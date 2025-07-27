import type { NextApiRequest, NextApiResponse } from "next";
import { bucket } from "@/lib/gcs";

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse
) {
	if (req.method !== "POST") return res.status(405).end();

	const { username, password, gameCode } = req.body;
	if (!username || !password || !gameCode)
		return res
			.status(400)
			.json({ error: "Missing username, password, or game code" });

	// Validate game code first
	const gameCodeFile = bucket.file("admin/game-code.json");
	try {
		const [gameCodeContents] = await gameCodeFile.download();
		const gameCodeData = JSON.parse(gameCodeContents.toString());

		if (
			gameCodeData.code !== gameCode.toUpperCase() ||
			!gameCodeData.active
		) {
			return res.status(401).json({ error: "Invalid game code" });
		}
	} catch {
		return res.status(401).json({ error: "Invalid game code" });
	}

	const file = bucket.file(`users/${username}.json`);
	try {
		const [contents] = await file.download();
		const user = JSON.parse(contents.toString());
		if (user.password !== password) {
			return res.status(401).json({ error: "Invalid credentials" });
		}
		// Don't return password
		const { password: _, ...userData } = user;
		res.status(200).json(userData);
	} catch {
		res.status(404).json({ error: "User not found" });
	}
}
