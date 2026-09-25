let currentUser = null;
let artistId = null;
let artist = null;


/*
 * =========================================
 * GET ARTIST ID
 * =========================================
 */

function getArtistId() {

    const params =
        new URLSearchParams(
            window.location.search
        );

    return params.get("artist");
}


/*
 * =========================================
 * LOAD ARTIST
 * =========================================
 */

async function loadArtist() {

    const {
        data,
        error
    } = await supabaseClient

        .from("artists")

        .select(`
            id,
            name,
            slug
        `)

        .eq(
            "id",
            artistId
        )

        .single();


    if (error) {

        console.error(
            "Artist loading error:",
            error
        );

        document.getElementById(
            "artistName"
        ).textContent =
            "Artist not found.";

        return false;

    }


    artist = data;


    document.getElementById(
        "artistName"
    ).textContent =
        artist.name;


    return true;

}


/*
 * =========================================
 * VERIFY ARTIST ACCESS
 * =========================================
 */

async function verifyArtistAccess() {

    const {
        data,
        error
    } = await supabaseClient

        .from("artist_users")

        .select("artist_id")

        .eq(
            "artist_id",
            artistId
        )

        .eq(
            "user_id",
            currentUser.id
        )

        .maybeSingle();


    if (
        error ||
        !data
    ) {

        console.error(
            "Artist access denied:",
            error
        );

        document.getElementById(
            "conversationList"
        ).innerHTML = `
            <div class="error">
                You are not authorized to view this artist's conversations.
            </div>
        `;

        return false;

    }


    return true;

}


/*
 * =========================================
 * LOAD CONVERSATIONS
 * =========================================
 */

async function loadConversations() {

    const container =
        document.getElementById(
            "conversationList"
        );


    const {
        data: conversations,
        error
    } = await supabaseClient

        .from("dm_conversations")

        .select(`
            id,
            fan_id,
            message_limit,
            message_count,
            payment_status,
            status,
            created_at
        `)

        .eq(
            "artist_id",
            artistId
        )

        .order(
            "created_at",
            {
                ascending: false
            }
        );


    if (error) {

        console.error(
            "Conversation loading error:",
            error
        );

        container.innerHTML = `
            <div class="error">
                Unable to load conversations.
            </div>
        `;

        return;

    }


    if (
        !conversations ||
        conversations.length === 0
    ) {

        container.innerHTML = `
            <div class="empty">
                No conversations yet.
            </div>
        `;

        return;

    }


    container.innerHTML = "";


    conversations.forEach(
        conversation => {

            const remaining =
                Math.max(
                    0,
                    conversation.message_limit -
                    conversation.message_count
                );


            const card =
                document.createElement(
                    "button"
                );

            card.type =
                "button";

            card.className =
                "conversation";


            const top =
                document.createElement(
                    "div"
                );

            top.className =
                "conversation-top";


            const id =
                document.createElement(
                    "div"
                );

            id.className =
                "conversation-id";

            id.textContent =
                `Conversation #${conversation.id}`;


            const status =
                document.createElement(
                    "div"
                );

            status.className =
                "conversation-status";

            status.textContent =
                conversation.status;


            top.appendChild(id);

            top.appendChild(status);


            const meta =
                document.createElement(
                    "div"
                );

            meta.className =
                "conversation-meta";

            meta.textContent =
                `${remaining} messages remaining · ` +
                `${conversation.message_count} sent · ` +
                `Created ${new Date(
                    conversation.created_at
                ).toLocaleDateString()}`;


            card.appendChild(top);

            card.appendChild(meta);


            card.addEventListener(
                "click",
                () => {

                    window.location.href =
                        `artist-dm.html?id=${encodeURIComponent(
                            conversation.id
                        )}`;

                }
            );


            container.appendChild(card);

        }
    );

}


/*
 * =========================================
 * BACK
 * =========================================
 */

document
    .getElementById("backButton")
    .addEventListener(
        "click",
        () => {

            window.location.href =
                "artist-dms.html";

        }
    );


/*
 * =========================================
 * START
 * =========================================
 */

async function startArtistDMList() {

    artistId =
        getArtistId();


    if (!artistId) {

        document.getElementById(
            "conversationList"
        ).innerHTML = `
            <div class="error">
                No artist was specified.
            </div>
        `;

        return;

    }


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


    const artistLoaded =
        await loadArtist();


    if (!artistLoaded) {
        return;
    }


    const authorized =
        await verifyArtistAccess();


    if (!authorized) {
        return;
    }


    await loadConversations();

}


startArtistDMList();
