import type { NextApiRequest, NextApiResponse } from "next";
import { bucket } from "@/lib/gcs";

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse
) {
	if (req.method !== "POST") return res.status(405).end();

	const { username, newPassword } = req.body;
	if (!username || !newPassword)
		return res
			.status(400)
			.json({ error: "Missing username or new password" });

	const file = bucket.file(`users/${username}.json`);
	try {
		const [contents] = await file.download();
		const user = JSON.parse(contents.toString());
		user.password = newPassword;
		await file.save(JSON.stringify(user), {
			contentType: "application/json",
		});
		res.status(200).json({ message: "Password reset successfully" });
	} catch {
		res.status(404).json({ error: "User not found" });
	}
}
