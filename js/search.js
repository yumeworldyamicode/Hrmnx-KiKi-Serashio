/*
 * =========================================
 * ELEMENTS
 * =========================================
 */

const searchInput =
    document.getElementById(
        "searchInput"
    );

const searchButton =
    document.getElementById(
        "searchButton"
    );

const searchResults =
    document.getElementById(
        "searchResults"
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
 * SEARCH
 * =========================================
 */

async function performSearch() {

    const query =
        searchInput.value.trim();


    if (!query) {

        searchResults.innerHTML = `
            <div class="initial-message">
                Search for an artist, group, notice or release.
            </div>
        `;

        return;
    }


    searchResults.innerHTML = `
        <div class="initial-message">
            Searching...
        </div>
    `;


    const searchTerm =
        `%${query}%`;


    /*
     * ARTISTS
     */

    const artistsPromise =
        supabaseClient

            .from("artists")

            .select(`
                id,
                name,
                slug,
                avatar_url
            `)

            .ilike(
                "name",
                searchTerm
            )

            .order(
                "name",
                {
                    ascending: true
                }
            );


    /*
     * NOTICES
     */

    const noticesPromise =
        supabaseClient

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

            .or(
                `title.ilike.${searchTerm},content.ilike.${searchTerm}`
            )

            .order(
                "created_at",
                {
                    ascending: false
                }
            );


    /*
     * MUSIC
     */

    const releasesPromise =
        supabaseClient

            .from("releases")

            .select(`
                id,
                artist_id,
                title,
                type,
                cover_url,
                release_date,

                artists (
                    id,
                    name,
                    slug
                )
            `)

            .ilike(
                "title",
                searchTerm
            )

            .order(
                "release_date",
                {
                    ascending: false
                }
            );


    const [
        artistsResult,
        noticesResult,
        releasesResult
    ] = await Promise.all([
        artistsPromise,
        noticesPromise,
        releasesPromise
    ]);


    if (artistsResult.error) {

        console.error(
            "Artist search error:",
            artistsResult.error
        );

    }


    if (noticesResult.error) {

        console.error(
            "Notice search error:",
            noticesResult.error
        );

    }


    if (releasesResult.error) {

        console.error(
            "Music search error:",
            releasesResult.error
        );

    }


    renderSearchResults(
        artistsResult.data || [],
        noticesResult.data || [],
        releasesResult.data || []
    );
}


/*
 * =========================================
 * RENDER RESULTS
 * =========================================
 */

function renderSearchResults(
    artists,
    notices,
    releases
) {

    searchResults.innerHTML = "";


    const totalResults =
        artists.length +
        notices.length +
        releases.length;


    if (totalResults === 0) {

        searchResults.innerHTML = `
            <div class="initial-message">
                No results found.
            </div>
        `;

        return;
    }


    /*
     * ARTISTS
     */

    if (artists.length > 0) {

        const section =
            document.createElement("section");

        section.className =
            "search-section";


        section.innerHTML = `
            <h2 class="section-heading">
                Artists & Groups
            </h2>

            <div class="results-list"></div>
        `;


        const list =
            section.querySelector(
                ".results-list"
            );


        artists.forEach(
            artist => {

                const card =
                    document.createElement("a");


                card.className =
                    "result-card";


                card.href =
                    `artist.html?slug=${encodeURIComponent(
                        artist.slug
                    )}`;


                card.innerHTML = `

                    ${
                        artist.avatar_url

                            ? `
                                <img
                                    class="result-image"
                                    src="${escapeHTML(
                                        artist.avatar_url
                                    )}"
                                    alt=""
                                >
                              `

                            : `
                                <div class="result-placeholder">
                                    ♪
                                </div>
                              `
                    }

                    <div class="result-info">

                        <div class="result-title">
                            ${escapeHTML(
                                artist.name
                            )}
                        </div>

                        <div class="result-meta">
                            Artist / Group
                        </div>

                    </div>
                `;


                list.appendChild(card);

            }
        );


        searchResults.appendChild(
            section
        );
    }


    /*
     * NOTICES
     */

    if (notices.length > 0) {

        const section =
            document.createElement("section");

        section.className =
            "search-section";


        section.innerHTML = `
            <h2 class="section-heading">
                Notices
            </h2>

            <div class="results-list"></div>
        `;


        const list =
            section.querySelector(
                ".results-list"
            );


        notices.forEach(
            notice => {

                const card =
                    document.createElement("a");


                card.className =
                    "result-card";


                card.href =
                    `notice.html?id=${encodeURIComponent(
                        notice.id
                    )}`;


                const artistName =
                    notice.artists?.name ||
                    "Serashio";


                card.innerHTML = `

                    ${
                        notice.image_url

                            ? `
                                <img
                                    class="result-image"
                                    src="${escapeHTML(
                                        notice.image_url
                                    )}"
                                    alt=""
                                >
                              `

                            : `
                                <div class="result-placeholder">
                                    !
                                </div>
                              `
                    }

                    <div class="result-info">

                        <div class="result-title">
                            ${escapeHTML(
                                notice.title
                            )}
                        </div>

                        <div class="result-meta">
                            ${escapeHTML(
                                artistName
                            )}
                        </div>

                    </div>
                `;


                list.appendChild(card);

            }
        );


        searchResults.appendChild(
            section
        );
    }


    /*
     * MUSIC
     */

    if (releases.length > 0) {

        const section =
            document.createElement("section");

        section.className =
            "search-section";


        section.innerHTML = `
            <h2 class="section-heading">
                Music
            </h2>

            <div class="results-list"></div>
        `;


        const list =
            section.querySelector(
                ".results-list"
            );


        releases.forEach(
            release => {

                const card =
                    document.createElement("a");


                card.className =
                    "result-card";


                card.href =
                    `artist.html?slug=${encodeURIComponent(
                        release.artists?.slug || ""
                    )}`;


                const artistName =
                    release.artists?.name ||
                    "Unknown artist";


                card.innerHTML = `

                    ${
                        release.cover_url

                            ? `
                                <img
                                    class="result-image"
                                    src="${escapeHTML(
                                        release.cover_url
                                    )}"
                                    alt=""
                                >
                              `

                            : `
                                <div class="result-placeholder">
                                    ♪
                                </div>
                              `
                    }

                    <div class="result-info">

                        <div class="result-title">
                            ${escapeHTML(
                                release.title
                            )}
                        </div>

                        <div class="result-meta">
                            ${escapeHTML(
                                artistName
                            )}
                            ${
                                release.type
                                    ? ` · ${escapeHTML(
                                        release.type
                                      )}`
                                    : ""
                            }
                        </div>

                    </div>
                `;


                list.appendChild(card);

            }
        );


        searchResults.appendChild(
            section
        );
    }
}


/*
 * =========================================
 * EVENTS
 * =========================================
 */

searchButton.addEventListener(
    "click",
    performSearch
);


searchInput.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Enter"
        ) {

            performSearch();

        }

    }
);
