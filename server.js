const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { WebSocketServer } = require("ws");

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = process.env.PORT || 3000;

// Prepare the Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Store WebSocket clients
const clients = new Set();

app.prepare().then(() => {
	const server = createServer(async (req, res) => {
		try {
			const parsedUrl = parse(req.url, true);
			await handle(req, res, parsedUrl);
		} catch (err) {
			console.error("Error occurred handling", req.url, err);
			res.statusCode = 500;
			res.end("internal server error");
		}
	});

	// Create WebSocket server with path filtering
	const wss = new WebSocketServer({
		server,
		path: "/ws", // Only handle WebSocket connections on /ws path
	});

	wss.on("connection", (ws, request) => {
		console.log("New WebSocket client connected to /ws");
		clients.add(ws);

		// Send initial connection message
		ws.send(JSON.stringify({ type: "connected" }));

		ws.on("close", () => {
			console.log("WebSocket client disconnected");
			clients.delete(ws);
		});

		ws.on("error", (error) => {
			console.error("WebSocket client error:", error);
			clients.delete(ws);
		});
	});

	// Make WebSocket server available globally
	global.wsServer = wss;
	global.broadcastToClients = (message) => {
		const messageStr = JSON.stringify(message);
		clients.forEach((client) => {
			if (client.readyState === 1) {
				// WebSocket.OPEN
				client.send(messageStr);
			}
		});
	};

	server.listen(port, () => {
		console.log(`> Ready on http://${hostname}:${port}`);
		console.log("> WebSocket server is running");
	});
});
