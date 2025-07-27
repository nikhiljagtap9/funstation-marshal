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

	// Validate game code format (alphanumeric, 6-12 characters)
	if (!/^[A-Za-z0-9]{6,12}$/.test(gameCode)) {
		return res.status(400).json({
			error: "Game code must be 6-12 alphanumeric characters",
		});
	}

	const file = bucket.file("admin/game-code.json");
	const gameCodeData = {
		code: gameCode.toUpperCase(),
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
		active: true,
	};

	try {
		await file.save(JSON.stringify(gameCodeData), {
			contentType: "application/json",
		});

		res.status(200).json({
			message: "Game code created successfully",
			gameCode: gameCode.toUpperCase(),
		});
	} catch (error) {
		console.error("Error creating game code:", error);
		res.status(500).json({ error: "Failed to create game code" });
	}
}
