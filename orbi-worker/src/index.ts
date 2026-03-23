const INSTALL_SCRIPT_URL =
	"https://raw.githubusercontent.com/arqxus-flow/Aqxus_Agent/main/install.sh";

export default {
	async fetch(request): Promise<Response> {
		const url = new URL(request.url);

		if (url.pathname === "/install") {
			const res = await fetch(INSTALL_SCRIPT_URL);
			return new Response(res.body, {
				headers: {
					"content-type": "text/plain; charset=utf-8",
					"cache-control": "public, max-age=300",
				},
			});
		}

		return new Response("Not found", { status: 404 });
	},
} satisfies ExportedHandler;
