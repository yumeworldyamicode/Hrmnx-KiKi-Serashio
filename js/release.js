/*
 * =========================================
 * ELEMENTS
 * =========================================
 */

const container =
    document.getElementById(
        "releaseContainer"
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
 * GET RELEASE ID
 * =========================================
 */

function getReleaseId() {

    const params =
        new URLSearchParams(
            window.location.search
        );

    return params.get("id");
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
 * LOAD RELEASE
 * =========================================
 */

async function loadRelease() {

    const releaseId =
        getReleaseId();


    if (!releaseId) {

        showError(
            "No release was specified."
        );

        return;
    }


    const {
        data: release,
        error
    } = await supabaseClient

        .from("releases")

        .select(`
            id,
            artist_id,
            title,
            type,
            cover_url,
            release_date,
            distribution_problem,
            distribution_message,

            artists (
                id,
                name,
                slug
            )
        `)

        .eq(
            "id",
            releaseId
        )

        .single();


    if (error || !release) {

        console.error(
            "Release loading error:",
            error
        );


        showError(
            "Release not found."
        );

        return;
    }


    document.title =
        `${release.title} — Serashio`;


    await loadReleaseContent(
        release
    );
}


/*
 * =========================================
 * LOAD TRACKS + PLATFORMS
 * ========================================= */

async function loadReleaseContent(
    release
) {

    const [
        tracksResult,
        platformsResult
    ] = await Promise.all([

        supabaseClient

            .from("release_tracks")

            .select(`
                id,
                track_number,
                title
            `)

            .eq(
                "release_id",
                release.id
            )

            .order(
                "track_number",
                {
                    ascending: true
                }
            ),


        supabaseClient

            .from("release_platforms")

            .select(`
                id,
                platform,
                url
            `)

            .eq(
                "release_id",
                release.id
            )

            .order(
                "platform",
                {
                    ascending: true
                }
            )

    ]);


    if (tracksResult.error) {

        console.error(
            "Track loading error:",
            tracksResult.error
        );

    }


    if (platformsResult.error) {

        console.error(
            "Platform loading error:",
            platformsResult.error
        );

    }


    renderRelease(
        release,
        tracksResult.data || [],
        platformsResult.data || []
    );
}


/*
 * =========================================
 * RENDER RELEASE
 * =========================================
 */

function renderRelease(
    release,
    tracks,
    platforms
) {

    const artist =
        release.artists;


    const artistName =
        artist?.name ||
        "Unknown artist";


    const artistSlug =
        artist?.slug;


    const releaseDate =
        release.release_date
            ? new Date(
                release.release_date
              )
            : null;


    const unreleased =
        releaseDate &&
        releaseDate.getTime() >
        Date.now();


    const cover =
        release.cover_url

            ? `
                <img
                    class="release-cover"
                    src="${escapeHTML(
                        release.cover_url
                    )}"
                    alt="${escapeHTML(
                        release.title
                    )}"
                >
              `

            : `
                <div class="release-cover-placeholder">
                    ♪
                </div>
              `;


    let html = `

        <div class="release-header">


            <div>

                ${cover}

            </div>


            <div>

                <div class="release-artist">

                    ${
                        artistSlug

                            ? `
                                <a
                                    href="artist.html?slug=${encodeURIComponent(
                                        artistSlug
                                    )}"
                                    style="
                                        color:inherit;
                                        text-decoration:none;
                                    "
                                >
                                    ${escapeHTML(
                                        artistName
                                    )}
                                </a>
                              `

                            : escapeHTML(
                                artistName
                              )
                    }

                </div>


                <h1 class="release-title">

                    ${escapeHTML(
                        release.title
                    )}

                </h1>


                ${
                    release.type

                        ? `
                            <div class="release-type">
                                ${escapeHTML(
                                    release.type
                                )}
                            </div>
                          `

                        : ""
                }


                ${
                    releaseDate

                        ? `
                            <div class="release-date">
                                ${
                                    unreleased
                                        ? "Releases"
                                        : "Released"
                                }
                                ${escapeHTML(
                                    formatDate(
                                        release.release_date
                                    )
                                )}
                            </div>
                          `

                        : ""
                }


                ${
                    unreleased

                        ? `
                            <div
                                id="countdown"
                                class="countdown"
                            >

                                <div class="countdown-label">
                                    Release countdown
                                </div>

                                <div
                                    id="countdownValue"
                                    class="countdown-value"
                                >
                                    Loading...
                                </div>

                            </div>
                          `

                        : ""
                }


                ${
                    release.distribution_problem

                        ? `
                            <div class="distribution-message">

                                ${escapeHTML(
                                    release.distribution_message ||
                                    "This release has some problems, we're working to solve them as fast as we can."
                                )}

                            </div>
                          `

                        : ""
                }

            </div>

        </div>


        ${
            tracks.length > 0

                ? `

                    <section class="section">

                        <h2 class="section-title">
                            Tracks
                        </h2>


                        <div class="track-list">

                            ${tracks.map(
                                (track, index) => `

                                    <div class="track">

                                        <div class="track-number">
                                            ${escapeHTML(
                                                track.track_number ||
                                                index + 1
                                            )}
                                        </div>

                                        <div class="track-title">
                                            ${escapeHTML(
                                                track.title
                                            )}
                                        </div>

                                    </div>

                                `
                            ).join("")}

                        </div>

                    </section>

                  `

                : ""
        }


        ${
            platforms.length > 0

                ? `

                    <section class="section">

                        <h2 class="section-title">
                            Listen

                        </h2>


                        <div class="platform-list">

                            ${platforms.map(
                                platform => `

                                    <a
                                        class="platform"
                                        href="${escapeHTML(
                                            platform.url
                                        )}"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        ${escapeHTML(
                                            platform.platform
                                        )}
                                    </a>

                                `
                            ).join("")}

                        </div>

                    </section>

                  `

                : ""
        }

    `;


    container.innerHTML =
        html;


    if (unreleased) {

        startCountdown(
            release.release_date
        );

    }
}


/*
 * =========================================
 * COUNTDOWN
 * =========================================
 */

let countdownInterval = null;


function startCountdown(
    releaseDate
) {

    const target =
        new Date(
            releaseDate
        ).getTime();


    function updateCountdown() {

        const element =
            document.getElementById(
                "countdownValue"
            );


        if (!element) {

            clearInterval(
                countdownInterval
            );

            return;
        }


        const difference =
            target -
            Date.now();


        if (difference <= 0) {

            element.textContent =
                "Released!";


            clearInterval(
                countdownInterval
            );

            return;
        }


        const days =
            Math.floor(
                difference /
                (1000 * 60 * 60 * 24)
            );


        const hours =
            Math.floor(
                (
                    difference %
                    (1000 * 60 * 60 * 24)
                ) /
                (1000 * 60 * 60)
            );


        const minutes =
            Math.floor(
                (
                    difference %
                    (1000 * 60 * 60)
                ) /
                (1000 * 60)
            );


        const seconds =
            Math.floor(
                (
                    difference %
                    (1000 * 60)
                ) /
                1000
            );


        element.textContent =
            `${days}d ${hours}h ${minutes}m ${seconds}s`;
    }


    updateCountdown();


    countdownInterval =
        setInterval(
            updateCountdown,
            1000
        );
}


/*
 * =========================================
 * ERROR
 * =========================================
 */

function showError(
    message
) {

    container.innerHTML = `

        <div class="state">

            ${escapeHTML(
                message
            )}

        </div>

    `;
}


/*
 * =========================================
 * START
 * =========================================
 */

loadRelease();
