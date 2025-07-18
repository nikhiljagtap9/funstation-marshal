import type { NextApiRequest, NextApiResponse } from "next";
import {
	listAllTeamUsernames,
	saveTeamRecord,
	downloadTeamRecord,
} from "@/lib/gcs";
import { sendWebsocketEvent } from "@/lib/websocket";

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
		// Send websocket event to all clients
		await sendWebsocketEvent("gamesReset", {
			message:
				"Admin resets all games! You need to start new competition again",
		});
		return res.status(200).json({ success: true });
	} catch (error) {
		return res.status(500).json({ error: "Failed to reset games" });
	}
}
