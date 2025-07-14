declare global {
	var broadcastToClients:
		| ((message: {
				type: string;
				message?: string;
				time?: string;
				teamId?: string;
				gameIndex?: number;
				completedGames?: number;
				resultsRevealed?: boolean; // Add this line for admin settings
				hasGameProgress?: boolean;
		  }) => void)
		| undefined;
}

export {};
