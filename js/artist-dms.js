let currentUser = null;
let artistAssignments = [];


/*
 * =========================================
 * LOAD ARTIST ASSIGNMENTS
 * =========================================
 */

async function loadArtistAssignments() {

    const container =
        document.getElementById("artistList");


    const {
        data,
        error
    } = await supabaseClient

        .from("artist_users")

        .select(`
            artist_id,

            artists (
                id,
                name,
                slug,
                avatar_url
            )
        `)

        .eq(
            "user_id",
            currentUser.id
        );


    if (error) {

        console.error(
            "Artist assignment error:",
            error
        );

        container.innerHTML = `
            <div class="error">
                Unable to load your artist assignments.
            </div>
        `;

        return;

    }


    artistAssignments =
        data || [];


    if (
        artistAssignments.length === 0
    ) {

        container.innerHTML = `
            <div class="empty">
                No artist accounts are assigned to you.
            </div>
        `;

        return;

    }


    container.innerHTML = "";


    artistAssignments.forEach(
        assignment => {

            const artist =
                assignment.artists;


            if (!artist) {
                return;
            }


            const card =
                document.createElement(
                    "div"
                );

            card.className =
                "artist-card";


            const avatar =
                document.createElement(
                    "img"
                );

            avatar.className =
                "artist-avatar";

            avatar.src =
                artist.avatar_url ||
                "";

            avatar.alt =
                artist.name;


            const info =
                document.createElement(
                    "div"
                );

            info.className =
                "artist-info";


            const name =
                document.createElement(
                    "div"
                );

            name.className =
                "artist-name";

            name.textContent =
                artist.name;


            const meta =
                document.createElement(
                    "div"
                );

            meta.className =
                "artist-meta";

            meta.textContent =
                "Artist account";


            info.appendChild(name);

            info.appendChild(meta);


            const button =
                document.createElement(
                    "button"
                );

            button.className =
                "open-button";

            button.type =
                "button";

            button.textContent =
                "Open messages";


            button.addEventListener(
                "click",
                () => {

                    window.location.href =
                        `artist-dm-list.html?artist=${encodeURIComponent(
                            artist.id
                        )}`;

                }
            );


            card.appendChild(avatar);

            card.appendChild(info);

            card.appendChild(button);


            container.appendChild(card);

        }
    );

}


/*
 * =========================================
 * START
 * =========================================
 */

async function startArtistDMs() {

    const {
        data,
        error
    } = await supabaseClient.auth.getUser();


    if (
        error ||
        !data.user
    ) {

        window.location.href =
            "dm-login.html";

        return;

    }


    currentUser =
        data.user;


    await loadArtistAssignments();

}


startArtistDMs();
