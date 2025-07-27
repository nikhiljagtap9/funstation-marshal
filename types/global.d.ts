declare global {
	var broadcastToClients:
		| ((message: {
				type: string;
				message?: string;
				time?: string;
				teamId?: string;
				gameIndex?: number;
				completedGames?: number;
				resultsRevealed?: boolean;
				hasGameProgress?: boolean;
		  }) => void)
		| undefined;
}

export {};
