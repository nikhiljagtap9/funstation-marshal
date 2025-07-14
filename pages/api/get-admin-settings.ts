import type { NextApiRequest, NextApiResponse } from "next";
import { bucket } from "@/lib/gcs";

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse
) {
	if (req.method !== "GET") return res.status(405).end();

	try {
		const file = bucket.file("admin/settings.json");
		const [contents] = await file.download();
		const settings = JSON.parse(contents.toString());
		res.status(200).json(settings);
	} catch (error) {
		// If file doesn't exist, return default settings
		res.status(200).json({
			resultsRevealed: false,
			updatedAt: new Date().toISOString(),
		});
	}
}
