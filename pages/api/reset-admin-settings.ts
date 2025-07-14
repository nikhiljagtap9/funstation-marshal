import type { NextApiRequest, NextApiResponse } from "next";
import { bucket } from "@/lib/gcs";

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse
) {
	if (req.method !== "POST") return res.status(405).end();

	try {
		const defaultSettings = {
			resultsRevealed: false,
			updatedAt: new Date().toISOString(),
		};

		const file = bucket.file("admin/settings.json");
		await file.save(JSON.stringify(defaultSettings, null, 2), {
			contentType: "application/json",
		});

		res.status(200).json({
			message: "Admin settings reset successfully",
			settings: defaultSettings,
		});
	} catch (error) {
		console.error("Error resetting admin settings:", error);
		res.status(500).json({ error: "Failed to reset admin settings" });
	}
}
