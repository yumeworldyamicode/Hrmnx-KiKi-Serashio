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
 * START
 * =========================================
 */

async function startSerashioFeed() {

    await loadArtists();

    await loadNotices();
}


startSerashioFeed();
