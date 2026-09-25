/*
 * =========================================
 * STATE
 * =========================================
 */

let allNotices = [];

let selectedArtist =
    "all";


/*
 * =========================================
 * ESCAPE HTML
 * =========================================
 */

function escapeHTML(value) {

    const div =
        document.createElement("div");

    div.textContent =
        value ?? "";

    return div.innerHTML;
}


/*
 * =========================================
 * FORMAT DATE
 * =========================================
 */

function formatDate(date) {

    if (!date) {
        return "";
    }

    return new Date(date).toLocaleDateString(
        undefined,
        {
            year: "numeric",
            month: "long",
            day: "numeric"
        }
    );
}


/*
 * =========================================
 * CREATE EXCERPT
 * =========================================
 */

function getExcerpt(content) {

    if (!content) {
        return "";
    }

    return content.trim();
}


/*
 * =========================================
 * LOAD ARTISTS
 * =========================================
 */

async function loadArtists() {

    const navigation =
        document.getElementById(
            "artistNavigation"
        );


    const {
        data: artists,
        error
    } = await supabaseClient

        .from("artists")

        .select(`
            id,
            name
        `)

        .order(
            "name",
            {
                ascending: true
            }
        );


    if (error) {

        console.error(
            "Artist loading error:",
            error
        );

        return;
    }


    artists.forEach(
        artist => {

            const button =
                document.createElement(
                    "button"
                );


            button.className =
                "artist-button";


            button.dataset.artistId =
                artist.id;


            button.textContent =
                artist.name;


            button.addEventListener(
                "click",
                () => {

                    filterByArtist(
                        artist.id,
                        button
                    );

                }
            );


            navigation.appendChild(
                button
            );

        }
    );


    const allButton =
        navigation.querySelector(
            '[data-artist-id="all"]'
        );


    allButton.addEventListener(
        "click",
        () => {

            filterByArtist(
                "all",
                allButton
            );

        }
    );
}


/*
 * =========================================
 * LOAD NOTICES
 * =========================================
 */

async function loadNotices() {

    const feed =
        document.getElementById(
            "noticeFeed"
        );


    const {
        data: notices,
        error
    } = await supabaseClient

        .from("notices")

        .select(`
            id,
            artist_id,
            title,
            content,
            image_url,
            created_at,

            artists (
                id,
                name,
                slug
            )
        `)

        .order(
            "created_at",
            {
                ascending: false
            }
        );


    if (error) {

        console.error(
            "Notice loading error:",
            error
        );


        feed.innerHTML = `
            <div class="feed-state">
                Unable to load notices.
            </div>
        `;

        return;
    }


    allNotices =
        notices || [];


    renderNotices();
}


/*
 * =========================================
 * RENDER NOTICES
 * =========================================
 */

function renderNotices() {

    const feed =
        document.getElementById(
            "noticeFeed"
        );


    const filteredNotices =
        selectedArtist === "all"

            ? allNotices

            : allNotices.filter(
                notice =>
                    String(
                        notice.artist_id
                    ) === String(
                        selectedArtist
                    )
            );


    if (
        filteredNotices.length === 0
    ) {

        feed.innerHTML = `
            <div class="feed-state">
                No notices found.
            </div>
        `;

        return;
    }


    feed.innerHTML = "";


    filteredNotices.forEach(
        notice => {

            const artist =
                notice.artists;


            const artistName =
                artist?.name ||
                "Serashio";


            const card =
                document.createElement(
                    "a"
                );


            card.className =
                "notice-preview";


            card.href =
                `notice.html?id=${encodeURIComponent(
                    notice.id
                )}`;


            const excerpt =
                getExcerpt(
                    notice.content
                );


            card.innerHTML = `

                ${
                    notice.image_url
                        ? `
                            <img
                                class="notice-preview-image"
                                src="${escapeHTML(
                                    notice.image_url
                                )}"
                                alt=""
                            >
                        `
                        : ""
                }


                <div class="notice-preview-body">

                    <div class="notice-artist">
                        ${escapeHTML(
                            artistName
                        )}
                    </div>


                    <h2 class="notice-title">
                        ${escapeHTML(
                            notice.title || ""
                        )}
                    </h2>


                    <div class="notice-date">
                        ${escapeHTML(
                            formatDate(
                                notice.created_at
                            )
                        )}
                    </div>


                    <div class="notice-excerpt">
                        ${escapeHTML(
                            excerpt
                        )}
                    </div>


                    <div class="read-notice">
                        Read notice →
                    </div>

                </div>

            `;


            feed.appendChild(
                card
            );

        }
    );
}


/*
 * =========================================
 * FILTER
 * =========================================
 */

function filterByArtist(
    artistId,
    activeButton
) {

    selectedArtist =
        artistId;


    document
        .querySelectorAll(
            ".artist-button"
        )
        .forEach(
            button => {

                button.classList.remove(
                    "active"
                );

            }
        );


    activeButton.classList.add(
        "active"
    );


    renderNotices();
}

/*
 * =========================================
 * BANNER SLIDESHOW
 * =========================================
 */

let bannerItems = [];

let currentBanner = 0;

let bannerTimer = null;


/*
 * =========================================
 * LOAD BANNERS
 * =========================================
 */

