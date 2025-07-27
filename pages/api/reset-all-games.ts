import type { NextApiRequest, NextApiResponse } from "next";
import {
	listAllTeamUsernames,
	saveTeamRecord,
	downloadTeamRecord,
} from "@/lib/gcs";

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse
) {
	if (req.method !== "POST") {
		return res.status(405).json({ error: "Method not allowed" });
	}

	try {
		const usernames = await listAllTeamUsernames();
		await Promise.all(
			usernames.map(async (username: string) => {
				// Download existing team record
				const record = await downloadTeamRecord(username);
				// Preserve marshalName and teamName, reset only gameProgress
				await saveTeamRecord(username, {
					marshalName: record.marshalName || "",
					teamName: record.teamName || "",
					gameProgress: { games: [] },
				});
			})
		);
		// Broadcast reset message to all marshal clients only
		if (global.broadcastToClients) {
			global.broadcastToClients({
				type: "gamesReset",
				message:
					"Admin has reset all games. You will be logged out automatically.",
			});
		}

		// Also broadcast to admin dashboards for real-time update
		if (global.broadcastToClients) {
			global.broadcastToClients({
				type: "liveUpdate",
				message: "All games have been reset",
			});
		}
		return res.status(200).json({ success: true });
	} catch (error) {
		return res.status(500).json({ error: "Failed to reset games" });
	}
}
