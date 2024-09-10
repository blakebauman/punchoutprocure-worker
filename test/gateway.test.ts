import { describe, it, expect } from 'vitest';
import { handleErrorResponse, logRequest, logResponse, logError, ApiGateway } from '../gateway';

describe('Gateway', () => {
	describe('handleErrorResponse', () => {
		it('should return a response with the provided error message and status code', () => {
			const message = 'Bad request';
			const statusCode = 400;
			const response = handleErrorResponse(message, statusCode);
			expect(response.status).toBe(statusCode);
			expect(response.headers.get('Content-Type')).toBe('application/json');
			expect(response.body).toBe(JSON.stringify({ error: message }));
		});
	});

	describe('logRequest', () => {
		it('should log the incoming request', () => {
			// Mock console.log
			const consoleLogMock = jest.spyOn(console, 'log').mockImplementation();

			const req = new Request('https://example.com', { method: 'GET' });
			const env = {};
			logRequest(req, env);

			expect(consoleLogMock).toHaveBeenCalledWith(`Incoming request: ${req.method} ${req.url}`);

			// Restore console.log
			consoleLogMock.mockRestore();
		});
	});

	describe('logResponse', () => {
		it('should log the response for the request', () => {
			// Mock console.log
			const consoleLogMock = jest.spyOn(console, 'log').mockImplementation();

			const req = new Request('https://example.com', { method: 'GET' });
			const res = new Response('OK', { status: 200 });
			const env = {};
			logResponse(req, res, env);

			expect(consoleLogMock).toHaveBeenCalledWith(`Response for ${req.method} ${req.url}: ${res.status}`);

			// Restore console.log
			consoleLogMock.mockRestore();
		});
	});

	describe('logError', () => {
		it('should log the error for the request', () => {
			// Mock console.error
			const consoleErrorMock = jest.spyOn(console, 'error').mockImplementation();

			const req = new Request('https://example.com', { method: 'GET' });
			const error = new Error('Internal Server Error');
			logError(req, error);

			expect(consoleErrorMock).toHaveBeenCalledWith(`Error for ${req.method} ${req.url}: ${error.message}`);

			// Restore console.error
			consoleErrorMock.mockRestore();
		});
	});

	describe('ApiGateway', () => {
		it('should create an instance of ApiGateway', () => {
			const apiGateway = new ApiGateway();
			expect(apiGateway).toBeInstanceOf(ApiGateway);
		});

		it('should register and handle routes', async () => {
			const apiGateway = new ApiGateway();

			apiGateway.on('GET', '/users/:id', async (req, env, ctx) => {
				const { id } = ctx.params;
				return new Response(`User ID: ${id}`);
			});

			const req = new Request('https://example.com/users/123', { method: 'GET' });
			const env = {};
			const ctx = {};

			const response = await apiGateway.handleRequest(req, env, ctx);

			expect(response.status).toBe(200);
			expect(await response.text()).toBe('User ID: 123');
		});

		it('should handle middleware', async () => {
			const apiGateway = new ApiGateway();

			const middleware = async (req, env, ctx) => {
				ctx.data = 'Hello, World!';
			};

			apiGateway.use(middleware);

			apiGateway.on('GET', '/greeting', async (req, env, ctx) => {
				return new Response(ctx.data);
			});

			const req = new Request('https://example.com/greeting', { method: 'GET' });
			const env = {};
			const ctx = {};

			const response = await apiGateway.handleRequest(req, env, ctx);

			expect(response.status).toBe(200);
			expect(await response.text()).toBe('Hello, World!');
		});
	});
});
