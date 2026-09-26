/*
 * =========================================
 * STATE
 * =========================================
 */

let artist = null;

let currentTab = "notices";


/*
 * =========================================
 * ELEMENTS
 * =========================================
 */

const artistHeader =
    document.getElementById(
        "artistHeader"
    );

const tabContent =
    document.getElementById(
        "tabContent"
    );

const noticesTab =
    document.getElementById(
        "noticesTab"
    );

const musicTab =
    document.getElementById(
        "musicTab"
    );


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
 * GET SLUG
 * =========================================
 */

function getArtistSlug() {

    const params =
        new URLSearchParams(
            window.location.search
        );

    return params.get("slug");
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
 * LOAD ARTIST
 * =========================================
 */

async function loadArtist() {

    const slug =
        getArtistSlug();


    if (!slug) {

        showError(
            "No artist was specified."
        );

        return;
    }


    const {
        data,
        error
    } = await supabaseClient

        .from("artists")

        .select(`
            id,
            name,
            slug,
            description,
            bio,
            avatar_url,
            banner_url
        `)

        .eq(
            "slug",
            slug
        )

        .single();


    if (error || !data) {

        console.error(
            "Artist loading error:",
            error
        );


        showError(
            "Artist or group not found."
        );

        return;
    }


    artist =
        data;


    document.title =
        `${artist.name} — Serashio`;


    renderArtistHeader();


    await loadFAQs();


    await loadNotices();
}


/*
 * =========================================
 * HEADER
 * =========================================
 */

function renderArtistHeader() {

    const banner =
        artist.banner_url
            ? `
                <div class="artist-banner">
                    <img
                        src="${escapeHTML(artist.banner_url)}"
                        alt=""
                    >
                </div>
              `
            : `
                <div class="artist-banner">
                    <div class="artist-banner-placeholder">
                        No banner
                    </div>
                </div>
              `;


    const avatar =
        artist.avatar_url
            ? `
                <img
                    class="artist-avatar"
                    src="${escapeHTML(artist.avatar_url)}"
                    alt=""
                >
              `
            : `
                <div class="artist-avatar-placeholder">
                    ♪
                </div>
              `;


    artistHeader.innerHTML = `

        ${banner}


        <div class="artist-profile">

            ${avatar}

            <div class="artist-heading">

                <h1 class="artist-name">
                    ${escapeHTML(artist.name)}
                </h1>

                ${
                    artist.description
                        ? `
                            <div class="artist-description">
                                ${escapeHTML(artist.description)}
                            </div>
                          `
                        : ""
                }

            </div>

        </div>


        ${
            artist.bio
                ? `
                    <div class="artist-bio">

                        <h2 class="artist-section-title">
                            About
                        </h2>

                        <div class="artist-description">
                            ${escapeHTML(artist.bio)}
                        </div>

                    </div>
                  `
                : ""
        }


        <div
            id="artistFAQ"
            class="artist-faq"
        ></div>


        <div
            id="dm-section"
            style="
                margin-top:24px;
                padding-top:20px;
                border-top:1px solid #eee;
            "
        >

            <h2 style="margin:0 0 8px;">
                Direct Messages
            </h2>

            <p style="margin:0 0 14px;">
                Send a private message to this artist.
                One DM purchase includes 20 messages.
            </p>

            <button
                id="buy-dm-button"
                type="button"
            >
                Purchase DM — ¥500
            </button>

            <p
                id="dm-status"
                style="margin-top:12px;"
            ></p>

        </div>

    `;
}

document.addEventListener("click", async function (event) {

    if (event.target.id !== "buy-dm-button") {
        return;
    }

    const button = event.target;
    const status = document.getElementById("dm-status");

    button.disabled = true;
    status.textContent = "Creating your DM order...";

    try {

        const {
            data: order,
            error
        } = await supabaseClient.rpc(
            "create_dm_order",
            {
                p_artist_id: artist.id
            }
        );

        if (error) {
            throw error;
        }

        console.log("DM order created:", order);

        status.textContent =
            `Order created: ${order.order_reference}`;

    } catch (error) {

        console.error("DM order error:", error);

        status.textContent =
            error.message || "Something went wrong.";

        button.disabled = false;
    }

});

/*
 * =========================================
 * LOAD FAQS
 * =========================================
 */

async function loadFAQs() {

    const faqContainer =
        document.getElementById(
            "artistFAQ"
        );


    if (!faqContainer) {
        return;
    }


    const {
        data: faqs,
        error
    } = await supabaseClient

        .from("artist_faqs")

        .select(`
            id,
            question,
            answer,
            sort_order
        `)

        .eq(
            "artist_id",
            artist.id
        )

        .order(
            "sort_order",
            {
                ascending: true
            }
        );


    if (error) {

        console.error(
            "FAQ loading error:",
            error
        );

        return;
    }


    if (!faqs || faqs.length === 0) {

        faqContainer.innerHTML = "";

        return;
    }


    faqContainer.innerHTML = `

        <h2 class="artist-section-title">
            FAQ
        </h2>


        <div class="faq-list">

            ${faqs.map(
                faq => `

                    <div class="faq-item">

                        <button
                            class="faq-question"
                            type="button"
                            onclick="toggleFAQ(this)"
                        >

                            <span>
                                ${escapeHTML(
                                    faq.question
                                )}
                            </span>


                            <span class="faq-arrow">
                                ▼
                            </span>

                        </button>


                        <div class="faq-answer">

                            ${escapeHTML(
                                faq.answer
                            )}

                        </div>

                    </div>

                `
            ).join("")}

        </div>

    `;
}


/*
 * =========================================
 * FAQ TOGGLE
 * =========================================
 */

function toggleFAQ(button) {

    const item =
        button.closest(
            ".faq-item"
        );


    if (!item) {
        return;
    }


    item.classList.toggle(
        "open"
    );
}


/*
 * =========================================
 * LOAD NOTICES
 * =========================================
 */

async function loadNotices() {

    tabContent.innerHTML = `

        <div class="state">
            Loading notices...
        </div>

    `;


    const {
        data: notices,
        error
    } = await supabaseClient

        .from("notices")

        .select(`
            id,
            title,
            content,
            created_at
        `)

        .eq(
            "artist_id",
            artist.id
        )

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


        tabContent.innerHTML = `

            <div class="state">
                Unable to load notices.
            </div>

        `;

        return;
    }


    renderNotices(
        notices || []
    );
}


