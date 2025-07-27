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
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

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
	const [resetNoticeOpen, setResetNoticeOpen] = useState(false);
	const [deleteNoticeOpen, setDeleteNoticeOpen] = useState(false);
	const [wsConnected, setWsConnected] = useState(false);
	const router = useRouter();
	const { toast } = useToast();

	// Define defaultGames with all required GameData properties
	const defaultGames = [
		{
			name: "House of Cards",
			icon: "🏠",
			description: "Build the tallest card tower",
			completed: false,
			time: 0,
			score: 0,
			details: {
				bonusSeconds: 0,
				penaltySeconds: 0,
				creativityBonus: false,
				finalScore: 0,
				finalScoreFormatted: "0:00",
			},
		},
		{
			name: "Office Chair Race",
			icon: "🪑",
			description: "Navigate obstacles on wheels",
			completed: false,
			time: 0,
			score: 0,
			details: {
				bonusSeconds: 0,
				penaltySeconds: 0,
				creativityBonus: false,
				finalScore: 0,
				finalScoreFormatted: "0:00",
			},
		},
		{
			name: "Around the Clock",
			icon: "🕐",
			description: "Complete tasks in sequence",
			completed: false,
			time: 0,
			score: 0,
			details: {
				bonusSeconds: 0,
				penaltySeconds: 0,
				creativityBonus: false,
				finalScore: 0,
				finalScoreFormatted: "0:00",
			},
		},
		{
			name: "Pass the Spud",
			icon: "🥔",
			description: "Team coordination challenge",
			completed: false,
			time: 0,
			score: 0,
			details: {
				bonusSeconds: 0,
				penaltySeconds: 0,
				creativityBonus: false,
				finalScore: 0,
				finalScoreFormatted: "0:00",
			},
		},
		{
			name: "Skin the Snake",
			icon: "🐍",
			description: "Team coordination snake game",
			completed: false,
			time: 0,
			score: 0,
			details: {
				bonusSeconds: 0,
				penaltySeconds: 0,
				creativityBonus: false,
				finalScore: 0,
				finalScoreFormatted: "0:00",
			},
		},
	];

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
						let gamesArr = cloudData.gameProgress.games;
						if (!gamesArr || gamesArr.length === 0) {
							gamesArr = defaultGames;
						}
						setGames(gamesArr);
						// Determine the correct current game from cloud
						let correctCurrentGame = 0;
						const firstUncompletedIndex = gamesArr.findIndex(
							(game: any) => !game.completed
						);
						if (firstUncompletedIndex !== -1) {
							correctCurrentGame = firstUncompletedIndex;
						} else if (
							gamesArr.every((game: any) => game.completed)
						) {
							correctCurrentGame = gamesArr.length - 1;
						}
						setCurrentGame(correctCurrentGame);
					}
					if (cloudData.teamName || cloudData.teamMembers) {
						setTeamData((prev: any) => ({ ...prev, ...cloudData }));
					}
				}
			});
		}

		// WebSocket connection for real-time updates
		try {
			const protocol =
				window.location.protocol === "https:" ? "wss" : "ws";
			const ws = new WebSocket(
				`${protocol}://${window.location.host}/ws`
			);

			ws.onopen = () => {
				console.log("Games WebSocket connected successfully");
				setWsConnected(true);
			};

			ws.onmessage = (event) => {
				try {
					const msg = JSON.parse(event.data);
					console.log("Games WebSocket message received:", msg);

					if (msg.type === "gamesReset") {
						setResetNoticeOpen(true);
					}

					if (msg.type === "marshalDeleted") {
						// Check if this message is for the current marshal
						const localData = localStorage.getItem("marshalData");
						if (localData) {
							const parsed = JSON.parse(localData);
							if (parsed.username === msg.username) {
								// Show deletion modal and auto-logout
								setDeleteNoticeOpen(true);
							}
						}
					}
				} catch (error) {
					console.error("Error parsing WebSocket message:", error);
				}
			};

			ws.onclose = () => {
				console.log("Games WebSocket disconnected");
				setWsConnected(false);
			};

			ws.onerror = (error) => {
				console.warn("Games WebSocket connection failed:", error);
				setWsConnected(false);
			};

			// Cleanup on unmount
			return () => {
				ws.close();
			};
		} catch (error) {
			console.warn("Games WebSocket setup failed:", error);
			setWsConnected(false);
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

		console.log("Games after completion:", updatedGames);

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
				console.log("Saving game completion to cloud...", {
					teamId: username,
					completedGames: updatedGames.filter((g: any) => g.completed)
						.length,
					totalGames: updatedGames.length,
				});
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
										{games.length > 0 && games[currentGame]
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
									{/* Competition Results Summary */}
									<div className="my-6">
										<h3 className="text-xl font-bold text-yellow-600 mb-2">
											Competition Results
										</h3>
										<div className="space-y-3">
											{games.map((game, idx) => (
												<div
													key={game.name}
													className="flex flex-col md:flex-row md:items-center md:justify-between bg-gray-50 rounded-lg p-3 border border-gray-100"
												>
													<div className="flex items-center gap-2">
														<span className="text-2xl">
															{game.icon}
														</span>
														<span className="font-semibold text-gray-800">
															{game.name}
														</span>
													</div>
													<div className="flex flex-col md:flex-row md:items-center gap-2 mt-2 md:mt-0">
														<span className="text-sm text-gray-600">
															Time:{" "}
															<span className="font-bold text-green-700">
																{game.timeFormatted ||
																	"-"}
															</span>
														</span>
														{game.score !==
															undefined && (
															<span className="text-sm text-gray-600">
																Score:{" "}
																<span className="font-bold text-yellow-700">
																	{game.score}
																</span>
															</span>
														)}
														{game.details && (
															<span className="text-xs text-gray-500">
																Bonus:{" "}
																{
																	game.details
																		.bonusSeconds
																}
																, Penalty:{" "}
																{
																	game.details
																		.penaltySeconds
																}
																, Creativity:{" "}
																{game.details
																	.creativityBonus
																	? "Yes"
																	: "No"}
															</span>
														)}
													</div>
												</div>
											))}
										</div>
										<div className="mt-4 text-lg font-bold text-gray-800">
											Total Time:{" "}
											<span className="text-yellow-700">
												{Math.floor(totalTime / 60)}:
												{(totalTime % 60)
													.toString()
													.padStart(2, "0")}
											</span>
										</div>
									</div>
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

			{/* Reset Notice Modal */}
			<Dialog open={resetNoticeOpen} onOpenChange={setResetNoticeOpen}>
				<DialogContent className="max-w-md w-full p-0 sm:p-6 rounded-2xl shadow-2xl bg-white/95 border-none flex flex-col items-center">
					<div className="flex flex-col items-center justify-center w-full">
						<div className="mb-4">
							<svg
								className="w-16 h-16 text-red-500 animate-bounce"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
								/>
							</svg>
						</div>
						<DialogTitle className="text-2xl font-bold text-center text-red-600 mb-2">
							Games Reset
						</DialogTitle>
						<div className="text-gray-700 text-center mb-6 px-2">
							Admin has reset all games. You will be logged out
							automatically.
							<br />
							<br />
							Please log in again to continue.
						</div>
						<div className="flex gap-4 w-full justify-center">
							<button
								className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-lg transition-all"
								onClick={() => {
									setResetNoticeOpen(false);
									localStorage.removeItem("authToken");
									localStorage.removeItem("marshalData");
									localStorage.removeItem("gameProgress");
									window.location.href = "/";
								}}
							>
								OK
							</button>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			{/* Delete Notice Modal */}
			<Dialog open={deleteNoticeOpen} onOpenChange={setDeleteNoticeOpen}>
				<DialogContent className="max-w-md w-full p-0 sm:p-6 rounded-2xl shadow-2xl bg-white/95 border-none flex flex-col items-center">
					<div className="flex flex-col items-center justify-center w-full">
						<div className="mb-4">
							<svg
								className="w-16 h-16 text-red-500 animate-bounce"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
								/>
							</svg>
						</div>
						<DialogTitle className="text-2xl font-bold text-center text-red-600 mb-2">
							Account Deleted
						</DialogTitle>
						<div className="text-gray-700 text-center mb-6 px-2">
							Admin has deleted your account. You will be logged
							out automatically.
							<br />
							<br />
							Please contact the administrator if you believe this
							was done in error.
						</div>
						<div className="flex gap-4 w-full justify-center">
							<button
								className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-lg transition-all"
								onClick={() => {
									setDeleteNoticeOpen(false);
									localStorage.removeItem("authToken");
									localStorage.removeItem("marshalData");
									localStorage.removeItem("gameProgress");
									window.location.href = "/";
								}}
							>
								OK
							</button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
