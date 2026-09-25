let currentUser = null;
let conversation = null;
let artist = null;


/*
 * =========================================
 * GET CONVERSATION ID
 * =========================================
 */

function getConversationId() {

    const params =
        new URLSearchParams(
            window.location.search
        );

    return params.get("id");

}


/*
 * =========================================
 * FORMAT TIME
 * =========================================
 */

function formatTime(date) {

    if (!date) {
        return "";
    }

    return new Date(date).toLocaleString(
        undefined,
        {
            dateStyle: "short",
            timeStyle: "short"
        }
    );

}


/*
 * =========================================
 * LOAD CONVERSATION
 * =========================================
 */

async function loadConversation() {

    const conversationId =
        getConversationId();


    if (!conversationId) {

        showError(
            "No conversation was specified."
        );

        return false;

    }


    const {
        data,
        error
    } = await supabaseClient

        .from("dm_conversations")

        .select(`
            id,
            artist_id,
            fan_id,
            message_limit,
            message_count,
            payment_status,
            status,

            artists (
                id,
                name,
                slug
            )
        `)

        .eq(
            "id",
            conversationId
        )

        .single();


    if (error) {

        console.error(
            "Conversation loading error:",
            error
        );

        showError(
            "Unable to load this conversation."
        );

        return false;

    }


    conversation =
        data;

    artist =
        data.artists;


    document.getElementById(
        "artistName"
    ).textContent =
        artist?.name || "Artist";


    document.getElementById(
        "conversationNumber"
    ).textContent =
        `Conversation #${conversation.id}`;


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
            conversation.artist_id
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

        showError(
            "You are not authorized to view this conversation."
        );

        return false;

    }


    return true;

}


/*
 * =========================================
 * LOAD MESSAGES
 * =========================================
 */

async function loadMessages() {

    const container =
        document.getElementById(
            "messages"
        );


    const {
        data: messages,
        error
    } = await supabaseClient

        .from("dm_messages")

        .select(`
            id,
            sender_type,
            sender_id,
            content,
            created_at
        `)

        .eq(
            "conversation_id",
            conversation.id
        )

        .order(
            "created_at",
            {
                ascending: true
            }
        );


    if (error) {

        console.error(
            "Message loading error:",
            error
        );

        showError(
            "Unable to load messages."
        );

        return;

    }


    if (
        !messages ||
        messages.length === 0
    ) {

        container.innerHTML = `
            <div class="empty">
                No messages yet.
            </div>
        `;

        return;

    }


    container.innerHTML = "";


    messages.forEach(
        message => {

            const bubble =
                document.createElement(
                    "div"
                );

            bubble.className =
                `message ${message.sender_type}`;


            const text =
                document.createElement(
                    "div"
                );

            text.textContent =
                message.content;


            const time =
                document.createElement(
                    "div"
                );

            time.className =
                "message-time";

            time.textContent =
                formatTime(
                    message.created_at
                );


            bubble.appendChild(text);

            bubble.appendChild(time);

            container.appendChild(bubble);

        }
    );


    container.scrollTop =
        container.scrollHeight;

}


/*
 * =========================================
 * UPDATE STATUS
 * =========================================
 */

function updateStatus() {

    const status =
        document.getElementById(
            "conversationStatus"
        );


    if (
        conversation.status !== "open"
    ) {

        document.getElementById(
            "composer"
        ).innerHTML = `
            <div class="closed">
                This conversation is closed.
            </div>
        `;

        return;

    }


    const remaining =
        Math.max(
            0,
            conversation.message_limit -
            conversation.message_count
        );


    status.textContent =
        `${remaining} fan messages remaining`;

}


/*
 * =========================================
 * SEND ARTIST MESSAGE
 * =========================================
 */

document
    .getElementById("messageForm")
    .addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const input =
                document.getElementById(
                    "messageInput"
                );

            const button =
                document.getElementById(
                    "sendButton"
                );


            const content =
                input.value.trim();


            if (!content) {
                return;
            }


            if (
                !conversation ||
                conversation.status !== "open"
            ) {

                return;

            }


            button.disabled = true;

            button.textContent =
                "Sending...";


            const {
                error
            } = await supabaseClient.rpc(
                "send_artist_dm_message",
                {
                    p_conversation_id:
                        conversation.id,

                    p_content:
                        content
                }
            );


            if (error) {

                console.error(
                    "Artist message error:",
                    error
                );

                alert(
                    error.message ||
                    "Unable to send message."
                );

                button.disabled = false;

                button.textContent =
                    "Send";

                return;

            }


            input.value = "";


            await loadConversation();

            await loadMessages();

            updateStatus();


            button.disabled = false;

            button.textContent =
                "Send";

        }
    );


/*
 * =========================================
 * ERROR
 * =========================================
 */

function showError(message) {

    document.getElementById(
        "messages"
    ).innerHTML = `
        <div class="error">
            ${message}
        </div>
    `;

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

            window.history.back();

        }
    );


/*
 * =========================================
 * START
 * =========================================
 */

async function startArtistDM() {

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


    const loaded =
        await loadConversation();


    if (!loaded) {
        return;
    }


    const authorized =
        await verifyArtistAccess();


    if (!authorized) {
        return;
    }


    await loadMessages();

    updateStatus();

}


startArtistDM();