/*
 * =========================================
 * RENDER NOTICES
 * =========================================
 */

function renderNotices(
    notices
) {

    if (notices.length === 0) {

        tabContent.innerHTML = `

            <div class="state">
                No notices yet.
            </div>

        `;

        return;
    }


    const list =
        document.createElement(
            "div"
        );


    list.className =
        "notice-list";


    notices.forEach(
        notice => {

            const card =
                document.createElement(
                    "a"
                );


            card.className =
                "notice-card";


            card.href =
                `notice.html?id=${encodeURIComponent(
                    notice.id
                )}`;


            card.innerHTML = `

                <div class="notice-date">

                    ${escapeHTML(
                        formatDate(
                            notice.created_at
                        )
                    )}

                </div>


                <h2 class="notice-title">

                    ${escapeHTML(
                        notice.title
                    )}

                </h2>


                <div class="notice-excerpt">

                    ${escapeHTML(
                        notice.content
                    )}

                </div>

            `;


            list.appendChild(
                card
            );

        }
    );


    tabContent.innerHTML = "";

    tabContent.appendChild(
        list
    );
}


/*
 * =========================================
 * LOAD MUSIC
 * =========================================
 */

async function loadMusic() {

    tabContent.innerHTML = `

        <div class="state">
            Loading music...
        </div>

    `;


    const {
        data: releases,
        error
    } = await supabaseClient

        .from("releases")

        .select(`
            id,
            title,
            type,
            cover_url,
            release_date
        `)

        .eq(
            "artist_id",
            artist.id
        )

        .order(
            "release_date",
            {
                ascending: false
            }
        );


    if (error) {

        console.error(
            "Music loading error:",
            error
        );


        tabContent.innerHTML = `

            <div class="state">
                Unable to load music.
            </div>

        `;

        return;
    }


    renderMusic(
        releases || []
    );
}


/*
 * =========================================
 * RENDER MUSIC
 * =========================================
 */

