import type { NextApiRequest, NextApiResponse } from "next";
import { bucket } from "@/lib/gcs";

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse
) {
	const { teamId } = req.query;
	if (!teamId) return res.status(400).json({ error: "Missing teamId" });

	const file = bucket.file(`teams/${teamId}.json`);
	try {
		const [contents] = await file.download();
		res.status(200).json(JSON.parse(contents.toString()));
	} catch (e) {
		res.status(404).json({ error: "Not found" });
	}
}
