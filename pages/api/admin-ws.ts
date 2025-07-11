import { NextApiRequest } from "next";
import { Server } from "ws";

let wsServer: Server | null = null;
export { wsServer };

export default function handler(req: NextApiRequest, res: any) {
	if (!res.socket.server.ws) {
		wsServer = new Server({ noServer: true });
		res.socket.server.ws = wsServer;
		res.socket.server.on(
			"upgrade",
			(request: any, socket: any, head: any) => {
				wsServer!.handleUpgrade(request, socket, head, (ws) => {
					wsServer!.emit("connection", ws, request);
				});
			}
		);

		wsServer.on("connection", (ws) => {
			ws.send(JSON.stringify({ type: "connected" }));
		});

		// Broadcast a refresh message every 10 seconds (placeholder for real-time updates)
		setInterval(() => {
			wsServer!.clients.forEach((client) => {
				if (client.readyState === 1) {
					client.send(JSON.stringify({ type: "refresh" }));
				}
			});
		}, 10000);
	}
	res.end();
}

export const config = {
	api: {
		bodyParser: false,
	},
};
