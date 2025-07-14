declare global {
	var broadcastToClients:
		| ((message: {
				type: string;
				message?: string;
				time?: string;
				teamId?: string;
				completedGames?: number;
				resultsRevealed?: boolean; // Add this line for admin settings
		  }) => void)
		| undefined;
}

export {};
