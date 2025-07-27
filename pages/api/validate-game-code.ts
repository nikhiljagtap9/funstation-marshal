import type { NextApiRequest, NextApiResponse } from "next";
import { bucket } from "@/lib/gcs";

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse
) {
	if (req.method !== "POST") return res.status(405).end();

	const { gameCode } = req.body;
	if (!gameCode) {
		return res.status(400).json({ error: "Game code is required" });
	}

	const file = bucket.file("admin/game-code.json");

	try {
		const [contents] = await file.download();
		const gameCodeData = JSON.parse(contents.toString());

		if (
			gameCodeData.code === gameCode.toUpperCase() &&
			gameCodeData.active
		) {
			res.status(200).json({ valid: true });
		} else {
			res.status(200).json({ valid: false });
		}
	} catch (error) {
		// If file doesn't exist, game code is invalid
		res.status(200).json({ valid: false });
	}
}
