import type { NextApiRequest, NextApiResponse } from "next";
import { bucket } from "@/lib/gcs";

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse
) {
	if (req.method !== "POST") return res.status(405).end();

	const { teamId, data, editAction, gameIndex } = req.body;
	if (!teamId || !data)
		return res.status(400).json({ error: "Missing teamId or data" });

	// Remove teamMembers if present
	const { teamMembers, ...dataWithoutTeamMembers } = data;

	const file = bucket.file(`teams/${teamId}.json`);
	let updatedData = { ...dataWithoutTeamMembers };

	// If editAction is present, update the relevant game fields
	if (typeof editAction === "string" && typeof gameIndex === "number") {
		try {
			const [contents] = await file.download();
			const currentData = JSON.parse(contents.toString());
			if (currentData.gameProgress && currentData.gameProgress.games) {
				const games = currentData.gameProgress.games;
				if (games[gameIndex]) {
					switch (editAction) {
						case "requestEdit":
							games[gameIndex].editRequested = true;
							games[gameIndex].editAllowed = false;
							games[gameIndex].editPending = false;
							break;
						case "allowEdit":
							games[gameIndex].editAllowed = true;
							games[gameIndex].editRequested = false;
							break;
						case "submitEdit":
							// Overwrite the game at gameIndex with the new data from the request
							if (
								data.gameProgress &&
								data.gameProgress.games &&
								data.gameProgress.games[gameIndex]
							) {
								games[gameIndex] = {
									...data.gameProgress.games[gameIndex],
								};
							}
							games[gameIndex].editPending = true;
							games[gameIndex].editAllowed = false;
							break;
						case "acceptEdit":
							games[gameIndex].editPending = false;
							games[gameIndex].editAllowed = false;
							games[gameIndex].editRequested = false;
							break;
					}
					currentData.gameProgress.games = games;
					updatedData = { ...currentData };
				}
			}
		} catch (e) {
			// If file doesn't exist, fallback to new data
		}
	}

	await file.save(JSON.stringify(updatedData), {
		contentType: "application/json",
	});

	// Broadcast to admin dashboards via WebSocket
	if (global.broadcastToClients) {
		let wsType = "liveUpdate";
		if (editAction === "requestEdit") wsType = "editRequested";
		if (editAction === "allowEdit") wsType = "editAllowed";
		if (editAction === "submitEdit") wsType = "editPending";
		if (editAction === "acceptEdit") wsType = "editAccepted";

		const completedGames =
			updatedData.gameProgress?.games?.filter((g: any) => g.completed)
				?.length || 0;
		console.log(
			`Broadcasting WebSocket update: ${wsType} for team ${teamId}, completed games: ${completedGames}`
		);

		// Always broadcast liveUpdate for any data change (including game completions)
		global.broadcastToClients({
			type: wsType,
			teamId,
			gameIndex,
			// Include additional info for game completions
			hasGameProgress: !!updatedData.gameProgress,
			completedGames: completedGames,
		});
	}

	res.status(200).json({ message: "Saved successfully" });
}
