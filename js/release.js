const params = new URLSearchParams(window.location.search);
const releaseId = params.get("id");

const releaseContent = document.getElementById("releaseContent");

function escapeHTML(value) {
    if (value === null || value === undefined) return "";

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =========================
   SOCIAL ICONS
========================= */

function getSocialIcon(platform) {

    const name = platform.toLowerCase();

    if (name.includes("instagram")) {
        return "IG";
    }

    if (name === "x" || name.includes("twitter")) {
        return "𝕏";
    }

    if (name.includes("youtube")) {
        return "YT";
    }

    if (name.includes("tiktok")) {
        return "TT";
    }

    if (name.includes("facebook")) {
        return "f";
    }

    if (name.includes("threads")) {
        return "@";
    }

    if (name.includes("weverse")) {
        return "W";
    }

    if (name.includes("soundcloud")) {
        return "SC";
    }

    return platform.substring(0, 2).toUpperCase();
}


/* =========================
   COUNTDOWN
========================= */

function startCountdown(date) {

    const countdownElement = document.getElementById("countdownTime");

    if (!countdownElement) return;

    function updateCountdown() {

        const now = new Date().getTime();
        const target = new Date(date).getTime();

        const difference = target - now;

        if (difference <= 0) {
            countdownElement.textContent = "Released";
            return;
        }

        const days = Math.floor(
            difference / (1000 * 60 * 60 * 24)
        );

        const hours = Math.floor(
            (difference / (1000 * 60 * 60)) % 24
        );

        const minutes = Math.floor(
            (difference / (1000 * 60)) % 60
        );

        const seconds = Math.floor(
            (difference / 1000) % 60
        );

        countdownElement.textContent =
            `${days}d ${hours}h ${minutes}m ${seconds}s`;
    }

    updateCountdown();

    setInterval(updateCountdown, 1000);
}


/* =========================
   LOAD RELEASE
========================= */

async function loadRelease() {

    if (!releaseId) {
        releaseContent.innerHTML =
            `<div class="state">Release not found.</div>`;
        return;
    }


    /* =========================
       RELEASE
    ========================= */

    const {
        data: release,
        error: releaseError
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
            distribution_message
        `)
        .eq("id", releaseId)
        .single();


    if (releaseError || !release) {

        console.error(releaseError);

        releaseContent.innerHTML =
            `<div class="state">Release not found.</div>`;

        return;
    }


    /* =========================
       ARTIST
    ========================= */

    const {
        data: artist
    } = await supabaseClient
        .from("artists")
        .select(`
            id,
            name,
            slug
        `)
        .eq("id", release.artist_id)
        .single();


    /* =========================
       TRACKS
    ========================= */

    const {
        data: tracks
    } = await supabaseClient
        .from("release_tracks")
        .select(`
            track_number,
            title
        `)
        .eq("release_id", release.id)
        .order("track_number", {
            ascending: true
        });


    /* =========================
       PLATFORMS
    ========================= */

    const {
        data: platforms
    } = await supabaseClient
        .from("release_platforms")
        .select(`
            platform,
            url
        `)
        .eq("release_id", release.id)
        .order("platform");


    /* =========================
       RELEASE DETAILS
    ========================= */

    const {
        data: details,
        error: detailsError
    } = await supabaseClient
        .from("release_details")
        .select(`
            description,
            producer_name,
            producer_text
        `)
        .eq("release_id", release.id)
        .maybeSingle();


    if (detailsError) {
        console.error("Release details error:", detailsError);
    }


    /* =========================
       INTERVIEWS
    ========================= */

    const {
        data: interviews,
        error: interviewsError
    } = await supabaseClient
        .from("release_interviews")
        .select(`
            person_name,
            person_role,
            content
        `)
        .eq("release_id", release.id)
        .order("sort_order", {
            ascending: true
        });


    if (interviewsError) {
        console.error("Interview error:", interviewsError);
    }


    /* =========================
       SOCIALS
    ========================= */

    const {
        data: socials,
        error: socialsError
    } = await supabaseClient
        .from("release_socials")
        .select(`
            platform,
            url
        `)
        .eq("release_id", release.id)
        .order("sort_order", {
            ascending: true
        });


    if (socialsError) {
        console.error("Socials error:", socialsError);
    }


    /* =========================
       DATE
    ========================= */

    let formattedDate = "";

    if (release.release_date) {

        formattedDate = new Date(
            release.release_date
        ).toLocaleDateString(
            undefined,
            {
                year: "numeric",
                month: "long",
                day: "numeric"
            }
        );
    }


    /* =========================
       TRACK HTML
    ========================= */

    let tracksHTML = "";

    if (tracks && tracks.length > 0) {

        tracksHTML = tracks.map(track => {

            return `
                <div class="track">

                    <div class="track-number">
                        ${escapeHTML(track.track_number)}
                    </div>

                    <div class="track-title">
                        ${escapeHTML(track.title)}
                    </div>

                </div>
            `;

        }).join("");

    } else {

        tracksHTML = `
            <div class="section-text">
                No tracks have been added yet.
            </div>
        `;
    }


    /* =========================
       PLATFORM HTML
    ========================= */

    let platformsHTML = "";

    if (platforms && platforms.length > 0) {

        platformsHTML = platforms.map(platform => {

            return `
                <a
                    class="platform-link"
                    href="${escapeHTML(platform.url)}"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    ${escapeHTML(platform.platform)}
                </a>
            `;

        }).join("");

    } else {

        platformsHTML = `
            <div class="section-text">
                Streaming links will be added when available.
            </div>
        `;
    }


    /* =========================
       ABOUT RELEASE
    ========================= */

    let aboutHTML = "";

    if (details && details.description) {

        aboutHTML = `
            <section class="release-section">

                <h2 class="section-title">
                    About this release
                </h2>

                <div class="section-text">
                    ${escapeHTML(details.description)}
                </div>

            </section>
        `;
    }


    /* =========================
       PRODUCER
    ========================= */

    let producerHTML = "";

    if (
        details &&
        (
            details.producer_name ||
            details.producer_text
        )
    ) {

        producerHTML = `
            <section class="release-section">

                <h2 class="section-title">
                    Producer
                </h2>

                ${
                    details.producer_name
                    ? `
                        <div class="producer-label">
                            Producer
                        </div>

                        <div class="producer-name">
                            ${escapeHTML(details.producer_name)}
                        </div>
                    `
                    : ""
                }

                ${
                    details.producer_text
                    ? `
                        <div class="section-text">
                            ${escapeHTML(details.producer_text)}
                        </div>
                    `
                    : ""
                }

            </section>
        `;
    }


    /* =========================
       INTERVIEW
    ========================= */

    let interviewHTML = "";

    if (interviews && interviews.length > 0) {

        const interviewItems = interviews.map(person => {

            return `
                <article class="interview">

                    <div class="interview-person">
                        ${escapeHTML(person.person_name)}
                    </div>

                    ${
                        person.person_role
                        ? `
                            <div class="interview-role">
                                ${escapeHTML(person.person_role)}
                            </div>
                        `
                        : ""
                    }

                    <div class="interview-content">
                        ${escapeHTML(person.content)}
                    </div>

                </article>
            `;

        }).join("");


        interviewHTML = `
            <section class="release-section">

                <h2 class="section-title">
                    Artist Interview
                </h2>

                <div class="interview-list">
                    ${interviewItems}
                </div>

            </section>
        `;
    }


    /* =========================
       SOCIALS
    ========================= */

    let socialsHTML = "";

    if (socials && socials.length > 0) {

        const socialItems = socials.map(social => {

            return `
                <a
                    class="social-link"
                    href="${escapeHTML(social.url)}"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="${escapeHTML(social.platform)}"
                    title="${escapeHTML(social.platform)}"
                >
                    ${getSocialIcon(social.platform)}
                </a>
            `;

        }).join("");


        socialsHTML = `
            <section class="release-section">

                <h2 class="section-title">
                    Follow
                </h2>

                <div class="social-list">
                    ${socialItems}
                </div>

            </section>
        `;
    }


    /* =========================
       COUNTDOWN
    ========================= */

    let countdownHTML = "";

    if (release.release_date) {

        const releaseTime =
            new Date(release.release_date).getTime();

        const now = Date.now();

        if (releaseTime > now) {

            countdownHTML = `
                <div class="countdown">

                    <div class="countdown-label">
                        Release countdown
                    </div>

                    <div
                        id="countdownTime"
                        class="countdown-time"
                    >
                        Loading...
                    </div>

                </div>
            `;
        }
    }


    /* =========================
       DISTRIBUTION PROBLEM
    ========================= */

    let distributionHTML = "";

    if (release.distribution_problem) {

        const message =
            release.distribution_message ||
            "This release has some problems, we're working to solve them as fast as we can.";

        distributionHTML = `
            <div class="distribution-problem">
                ${escapeHTML(message)}
            </div>
        `;
    }


    /* =========================
       RENDER
    ========================= */

    releaseContent.innerHTML = `

        <section class="release-main">

            ${
                release.cover_url
                ? `
                    <img
                        class="release-cover"
                        src="${escapeHTML(release.cover_url)}"
                        alt="${escapeHTML(release.title)}"
                    >
                `
                : `
                    <div class="release-cover"></div>
                `
            }

            <div class="release-info">

                ${
                    artist
                    ? `
                        <div class="release-artist">
                            ${escapeHTML(artist.name)}
                        </div>
                    `
                    : ""
                }

                <h1 class="release-title">
                    ${escapeHTML(release.title)}
                </h1>

                ${
                    release.type
                    ? `
                        <div class="release-type">
                            ${escapeHTML(release.type)}
                        </div>
                    `
                    : ""
                }

                ${
                    formattedDate
                    ? `
                        <div class="release-date">
                            ${formattedDate}
                        </div>
                    `
                    : ""
                }

                ${countdownHTML}

                ${distributionHTML}

            </div>

        </section>


        <section class="release-section">

            <h2 class="section-title">
                Tracks
            </h2>

            <div class="track-list">
                ${tracksHTML}
            </div>

        </section>


        <section class="release-section">

            <h2 class="section-title">
                Listen
            </h2>

            <div class="platform-list">
                ${platformsHTML}
            </div>

        </section>


        ${aboutHTML}

        ${producerHTML}

        ${interviewHTML}

        ${socialsHTML}

    `;


    /* Start countdown after HTML exists */

    if (
        release.release_date &&
        new Date(release.release_date).getTime() > Date.now()
    ) {

        startCountdown(release.release_date);
    }
}


loadRelease();
