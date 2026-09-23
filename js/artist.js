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
            avatar_url
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


    await loadNotices();
}


/*
 * =========================================
 * HEADER
 * =========================================
 */

function renderArtistHeader() {

    const avatar =
        artist.avatar_url

            ? `
                <img
                    class="artist-avatar"
                    src="${escapeHTML(
                        artist.avatar_url
                    )}"
                    alt=""
                >
              `

            : `
                <div class="artist-avatar-placeholder">
                    ♪
                </div>
              `;


    artistHeader.innerHTML = `

        ${avatar}

        <div>

            <h1 class="artist-name">
                ${escapeHTML(
                    artist.name
                )}
            </h1>

            ${
                artist.description

                    ? `
                        <div class="artist-description">
                            ${escapeHTML(
                                artist.description
                            )}
                        </div>
                      `

                    : ""
            }

        </div>

    `;
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
        switchTab("notices");
    }
);


musicTab.addEventListener(
    "click",
    () => {
        switchTab("music");
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
