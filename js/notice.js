/*
 * =========================================
 * GET NOTICE ID
 * =========================================
 */

const params =
    new URLSearchParams(
        window.location.search
    );

const noticeId =
    params.get("id");


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
 * BACK TO SERASHIO
 * =========================================
 */

function goBackToSerashio() {

    if (
        window.parent &&
        window.parent !== window &&
        typeof window.parent.loadSerashioPage === "function"
    ) {

        window.parent.loadSerashioPage(
            "home.html"
        );

        return;
    }

    window.history.back();
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
 * LOAD NOTICE
 * =========================================
 */

async function loadNotice() {

    const container =
        document.getElementById(
            "noticeContainer"
        );


    if (!noticeId) {

        container.innerHTML = `
            <div class="error">
                This notice could not be found.
            </div>
        `;

        return;
    }


    const {
        data: notice,
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
            updated_at,

            artists (
                id,
                name,
                slug,
                avatar_url
            )
        `)

        .eq(
            "id",
            noticeId
        )

        .single();


    if (error) {

        console.error(
            "Notice loading error:",
            error
        );

        container.innerHTML = `
            <div class="error">
                Unable to load this notice.
            </div>
        `;

        return;
    }


    if (!notice) {

        container.innerHTML = `
            <div class="error">
                This notice could not be found.
            </div>
        `;

        return;
    }


    const artist =
        notice.artists;


    const artistName =
        artist?.name ||
        "Serashio";


    container.innerHTML = `

        <article class="notice-card">

            <div class="notice-header">

                <div class="notice-artist">
                    ${escapeHTML(artistName)}
                </div>

                <h1 class="notice-title">
                    ${escapeHTML(
                        notice.title || ""
                    )}
                </h1>

                <div class="notice-date">
                    ${escapeHTML(
                        formatDate(
                            notice.created_at
                        )
                    )}
                </div>

            </div>


            ${
                notice.image_url
                    ? `
                        <img
                            class="notice-image"
                            src="${escapeHTML(
                                notice.image_url
                            )}"
                            alt=""
                        >
                    `
                    : ""
            }


            <div class="notice-content">
                ${escapeHTML(
                    notice.content || ""
                )}
            </div>


            <div class="notice-actions">

                <button
                    id="shareButton"
                    class="notice-action"
                    onclick="shareNotice()"
                >
                    ↗ Share
                </button>

            </div>

        </article>

    `;


    await loadMoreFromArtist(
        notice.artist_id,
        notice.id,
        artistName
    );
}


/*
 * =========================================
 * SHARE NOTICE
 * =========================================
 */

async function shareNotice() {

    const url =
        window.location.href;


    try {

        await navigator.clipboard.writeText(
            url
        );


        const button =
            document.getElementById(
                "shareButton"
            );


        button.textContent =
            "✓ Copied!";


        setTimeout(
            () => {

                button.textContent =
                    "↗ Share";

            },
            1800
        );

    } catch {

        alert(
            "Copy this URL to share the notice:\n\n" +
            url
        );
    }
}


/*
 * =========================================
 * MORE FROM ARTIST
 * =========================================
 */

async function loadMoreFromArtist(
    artistId,
    currentNoticeId,
    artistName
) {

    if (!artistId) {
        return;
    }


    const {
        data: notices,
        error
    } = await supabaseClient

        .from("notices")

        .select(`
            id,
            title,
            created_at
        `)

        .eq(
            "artist_id",
            artistId
        )

        .neq(
            "id",
            currentNoticeId
        )

        .order(
            "created_at",
            {
                ascending: false
            }
        )

        .limit(5);


    if (error) {

        console.error(
            "More notices loading error:",
            error
        );

        return;
    }


    if (
        !notices ||
        notices.length === 0
    ) {

        return;
    }


    const section =
        document.getElementById(
            "moreSection"
        );

    const title =
        document.getElementById(
            "moreTitle"
        );

    const list =
        document.getElementById(
            "moreList"
        );


    title.textContent =
        `More from ${artistName}`;


    list.innerHTML = "";


    notices.forEach(
        notice => {

            const link =
                document.createElement(
                    "a"
                );

            link.className =
                "more-notice";

            link.href =
                `notice.html?id=${encodeURIComponent(
                    notice.id
                )}`;


            link.innerHTML = `

                <div class="more-notice-title">
                    ${escapeHTML(
                        notice.title || ""
                    )}
                </div>

                <div class="more-notice-date">
                    ${escapeHTML(
                        formatDate(
                            notice.created_at
                        )
                    )}
                </div>

            `;


            list.appendChild(link);
        }
    );


    section.style.display =
        "block";
}


/*
 * =========================================
 * START
 * =========================================
 */

loadNotice();
