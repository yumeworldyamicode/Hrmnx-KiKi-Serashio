const signupForm =
    document.getElementById("signupForm");

const signupButton =
    document.getElementById("signupButton");

const message =
    document.getElementById("message");


signupForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        const email =
            document
                .getElementById("email")
                .value
                .trim();

        const password =
            document
                .getElementById("password")
                .value;


        signupButton.disabled = true;

        signupButton.textContent =
            "Creating account...";

        message.textContent = "";


        const {
            data,
            error
        } = await supabaseClient.auth.signUp({
            email: email,
            password: password
        });


        if (error) {

            console.error(
                "Signup error:",
                error
            );

            message.textContent =
                error.message;

            signupButton.disabled = false;

            signupButton.textContent =
                "Create account";

            return;
        }


        console.log(
            "Account created:",
            data.user
        );


        if (data.session) {

            window.location.href =
                "index.html";

            return;
        }


        message.textContent =
            "Your account was created. Please check your email to confirm your account.";

        signupButton.disabled = false;

        signupButton.textContent =
            "Create account";

    }
);
