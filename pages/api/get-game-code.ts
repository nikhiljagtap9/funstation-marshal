import type { NextApiRequest, NextApiResponse } from "next";
import { bucket } from "@/lib/gcs";

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse
) {
	if (req.method !== "GET") return res.status(405).end();

	const file = bucket.file("admin/game-code.json");

	try {
		const [contents] = await file.download();
		const gameCodeData = JSON.parse(contents.toString());

		res.status(200).json(gameCodeData);
	} catch (error) {
		// If file doesn't exist, return null
		res.status(200).json(null);
	}
}
