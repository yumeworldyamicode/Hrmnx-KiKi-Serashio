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

function formatMessageTime(date) {

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

        document.getElementById(
            "dmStatus"
        ).textContent =
            "No conversation specified.";

        return;

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
            price_yen,
            message_limit,
            message_count,
            payment_status,
            status,

            artists (
                id,
                name,
                slug,
                avatar_url
            )
        `)

        .eq("id", conversationId)

        .single();


    if (error) {

        console.error(
            "Conversation loading error:",
            error
        );

        document.getElementById(
            "dmStatus"
        ).textContent =
            "Conversation could not be loaded.";

        return;

    }


    conversation = data;

    artist = data.artists;


    document.getElementById(
        "artistName"
    ).textContent =
        artist?.name || "Artist";


    updateConversationStatus();

    await loadMessages();

}


/*
 * =========================================
 * STATUS
 * =========================================
 */

function updateConversationStatus() {

    const status =
        document.getElementById(
            "dmStatus"
        );

    const limit =
        document.getElementById(
            "dmLimit"
        );


    const remaining =
        Math.max(
            0,
            conversation.message_limit -
            conversation.message_count
        );


    if (
        conversation.status !== "open"
    ) {

        status.textContent =
            "Conversation closed.";

        document.getElementById(
            "dmComposer"
        ).innerHTML = `
            <div class="dm-closed">
                This conversation is closed.
            </div>
        `;

        return;

    }


    status.textContent =
        `${remaining} messages remaining`;


    limit.textContent =
        `${remaining} messages remaining`;

}


/*
 * =========================================
 * LOAD MESSAGES
 * =========================================
 */

async function loadMessages() {

    const container =
        document.getElementById(
            "dmMessages"
        );


    const {
        data: messages,
        error
    } = await supabaseClient

        .from("dm_messages")

        .select(`
            id,
            conversation_id,
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

        container.innerHTML = `
            <div class="dm-empty">
                Unable to load messages.
            </div>
        `;

        return;

    }


    if (!messages || messages.length === 0) {

        container.innerHTML = `
            <div class="dm-empty">
                No messages yet.
            </div>
        `;

        return;

    }


    container.innerHTML = "";


    messages.forEach(
        message => {

            const wrapper =
                document.createElement(
                    "div"
                );

            wrapper.className =
                `dm-message ${message.sender_type}`;


            const content =
                document.createElement(
                    "div"
                );

            content.textContent =
                message.content;


            const time =
                document.createElement(
                    "div"
                );

            time.className =
                "dm-message-time";

            time.textContent =
                formatMessageTime(
                    message.created_at
                );


            wrapper.appendChild(content);

            wrapper.appendChild(time);

            container.appendChild(wrapper);

        }
    );


    container.scrollTop =
        container.scrollHeight;

}


/*
 * =========================================
 * SEND MESSAGE
 * =========================================
 */

document
    .getElementById("dmForm")
    .addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const input =
                document.getElementById(
                    "dmInput"
                );

            const sendButton =
                document.getElementById(
                    "dmSend"
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


            const remaining =
                conversation.message_limit -
                conversation.message_count;


            if (remaining <= 0) {

                alert(
                    "This conversation has reached its message limit."
                );

                return;

            }


            sendButton.disabled = true;

            sendButton.textContent =
                "Sending...";


            const {
                    data,
                    error
                } = await supabaseClient.rpc(
                    "send_dm_message",
                    {
                        p_conversation_id:
                            conversation.id,

                            p_content:
                            content
                    }
            );


            if (error) {

                console.error(
                    "Message sending error:",
                    error
                );

                alert(
                    "Unable to send this message."
                );

                sendButton.disabled = false;

                sendButton.textContent =
                    "Send";

                return;

            }


            input.value = "";


            await loadConversation();


            sendButton.disabled = false;

            sendButton.textContent =
                "Send";

        }
    );


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

async function startDM() {

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


    await loadConversation();

}


startDM();
