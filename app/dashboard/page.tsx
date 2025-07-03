"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Users,
	Trophy,
	Clock,
	Play,
	LogOut,
	Eye,
	RefreshCw,
	MoreVertical,
	Save,
	Loader2,
} from "lucide-react";
import StartGameModal from "@/components/start-game-modal";
import GameDetailsModal from "@/components/game-details-modal";
import GameRulesModal from "@/components/game-rules-modal";
import ResetConfirmationModal from "@/components/reset-confirmation-modal";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";

interface MarshalData {
	marshalName: string;
	teamName: string;
	username: string;
	teamMembers?: string;
}

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

export default function DashboardPage() {
	const [marshalData, setMarshalData] = useState<MarshalData | null>(null);
	const [teamInfo, setTeamInfo] = useState({
		teamName: "",
	});
	const [isEditingTeam, setIsEditingTeam] = useState(false);
	const [showStartModal, setShowStartModal] = useState(false);
	const [showResetModal, setShowResetModal] = useState(false);
	const [showRulesModal, setShowRulesModal] = useState(false);
	const [selectedGame, setSelectedGame] = useState("");
	const [gameResults, setGameResults] = useState<GameData[]>([]);
	const [selectedGameDetails, setSelectedGameDetails] =
		useState<GameData | null>(null);
	const [hasCompletedGames, setHasCompletedGames] = useState(false);
	const [allGamesCompleted, setAllGamesCompleted] = useState(false);
	const [loading, setLoading] = useState(true);
	const router = useRouter();
	const { toast } = useToast();

	useEffect(() => {
		const token = localStorage.getItem("authToken");
		if (!token) {
			router.push("/");
			return;
		}

		// Try to get marshalData from cloud storage
		const fetchMarshalData = async () => {
			try {
				let username = "";
				const localData = localStorage.getItem("marshalData");
				if (localData) {
					const parsed = JSON.parse(localData);
					username = parsed.username;
				}
				if (!username) username = "marshal@guest.com";
				const res = await fetch(
					`/api/get-team-record?teamId=${encodeURIComponent(
						username
					)}`
				);
				if (res.ok) {
					const data = await res.json();
					setMarshalData(data);
					setTeamInfo({
						teamName: data.teamName || "",
					});
					if (data.gameProgress) {
						const completedGames = (
							data.gameProgress.games || []
						).filter((game: GameData) => game.completed);
						setGameResults(completedGames);
						setHasCompletedGames(completedGames.length > 0);
						setAllGamesCompleted(completedGames.length === 5);
					}
				}
			} catch (e) {
				setMarshalData({
					marshalName: "Game Marshal",
					teamName: "Default Team",
					username: "marshal@guest.com",
				});
			}
			setLoading(false);
		};
		fetchMarshalData();
	}, [router]);

	const handleLogout = () => {
		localStorage.removeItem("authToken");
		localStorage.removeItem("marshalData");
		localStorage.removeItem("gameProgress");
		router.push("/");
	};

	const handleContinueGames = () => {
		router.push("/games");
	};

	const handleResetGames = async () => {
		if (!marshalData) return;
		// Remove gameProgress from cloud storage (by saving empty progress)
		const updatedData = { ...marshalData, gameProgress: { games: [] } };
		await fetch("/api/save-team-record", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				teamId: marshalData.username,
				data: updatedData,
			}),
		});
		setGameResults([]);
		setHasCompletedGames(false);
		setAllGamesCompleted(false);
		toast({
			title: "Games Reset Successfully",
			description:
				"All game progress has been cleared. You can start a new competition.",
			duration: 3000,
		});
	};

	const handleSaveTeamInfo = async () => {
		if (!marshalData) return;
		const updatedMarshalData = {
			...marshalData,
			...teamInfo,
		};
		setMarshalData(updatedMarshalData);
		try {
			const res = await fetch("/api/save-team-record", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					teamId: marshalData.username,
					data: updatedMarshalData,
				}),
			});
			if (res.ok) {
				// Fetch the latest data from the cloud
				const fetchRes = await fetch(
					`/api/get-team-record?teamId=${encodeURIComponent(
						marshalData.username
					)}`
				);
				if (fetchRes.ok) {
					const cloudData = await fetchRes.json();
					setMarshalData(cloudData);
					setTeamInfo({
						teamName: cloudData.teamName || "",
					});
					toast({
						title: "Team Information Saved",
						description:
							"Your team information has been updated successfully.",
						className:
							"bg-green-100 text-green-800 border-green-300",
						duration: 2000,
					});
				} else {
					toast({
						title: "Error Fetching Team Info!",
						description:
							"Could not fetch updated team info from cloud.",
						variant: "destructive",
						className: "bg-red-100 text-red-800 border-red-300",
						duration: 2000,
					});
				}
			} else {
				toast({
					title: "Error Saving Team Info!",
					description: "Could not save team info to cloud.",
					variant: "destructive",
					className: "bg-red-100 text-red-800 border-red-300",
					duration: 2000,
				});
			}
		} catch (err) {
			toast({
				title: "Error Saving Team Info!",
				description: "Could not save team info to cloud.",
				variant: "destructive",
				className: "bg-red-100 text-red-800 border-red-300",
				duration: 2000,
			});
		}
		setIsEditingTeam(false);
	};

	const handleShowRules = (gameName: string) => {
		setSelectedGame(gameName);
		setShowRulesModal(true);
	};

	const games = [
		{
			name: "House of Cards",
			icon: "🏠",
			description: "Build the tallest card tower",
		},
		{
			name: "Office Chair Race",
			icon: "🪑",
			description: "Navigate obstacles on wheels",
		},
		{
			name: "Around the Clock",
			icon: "🕐",
			description: "Complete tasks in sequence",
		},
		{
			name: "Pass the Spud",
			icon: "🥔",
			description: "Team coordination challenge",
		},
		{
			name: "Skin the Snake",
			icon: "🐍",
			description: "Team coordination snake game",
		},
	];

	const formatTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, "0")}`;
	};

	const totalTime = gameResults.reduce(
		(sum, game) => sum + (game.time || 0),
		0
	);

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-100 to-blue-100">
				<div className="flex flex-col items-center gap-4">
					<Loader2 className="animate-spin w-16 h-16 text-yellow-500" />
					<p className="text-xl font-semibold text-gray-700">
						Loading your dashboard...
					</p>
				</div>
			</div>
		);
	}
	if (!marshalData) {
		return <div>No marshal data found.</div>;
	}

	return (
		<div className="min-h-screen bg-white p-4">
			<div className="max-w-7xl mx-auto">
				{/* Navbar */}
				<nav className="flex items-center justify-between bg-white py-3 ">
					<div className="flex items-center gap-7">
						<Image
							src="/logo.png"
							alt="Fun Station Logo"
							width={80}
							height={36}
							className="object-contain"
						/>
					</div>
					<div className="flex items-center gap-2">
						<Button
							onClick={handleLogout}
							variant="outline"
							className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
						>
							<LogOut className="w-4 h-4 mr-2" />
							Logout
						</Button>
					</div>
				</nav>
				<div className="flex flex-col my-5">
					<span className="font-bold text-4xl md:text-2xl text-gray-800">
						Welcome back,{" "}
						<span className="text-xl md:text-2xl font-bold bg-gradient-to-r from-yellow-400 via-pink-400 to-blue-400 bg-clip-text text-transparent ml-0">
							{marshalData.marshalName}!
						</span>
					</span>
				</div>
				{/* Stats Cards */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6, delay: 0.2 }}
					className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8"
				>
					<Card className="bg-white border-gray-200 shadow-lg">
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium text-gray-700">
								Total Games
							</CardTitle>
							<Trophy className="h-4 w-4 text-gray-600" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold text-gray-800">
								5
							</div>
							<p className="text-xs text-gray-600">
								Games available
							</p>
						</CardContent>
					</Card>

					<Card className="bg-white border-gray-200 shadow-lg">
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium text-gray-700">
								Time Limit
							</CardTitle>
							<Clock className="h-4 w-4 text-gray-600" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold text-gray-800">
								10
							</div>
							<p className="text-xs text-gray-600">
								Minutes per game
							</p>
						</CardContent>
					</Card>
				</motion.div>

				{/* Team Info Card */}
				<motion.div
					initial={{ opacity: 0, scale: 0.95 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ duration: 0.6, delay: 0.6 }}
					className="mb-8"
				>
					<Card className="bg-white border-gray-200 shadow-lg">
						<CardHeader className="flex flex-row items-center justify-between">
							<CardTitle className="text-gray-800 flex items-center gap-2">
								<Users className="w-5 h-5" />
								Team Information
							</CardTitle>
							{!isEditingTeam ? (
								<Button
									variant="outline"
									size="sm"
									onClick={() => setIsEditingTeam(true)}
									className="bg-yellow-400 hover:bg-yellow-500 text-black border-yellow-400"
								>
									Update Info
								</Button>
							) : (
								<div className="flex gap-2">
									<Button
										variant="outline"
										size="sm"
										onClick={() => setIsEditingTeam(false)}
										className="bg-gray-100 hover:bg-gray-200 text-gray-700"
									>
										Cancel
									</Button>
									<Button
										size="sm"
										onClick={handleSaveTeamInfo}
										className="bg-yellow-400 hover:bg-yellow-500 text-black"
									>
										<Save className="w-4 h-4 mr-1" />
										Save
									</Button>
								</div>
							)}
						</CardHeader>
						<CardContent className="space-y-4">
							{isEditingTeam ? (
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div>
										<Label
											htmlFor="teamName"
											className="text-sm text-gray-600"
										>
											Team Name
										</Label>
										<Input
											id="teamName"
											value={teamInfo.teamName}
											onChange={(e) =>
												setTeamInfo({
													...teamInfo,
													teamName: e.target.value,
												})
											}
											className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-yellow-400 focus:ring-yellow-400"
											placeholder="Enter team name"
										/>
									</div>
								</div>
							) : (
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div>
										<p className="text-sm text-gray-600">
											Marshal Name
										</p>
										<p className="text-lg font-semibold text-gray-800">
											{marshalData.marshalName}
										</p>
									</div>
									<div>
										<p className="text-sm text-gray-600">
											Team Name
										</p>
										<p className="text-lg font-semibold text-gray-800">
											{teamInfo.teamName || "Not set"}
										</p>
									</div>
								</div>
							)}
							<Badge
								variant="secondary"
								className="bg-green-100 text-green-800 border-green-300"
							>
								Ready to Play
							</Badge>
						</CardContent>
					</Card>
				</motion.div>
				{/* Game Results Section */}
				{hasCompletedGames && (
					<motion.div
						initial={{ opacity: 0, scale: 0.95 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ duration: 0.6, delay: 0.4 }}
						className="mb-8"
					>
						<Card className="bg-white border-gray-200 shadow-lg">
							<CardHeader>
								<CardTitle className="text-gray-800 flex items-center gap-2">
									<Trophy className="w-5 h-5" />
									Competition Results
									{allGamesCompleted ? (
										<Badge className="bg-green-100 text-green-800 border-green-300 ml-2">
											Completed
										</Badge>
									) : (
										<Badge className="bg-yellow-100 text-yellow-800 border-yellow-300 ml-2">
											On Process
										</Badge>
									)}
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
									<div>
										<p className="text-sm text-gray-600">
											Games Completed
										</p>
										<p className="text-2xl font-bold text-gray-800">
											{gameResults.length}/5
										</p>
									</div>
									<div>
										<p className="text-sm text-gray-600">
											Total Time
										</p>
										<p className="text-2xl font-bold text-gray-800">
											{formatTime(totalTime)}
										</p>
									</div>
									<div>
										<p className="text-sm text-gray-600">
											Average Time
										</p>
										<p className="text-2xl font-bold text-gray-800">
											{gameResults.length > 0
												? formatTime(
														Math.round(
															totalTime /
																gameResults.length
														)
												  )
												: "0:00"}
										</p>
									</div>
								</div>

								{/* Completed Games List */}
								<div className="space-y-2">
									<h3 className="text-lg font-semibold text-gray-800">
										Completed Games:
									</h3>
									<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
										{gameResults.map((game, index) => (
											<Card
												key={game.name}
												className="bg-green-50 border-green-300"
											>
												<CardContent className="p-3">
													<div className="flex items-center justify-between">
														<div className="flex items-center gap-2">
															<span className="text-xl">
																{game.icon}
															</span>
															<div>
																<h4 className="font-semibold text-gray-800 text-sm">
																	{game.name}
																</h4>
																<p className="text-xs text-green-600 font-semibold">
																	{game.timeFormatted ||
																		formatTime(
																			game.time ||
																				0
																		)}
																</p>
															</div>
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
													</div>
												</CardContent>
											</Card>
										))}
									</div>
								</div>
								{hasCompletedGames && !allGamesCompleted ? (
									<Button
										onClick={handleContinueGames}
										size="lg"
										className="bg-yellow-400 hover:bg-yellow-500 text-black px-8 py-4 text-lg font-semibold"
									>
										<Play className="w-5 h-5 mr-2" />
										Continue Competition
									</Button>
								) : allGamesCompleted ? (
									<div className="space-y-4">
										<div className="flex gap-4 justify-center">
											<Button
												onClick={() =>
													router.push("/results")
												}
												size="lg"
												className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 text-lg font-semibold"
											>
												<Trophy className="w-5 h-5 mr-2" />
												View Results
											</Button>
										</div>
									</div>
								) : (
									<Button
										onClick={() => setShowStartModal(true)}
										size="lg"
										className="bg-yellow-400 hover:bg-yellow-500 text-black px-8 py-4 text-lg font-semibold"
									>
										<Play className="w-5 h-5 mr-2" />
										Start Game Competition
									</Button>
								)}
							</CardContent>
						</Card>
					</motion.div>
				)}
				{/* Games Grid */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6, delay: 0.8 }}
					className="mb-8"
				>
					<h2 className="text-2xl font-bold text-gray-800 mb-6">
						Available Games
					</h2>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{games.map((game, index) => (
							<motion.div
								key={game.name}
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{
									duration: 0.6,
									delay: 1.0 + index * 0.1,
								}}
								whileHover={{ scale: 1.05 }}
							>
								<Card className="bg-white border-gray-200 shadow-lg hover:shadow-xl transition-all">
									<CardHeader>
										<CardTitle className="text-gray-800 flex items-center justify-between">
											<div className="flex items-center gap-2">
												<span className="text-2xl">
													{game.icon}
												</span>
												{game.name}
											</div>
											<Button
												variant="ghost"
												size="sm"
												onClick={() =>
													handleShowRules(game.name)
												}
												className="h-8 w-8 p-0 hover:bg-gray-100"
											>
												<MoreVertical className="h-4 w-4" />
											</Button>
										</CardTitle>
									</CardHeader>
									<CardContent>
										<p className="text-gray-600 text-sm">
											{game.description}
										</p>
										<Badge
											variant="outline"
											className="mt-2 border-gray-300 text-gray-600"
										>
											10 min max
										</Badge>
									</CardContent>
								</Card>
							</motion.div>
						))}
					</div>
				</motion.div>

				{/* Start Game Button */}
				<motion.div
					initial={{ opacity: 0, scale: 0.9 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ duration: 0.6, delay: 1.4 }}
					className="text-center"
				></motion.div>
			</div>

			<StartGameModal
				isOpen={showStartModal}
				onClose={() => setShowStartModal(false)}
			/>
			<ResetConfirmationModal
				isOpen={showResetModal}
				onClose={() => setShowResetModal(false)}
				onConfirm={handleResetGames}
			/>
			<GameRulesModal
				isOpen={showRulesModal}
				onClose={() => setShowRulesModal(false)}
				gameName={selectedGame}
			/>

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
