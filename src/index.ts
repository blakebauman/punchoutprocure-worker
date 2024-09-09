/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.toml`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

// export default {
// 	async fetch(request, env, ctx): Promise<Response> {
// 		return new Response('Hello World!');
// 	},
// } satisfies ExportedHandler<Env>;

import { handlePunchOutSetupRequest, createPunchOutSetupResponse } from './services/punchoutService';
import { authenticateCXMLHeader } from './services/authenticationService';

const handleRequest = async (req: Request, env: any, ctx: any) => {
	if (req.method === 'POST' && req.url.endsWith('/punchout/setup')) {
		const xmlString = await req.text();
		const response = await handlePunchOutSetupRequest(xmlString);
		return new Response(JSON.stringify(response), { headers: { 'Content-Type': 'application/json' } });
	} else if (req.method === 'POST' && req.url.endsWith('/punchout/response')) {
		const response = await createPunchOutSetupResponse();
		return new Response(response, { headers: { 'Content-Type': 'application/xml' } });
	}

	return new Response('Not Found', { status: 404 });
};

// Use export default to handle the request
export default {
	async fetch(req: Request, env: any, ctx: any): Promise<Response> {
		return handleRequest(req, env, ctx);
	},
};
