"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Star, Home } from "lucide-react";

interface GameResult {
	name: string;
	icon: string;
	time: number;
	score: number;
}

export default function ResultsPage() {
	const [gameResults, setGameResults] = useState<GameResult[]>([]);
	const [teamData, setTeamData] = useState<any>(null);
	const [totalTime, setTotalTime] = useState(0);
	const router = useRouter();

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
			// Fetch results from cloud
			fetch(
				`/api/get-team-record?teamId=${encodeURIComponent(username)}`
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
							}));
						setGameResults(results);
						setTotalTime(
							results.reduce(
								(sum: number, game: any) => sum + game.time,
								0
							)
						);
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

	if (!teamData) {
		return <div>Loading...</div>;
	}

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
						{gameResults.map((game, index) => (
							<motion.div
								key={game.name}
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.6 + index * 0.1 }}
								whileHover={{ scale: 1.05 }}
							>
								<Card className="bg-gray-50 border-gray-200 hover:bg-gray-100 transition-all">
									<CardHeader className="p-3">
										<CardTitle className="text-gray-800 flex items-center gap-2 text-lg">
											<span className="text-2xl">
												{game.icon}
											</span>
											{game.name}
										</CardTitle>
									</CardHeader>
									<CardContent className="p-3">
										<div className="space-y-2">
											<div className="flex items-center justify-between text-sm">
												<span className="text-gray-600">
													Time:
												</span>
												<Badge
													variant="secondary"
													className="bg-green-100 text-green-800 border-green-300"
												>
													{game.timeFormatted ||
														formatTime(
															game.time || 0
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
			</div>
		</div>
	);
}
