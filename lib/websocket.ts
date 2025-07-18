export async function sendWebsocketEvent(type: string, payload: any) {
	// TODO: Implement real websocket broadcast to all clients
	// For now, just log to console
	console.log("WebSocket Event:", type, payload);
}
