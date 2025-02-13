// src/index.ts
import { Env } from '../../worker-configuration';
import { fillInArg } from './utils';

// Constants for User Agent Detection
const USER_AGENT_HEADER = 'User-Agent';
const AGNOS_SETUP_USER_AGENT = 'AGNOSSetup';

const REPO_NAME = "openpilot"; // Constant for repository name

/**
 * Handles GET requests to serve the HTML form and redirects for specific user agents.
 */
async function handleRequest(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const userAgent = request.headers.get(USER_AGENT_HEADER) ?? '';
    const isAgnosUserAgent = userAgent.includes(AGNOS_SETUP_USER_AGENT);

    let username = "";
    let branch = "";
    let loadingMessage = "";

    // Extract username, branch, and loading message from URL path
    const pathParts = url.pathname.slice(1).split("/");
    username = pathParts[0] || "";
    branch = pathParts[1] || "";
    loadingMessage = pathParts[2] || "";

    // Input sanitization and length limits
    username = username.substring(0, 39).toLowerCase(); // Max GitHub username length
    branch = branch === "_" ? "" : branch.substring(0, 255).trim(); // Max GitHub branch length
    loadingMessage = loadingMessage.substring(0, 39).trim();

    if (loadingMessage === "") {
        loadingMessage = username; // Default loading message to username if not provided
    } else {
        loadingMessage = loadingMessage.replace(" ", "%20"); // URL encode spaces in loading message
    }

    // Logging request details
    console.log(`IP: ${request.headers.get("CF-Connecting-IP")}, URL: ${url.pathname}, Username: ${username}, Branch: ${branch}, User Agent: ${userAgent}`);

    // Redirect AGNOS Setup user agents
    if (isAgnosUserAgent) {
        if (username === "") {
            username = "commaai"; // Default username if not in path
            branch = "release3";     // Default branch
            loadingMessage = "openpilot"; // Default loading message
        }
        const redirectUrl = `/installer/build_agnos.js?username=${username}&branch=${branch}&loading_msg=${loadingMessage}`;
        return Response.redirect(redirectUrl, 302);
    }

    // HTML for website form
    const htmlContent = `<!DOCTYPE html>
    <html>
    <head>
    <link rel="preconnect" href="https://fonts.gstatic.com">
    <link href="https://fonts.googleapis.com/css2?family=Roboto&display=swap" rel="stylesheet">
    <style>
    body {background-image: linear-gradient(#F9DEC9, #99B2DD); font-family: "Roboto", sans-serif; color: #30323D; text-align: center;}
    span { color: #6369D1; }
    a { text-decoration: none; color: #6369D1;}
    button[name="download_agnos"] {background-color: #ace6df; border-radius: 4px; border: 5px; padding: 10px 12px; box-shadow:0px 4px 0px #80c2ba; display: inline-block; color: #30323D;top: 1px; outline: 0px transparent !important;}
    button:active[name="download_agnos"] {background-color: #89c7c7; border-radius: 4px; border: 5px; padding: 10px 12px; box-shadow:0px 2px 2px #89c7c7; background-color: #89c7c7; display: inline-block; top: 1px, outline: 0px transparent !important;}
    </style>
    <title>fork installer generator</title>
    <link rel="icon" type="image/x-icon" href="/favicon.ico">
    </head>
    <body>
    </br></br><a href="/"><h1 style="color: #30323D;">🍴 openpilot fork installer generator-inator 🍴</h1></a>
    <h3 style="position: absolute; bottom: 0; left: 0; width: 100%; text-align: center;"><a href="https://github.com/sshane/openpilot-installer-generator" style="color: 30323D;">💾 Installer Generator GitHub Repo</a></h3>`;

    let htmlBody = "";

    if (username === "") {
        htmlBody += `<h3 style="color: #30323D;">🎉 now supports comma three! 🎉<h3>`;
        htmlBody += "</br><h2>Enter this URL on your device during setup with the format:</h2>";
        htmlBody += `<h2><a href="/username/branch"><span>${url.origin}/username/branch</span></a></h2>`;
        htmlBody += "</br><h3>Or complete the request on your desktop to download a custom installer.</h3>";
    } else {
        htmlBody += `<h3>Given fork username: <a href="https://github.com/${username}/${REPO_NAME}">${username}</a></h3>`;
        if (branch !== "") {
            htmlBody += `<h3>Given branch: <a href="https://github.com/${username}/${REPO_NAME}/tree/${branch}">${branch}</a></h3>`;
        } else {
            htmlBody += '<h3>❗ No branch supplied, git will use default GitHub branch ❗</h3>';
        }
        if (loadingMessage && loadingMessage !== username) { // Display loading message if provided and not default
            htmlBody += `<h3>You've discovered a hidden secret!</br>Custom loading message: <span>Installing ${loadingMessage}</span></h3>`;
        }

        htmlBody += `
            <form method="post">
            <input type="hidden" name="username" value="${username}">
            <input type="hidden" name="branch" value="${branch}">
            <input type="hidden" name="loading_msg" value="${loadingMessage}">
            <button class="button" name="download_agnos">Download AGNOS Installer Binary</button>
        </form>
        <h5>Or enter this URL on the setup screen on your device.</h5>
        `;
    }

    const fullHtml = htmlContent + htmlBody + `</body></html>`;

    return new Response(fullHtml, {
        headers: { "Content-Type": "text/html;charset=UTF-8" },
    });
}

/**
 * Handles POST requests from the form submission to generate and return the AGNOS installer binary.
 */
async function handleFormSubmission(request: Request, env: Env): Promise<Response> {
    const formData = await request.formData();

    const username = formData.get("username")?.toString() || "commaai";
    const branch = formData.get("branch")?.toString() || "release3";
    const loadingMessage = formData.get("loading_msg")?.toString() || "openpilot";

    if (formData.has('download_agnos')) {
        const filePath = 'installer_openpilot_agnos';
        const binaryData = await env.__STATIC_CONTENT.get(filePath, 'arrayBuffer');

        if (!binaryData) {
            return new Response("Binary not found in KV Storage", { status: 500 });
        }

        let installerBinary = new Uint8Array(binaryData);
        installerBinary = fillInArg("27182818284590452353602874713526624977572470936999595", `${username}/${REPO_NAME}.git`, installerBinary, "\0", "username");
        installerBinary = fillInArg("161803398874989484820458683436563811772030917980576286213544862270526046281890244970720720418939113748475408807538689175212663386222353693179318006076672635443338908659593958290563832266131992829026788067520876689250171169620703222104321626954862629631361", branch, installerBinary, "\0", "branch");
        installerBinary = fillInArg("314159265358979323846264338327950288419", loadingMessage, installerBinary, " ", "loading message");

        return new Response(installerBinary, {
            headers: {
                "Content-Type": "application/octet-stream",
                "Content-Disposition": `attachment; filename="installer_agnos_${username}_${branch}.bin"`
            }
        });
    }

    return new Response("Invalid form submission", { status: 400 });
}

export default {
    async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
        if (request.method === 'POST') {
            return handleFormSubmission(request, env);
        } else {
            return handleRequest(request, env);
        }
    },
} satisfies ExportedHandler<Env>;
