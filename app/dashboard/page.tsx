"use client";

import { useEffect, useState, useRef, useCallback } from "react";
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
	Bell,
} from "lucide-react";
import StartGameModal from "@/components/start-game-modal";
import GameDetailsModal from "@/components/game-details-modal";
import GameRulesModal from "@/components/game-rules-modal";
import ResetConfirmationModal from "@/components/reset-confirmation-modal";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import {
	AlertDialog,
	AlertDialogTrigger,
	AlertDialogContent,
	AlertDialogHeader,
	AlertDialogFooter,
	AlertDialogTitle,
	AlertDialogDescription,
	AlertDialogAction,
	AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface MarshalData {
	marshalName: string;
	teamName: string;
	username: string;
	teamMembers?: string;
	gameProgress?: {
		games: GameData[];
	};
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
	editRequested?: boolean;
	editAllowed?: boolean;
}

const playNotificationSound = () => {
	const audio = new Audio("/notification-sound-349341.mp3");
	audio.play();
};

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
	const wsRef = useRef<WebSocket | null>(null);
	const [notifications, setNotifications] = useState<
		{ message: string; time: string }[]
	>([]);
	const [notifOpen, setNotifOpen] = useState(false);
	const [notifLoading, setNotifLoading] = useState(false);
	// Add state for editingGameIndex and newEditTime at the top of the component
	const [editingGameIndex, setEditingGameIndex] = useState<number | null>(
		null
	);
	const [newEditTime, setNewEditTime] = useState<number>(0);
	// Add state for edit modal
	const [editModalOpen, setEditModalOpen] = useState(false);
	const [editModalGame, setEditModalGame] = useState<GameData | null>(null);
	// Add state for confirmation modal
	const [confirmEditIndex, setConfirmEditIndex] = useState<number | null>(
		null
	);
	// Add state to track WebSocket connection status
	const [wsConnected, setWsConnected] = useState(false);
	const [resetNoticeOpen, setResetNoticeOpen] = useState(false);
	const [deleteNoticeOpen, setDeleteNoticeOpen] = useState(false);

	const fetchMarshalData = useCallback(async () => {
		try {
			let username = "";
			const localData = localStorage.getItem("marshalData");
			if (localData) {
				const parsed = JSON.parse(localData);
				username = parsed.username;
			}
			if (!username) username = "marshal@guest.com";
			const res = await fetch(
				`/api/get-team-record?teamId=${encodeURIComponent(username)}`
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
	}, []);

	useEffect(() => {
		const token = localStorage.getItem("authToken");
		if (!token) {
			router.push("/");
			return;
		}
		fetchMarshalData();

		// WebSocket connection for real-time updates
		if (!wsRef.current) {
			try {
				const protocol =
					window.location.protocol === "https:" ? "wss" : "ws";
				const ws = new WebSocket(
					`${protocol}://${window.location.host}/ws`
				);
				wsRef.current = ws;

				ws.onopen = () => {
					console.log("Marshal WebSocket connected successfully");
					setWsConnected(true);
				};

				ws.onmessage = (event) => {
					try {
						const msg = JSON.parse(event.data);
						console.log(
							"Dashboard WebSocket message received:",
							msg
						);

						if (msg.type === "editAllowed") {
							console.log(
								"Received editAllowed WebSocket message",
								msg
							);
							toast({
								title: "Edit Approved!",
								description:
									"Admin has approved your edit request. You can now edit the game result.",
								className:
									"bg-yellow-100 text-yellow-800 border-yellow-300",
								duration: 2500,
							});
							setNotifLoading(true);
							fetchMarshalData();
							setNotifLoading(false);
							playNotificationSound();
							return;
						}
						if (
							msg.type === "liveUpdate" ||
							msg.type === "editPending" ||
							msg.type === "editRequested" ||
							msg.type === "editAccepted"
						) {
							console.log(
								"Marshal: Triggering live update fetch..."
							);
							setNotifLoading(true);
							fetchMarshalData();
							setNotifLoading(false);
							playNotificationSound();
							toast({
								title: "Live Update!",
								description:
									"Your team data was updated in real time.",
								duration: 2500,
							});
						}
						if (msg.type === "new_marshal") {
							setNotifications((prev) => [
								{
									message: msg.message,
									time:
										msg.time ||
										new Date().toLocaleTimeString(),
								},
								...prev.slice(0, 9),
							]);
							setNotifLoading(false);
							playNotificationSound();
							toast({
								title: "New Marshal Registered!",
								description: msg.message,
								duration: 4000,
							});
						}
						if (msg.type === "gamesReset") {
							setResetNoticeOpen(true);
							fetchMarshalData(); // Refresh marshal data immediately on reset
						}
						if (msg.type === "marshalDeleted") {
							// Check if this message is for the current marshal
							const localData =
								localStorage.getItem("marshalData");
							if (localData) {
								const parsed = JSON.parse(localData);
								if (parsed.username === msg.username) {
									// Show deletion modal and auto-logout
									setDeleteNoticeOpen(true);
								}
							}
						}
					} catch (error) {
						console.error(
							"Error parsing WebSocket message:",
							error
						);
					}
				};

				ws.onclose = () => {
					console.log("Marshal WebSocket disconnected");
					wsRef.current = null;
					setWsConnected(false);
				};

				ws.onerror = (error) => {
					console.warn("Marshal WebSocket connection failed:", error);
					wsRef.current = null;
					setWsConnected(false);
				};
			} catch (error) {
				console.warn("Marshal WebSocket setup failed:", error);
				setWsConnected(false);
			}
		}
		// Cleanup on unmount
		return () => {
			if (wsRef.current) {
				wsRef.current.close();
				wsRef.current = null;
			}
		};
	}, [router, toast]);

	// Add polling fallback if websocket is not connected
	useEffect(() => {
		let pollInterval: NodeJS.Timeout | null = null;
		if (!wsConnected) {
			pollInterval = setInterval(async () => {
				try {
					let username = "";
					const localData = localStorage.getItem("marshalData");
					if (localData) {
						const parsed = JSON.parse(localData);
						username = parsed.username;
					}
					if (!username) return;
					const res = await fetch(
						`/api/get-team-record?teamId=${encodeURIComponent(
							username
						)}`
					);
					if (res.ok) {
						const data = await res.json();
						// If reset detected (games array is empty)
						if (
							data &&
							data.gameProgress &&
							Array.isArray(data.gameProgress.games) &&
							data.gameProgress.games.length === 0 &&
							!resetNoticeOpen
						) {
							setResetNoticeOpen(true);
						}
					}
				} catch {}
			}, 5000);
		}
		return () => {
			if (pollInterval) clearInterval(pollInterval);
		};
	}, [wsConnected, resetNoticeOpen]);

	// WebSocket-only real-time updates (polling removed)
	// All updates now come through WebSocket connections

	const handleLogout = () => {
		localStorage.removeItem("authToken");
		localStorage.removeItem("marshalData");
		localStorage.removeItem("gameProgress");
		router.push("/");
	};

	const handleContinueGames = () => {
		// Find the first uncompleted game index
		let currentGameIdx = 0;
		if (
			marshalData &&
			marshalData.gameProgress &&
			Array.isArray(marshalData.gameProgress.games)
		) {
			const firstUncompleted = marshalData.gameProgress.games.findIndex(
				(g: any) => !g.completed
			);
			if (firstUncompleted !== -1) {
				currentGameIdx = firstUncompleted;
			} else {
				currentGameIdx = marshalData.gameProgress.games.length - 1;
			}
		}
		// Store in localStorage for /games page to read
		localStorage.setItem("currentGame", String(currentGameIdx));
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

	// Update totalTime calculation to include penalties for each game
	const totalTime = (marshalData?.gameProgress?.games || []).reduce(
		(sum: number, g: any) =>
			sum +
			(g.details?.finalScore ??
				(g.time ?? 0) + (g.details?.penaltySeconds ?? 0) * 5),
		0
	);

	// Calculate Office Chair Race penalty seconds
	const officeChairGame = (marshalData?.gameProgress?.games || []).find(
		(g: any) => g.name === "Office Chair Race"
	);
	const officeChairPenalty = officeChairGame?.details?.penaltySeconds
		? officeChairGame.details.penaltySeconds * 5
		: 0;

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
		return (
			<div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-yellow-100 to-blue-100">
				<div className="flex flex-col items-center gap-6 p-8 bg-white rounded-lg shadow-lg">
					<p className="text-2xl font-bold text-gray-700 mb-4">
						No marshal data found.
					</p>
					<Button
						onClick={handleLogout}
						variant="outline"
						className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
					>
						<LogOut className="w-4 h-4 mr-2" />
						Logout
					</Button>
				</div>
			</div>
		);
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
										{officeChairPenalty > 0 && (
											<p className="text-sm text-red-600">
												Office Chair Race Penalty: +
												{officeChairPenalty}s
											</p>
										)}
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
																	{game.name ===
																		"Office Chair Race" &&
																	game.details ? (
																		<span className="text-green-700 font-bold text-sm flex items-center gap-1">
																			{(() => {
																				const base =
																					game.time ||
																					0;
																				const penalties =
																					game
																						.details
																						.penaltySeconds *
																						5 ||
																					0;
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
																				const secs =
																					(
																						total %
																						60
																					)
																						.toString()
																						.padStart(
																							2,
																							"0"
																						);
																				return `${mins}:${secs}`;
																			})()}
																			{game
																				.details
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
																			{game.details &&
																			typeof game
																				.details
																				.finalScore ===
																				"number"
																				? formatTime(
																						game
																							.details
																							.finalScore
																				  )
																				: formatTime(
																						game.time ||
																							0
																				  )}
																		</span>
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
															className="bg-yellow-400 hover:bg-yellow-500 text-black mr-2"
														>
															<Eye className="w-3 h-3" />
														</Button>
														<AlertDialog
															open={
																confirmEditIndex ===
																index
															}
															onOpenChange={(
																open
															) =>
																setConfirmEditIndex(
																	open
																		? index
																		: null
																)
															}
														>
															<AlertDialogTrigger
																asChild
															>
																<Button
																	size="sm"
																	variant="outline"
																	disabled={
																		game.editRequested ||
																		game.editAllowed
																	}
																	onClick={() =>
																		setConfirmEditIndex(
																			index
																		)
																	}
																>
																	{game.editRequested
																		? "Edit Requested"
																		: game.editAllowed
																		? "Edit Allowed"
																		: "Request Admin"}
																</Button>
															</AlertDialogTrigger>
															<AlertDialogContent>
																<AlertDialogHeader>
																	<AlertDialogTitle>
																		Request
																		Admin?
																	</AlertDialogTitle>
																	<AlertDialogDescription>
																		<span>
																			You
																			are
																			about
																			to
																			request
																			an
																			admin
																			edit
																			for{" "}
																			<b>
																				{
																					game.name
																				}
																			</b>
																			.
																			<br />
																			<br />
																			If
																			you
																			made
																			a
																			mistake
																			in
																			entering
																			the
																			game
																			results—such
																			as
																			an
																			incorrect
																			time,
																			score,
																			or
																			any
																			other
																			error—this
																			will
																			notify
																			the
																			admin
																			so
																			you
																			can
																			correct
																			it.
																			<br />
																			<br />
																			<span className="text-yellow-700 font-semibold">
																				This
																				action
																				cannot
																				be
																				undone
																				and
																				will
																				alert
																				the
																				admin
																				immediately.
																			</span>
																		</span>
																	</AlertDialogDescription>
																</AlertDialogHeader>
																<AlertDialogFooter>
																	<AlertDialogCancel>
																		Cancel
																	</AlertDialogCancel>
																	<AlertDialogAction
																		className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold border-yellow-400"
																		onClick={async () => {
																			if (
																				!marshalData
																			)
																				return;
																			await fetch(
																				"/api/save-team-record",
																				{
																					method: "POST",
																					headers:
																						{
																							"Content-Type":
																								"application/json",
																						},
																					body: JSON.stringify(
																						{
																							teamId: marshalData.username,
																							data: marshalData,
																							editAction:
																								"requestEdit",
																							gameIndex:
																								index,
																						}
																					),
																				}
																			);
																			toast(
																				{
																					title: "Edit Requested",
																					description: `Requested admin permission to edit ${game.name}.`,
																					className:
																						"bg-yellow-100 text-yellow-800 border-yellow-300",
																					duration: 2000,
																				}
																			);
																			setConfirmEditIndex(
																				null
																			);
																		}}
																	>
																		Request
																	</AlertDialogAction>
																</AlertDialogFooter>
															</AlertDialogContent>
														</AlertDialog>
														{/* Edit Button or Waiting Message */}
														{game.editAllowed ? (
															<Button
																size="sm"
																variant="outline"
																className="ml-2 bg-yellow-400 hover:bg-yellow-500 text-black font-semibold"
																onClick={() => {
																	toast({
																		title: "Edit Mode",
																		description:
																			"You can now edit the game result. Make your changes and submit.",
																		className:
																			"bg-yellow-100 text-yellow-800 border-yellow-300",
																		duration: 2500,
																	});
																	setEditModalGame(
																		game
																	);
																	setEditModalOpen(
																		true
																	);
																}}
															>
																Edit
															</Button>
														) : game.editRequested ? (
															<span
																className="ml-2 px-3 py-1 rounded bg-yellow-100 text-yellow-700 font-semibold text-xs border border-yellow-300 cursor-pointer"
																onClick={() => {
																	toast({
																		title: "Waiting for Approval",
																		description:
																			"Your edit request is pending admin approval. Please wait.",
																		className:
																			"bg-yellow-100 text-yellow-800 border-yellow-300",
																		duration: 2500,
																	});
																}}
															>
																Pending
															</span>
														) : null}
													</div>
												</CardContent>
												{/* Inline edit form for the selected game */}
												{editingGameIndex === index && (
													<form
														onSubmit={async (e) => {
															e.preventDefault();
															if (!marshalData)
																return;
															await fetch(
																"/api/save-team-record",
																{
																	method: "POST",
																	headers: {
																		"Content-Type":
																			"application/json",
																	},
																	body: JSON.stringify(
																		{
																			teamId: marshalData.username,
																			data: {
																				...marshalData,
																				gameProgress:
																					{
																						...marshalData.gameProgress,
																						games: (
																							marshalData
																								.gameProgress
																								?.games ||
																							[]
																						).map(
																							(
																								g: GameData,
																								i: number
																							) =>
																								i ===
																								index
																									? {
																											...g,
																											time: newEditTime,
																											editPending:
																												true,
																											editAllowed:
																												false,
																									  }
																									: g
																						),
																					},
																			},
																			editAction:
																				"submitEdit",
																			gameIndex:
																				index,
																		}
																	),
																}
															);
															setEditingGameIndex(
																null
															);
															setNewEditTime(0);
															toast({
																title: "Edit Submitted",
																description: `New time submitted for ${game.name}. Awaiting admin review.`,
																className:
																	"bg-blue-100 text-blue-800 border-blue-300",
																duration: 2000,
															});
														}}
														className="flex items-center gap-2 mt-2"
													>
														<input
															type="number"
															min={0}
															value={newEditTime}
															onChange={(e) =>
																setNewEditTime(
																	Number(
																		e.target
																			.value
																	)
																)
															}
															className="border border-gray-300 rounded px-2 py-1 w-24"
															placeholder="New time (sec)"
															required
														/>
														<Button
															type="submit"
															size="sm"
															className="bg-blue-500 text-white"
														>
															Submit
														</Button>
														<Button
															type="button"
															size="sm"
															variant="ghost"
															onClick={() =>
																setEditingGameIndex(
																	null
																)
															}
														>
															Cancel
														</Button>
													</form>
												)}
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
				{/* Start Competition Section - Show when no games have been started */}
				{!hasCompletedGames && (
					<motion.div
						initial={{ opacity: 0, scale: 0.95 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ duration: 0.6, delay: 0.4 }}
						className="mb-8"
					>
						<Card className="bg-white border-gray-200 shadow-lg">
							<CardHeader className="flex items-center">
								<CardTitle className="text-gray-800 flex items-center gap-2">
									<Play className="w-5 h-5" />
									Ready to Start Your Competition?
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="text-center">
									<p className="text-gray-600 mb-6">
										Your team is ready! Click the button
										below to begin your exciting game
										competition.
									</p>
									<Button
										onClick={() => setShowStartModal(true)}
										size="lg"
										className="bg-yellow-400 hover:bg-yellow-500 text-black px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
									>
										<Play className="w-5 h-5 mr-2" />
										Start Competition
									</Button>
								</div>
							</CardContent>
						</Card>
					</motion.div>
				)}

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
			{/* Edit Modal for marshal */}
			{editModalGame && (
				<GameDetailsModal
					game={editModalGame}
					isOpen={editModalOpen}
					onClose={() => setEditModalOpen(false)}
					canEdit={editModalGame.editAllowed}
					onEditSubmit={async (values) => {
						if (!marshalData) return;
						// Find the index of the game being edited
						const gameIndex =
							marshalData.gameProgress?.games?.findIndex(
								(g) => g.name === editModalGame.name
							);
						if (gameIndex === undefined || gameIndex < 0) return;
						// Update the game in marshalData
						const updatedGames = (
							marshalData.gameProgress?.games || []
						).map((g, i) =>
							i === gameIndex
								? {
										...g,
										...values,
										details: {
											...g.details,
											bonusSeconds: values.bonusSeconds,
											penaltySeconds:
												values.penaltySeconds,
											creativityBonus:
												values.creativityBonus,
											finalScore: values.finalScore,
										},
										time: values.time,
										score: values.score,
										editPending: true,
										editAllowed: false,
								  }
								: g
						);
						const updatedData = {
							...marshalData,
							gameProgress: {
								...marshalData.gameProgress,
								games: updatedGames,
							},
						};
						await fetch("/api/save-team-record", {
							method: "POST",
							headers: { "Content-Type": "application/json" },
							body: JSON.stringify({
								teamId: marshalData.username,
								data: updatedData,
								editAction: "submitEdit",
								gameIndex,
							}),
						});
						setEditModalOpen(false);
						setEditModalGame(null);
						toast({
							title: "Edit Saved to Cloud",
							description:
								"Your changes have been saved and are pending admin approval. Both marshal and admin dashboards are now updated.",
							className:
								"bg-blue-100 text-blue-800 border-blue-300",
							duration: 2000,
						});
						// Fetch latest data from cloud, then show a second toast
						await fetchMarshalData();
						toast({
							title: "Data Refreshed",
							description:
								"You are now viewing the latest saved data from the cloud.",
							className:
								"bg-green-100 text-green-800 border-green-300",
							duration: 2000,
						});
					}}
				/>
			)}
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