async function loadBanners() {

    const banner =
        document.getElementById(
            "noticeBanner"
        );

    const slides =
        document.getElementById(
            "noticeBannerSlides"
        );

    const dots =
        document.getElementById(
            "bannerDots"
        );

    if (!banner || !slides || !dots) {
        return;
    }


    const now =
        new Date().toISOString();


    const {
        data: banners,
        error
    } = await supabaseClient

        .from("notice_banners")

        .select(`
            id,
            artist_id,
            title,
            image_url,
            link_url,
            sort_order,
            active,
            starts_at,
            ends_at,

            artists (
                id,
                name,
                slug
            )
        `)

        .eq(
            "active",
            true
        )

        .order(
            "sort_order",
            {
                ascending: true
            }
        );


    if (error) {

        console.error(
            "Banner loading error:",
            error
        );

        return;
    }


    bannerItems =
        (banners || []).filter(
            item => {

                if (
                    item.starts_at &&
                    item.starts_at > now
                ) {
                    return false;
                }


                if (
                    item.ends_at &&
                    item.ends_at < now
                ) {
                    return false;
                }


                return true;
            }
        );


    if (
        bannerItems.length === 0
    ) {

        banner.style.display =
            "none";

        return;
    }


    banner.style.display =
        "block";


    slides.innerHTML = "";

    dots.innerHTML = "";


    bannerItems.forEach(
        (item, index) => {

            const artist =
                item.artists;


            const slide =
                document.createElement(
                    "div"
                );


            slide.className =
                "notice-banner-slide";


            if (index === 0) {

                slide.classList.add(
                    "active"
                );

            }


            const link =
                item.link_url ||
                (
                    artist?.slug
                        ? `artist.html?slug=${encodeURIComponent(
                            artist.slug
                        )}`
                        : "#"
                );


            slide.innerHTML = `

                <a
                    href="${escapeHTML(
                        link
                    )}"
                >

                    <img
                        src="${escapeHTML(
                            item.image_url
                        )}"
                        alt="${escapeHTML(
                            item.title ||
                            artist?.name ||
                            ""
                        )}"
                    >


                    ${
                        item.title ||
                        artist?.name
                            ? `
                                <div
                                    class="notice-banner-content"
                                >

                                    ${
                                        item.title
                                            ? `
                                                <div
                                                    class="notice-banner-title"
                                                >
                                                    ${escapeHTML(
                                                        item.title
                                                    )}
                                                </div>
                                            `
                                            : ""
                                    }


                                    ${
                                        artist?.name
                                            ? `
                                                <div
                                                    class="notice-banner-artist"
                                                >
                                                    ${escapeHTML(
                                                        artist.name
                                                    )}
                                                </div>
                                            `
                                            : ""
                                    }

                                </div>
                            `
                            : ""
                    }

                </a>

            `;


            slides.appendChild(
                slide
            );


            const dot =
                document.createElement(
                    "button"
                );


            dot.className =
                "banner-dot";


            if (index === 0) {

                dot.classList.add(
                    "active"
                );

            }


            dot.type =
                "button";


            dot.setAttribute(
                "aria-label",
                `Show banner ${index + 1}`
            );


            dot.addEventListener(
                "click",
                () => {

                    showBanner(
                        index
                    );

                    restartBannerTimer();

                }
            );


            dots.appendChild(
                dot
            );

        }
    );


    currentBanner = 0;


    const previous =
        document.getElementById(
            "bannerPrevious"
        );


    const next =
        document.getElementById(
            "bannerNext"
        );


    previous.addEventListener(
        "click",
        () => {

            showBanner(
                currentBanner - 1
            );

            restartBannerTimer();

        }
    );


    next.addEventListener(
        "click",
        () => {

            showBanner(
                currentBanner + 1
            );

            restartBannerTimer();

        }
    );


    startBannerTimer();
}


/*
 * =========================================
 * SHOW BANNER
 * =========================================
 */

function showBanner(index) {

    const slides =
        document.querySelectorAll(
            ".notice-banner-slide"
        );


    const dots =
        document.querySelectorAll(
            ".banner-dot"
        );


    if (
        slides.length === 0
    ) {
        return;
    }


    if (
        index < 0
    ) {

        index =
            slides.length - 1;

    }


    if (
        index >= slides.length
    ) {

        index = 0;

    }


    slides.forEach(
        slide => {

            slide.classList.remove(
                "active"
            );

        }
    );


    dots.forEach(
        dot => {

            dot.classList.remove(
                "active"
            );

        }
    );


    slides[index].classList.add(
        "active"
    );


    if (dots[index]) {

        dots[index].classList.add(
            "active"
        );

    }


    currentBanner =
        index;
}


/*
 * =========================================
 * AUTO ROTATION
 * =========================================
 */

function startBannerTimer() {

    clearInterval(
        bannerTimer
    );


    if (
        bannerItems.length <= 1
    ) {
        return;
    }


    bannerTimer =
        setInterval(
            () => {

                showBanner(
                    currentBanner + 1
                );

            },
            6000
        );
}


/*
 * =========================================
 * RESTART TIMER
 * =========================================
 */

function restartBannerTimer() {

    startBannerTimer();

}

/*
 * =========================================
 * START
 * =========================================
 */

async function startSerashioFeed() {

    await loadArtists();

    await loadBanners();

    await loadNotices();
}


startSerashioFeed();
