"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, ArrowRight, Home, Eye, Lock, CheckCircle } from "lucide-react";
import GameTimer from "@/components/game-timer";
import GameDetailsModal from "@/components/game-details-modal";
import GameCompletionAnimation from "@/components/game-completion-animation";
import { useToast } from "@/hooks/use-toast";
import NewYearAnimation from "@/components/new-year-animation";

interface GameData {
	name: string;
	icon: string;
	description: string;
	completed: boolean;
	time?: number;
	timeFormatted?: string;
	score?: number;
	completedAt?: string;
	details?: {
		bonusSeconds: number;
		penaltySeconds: number;
		creativityBonus: boolean;
		finalScore: number;
		finalScoreFormatted?: string;
	};
}

export default function GamesPage() {
	const [currentGame, setCurrentGame] = useState(0);
	const [games, setGames] = useState<GameData[]>([
		{
			name: "House of Cards",
			icon: "🏠",
			description: "Build the tallest card tower",
			completed: false,
		},
		{
			name: "Office Chair Race",
			icon: "🪑",
			description: "Navigate obstacles on wheels",
			completed: false,
		},
		{
			name: "Around the Clock",
			icon: "🕐",
			description: "Complete tasks in sequence",
			completed: false,
		},
		{
			name: "Pass the Spud",
			icon: "🥔",
			description: "Team coordination challenge",
			completed: false,
		},
		{
			name: "Skin the Snake",
			icon: "🐍",
			description: "Team coordination snake game",
			completed: false,
		},
	]);
	const [teamData, setTeamData] = useState<any>(null);
	const [selectedGameDetails, setSelectedGameDetails] =
		useState<GameData | null>(null);
	const [showCompletionAnimation, setShowCompletionAnimation] =
		useState(false);
	const [showTransitionModal, setShowTransitionModal] = useState(false);
	const [transitionMessage, setTransitionMessage] = useState("");
	const [countdown, setCountdown] = useState(5);
	const router = useRouter();
	const { toast } = useToast();

	useEffect(() => {
		const token = localStorage.getItem("authToken");
		if (!token) {
			router.push("/");
			return;
		}

		const data = localStorage.getItem("marshalData");
		let username = "";
		if (data) {
			const parsed = JSON.parse(data);
			setTeamData(parsed);
			username = parsed.username;
		}

		if (username) {
			// Load saved game progress from cloud
			fetch(
				`/api/get-team-record?teamId=${encodeURIComponent(username)}`
			).then(async (res) => {
				if (res.ok) {
					const cloudData = await res.json();
					if (cloudData.gameProgress) {
						const loadedGames =
							cloudData.gameProgress.games || games;
						setGames(loadedGames);

						// Determine the correct current game
						let correctCurrentGame =
							cloudData.gameProgress.currentGame || 0;

						// If we have a currentGame saved, verify it's correct
						// The current game should be the first uncompleted game
						const firstUncompletedIndex = loadedGames.findIndex(
							(game) => !game.completed
						);
						if (firstUncompletedIndex !== -1) {
							correctCurrentGame = firstUncompletedIndex;
						} else if (
							loadedGames.every((game) => game.completed)
						) {
							// All games completed, set to last game index
							correctCurrentGame = loadedGames.length - 1;
						}

						setCurrentGame(correctCurrentGame);
					}
					if (cloudData.teamName || cloudData.teamMembers) {
						setTeamData((prev: any) => ({ ...prev, ...cloudData }));
					}
				}
			});
		}
	}, [router]);

	const formatTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, "0")}`;
	};

	const handleGameComplete = (
		time: number,
		bonusSeconds = 0,
		details: any = {}
	) => {
		const updatedGames = [...games];
		const completedAt = new Date().toISOString();

		// Mark current game as completed
		updatedGames[currentGame] = {
			...updatedGames[currentGame],
			completed: true,
			time: time,
			timeFormatted: formatTime(time),
			score: time,
			completedAt: new Date(completedAt).toLocaleString(),
			details: {
				bonusSeconds,
				penaltySeconds: details.penaltySeconds || 0,
				creativityBonus: details.creativityBonus || false,
				finalScore: time,
				finalScoreFormatted: formatTime(time),
			},
		};

		let nextGameIndex = currentGame;
		let showFinalModal = false;
		if (currentGame < games.length - 1) {
			nextGameIndex = currentGame + 1;
		} else {
			showFinalModal = true;
		}

		setGames(updatedGames);
		setCurrentGame(nextGameIndex);

		// Show transition modal with countdown and animation immediately
		let message = "";
		if (showFinalModal) {
			message = "All Games Completed!";
		} else {
			message = `Game ${currentGame + 1} completed! Ready for Game ${
				currentGame + 2
			}`;
		}
		setTransitionMessage(message);
		setCountdown(5);
		setShowTransitionModal(true);

		// Save progress to cloud (after splash/countdown)
		setTimeout(async () => {
			try {
				const data = localStorage.getItem("marshalData");
				let username = "";
				let teamName = "";
				let marshalName = "";
				if (data) {
					const parsed = JSON.parse(data);
					username = parsed.username;
					marshalName = parsed.marshalName || "";
				}
				// Fetch latest teamName from cloud
				if (username) {
					const res = await fetch(
						`/api/get-team-record?teamId=${encodeURIComponent(
							username
						)}`
					);
					if (res.ok) {
						const cloudData = await res.json();
						teamName = cloudData.teamName || teamName;
					}
				}
				const res = await fetch("/api/save-team-record", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						teamId: username,
						data: {
							username,
							marshalName,
							teamName,
							gameProgress: {
								games: updatedGames,
								currentGame: nextGameIndex,
							},
						},
					}),
				});
				if (res.ok) {
					toast({
						title: "Game Saved!",
						description: showFinalModal
							? "All games completed!"
							: `Game ${currentGame + 1} completed!`,
						className:
							"bg-green-100 text-green-800 border-green-300",
						duration: 2000,
					});
				} else {
					toast({
						title: "Error Saving Game!",
						description: "Could not save progress to cloud.",
						variant: "destructive",
						className: "bg-red-100 text-red-800 border-red-300",
						duration: 2000,
					});
				}
			} catch (err) {
				toast({
					title: "Error Saving Game!",
					description: "Could not save progress to cloud.",
					variant: "destructive",
					className: "bg-red-100 text-red-800 border-red-300",
					duration: 2000,
				});
			}
		}, 5000); // Wait for splash/countdown to finish
	};

	useEffect(() => {
		if (!showTransitionModal) return;
		if (countdown === 0) {
			setShowTransitionModal(false);
			// Only go to results if ALL games are completed
			if (games.every((g) => g.completed)) {
				router.push("/results");
			} else {
				toast({
					title: "Next Game Ready!",
					description: `Now playing: ${games[currentGame].name}`,
					duration: 3000,
				});
			}
			return;
		}
		const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
		return () => clearTimeout(timer);
	}, [showTransitionModal, countdown, currentGame, games, router, toast]);

	const handleCompletionAnimationEnd = () => {
		setShowCompletionAnimation(false);
		router.push("/results");
	};

	const canPlayGame = (gameIndex: number) => {
		if (gameIndex === 0) return true;
		return games[gameIndex - 1]?.completed || false;
	};

	const handleDashboard = async () => {
		try {
			const data = localStorage.getItem("marshalData");
			let username = "";
			let teamName = "";
			let marshalName = "";
			if (data) {
				const parsed = JSON.parse(data);
				username = parsed.username;
				marshalName = parsed.marshalName || "";
			}
			// Fetch latest teamName from cloud
			if (username) {
				const res = await fetch(
					`/api/get-team-record?teamId=${encodeURIComponent(
						username
					)}`
				);
				if (res.ok) {
					const cloudData = await res.json();
					teamName = cloudData.teamName || teamName;
				}
			}
			await fetch("/api/save-team-record", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					teamId: username,
					data: {
						username,
						marshalName,
						teamName,
						gameProgress: {
							games: games,
							currentGame: currentGame,
						},
					},
				}),
			});
		} catch {}
		router.push("/dashboard");
	};

	if (!teamData) {
		return <div>Loading...</div>;
	}

	if (showCompletionAnimation) {
		return (
			<GameCompletionAnimation
				onComplete={handleCompletionAnimationEnd}
				duration={5000}
			/>
		);
	}

	if (showTransitionModal) {
		return (
			<NewYearAnimation
				message={transitionMessage + `\nStarting in ${countdown}...`}
				duration={5000}
			/>
		);
	}

	const completedGames = games.filter((game) => game.completed).length;
	const totalTime = games.reduce((sum, game) => sum + (game.time || 0), 0);

	return (
		<div className="min-h-screen bg-gray-50 p-4">
			<div className="max-w-6xl mx-auto">
				{/* Header */}
				<motion.div
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					className="flex justify-between items-center mb-8"
				>
					<div>
						<h1 className="text-4xl font-bold text-gray-800 mb-2">
							Game Competition
						</h1>
						<p className="text-gray-600">
							Team: {teamData.teamName} | Marshal:{" "}
							{teamData.marshalName}
						</p>
					</div>
					<Button
						onClick={handleDashboard}
						className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold"
					>
						<Home className="w-4 h-4 mr-2" />
						Dashboard
					</Button>
				</motion.div>

				{/* Progress */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.2 }}
					className="mb-8"
				>
					<Card className="bg-white border-gray-200 shadow-lg">
						<CardHeader>
							<CardTitle className="text-gray-800 flex items-center gap-2">
								<Trophy className="w-5 h-5" />
								Competition Progress
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
								<div>
									<p className="text-sm text-gray-600">
										Games Completed
									</p>
									<p className="text-2xl font-bold text-gray-800">
										{completedGames}/5
									</p>
								</div>
								<div>
									<p className="text-sm text-gray-600">
										Current Game
									</p>
									<p className="text-lg font-semibold text-gray-800">
										{currentGame < games.length
											? games[currentGame].name
											: "All Complete!"}
									</p>
								</div>
								<div>
									<p className="text-sm text-gray-600">
										Total Time
									</p>
									<p className="text-2xl font-bold text-gray-800">
										{Math.floor(totalTime / 60)}:
										{(totalTime % 60)
											.toString()
											.padStart(2, "0")}
									</p>
								</div>
							</div>

							{/* Progress Bar */}
							<div className="mt-4">
								<div className="w-full bg-gray-200 rounded-full h-2">
									<div
										className="bg-gradient-to-r from-yellow-400 to-yellow-600 h-2 rounded-full transition-all duration-500"
										style={{
											width: `${
												(completedGames /
													games.length) *
												100
											}%`,
										}}
									/>
								</div>
							</div>
						</CardContent>
					</Card>
				</motion.div>

				{/* Games Grid */}
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
					{/* Games List */}
					<motion.div
						initial={{ opacity: 0, x: -20 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ delay: 0.4 }}
					>
						<h2 className="text-2xl font-bold text-gray-800 mb-6">
							Games
						</h2>
						<div className="space-y-4">
							{games.map((game, index) => (
								<motion.div
									key={game.name}
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: 0.6 + index * 0.1 }}
								>
									<Card
										className={`border-gray-200 transition-all shadow-md ${
											index === currentGame
												? "bg-yellow-50 border-yellow-300"
												: game.completed
												? "bg-green-50 border-green-300"
												: !canPlayGame(index)
												? "bg-gray-100 border-gray-300"
												: "bg-white"
										}`}
									>
										<CardContent className="p-4">
											<div className="flex items-center justify-between">
												<div className="flex items-center gap-3">
													<span className="text-2xl">
														{game.icon}
													</span>
													<div>
														<h3
															className={`font-semibold ${
																!canPlayGame(
																	index
																)
																	? "text-gray-400"
																	: "text-gray-800"
															}`}
														>
															{game.name}
														</h3>
														<p
															className={`text-sm ${
																!canPlayGame(
																	index
																)
																	? "text-gray-400"
																	: "text-gray-600"
															}`}
														>
															{game.description}
														</p>
													</div>
												</div>
												<div className="flex items-center gap-2">
													{game.completed && (
														<>
															<div className="text-right">
																<p className="text-sm text-green-600 font-semibold">
																	{Math.floor(
																		(game.time ||
																			0) /
																			60
																	)}
																	:
																	{(
																		(game.time ||
																			0) %
																		60
																	)
																		.toString()
																		.padStart(
																			2,
																			"0"
																		)}
																</p>
															</div>
															<Button
																size="sm"
																onClick={() =>
																	setSelectedGameDetails(
																		game
																	)
																}
																className="bg-yellow-400 hover:bg-yellow-500 text-black"
															>
																<Eye className="w-3 h-3" />
															</Button>
														</>
													)}
													{!canPlayGame(index) && (
														<Lock className="w-4 h-4 text-gray-400" />
													)}
													<Badge
														variant={
															index ===
															currentGame
																? "default"
																: game.completed
																? "secondary"
																: "outline"
														}
														className={
															index ===
															currentGame
																? "bg-yellow-400 text-black"
																: game.completed
																? "bg-green-100 text-green-800 border-green-300"
																: !canPlayGame(
																		index
																  )
																? "border-gray-300 text-gray-400"
																: "border-gray-300 text-gray-600"
														}
													>
														{index ===
														currentGame ? (
															"Current"
														) : game.completed ? (
															<>
																<CheckCircle className="w-3 h-3 mr-1" />
																Complete
															</>
														) : !canPlayGame(
																index
														  ) ? (
															"Locked"
														) : (
															"Pending"
														)}
													</Badge>
												</div>
											</div>
										</CardContent>
									</Card>
								</motion.div>
							))}
						</div>
					</motion.div>

					{/* Current Game Timer */}
					<motion.div
						initial={{ opacity: 0, x: 20 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ delay: 0.8 }}
					>
						{currentGame < games.length ? (
							<GameTimer
								game={games[currentGame]}
								gameIndex={currentGame}
								onComplete={handleGameComplete}
								canPlay={canPlayGame(currentGame)}
							/>
						) : (
							<Card className="bg-white border-gray-200 shadow-lg">
								<CardHeader>
									<CardTitle className="text-gray-800 text-center">
										🎉 All Games Completed! 🎉
									</CardTitle>
								</CardHeader>
								<CardContent className="text-center">
									<p className="text-gray-600 mb-4">
										Congratulations! You've completed all 5
										games.
									</p>
									<Button
										onClick={() => router.push("/results")}
										className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold"
									>
										View Results
										<ArrowRight className="w-4 h-4 ml-2" />
									</Button>
								</CardContent>
							</Card>
						)}
					</motion.div>
				</div>
			</div>

			{/* Game Details Modal */}
			{selectedGameDetails && (
				<GameDetailsModal
					game={selectedGameDetails}
					isOpen={!!selectedGameDetails}
					onClose={() => setSelectedGameDetails(null)}
				/>
			)}
		</div>
	);
}
