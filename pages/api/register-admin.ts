import type { NextApiRequest, NextApiResponse } from "next";
import { bucket } from "@/lib/gcs";

const ADMIN_USERNAME = "eric@fantasia.com";
const ADMIN_PASSWORD = "eric@2025";
const ADMIN_FILE = "admin-user/admin.json";

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse
) {
	if (req.method !== "POST") return res.status(405).end();

	const { username, password } = req.body;
	if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
		return res.status(403).json({ error: "Invalid admin credentials" });
	}

	const file = bucket.file(ADMIN_FILE);
	try {
		// Check if admin already exists
		await file.download();
		// If file exists, allow login
		return res.status(200).json({ message: "Admin already registered" });
	} catch {
		// Not found, so register
		const adminData = { username, password };
		await file.save(JSON.stringify(adminData), {
			contentType: "application/json",
		});
		return res
			.status(201)
			.json({ message: "Admin registered successfully" });
	}
}
