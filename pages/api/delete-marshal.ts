import type { NextApiRequest, NextApiResponse } from "next";
import { bucket } from "@/lib/gcs";

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse
) {
	if (req.method !== "POST") return res.status(405).end();

	const { username } = req.body;
	if (!username) {
		return res.status(400).json({ error: "Username is required" });
	}

	try {
		// Delete user file
		const userFile = bucket.file(`users/${username}.json`);
		await userFile.delete();

		// Delete team record if exists
		const teamFile = bucket.file(`teams/${username}.json`);
		try {
			await teamFile.delete();
		} catch (error) {
			// Team file might not exist, that's okay
			console.log("Team file not found, continuing...");
		}

		// Broadcast deletion to the specific marshal via WebSocket
		if (global.broadcastToClients) {
			global.broadcastToClients({
				type: "marshalDeleted",
				username: username,
				message:
					"Admin has deleted your account. You will be logged out automatically.",
			});
		}

		// Also broadcast to admin dashboards for real-time update
		if (global.broadcastToClients) {
			global.broadcastToClients({
				type: "liveUpdate",
				message: `Marshal ${username} has been deleted`,
			});
		}

		res.status(200).json({
			message: "Marshal deleted successfully",
			username: username,
		});
	} catch (error) {
		console.error("Error deleting marshal:", error);
		res.status(500).json({ error: "Failed to delete marshal" });
	}
}
