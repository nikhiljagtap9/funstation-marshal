import type { NextApiRequest, NextApiResponse } from "next";
import { bucket } from "@/lib/gcs";

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse
) {
	if (req.method !== "POST") return res.status(405).end();

	const { username, password } = req.body;
	if (!username || !password)
		return res.status(400).json({ error: "Missing username or password" });

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
