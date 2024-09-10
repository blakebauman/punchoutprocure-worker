// Define Middleware and RouteHandler type for reusable handling
type Middleware = (req: Request, env: any, ctx: any) => Promise<Response | void>;
type RouteHandler = (req: Request, env: any, ctx: any) => Promise<Response>;

// Helper for creating consistent error responses
export function handleErrorResponse(message: string, statusCode: number = 400): Response {
	return new Response(JSON.stringify({ error: message }), {
		status: statusCode,
		headers: { 'Content-Type': 'application/json' },
	});
}

// Structured logging for requests and errors
export function logRequest(req: Request, env: any): void {
	console.log(`Incoming request: ${req.method} ${req.url}`);
}

export function logResponse(req: Request, res: Response, env: any): void {
	console.log(`Response for ${req.method} ${req.url}: ${res.status}`);
}

export function logError(req: Request, error: Error): void {
	console.error(`Error for ${req.method} ${req.url}: ${error.message}`);
}

export interface Route {
	method: string;
	path: RegExp;
	handler: RouteHandler | (() => Promise<RouteHandler>);
	params?: string[];
	middlewares?: Middleware[];
}

export class ApiError extends Error {
	status: number;
	constructor(message: string, status: number) {
		super(message);
		this.status = status;
	}
}

export class NotFoundError extends ApiError {
	constructor(message = 'Resource not found') {
		super(message, 404);
	}
}

export class BadRequestError extends ApiError {
	constructor(message = 'Bad request') {
		super(message, 400);
	}
}

export class ApiGateway {
	private middlewares: Middleware[] = [];
	private routes: Route[] = [];

	use(middleware: Middleware): ApiGateway {
		this.middlewares.push(middleware);
		return this;
	}

	useOn(path: string, middleware: Middleware): ApiGateway {
		const pathRegex = new RegExp(`^${path}$`);
		const matchingRoute = this.routes.find((route) => route.path.source === pathRegex.source);

		if (matchingRoute) {
			matchingRoute.middlewares = matchingRoute.middlewares || [];
			matchingRoute.middlewares.push(middleware);
		}
		return this;
	}

	on(method: string, path: string, handler: RouteHandler): ApiGateway {
		const paramNames: string[] = [];
		const pathRegex = new RegExp(
			`^${path.replace(/:([\w]+)/g, (_, param) => {
				paramNames.push(param);
				return '([^/]+)';
			})}$`
		);
		this.routes.push({ method, path: pathRegex, handler, params: paramNames });
		return this;
	}

	async onAsync(method: string, path: string, handlerLoader: () => Promise<RouteHandler>): Promise<ApiGateway> {
		const pathRegex = new RegExp(`^${path}$`);
		this.routes.push({ method, path: pathRegex, handler: handlerLoader });
		return this;
	}

	extractParams(matchingRoute: any, url: string): Record<string, string> {
		const matches = url.match(matchingRoute.path);
		const params: Record<string, string> = {};
		if (matches && matchingRoute.params) {
			matchingRoute.params.forEach((param: string, index: number) => {
				params[param] = matches[index + 1];
			});
		}
		return params;
	}

	async handleRequest(req: Request, env: any, ctx: any): Promise<Response> {
		try {
			logRequest(req, env);

			for (const middleware of this.middlewares) {
				const response = await middleware(req, env, ctx);
				if (response) {
					logResponse(req, response, env);
					return response;
				}
			}

			const url = new URL(req.url);
			const matchingRoute = this.routes.find((route) => route.method === req.method && route.path.test(url.pathname));

			if (matchingRoute) {
				const params = this.extractParams(matchingRoute, url.pathname);
				ctx.params = params;

				// Run route-specific middleware
				if (matchingRoute.middlewares) {
					for (const middleware of matchingRoute.middlewares) {
						const response = await middleware(req, env, ctx);
						if (response) return response;
					}
				}

				// If handler is async-loaded
				const handler =
					typeof matchingRoute.handler === 'function' && matchingRoute.handler.constructor.name === 'AsyncFunction'
						? await matchingRoute.handler(req, env, ctx)
						: matchingRoute.handler;

				const response = await (handler as RouteHandler)(req, env, ctx);
				logResponse(req, response, env);
				return response;
			}

			const notFoundResponse = new Response('Not Found', { status: 404 });
			logResponse(req, notFoundResponse, env);
			return notFoundResponse;
		} catch (error) {
			logError(req, error);
			return this.handleError(error);
		}
	}

	private handleError(error: any): Response {
		if (error instanceof ApiError) {
			return new Response(error.message, { status: error.status });
		}
		return new Response('Internal Server Error', { status: 500 });
	}
}
