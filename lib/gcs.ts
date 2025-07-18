import { Storage } from "@google-cloud/storage";
import path from "path";

let storage: Storage;

if (process.env.NODE_ENV === "production") {
	// In production, use default authentication
	storage = new Storage();
} else {
	// In development, use service account key
	storage = new Storage({
		keyFilename: process.env.GCS_KEY_FILE || "gcs-key.json",
		projectId:
			process.env.GOOGLE_CLOUD_PROJECT || "quantum-beach-464611-e1",
	});
}

const BUCKET_NAME = "marshal-game-panel-data";

export const bucket = storage.bucket(BUCKET_NAME);

export async function uploadFile(
	bucketName: string,
	filename: string,
	data: any
) {
	const bucket = storage.bucket(bucketName);
	const file = bucket.file(filename);
	await file.save(data);
}

export async function downloadFile(bucketName: string, filename: string) {
	const bucket = storage.bucket(bucketName);
	const file = bucket.file(filename);
	const [data] = await file.download();
	return data;
}

export async function listFiles(bucketName: string) {
	const [files] = await storage.bucket(bucketName).getFiles();
	return files;
}

// List all team usernames by listing files in the 'teams/' prefix
export async function listAllTeamUsernames() {
	const [files] = await bucket.getFiles({ prefix: "teams/" });
	// Extract username from 'teams/{username}.json'
	return files
		.map((f) => f.name)
		.filter((name) => name.startsWith("teams/") && name.endsWith(".json"))
		.map((name) => name.replace("teams/", "").replace(".json", ""));
}

// Save a team record (overwrite existing)
export async function saveTeamRecord(username: string, data: any) {
	const file = bucket.file(`teams/${username}.json`);
	await file.save(JSON.stringify(data, null, 2), {
		contentType: "application/json",
	});
}

export async function downloadTeamRecord(username: string) {
	const file = bucket.file(`teams/${username}.json`);
	const [data] = await file.download();
	return JSON.parse(data.toString());
}
