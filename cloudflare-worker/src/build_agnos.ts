// src/build_agnos.ts
export interface Env {
    __STATIC_CONTENT: KVNamespace;
}

export default {
    async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
        const url = new URL(request.url);
        const username = url.searchParams.get("username") || "commaai";
        const branch = url.searchParams.get("branch") || "release3";
        const loadingMsg = url.searchParams.get("loading_msg") || "openpilot";

        const responseBody = `AGNOS Installer (Text-Based - Not a Real Binary)\nUsername: ${username}\nBranch: ${branch}\nLoading Message: ${loadingMsg}`;

        return new Response(responseBody, {
            headers: {
                "Content-Type": "text/plain",
                "Content-Disposition": "attachment; filename=installer_agnos.txt",
            },
        });
    },
} satisfies ExportedHandler<Env>;