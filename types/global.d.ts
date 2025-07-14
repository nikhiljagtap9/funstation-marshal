declare global {
	var broadcastToClients:
		| ((message: {
				type: string;
				message?: string;
				time?: string;
				teamId?: string;
				completedGames?: number;
		  }) => void)
		| undefined;
}

export {};
