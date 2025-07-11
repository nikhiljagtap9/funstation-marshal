import type { NextApiRequest, NextApiResponse } from "next";
import { bucket } from "@/lib/gcs";
import { wsServer } from "./admin-ws";

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse
) {
	if (req.method !== "POST") return res.status(405).end();

	const { username, password, marshalName } = req.body;
	if (!username || !password)
		return res.status(400).json({ error: "Missing username or password" });

	const file = bucket.file(`users/${username}.json`);
	try {
		// Check if user already exists
		await file.download();
		return res.status(409).json({ error: "User already exists" });
	} catch {
		// User does not exist, proceed
	}

	const userData = {
		username,
		password,
		marshalName,
	};
	await file.save(JSON.stringify(userData), {
		contentType: "application/json",
	});
	// Also save to teams/{username}.json for dashboard compatibility
	const teamFile = bucket.file(`teams/${username}.json`);
	await teamFile.save(JSON.stringify(userData), {
		contentType: "application/json",
	});
	// Broadcast to admin dashboards via WebSocket
	if (wsServer) {
		const now = new Date().toLocaleString();
		wsServer.clients.forEach((client) => {
			if (client.readyState === 1) {
				client.send(
					JSON.stringify({
						type: "new_marshal",
						message: `New marshal registered: ${
							marshalName || username
						} at ${now}`,
						marshalName: marshalName || username,
						username,
						time: now,
					})
				);
				client.send(JSON.stringify({ type: "liveUpdate" }));
			}
		});
	}
	res.status(201).json({ message: "User registered successfully" });
}