function renderMusic(
    releases
) {

    if (releases.length === 0) {

        tabContent.innerHTML = `

            <div class="state">
                No releases yet.
            </div>

        `;

        return;
    }


    const list =
        document.createElement(
            "div"
        );


    list.className =
        "release-list";


    releases.forEach(
        release => {

            const card =
                document.createElement(
                    "a"
                );


            card.className =
                "release-card";


            card.href =
                `release.html?id=${encodeURIComponent(
                    release.id
                )}`;


            card.innerHTML = `

                ${
                    release.cover_url

                        ? `

                            <img
                                class="release-cover"
                                src="${escapeHTML(
                                    release.cover_url
                                )}"
                                alt=""
                            >

                          `

                        : `

                            <div
                                class="release-cover"
                                style="
                                    display:flex;
                                    align-items:center;
                                    justify-content:center;
                                    color:#999;
                                "
                            >

                                ♪

                            </div>

                          `
                }


                <div class="release-info">

                    <div class="release-title">

                        ${escapeHTML(
                            release.title
                        )}

                    </div>


                    <div class="release-meta">

                        ${
                            release.type
                                ? escapeHTML(
                                    release.type
                                )
                                : ""
                        }


                        ${
                            release.release_date
                                ? ` · ${escapeHTML(
                                    formatDate(
                                        release.release_date
                                    )
                                  )}`
                                : ""
                        }

                    </div>

                </div>

            `;


            list.appendChild(
                card
            );

        }
    );


    tabContent.innerHTML = "";

    tabContent.appendChild(
        list
    );
}


/*
 * =========================================
 * TAB SWITCHING
 * =========================================
 */

function switchTab(
    tab
) {

    currentTab =
        tab;


    noticesTab.classList.toggle(
        "active",
        tab === "notices"
    );


    musicTab.classList.toggle(
        "active",
        tab === "music"
    );


    if (
        tab === "notices"
    ) {

        loadNotices();

    } else {

        loadMusic();

    }
}


noticesTab.addEventListener(
    "click",
    () => {

        switchTab(
            "notices"
        );

    }
);


musicTab.addEventListener(
    "click",
    () => {

        switchTab(
            "music"
        );

    }
);


/*
 * =========================================
 * ERROR
 * =========================================
 */

function showError(
    message
) {

    artistHeader.innerHTML = `

        <div class="state">

            ${escapeHTML(
                message
            )}

        </div>

    `;


    tabContent.innerHTML = "";
}


/*
 * =========================================
 * START
 * =========================================
 */

loadArtist();

async function setupDMSection(artist) {

    const dmSection = document.getElementById("dm-section");
    const buyButton = document.getElementById("buy-dm-button");
    const status = document.getElementById("dm-status");

    if (!dmSection || !buyButton || !status) {
        return;
    }

    dmSection.style.display = "block";

    const {
        data: {
            session
        }
    } = await supabaseClient.auth.getSession();

    if (!session) {

        buyButton.textContent = "Log in to purchase a DM";

        buyButton.onclick = function () {
            window.location.href = "dm-login.html";
        };

        return;
    }

    buyButton.textContent = "Purchase DM — ¥500";

    buyButton.onclick = async function () {

        buyButton.disabled = true;
        status.textContent = "Creating your order...";

        const {
            data,
            error
        } = await supabaseClient.rpc(
            "create_dm_order",
            {
                p_artist_id: artist.id
            }
        );

        if (error) {

            console.error("DM order error:", error);

            status.textContent =
                error.message ||
                "Could not create the DM order.";

            buyButton.disabled = false;
            return;
        }

        console.log("DM order created:", data);

        status.innerHTML =
            "Your order has been created.<br>" +
            "Order reference: <strong>" +
            data.order_reference +
            "</strong>";

        /*
         * Ko-fi payment will be connected here next.
         */

        buyButton.disabled = false;
    };
}

/* =========================================
   DM PURCHASE
========================================= */

async function purchaseDM() {

    const button =
        document.getElementById("buy-dm-button");

    const status =
        document.getElementById("dm-status");

    if (!button || !status) {
        return;
    }

    button.disabled = true;

    status.textContent =
        "Checking your account...";


    const {
        data: {
            session
        }
    } = await supabaseClient.auth.getSession();


    if (!session) {

        window.location.href =
            "dm-login.html";

        return;
    }


    status.textContent =
        "Creating your order...";


    const {
        data,
        error
    } = await supabaseClient.rpc(
        "create_dm_order",
        {
            p_artist_id: artist.id
        }
    );


    if (error) {

        console.error(
            "DM order error:",
            error
        );

        status.textContent =
            error.message ||
            "Unable to create your order.";

        button.disabled = false;

        return;
    }


    console.log(
        "DM order created:",
        data
    );


    status.innerHTML = `
        Order created successfully.<br><br>

        <strong>
            Order reference:
        </strong>

        ${escapeHTML(
            data.order_reference
        )}

        <br><br>

        Your payment is still pending.
    `;


    button.disabled = false;
}

document.addEventListener(
    "click",
    function(event) {

        if (
            event.target &&
            event.target.id ===
                "buy-dm-button"
        ) {

            purchaseDM();

        }

    }
);
