const loginForm =
    document.getElementById("loginForm");

const loginButton =
    document.getElementById("loginButton");

const message =
    document.getElementById("message");


loginForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();

        const email =
            document.getElementById("email").value.trim();

        const password =
            document.getElementById("password").value;


        loginButton.disabled = true;

        loginButton.textContent =
            "Signing in...";

        message.textContent = "";


        const {
            data,
            error
        } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });


        if (error) {

            console.error(
                "Login error:",
                error
            );

            message.textContent =
                error.message;

            loginButton.disabled = false;

            loginButton.textContent =
                "Sign in";

            return;
        }


        console.log(
            "Signed in:",
            data.user
        );


        window.location.href =
            "index.html";

    }
);
