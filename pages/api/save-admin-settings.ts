import type { NextApiRequest, NextApiResponse } from "next";
import { bucket } from "@/lib/gcs";

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse
) {
	if (req.method !== "POST") return res.status(405).end();

	const { resultsRevealed } = req.body;

	const file = bucket.file("admin/settings.json");
	const settings = {
		resultsRevealed: resultsRevealed || false,
		updatedAt: new Date().toISOString(),
	};

	await file.save(JSON.stringify(settings), {
		contentType: "application/json",
	});

	// Broadcast to admin dashboards via WebSocket
	if (global.broadcastToClients) {
		global.broadcastToClients({
			type: "adminSettingsUpdate",
			resultsRevealed,
		});
	}

	res.status(200).json({ message: "Settings saved successfully" });
}
