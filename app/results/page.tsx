"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Star, Home } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface GameResult {
	name: string;
	icon: string;
	time: number;
	score: number;
	finalScore?: number;
	details?: {
		penaltySeconds?: number;
	};
}

export default function ResultsPage() {
	const [gameResults, setGameResults] = useState<GameResult[]>([]);
	const [teamData, setTeamData] = useState<any>(null);
	const [totalTime, setTotalTime] = useState(0);
	const [resetNoticeOpen, setResetNoticeOpen] = useState(false);
	const [deleteNoticeOpen, setDeleteNoticeOpen] = useState(false);
	const [wsConnected, setWsConnected] = useState(false);
	const router = useRouter();

	useEffect(() => {
		let interval: NodeJS.Timeout | null = null;
		const fetchResults = () => {
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
				fetch(
					`/api/get-team-record?teamId=${encodeURIComponent(
						username
					)}`
				).then(async (res) => {
					if (res.ok) {
						const cloudData = await res.json();
						setTeamData(cloudData);
						if (cloudData.gameProgress) {
							const results = (cloudData.gameProgress.games || [])
								.filter((game: any) => game.completed)
								.map((game: any) => ({
									name: game.name,
									icon: game.icon,
									time: game.time || 0,
									score: game.score || 0,
									finalScore:
										game.details &&
										typeof game.details.finalScore ===
											"number"
											? game.details.finalScore
											: undefined,
									details: game.details || {},
								}));
							setGameResults(results);
							setTotalTime(
								results.reduce(
									(sum: number, game: any) => sum + game.time,
									0
								)
							);
							if (results.length === 5 && interval) {
								clearInterval(interval);
							}
						}
					}
				});
			}
		};
		fetchResults();
		interval = setInterval(() => {
			if (gameResults.length < 5) fetchResults();
			else if (interval) clearInterval(interval);
		}, 1000);
		// WebSocket connection for real-time updates
		try {
			const protocol =
				window.location.protocol === "https:" ? "wss" : "ws";
			const ws = new WebSocket(
				`${protocol}://${window.location.host}/ws`
			);

			ws.onopen = () => {
				console.log("Results WebSocket connected successfully");
				setWsConnected(true);
			};

			ws.onmessage = (event) => {
				try {
					const msg = JSON.parse(event.data);
					console.log("Results WebSocket message received:", msg);

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
				console.log("Results WebSocket disconnected");
				setWsConnected(false);
			};

			ws.onerror = (error) => {
				console.warn("Results WebSocket connection failed:", error);
				setWsConnected(false);
			};

			// Cleanup on unmount
			return () => {
				if (interval) clearInterval(interval);
				ws.close();
			};
		} catch (error) {
			console.warn("Results WebSocket setup failed:", error);
			setWsConnected(false);
			return () => {
				if (interval) clearInterval(interval);
			};
		}
	}, [router]);

	const formatTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, "0")}`;
	};

	if (!teamData) {
		return <div>Loading...</div>;
	}

	// Define the correct order for the games
	const gameOrder = [
		"House of Cards",
		"Office Chair Race",
		"Around the Clock",
		"Pass the Spud",
		"Skin the Snake",
	];
	// Sort gameResults in ascending order by gameOrder
	const sortedResults = [...gameResults].sort(
		(a, b) => gameOrder.indexOf(a.name) - gameOrder.indexOf(b.name)
	);

	return (
		<div className="min-h-screen bg-white p-4">
			<div className="max-w-6xl mx-auto">
				{/* Header */}
				<motion.div
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					className="text-center mb-8"
				>
					<h1 className="text-4xl font-bold text-gray-800 mb-4 sm:text-5xl">
						🎉 Competition Results 🎉
					</h1>
					<p className="text-lg text-gray-600 sm:text-xl">
						Team: {teamData.teamName} | Marshal:{" "}
						{teamData.marshalName}
					</p>
				</motion.div>

				{/* Completion Announcement */}
				<motion.div
					initial={{ opacity: 0, scale: 0.8 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ duration: 0.8, delay: 0.2 }}
					className="mb-8"
				>
					<Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
						<CardHeader>
							<CardTitle className="text-center text-gray-800 flex items-center justify-center gap-2">
								<Trophy className="w-6 h-6 text-yellow-500 sm:w-8 sm:h-8" />
								Competition Completed!
							</CardTitle>
						</CardHeader>
						<CardContent className="text-center">
							<motion.div
								animate={{ scale: [1, 1.1, 1] }}
								transition={{
									duration: 2,
									repeat: Number.POSITIVE_INFINITY,
								}}
								className="text-4xl mb-4 sm:text-6xl"
							>
								🏆
							</motion.div>
							<p className="text-xl font-bold text-gray-800 mb-2 sm:text-2xl">
								Total Time: {formatTime(totalTime)}
							</p>
							<p className="text-md text-gray-600 sm:text-lg">
								Excellent performance in all games!
							</p>
						</CardContent>
					</Card>
				</motion.div>

				{/* Game Results */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.4 }}
					className="mb-8"
				>
					<h2 className="text-2xl font-bold text-gray-800 mb-4 text-center sm:text-3xl">
						Game Breakdown
					</h2>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{sortedResults.map((game, index) => (
							<motion.div
								key={game.name}
								initial={{ opacity: 0, y: 40 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.6 + index * 0.4 }}
								whileHover={{ scale: 1.05 }}
							>
								<Card className="bg-gray-50 border-gray-200 hover:bg-gray-100 transition-all">
									<CardHeader className="p-3 flex flex-row items-center justify-between">
										<CardTitle className="text-gray-800 flex items-center gap-2 text-lg">
											<span className="text-2xl">
												{game.icon}
											</span>
											{game.name}
										</CardTitle>
										{/* Removed place/rank Badge */}
									</CardHeader>
									<CardContent className="p-3">
										<div className="space-y-2">
											<div className="flex items-center justify-between text-sm">
												<span className="text-gray-600">
													Final Time:
												</span>
												<Badge
													variant="secondary"
													className="bg-green-100 text-green-800 border-green-300"
												>
													{game.name ===
														"Office Chair Race" &&
													game.details ? (
														<span className="text-green-700 font-bold text-sm flex items-center gap-1">
															{(() => {
																const base =
																	game.time ||
																	0;
																const penalties =
																	game.details
																		.penaltySeconds
																		? game
																				.details
																				.penaltySeconds *
																		  5
																		: 0;
																const total =
																	base +
																	penalties;
																const mins =
																	Math.floor(
																		total /
																			60
																	)
																		.toString()
																		.padStart(
																			2,
																			"0"
																		);
																const secs = (
																	total % 60
																)
																	.toString()
																	.padStart(
																		2,
																		"0"
																	);
																return `${mins}:${secs}`;
															})()}
															{game.details
																.penaltySeconds &&
																game.details
																	.penaltySeconds >
																	0 && (
																	<span className="text-red-600 font-normal ml-2">
																		+
																		{game
																			.details
																			.penaltySeconds *
																			5}
																		s
																	</span>
																)}
														</span>
													) : (
														<span className="text-xs text-green-600 font-semibold">
															{game.finalScore !==
															undefined
																? formatTime(
																		game.finalScore
																  )
																: formatTime(
																		game.time ||
																			0
																  )}
														</span>
													)}
												</Badge>
											</div>
											<div className="flex items-center justify-between text-sm">
												<span className="text-gray-600">
													Performance:
												</span>
												<div className="flex items-center gap-1">
													{Array.from(
														{ length: 5 },
														(_, i) => (
															<Star
																key={i}
																className={`w-3 h-3 ${
																	i <
																	(game.time <=
																	300
																		? 5
																		: game.time <=
																		  450
																		? 4
																		: 3)
																		? "text-yellow-400 fill-current"
																		: "text-gray-400"
																}`}
															/>
														)
													)}
												</div>
											</div>
										</div>
									</CardContent>
								</Card>
							</motion.div>
						))}
					</div>
				</motion.div>

				{/* Summary Stats */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 1 }}
					className="mb-8"
				>
					<Card className="bg-gray-50 border-gray-200">
						<CardHeader>
							<CardTitle className="text-gray-800 text-center">
								Competition Summary
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
								<div>
									<div className="text-2xl font-bold text-gray-800 sm:text-3xl">
										{gameResults.length}
									</div>
									<p className="text-gray-600">
										Games Completed
									</p>
								</div>
								<div>
									<div className="text-2xl font-bold text-gray-800 sm:text-3xl">
										{formatTime(totalTime)}
									</div>
									<p className="text-gray-600">Total Time</p>
								</div>
								<div>
									<div className="text-2xl font-bold text-gray-800 sm:text-3xl">
										{formatTime(
											Math.round(
												totalTime / gameResults.length
											)
										)}
									</div>
									<p className="text-gray-600">
										Average Time
									</p>
								</div>
								<div>
									<div className="text-2xl font-bold text-gray-800 sm:text-3xl">
										{Math.min(
											...gameResults.map((g) => g.time)
										) ===
										Math.max(
											...gameResults.map((g) => g.time)
										)
											? formatTime(
													gameResults[0]?.time || 0
											  )
											: formatTime(
													Math.min(
														...gameResults.map(
															(g) => g.time
														)
													)
											  )}
									</div>
									<p className="text-gray-600">
										Best Game Time
									</p>
								</div>
							</div>
						</CardContent>
					</Card>
				</motion.div>

				{/* Action Button - Only Back to Dashboard */}
				<motion.div
					initial={{ opacity: 0, scale: 0.9 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ delay: 1.2 }}
					className="flex justify-center"
				>
					<Button
						onClick={() => router.push("/dashboard")}
						size="lg"
						className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold px-8 py-4"
					>
						<Home className="w-5 h-5 mr-2" />
						Back to Dashboard
					</Button>
				</motion.div>

				{/* Celebration Elements */}
				<div className="fixed inset-0 pointer-events-none overflow-hidden">
					{[...Array(20)].map((_, i) => (
						<motion.div
							key={i}
							className="absolute text-yellow-400 text-2xl"
							style={{
								left: `${Math.random() * 100}%`,
								top: `${Math.random() * 100}%`,
							}}
							animate={{
								y: [0, -20, 0],
								rotate: [0, 360],
								opacity: [0.3, 1, 0.3],
							}}
							transition={{
								duration: 3,
								repeat: Number.POSITIVE_INFINITY,
								delay: Math.random() * 2,
								ease: "easeInOut",
							}}
						>
							✨
						</motion.div>
					))}
				</div>

				{/* Reset Notice Modal */}
				<Dialog
					open={resetNoticeOpen}
					onOpenChange={setResetNoticeOpen}
				>
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
								Admin has reset all games. You will be logged
								out automatically.
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
				<Dialog
					open={deleteNoticeOpen}
					onOpenChange={setDeleteNoticeOpen}
				>
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
								Admin has deleted your account. You will be
								logged out automatically.
								<br />
								<br />
								Please contact the administrator if you believe
								this was done in error.
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
		</div>
	);
}
