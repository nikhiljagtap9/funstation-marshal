import type { NextApiRequest, NextApiResponse } from "next";
import { bucket } from "@/lib/gcs";

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse
) {
	if (req.method !== "POST") return res.status(405).end();

	const { teamId, data } = req.body;
	if (!teamId || !data)
		return res.status(400).json({ error: "Missing teamId or data" });

	// Remove teamMembers if present
	const { teamMembers, ...dataWithoutTeamMembers } = data;

	const file = bucket.file(`teams/${teamId}.json`);
	await file.save(JSON.stringify(dataWithoutTeamMembers), {
		contentType: "application/json",
	});

	res.status(200).json({ message: "Saved successfully" });
}
