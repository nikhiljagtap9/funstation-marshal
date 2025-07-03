import type { NextApiRequest, NextApiResponse } from "next";
import { bucket } from "@/lib/gcs";

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse
) {
	if (req.method !== "GET") return res.status(405).end();

	try {
		const [files] = await bucket.getFiles({ prefix: "users/" });
		const users = [];
		for (const file of files) {
			if (!file.name.endsWith(".json")) continue;
			const [contents] = await file.download();
			const user = JSON.parse(contents.toString());
			// Exclude password
			const { password, ...userData } = user;
			users.push(userData);
		}
		res.status(200).json(users);
	} catch (e) {
		res.status(500).json({ error: "Failed to list users" });
	}
}
