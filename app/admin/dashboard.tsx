"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	MoreVertical,
	Trophy,
	Users,
	LogOut,
	Bell,
	User,
	Clock,
	Landmark,
	Flag,
	Timer,
	Award,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { Bar } from "react-chartjs-2";
import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	BarElement,
	Title,
	Tooltip,
	Legend,
} from "chart.js";
import SparksAnimation from "@/components/sparks-animation";
import ShowResultsButton from "@/components/show-results-button";
import React from "react";

interface TeamData {
	username: string;
	marshalName: string;
	teamName: string;
	totalTime: number;
	gameProgress?: any;
	groupName?: string; // <-- add this line
}

function formatHMS(seconds: number) {
	const h = Math.floor(seconds / 3600);
	const m = Math.floor((seconds % 3600) / 60);
	const s = seconds % 60;
	return `${h > 0 ? h + "h " : ""}${m > 0 ? m + "m " : ""}${s}s`;
}

function formatMMSS(seconds: number) {
	const m = Math.floor(seconds / 60);
	const s = seconds % 60;
	return `${m}:${s.toString().padStart(2, "0")}`;
}

ChartJS.register(
	CategoryScale,
	LinearScale,
	BarElement,
	Title,
	Tooltip,
	Legend
);

export default function AdminDashboard() {
	const [teams, setTeams] = useState<TeamData[]>([]);
	const [error, setError] = useState("");
	const [selectedTeam, setSelectedTeam] = useState<TeamData | null>(null);
	const router = useRouter();
	const wsRef = useRef<WebSocket | null>(null);
	const { toast } = useToast();
	const [notifications, setNotifications] = useState<
		{ message: string; time: string }[]
	>([]);
	const [notifOpen, setNotifOpen] = useState(false);
	const [notifLoading, setNotifLoading] = useState(false);
	// Add state for leaderboard details modal
	const [leaderboardModalOpen, setLeaderboardModalOpen] = useState(false);
	const [leaderboardModalTeam, setLeaderboardModalTeam] =
		useState<TeamData | null>(null);
	// Add back loading state
	const [loading, setLoading] = useState(true);
	// Add state to track initial data fetch
	const [initialLoadComplete, setInitialLoadComplete] = useState(false);
	// Add state to track if results are revealed
	const [resultsRevealed, setResultsRevealed] = useState(false);
	// Add state to track WebSocket connection status
	const [wsConnected, setWsConnected] = useState(false);

	const [revealStep, setRevealStep] = useState<
		"splash" | "team" | "final" | null
	>(null);
	const [currentTeamIdx, setCurrentTeamIdx] = useState(0);

	const [progressModalOpen, setProgressModalOpen] = useState(false);
	const [progressModalTeam, setProgressModalTeam] = useState<TeamData | null>(
		null
	);
	const [progressModalLoading, setProgressModalLoading] = useState(false);
	const [progressModalData, setProgressModalData] = useState<any>(null);

	const handleShowProgressModal = async (team: TeamData) => {
		setProgressModalTeam(team);
		setProgressModalOpen(true);
		setProgressModalLoading(true);
		try {
			const res = await fetch(
				`/api/get-team-record?teamId=${encodeURIComponent(
					team.username
				)}`
			);
			if (!res.ok) throw new Error("Failed to fetch team record");
			const data = await res.json();
			setProgressModalData(data);
		} catch (err) {
			setProgressModalData(null);
		} finally {
			setProgressModalLoading(false);
		}
	};

	// When Show Results is clicked, start splash
	const handleShowResults = () => {
		setResultsRevealed(true);
		setRevealStep("splash");
		setCurrentTeamIdx(sortedCompleted.length - 1); // start from last place
	};

	// Handler for Next button
	const handleNext = () => {
		if (revealStep === "splash") {
			setRevealStep("team");
			setCurrentTeamIdx(sortedCompleted.length - 1); // start from last place
		} else if (revealStep === "team") {
			if (currentTeamIdx > 0) {
				setCurrentTeamIdx(currentTeamIdx - 1);
			} else {
				setRevealStep("final");
			}
		}
	};

	// Handler for Finish button
	const handleFinish = () => {
		setRevealStep(null); // show real results
	};

	// Function to save resultsRevealed to cloud storage
	const saveResultsRevealed = async (revealed: boolean) => {
		try {
			await fetch("/api/save-admin-settings", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ resultsRevealed: revealed }),
			});
		} catch (error) {
			console.error("Failed to save admin settings:", error);
		}
	};

	// Function to load resultsRevealed from cloud storage
	const loadResultsRevealed = async () => {
		try {
			const response = await fetch("/api/get-admin-settings");
			if (response.ok) {
				const settings = await response.json();
				setResultsRevealed(settings.resultsRevealed || false);
			}
		} catch (error) {
			console.error("Failed to load admin settings:", error);
		}
	};

	// Function to reset admin settings (for testing)
	const resetAdminSettings = async () => {
		try {
			const response = await fetch("/api/reset-admin-settings", {
				method: "POST",
			});
			if (response.ok) {
				setResultsRevealed(false);
				toast({
					title: "Settings Reset",
					description: "Admin settings have been reset to default",
					duration: 2000,
				});
			}
		} catch (error) {
			console.error("Failed to reset admin settings:", error);
		}
	};

	// Memoize fetchTeams to prevent repeated fetching
	const fetchTeams = useCallback(
		async (notify = false) => {
			setLoading(true);
			setError("");
			try {
				const res = await fetch("/api/list-users");
				if (!res.ok) throw new Error("Failed to fetch users");
				const users = await res.json();
				const teamPromises = users.map(async (user: any) => {
					const recRes = await fetch(
						`/api/get-team-record?teamId=${encodeURIComponent(
							user.username
						)}`
					);
					if (!recRes.ok) return null;
					const rec = await recRes.json();
					let totalTime = 0;
					if (rec.gameProgress && rec.gameProgress.games) {
						totalTime = rec.gameProgress.games.reduce(
							(sum: number, g: any) => sum + (g.time || 0),
							0
						);
					}
					return {
						username: user.username,
						marshalName: rec.marshalName || user.marshalName || "",
						teamName: rec.teamName || user.teamName || "",
						totalTime,
						gameProgress: rec.gameProgress || {},
					};
				});
				let teamsData = (await Promise.all(teamPromises)).filter(
					Boolean
				) as TeamData[];
				teamsData = teamsData.sort((a, b) => b.totalTime - a.totalTime); // longest first
				setTeams(teamsData);
				if (notify) {
					toast({
						title: "Leaderboard Updated!",
						description: "New team data received in real time.",
						duration: 2500,
					});
				}
			} catch (err: any) {
				setError(err.message || "Unknown error");
			} finally {
				setLoading(false);
				// Mark initial load as complete after first successful fetch
				if (!initialLoadComplete) {
					setInitialLoadComplete(true);
				}
			}
		},
		[toast, initialLoadComplete]
	);

	// Add a notification sound
	const playNotificationSound = () => {
		try {
			const audio = new Audio("/notification-sound-349341.mp3");
			audio.play().catch((error) => {
				console.log(
					"Audio playback failed (user interaction required):",
					error
				);
				// Silently fail - this is expected behavior in browsers
			});
		} catch (error) {
			console.log("Audio creation failed:", error);
		}
	};

	// Update useEffect to depend on router and fetchTeams only
	useEffect(() => {
		if (
			typeof window !== "undefined" &&
			!localStorage.getItem("adminSession")
		) {
			router.push("/admin");
			return;
		}
		fetchTeams();
		loadResultsRevealed(); // Load admin settings from cloud storage
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
					console.log("WebSocket connected successfully");
					setWsConnected(true);
				};

				ws.onmessage = (event) => {
					try {
						const msg = JSON.parse(event.data);
						console.log("WebSocket message received:", msg);

						if (
							msg.type === "liveUpdate" ||
							msg.type === "editPending" ||
							msg.type === "editAllowed" ||
							msg.type === "editRequested" ||
							msg.type === "editAccepted"
						) {
							console.log("Triggering live update fetch...");
							fetchTeams(true);

							// Show specific notification for game completions
							if (
								msg.type === "liveUpdate" &&
								msg.completedGames
							) {
								toast({
									title: "Game Completed!",
									description: `Team ${msg.teamId} completed ${msg.completedGames} games`,
									duration: 3000,
								});
							}
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
							playNotificationSound();
							toast({
								title: "New Marshal Registered!",
								description: msg.message,
								duration: 4000,
							});
						}
						// Handle admin settings updates
						if (msg.type === "adminSettingsUpdate") {
							setResultsRevealed(msg.resultsRevealed || false);
							toast({
								title: "Settings Updated",
								description: "Admin settings have been updated",
								duration: 2000,
							});
						}
					} catch (error) {
						console.error(
							"Error parsing WebSocket message:",
							error
						);
					}
				};

				ws.onclose = () => {
					console.log("WebSocket disconnected");
					wsRef.current = null;
					setWsConnected(false);
				};

				ws.onerror = (error) => {
					console.warn(
						"WebSocket connection failed, falling back to polling:",
						error
					);
					wsRef.current = null;
					setWsConnected(false);
				};
			} catch (error) {
				console.warn(
					"WebSocket setup failed, falling back to polling:",
					error
				);
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
	}, [router, fetchTeams, toast]);

	// WebSocket-only real-time updates (polling removed)
	// All updates now come through WebSocket connections

	// Note: resultsRevealed is now loaded from cloud storage in the main useEffect

	const totalTeams = teams.length;
	const totalTime = teams.reduce((sum, t) => sum + t.totalTime, 0);
	const avgTime = totalTeams > 0 ? Math.round(totalTime / totalTeams) : 0;

	// Filter completed and in-progress teams
	const completedTeams = teams.filter(
		(team) =>
			team.gameProgress &&
			Array.isArray(team.gameProgress.games) &&
			team.gameProgress.games.length === 5 &&
			team.gameProgress.games.every((g: any) => g.completed)
	);
	const inProgressTeams = teams.filter(
		(team) =>
			!team.gameProgress ||
			!Array.isArray(team.gameProgress.games) ||
			team.gameProgress.games.length < 5 ||
			!team.gameProgress.games.every((g: any) => g.completed)
	);
	// Add state and logic for results button after completedTeams is defined
	const allTeamsRegistered = teams.length > 0;
	const allTeamsCompleted =
		completedTeams.length === teams.length && teams.length > 0;
	const showResultsButton =
		allTeamsRegistered && allTeamsCompleted && !resultsRevealed;
	const showOnProgressButton = allTeamsRegistered && !allTeamsCompleted;

	// Add debugging logs
	console.log("=== DEBUG INFO ===");
	console.log("teams.length:", teams.length);
	console.log("completedTeams.length:", completedTeams.length);
	console.log("allTeamsRegistered:", allTeamsRegistered);
	console.log("allTeamsCompleted:", allTeamsCompleted);
	console.log("resultsRevealed:", resultsRevealed);
	console.log("showResultsButton:", showResultsButton);
	console.log("showOnProgressButton:", showOnProgressButton);
	console.log("==================");

	// Sort completed teams by totalTime ascending (shortest first)
	const sortedCompleted = [...completedTeams].sort(
		(a, b) => a.totalTime - b.totalTime
	);
	const winner = sortedCompleted[0];

	// Bar chart data: bar height reflects real totalTime, but no timings shown
	// Reverse the order to show from last place to 1st place
	const chartTeams = [...sortedCompleted].reverse(); // Last place first, 1st place last
	const placeLabels = [
		"1st PLACE",
		"2nd PLACE",
		"3rd PLACE",
		"4th PLACE",
		"5th PLACE",
		"6th PLACE",
		"7th PLACE",
		"8th PLACE",
		"9th PLACE",
		"10th PLACE",
	];
	const chartLabels = chartTeams.map((team, idx) => {
		// Since chartTeams is reversed, we need to calculate the actual place
		const actualPlace = chartTeams.length - idx;
		let placeLabel = `${actualPlace}th PLACE`;
		if (actualPlace === 1) placeLabel = "1st PLACE";
		else if (actualPlace === 2) placeLabel = "2nd PLACE";
		else if (actualPlace === 3) placeLabel = "3rd PLACE";
		return `${team.teamName} - ${placeLabel}`;
	});
	const barColors = chartTeams.map(() => "rgba(250, 204, 21, 0.85)"); // all yellow
	const barData = {
		labels: chartLabels,
		datasets: [
			{
				label: "Ranking",
				data: chartTeams.map((team) => team.totalTime), // Use real totalTime for bar height
				backgroundColor: barColors,
				borderRadius: 4,
				borderSkipped: false,
				barPercentage: 0.5,
				categoryPercentage: 0.5,
			},
		],
	};
	const barOptions = {
		indexAxis: "x" as const, // vertical bars
		responsive: true,
		plugins: {
			legend: { display: false },
			title: { display: false },
			tooltip: {
				enabled: true,
				callbacks: {
					label: function (context: any) {
						const value = context.parsed.y || context.parsed;
						return `Time: ${formatMMSS(value)}`;
					},
				},
				backgroundColor: "#fff",
				titleColor: "#334155",
				bodyColor: "#334155",
				borderColor: "#facc15",
				borderWidth: 1,
				padding: 5,
				cornerRadius: 2,
				displayColors: false,
			},
		},
		scales: {
			x: {
				ticks: {
					color: "#64748b",
					font: { size: 14, weight: 700 },
				},
				grid: { color: "#e5e7eb" },
			},
			y: {
				display: false, // Hide y-axis
				grid: { display: false },
			},
		},
		layout: { padding: 10 },
		maintainAspectRatio: false,
	};

	// Update totalFinalTime calculation to include penalties for each game
	let totalFinalTime = 0;
	if (
		progressModalData &&
		progressModalData.gameProgress &&
		progressModalData.gameProgress.games
	) {
		totalFinalTime = progressModalData.gameProgress.games.reduce(
			(sum: number, g: any) =>
				sum +
				(g.details?.finalScore ??
					(g.time ?? 0) + (g.details?.penaltySeconds ?? 0) * 5),
			0
		);
	}

	// Calculate total penalty seconds for all games
	let totalPenaltySeconds = 0;
	if (
		progressModalData &&
		progressModalData.gameProgress &&
		progressModalData.gameProgress.games
	) {
		totalPenaltySeconds = progressModalData.gameProgress.games.reduce(
			(sum: number, g: any) => sum + (g.details?.penaltySeconds ?? 0) * 5,
			0
		);
	}

	if (loading && !initialLoadComplete) {
		return (
			<div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white">
				<svg
					className="animate-spin h-16 w-16 text-yellow-400 mb-6"
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
				>
					<circle
						className="opacity-25"
						cx="12"
						cy="12"
						r="10"
						stroke="currentColor"
						strokeWidth="4"
					></circle>
					<path
						className="opacity-75"
						fill="currentColor"
						d="M4 12a8 8 0 018-8v8z"
					></path>
				</svg>
				<span className="text-yellow-500 font-bold text-2xl">
					Loading ...
				</span>
			</div>
		);
	}

	if (error) {
		return (
			<div className="min-h-screen flex items-center justify-center text-red-500">
				{error}
			</div>
		);
	}

	// If all teams are completed and results not revealed, show navbar, stats, and Show Results button (but no winner/leaderboard)
	if (allTeamsCompleted && !resultsRevealed) {
		console.log("SHOWING: Show Results button view");
		return (
			<div className="min-h-screen bg-white">
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
						<div className="flex items-center gap-4 relative">
							<Button
								onClick={() => setNotifOpen(true)}
								variant="ghost"
								className="relative"
							>
								<Bell className="w-6 h-6 text-yellow-500" />
								{/* Show badge with count if there are pending edit requests */}
								{(() => {
									const editRequestCount = teams.reduce(
										(count, team) =>
											count +
											(team.gameProgress &&
											team.gameProgress.games
												? team.gameProgress.games.filter(
														(g: any) =>
															g.editRequested
												  ).length
												: 0),
										0
									);
									return editRequestCount > 0 ? (
										<span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5 min-w-[1.5em] text-center">
											{editRequestCount}
										</span>
									) : null;
								})()}
							</Button>
							<Button
								onClick={() => {
									localStorage.removeItem("adminSession");
									router.push("/admin");
								}}
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
							Welcome,{" "}
							<span className="text-xl md:text-2xl font-bold bg-gradient-to-r from-yellow-400 via-pink-400 to-blue-400 bg-clip-text text-transparent ml-0">
								Eric!
							</span>
						</span>
					</div>
					{/* Stats Cards */}
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6, delay: 0.2 }}
						className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
					>
						<Card className="bg-white border-gray-200 shadow-lg">
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium text-gray-700">
									Total Teams
								</CardTitle>
								<Users className="h-4 w-4 text-gray-600" />
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold text-gray-800">
									{totalTeams}
								</div>
								<p className="text-xs text-gray-600">
									Registered teams
								</p>
							</CardContent>
						</Card>
						<Card className="bg-white border-gray-200 shadow-lg">
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium text-gray-700">
									Average Time
								</CardTitle>
								<Trophy className="h-4 w-4 text-gray-600" />
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold text-gray-800">
									{formatHMS(avgTime)}
								</div>
								<p className="text-xs text-gray-600">
									Average team time
								</p>
							</CardContent>
						</Card>
						<Card className="bg-white border-gray-200 shadow-lg">
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium text-gray-700">
									Total Time
								</CardTitle>
								<Trophy className="h-4 w-4 text-gray-600" />
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold text-gray-800">
									{formatHMS(totalTime)}
								</div>
								<p className="text-xs text-gray-600">
									Sum of all teams
								</p>
							</CardContent>
						</Card>
					</motion.div>
					{/* Show Results button centered */}
					<div className="flex flex-col items-center justify-center min-h-[40vh]">
						<button
							className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold text-2xl px-10 py-6 rounded-lg shadow-lg transition-all w-full max-w-xs"
							onClick={() => {
								setResultsRevealed(true);
								saveResultsRevealed(true);
								router.push("/admin/results");
							}}
						>
							Show Results
						</button>
					</div>
				</div>
			</div>
		);
	}

	// Main dashboard view (when results are revealed or teams are still in progress)
	console.log("SHOWING: Main dashboard view");
	return (
		<div
			className={
				revealStep ? "min-h-screen bg-black" : "min-h-screen bg-white"
			}
		>
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
					<div className="flex items-center gap-4 relative">
						<Button
							onClick={() => setNotifOpen(true)}
							variant="ghost"
							className="relative"
						>
							<Bell className="w-6 h-6 text-yellow-500" />
							{/* Show badge with count if there are pending edit requests */}
							{(() => {
								const editRequestCount = teams.reduce(
									(count, team) =>
										count +
										(team.gameProgress &&
										team.gameProgress.games
											? team.gameProgress.games.filter(
													(g: any) => g.editRequested
											  ).length
											: 0),
									0
								);
								return editRequestCount > 0 ? (
									<span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5 min-w-[1.5em] text-center">
										{editRequestCount}
									</span>
								) : null;
							})()}
						</Button>
						<Button
							onClick={resetAdminSettings}
							variant="outline"
							className="bg-red-50 border-red-300 text-red-700 hover:bg-red-100 mr-2"
						>
							Reset Settings
						</Button>
						<Button
							onClick={() => {
								localStorage.removeItem("adminSession");
								router.push("/admin");
							}}
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
						Welcome,{" "}
						<span className="text-xl md:text-2xl font-bold bg-gradient-to-r from-yellow-400 via-pink-400 to-blue-400 bg-clip-text text-transparent ml-0">
							Eric!
						</span>
					</span>
				</div>
				{/* Stats Cards */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6, delay: 0.2 }}
					className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
				>
					<Card className="bg-white border-gray-200 shadow-lg">
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium text-gray-700">
								Total Teams
							</CardTitle>
							<Users className="h-4 w-4 text-gray-600" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold text-gray-800">
								{totalTeams}
							</div>
							<p className="text-xs text-gray-600">
								Registered teams
							</p>
						</CardContent>
					</Card>
					<Card className="bg-white border-gray-200 shadow-lg">
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium text-gray-700">
								Average Time
							</CardTitle>
							<Trophy className="h-4 w-4 text-gray-600" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold text-gray-800">
								{formatHMS(avgTime)}
							</div>
							<p className="text-xs text-gray-600">
								Average team time
							</p>
						</CardContent>
					</Card>
					<Card className="bg-white border-gray-200 shadow-lg">
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium text-gray-700">
								Total Time
							</CardTitle>
							<Trophy className="h-4 w-4 text-gray-600" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold text-gray-800">
								{formatHMS(totalTime)}
							</div>
							<p className="text-xs text-gray-600">
								Sum of all teams
							</p>
						</CardContent>
					</Card>
				</motion.div>
				{/* Show On Progress button if not all teams completed */}
				{showOnProgressButton && (
					<div className="flex flex-col items-center justify-center min-h-[40vh]">
						<button
							className="bg-gray-300 text-gray-700 font-bold text-2xl px-10 py-6 rounded-lg cursor-not-allowed opacity-80"
							disabled
						>
							On Progress
						</button>
					</div>
				)}

				{/* Reveal Flow: Splash, Team Results, Final */}
				{resultsRevealed &&
					allTeamsCompleted &&
					revealStep === "splash" && (
						<div className="flex flex-col items-center justify-center min-h-[70vh] relative">
							<SparksAnimation />
							<div className="absolute inset-0 flex flex-col items-center justify-center">
								<div className="bg-black bg-opacity-80 rounded-xl px-8 py-12">
									<h1
										className="text-5xl md:text-6xl font-extrabold text-yellow-400 text-center mb-10"
										style={{ textShadow: "0 2px 8px #000" }}
									>
										Are you ready to see the results
									</h1>
									<button
										className="mt-8 bg-yellow-400 hover:bg-yellow-500 text-black font-bold text-2xl px-10 py-4 rounded-lg shadow-lg transition-all"
										onClick={handleNext}
									>
										Next &rarr;
									</button>
								</div>
							</div>
						</div>
					)}
				{resultsRevealed &&
					allTeamsCompleted &&
					revealStep === "team" && (
						<div className="flex flex-col items-center justify-center min-h-[70vh] relative">
							<SparksAnimation />
							<div className="absolute inset-0 flex flex-col items-center justify-center">
								<div className="bg-black bg-opacity-80 rounded-xl px-8 py-12">
									<h2
										className="text-4xl md:text-5xl font-extrabold text-orange-500 text-center mb-6"
										style={{ textShadow: "0 2px 8px #000" }}
									>
										CONGRATULATIONS
									</h2>
									<h3
										className="text-3xl md:text-4xl font-extrabold text-yellow-400 text-center mb-2"
										style={{ textShadow: "0 2px 8px #000" }}
									>
										{sortedCompleted[
											currentTeamIdx
										]?.teamName?.toUpperCase()}{" "}
										-{" "}
										{sortedCompleted.length -
											currentTeamIdx}
										TH PLACE
									</h3>
									<h4
										className="text-2xl md:text-3xl font-extrabold text-yellow-400 text-center mb-6"
										style={{ textShadow: "0 2px 8px #000" }}
									>
										GROUP{" "}
										{sortedCompleted[
											currentTeamIdx
										]?.groupName?.toUpperCase() || ""}
									</h4>
									<button
										className="mt-8 bg-yellow-400 hover:bg-yellow-500 text-black font-bold text-2xl px-10 py-4 rounded-lg shadow-lg transition-all"
										onClick={handleNext}
									>
										{currentTeamIdx === 0
											? "Finish"
											: "Next →"}
									</button>
								</div>
							</div>
						</div>
					)}
				{resultsRevealed &&
					allTeamsCompleted &&
					revealStep === "final" && (
						<div className="flex flex-col items-center justify-center min-h-[70vh] relative">
							<SparksAnimation />
							<div className="absolute inset-0 flex flex-col items-center justify-center">
								<div className="bg-black bg-opacity-80 rounded-xl px-8 py-12">
									<h2
										className="text-4xl md:text-5xl font-extrabold text-yellow-400 text-center mb-10"
										style={{ textShadow: "0 2px 8px #000" }}
									>
										All Results Revealed!
									</h2>
									<button
										className="mt-8 bg-yellow-400 hover:bg-yellow-500 text-black font-bold text-2xl px-10 py-4 rounded-lg shadow-lg transition-all"
										onClick={handleFinish}
									>
										Finish
									</button>
								</div>
							</div>
						</div>
					)}

				{/* Only show results sections if results have been revealed */}
				{resultsRevealed && allTeamsCompleted && (
					<>
						{/* Winner Card */}
						{winner && (
							<motion.div
								initial={{ opacity: 0, scale: 0.95 }}
								animate={{ opacity: 1, scale: 1 }}
								transition={{ duration: 0.6, delay: 0.3 }}
								className="mb-8"
							>
								<Card className="bg-yellow-50 border-yellow-300 shadow-lg cursor-pointer hover:shadow-xl transition-all">
									<CardHeader className="flex flex-row items-center justify-between">
										<CardTitle className="text-gray-800 flex items-center gap-2">
											<Trophy className="w-5 h-5 text-yellow-500" />{" "}
											Winner
										</CardTitle>
										<Button
											variant="ghost"
											size="icon"
											onClick={() =>
												setSelectedTeam(winner)
											}
										></Button>
									</CardHeader>
									<CardContent className="space-y-2">
										<div className="flex flex-col gap-1">
											<span className="text-lg font-bold text-gray-800">
												{winner.teamName}
											</span>
											<span className="text-xs text-gray-600">
												Marshal: {winner.marshalName}
											</span>
											<span className="text-xs text-gray-600">
												Total Time:{" "}
												<span className="font-semibold text-yellow-800">
													{formatHMS(
														winner.totalTime
													)}
												</span>
											</span>
										</div>
										<Badge className="bg-yellow-300 text-yellow-900 border-yellow-400">
											1st Place
										</Badge>
									</CardContent>
								</Card>
							</motion.div>
						)}
						{/* Bar Chart of Teams */}
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.6, delay: 0.4 }}
							className="mb-8"
						>
							<Card className="bg-white border-gray-200 shadow-lg">
								<CardHeader>
									<CardTitle className="text-gray-800 flex items-center gap-2">
										<Trophy className="w-5 h-5" />
										Team Times
										<Badge
											className={`ml-2 ${
												wsConnected
													? "bg-green-100 text-green-800 border-green-300"
													: "bg-yellow-100 text-yellow-800 border-yellow-300"
											}`}
										>
											{wsConnected
												? "Real-time"
												: "Polling"}
										</Badge>
									</CardTitle>
								</CardHeader>
								<CardContent>
									{loading && teams.length === 0 ? (
										<div className="flex flex-col items-center justify-center h-72">
											<svg
												className="animate-spin h-10 w-10 text-yellow-400 mb-2"
												xmlns="http://www.w3.org/2000/svg"
												fill="none"
												viewBox="0 0 24 24"
											>
												<circle
													className="opacity-25"
													cx="12"
													cy="12"
													r="10"
													stroke="currentColor"
													strokeWidth="4"
												></circle>
												<path
													className="opacity-75"
													fill="currentColor"
													d="M4 12a8 8 0 018-8v8z"
												></path>
											</svg>
											<span className="text-yellow-500 font-semibold">
												Loading...
											</span>
										</div>
									) : teams.length > 0 ? (
										<div className="h-72 w-full">
											<Bar
												data={barData}
												options={barOptions}
											/>
										</div>
									) : (
										<div className="flex flex-col items-center justify-center h-72">
											<span className="text-gray-500 font-semibold">
												No teams data yet
											</span>
										</div>
									)}
								</CardContent>
							</Card>
						</motion.div>
						{/* Leaderboard Section */}
						<motion.div
							initial={{ opacity: 0, scale: 0.95 }}
							animate={{ opacity: 1, scale: 1 }}
							transition={{ duration: 0.6, delay: 0.5 }}
							className="mb-8 relative"
						>
							<Card className="bg-white border-gray-200 shadow-lg">
								<CardHeader>
									<CardTitle className="text-gray-800 flex items-center gap-2">
										<Trophy className="w-5 h-5" />
										Leaderboard
										<Badge
											className={`ml-2 ${
												wsConnected
													? "bg-green-100 text-green-800 border-green-300"
													: "bg-yellow-100 text-yellow-800 border-yellow-300"
											}`}
										>
											{wsConnected
												? "Real-time"
												: "Polling"}
										</Badge>
									</CardTitle>
								</CardHeader>
								<CardContent className="space-y-4">
									<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
										{sortedCompleted
											.slice()
											.reverse()
											.map((team, idx, arr) => {
												const place = arr.length - idx;
												let placeLabel = `${place}th`;
												if (place === 1)
													placeLabel = "1st";
												else if (place === 2)
													placeLabel = "2nd";
												else if (place === 3)
													placeLabel = "3rd";
												return (
													<motion.div
														key={team.username}
														initial={{
															opacity: 0,
															y: 40,
														}}
														animate={{
															opacity: 1,
															y: 0,
														}}
														transition={{
															delay:
																0.6 + idx * 0.4,
														}}
													>
														<Card className="bg-blue-50 border-blue-300 cursor-pointer hover:shadow-xl transition-all">
															<CardContent className="p-3">
																<div className="flex items-center justify-between">
																	<div className="flex flex-col gap-1">
																		<span className="text-lg font-bold text-gray-800">
																			{
																				team.teamName
																			}
																		</span>
																		<span className="text-xs text-gray-600">
																			Marshal:{" "}
																			{
																				team.marshalName
																			}
																		</span>
																		<span className="text-xs text-gray-600">
																			Total
																			Time:{" "}
																			<span className="font-semibold text-blue-800">
																				{formatHMS(
																					team.totalTime
																				)}
																			</span>
																		</span>
																	</div>
																	<Button
																		variant="outline"
																		size="sm"
																		className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold"
																		onClick={() => {
																			setLeaderboardModalTeam(
																				team
																			);
																			setLeaderboardModalOpen(
																				true
																			);
																		}}
																	>
																		Details
																	</Button>
																</div>
																<Badge
																	className={`mt-2 px-3 py-1 text-sm font-semibold ${
																		place ===
																		1
																			? "bg-yellow-300 text-yellow-900 border-yellow-400"
																			: place ===
																			  2
																			? "bg-gray-300 text-gray-900 border-gray-400"
																			: place ===
																			  3
																			? "bg-orange-300 text-orange-900 border-orange-400"
																			: "bg-blue-100 text-blue-800 border-blue-300"
																	}`}
																>
																	{placeLabel}
																</Badge>
															</CardContent>
														</Card>
													</motion.div>
												);
											})}
									</div>
									{/* New Year Sparks Animation */}
									<SparksAnimation />
								</CardContent>
							</Card>
						</motion.div>
					</>
				)}

				{/* In Progress Teams */}
				{inProgressTeams.map((team) => (
					<Card
						key={team.username}
						className="bg-gray-50 border-gray-200 cursor-pointer hover:shadow-xl transition-all"
					>
						<CardContent className="p-3">
							<div className="flex items-center justify-between">
								<div className="flex flex-col gap-1">
									<span className="text-lg font-bold text-gray-800">
										{team.teamName}
									</span>
									<span className="text-xs text-gray-600">
										Marshal: {team.marshalName}
									</span>
									<span className="text-xs text-gray-600">
										Total Time:{" "}
										<span className="font-semibold text-gray-500">
											On Progress
										</span>
									</span>
								</div>
								<button
									className="p-2 rounded-full hover:bg-gray-200 focus:outline-none"
									onClick={() =>
										handleShowProgressModal(team)
									}
								>
									<MoreVertical className="w-6 h-6 text-gray-600" />
								</button>
							</div>
							<Badge className="mt-2 px-3 py-1 text-sm font-semibold bg-gray-300 text-gray-700 border-gray-400">
								On Progress
							</Badge>
						</CardContent>
					</Card>
				))}
			</div>
			<Dialog open={notifOpen} onOpenChange={setNotifOpen}>
				<DialogContent className="max-w-2xl">
					<DialogHeader>
						<DialogTitle>Edit Requests</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						{/* Pending Edit Requests */}
						{teams
							.flatMap((team) =>
								team.gameProgress && team.gameProgress.games
									? team.gameProgress.games.map(
											(game: any, idx: number) => ({
												team,
												game,
												idx,
											})
									  )
									: []
							)
							.filter(({ game }) => game.editRequested).length ===
						0 ? (
							<p className="text-gray-600">
								No edit requests at the moment.
							</p>
						) : (
							teams
								.flatMap((team) =>
									team.gameProgress && team.gameProgress.games
										? team.gameProgress.games.map(
												(game: any, idx: number) => ({
													team,
													game,
													idx,
												})
										  )
										: []
								)
								.filter(({ game }) => game.editRequested)
								.map(({ team, game, idx }) => (
									<div
										key={team.username + game.name}
										className="flex items-center justify-between border-b pb-2"
									>
										<div>
											<p className="font-semibold text-gray-800">
												{game.name} ({team.teamName})
											</p>
											<p className="text-xs text-gray-600">
												Marshal: {team.marshalName}
											</p>
										</div>
										<Button
											size="sm"
											className="bg-yellow-400 hover:bg-yellow-500 text-black"
											onClick={async () => {
												await fetch(
													"/api/save-team-record",
													{
														method: "POST",
														headers: {
															"Content-Type":
																"application/json",
														},
														body: JSON.stringify({
															teamId: team.username,
															data: team,
															editAction:
																"allowEdit",
															gameIndex: idx,
														}),
													}
												);
												toast({
													title: "Edit Allowed",
													description: `Edit allowed for ${game.name} (${team.teamName})`,
													className:
														"bg-green-100 text-green-800 border-green-300",
													duration: 2000,
												});
												setNotifOpen(false);
												await fetchTeams();
											}}
										>
											Allow Edit
										</Button>
									</div>
								))
						)}

						{/* Pending Edits to Accept */}
						{teams
							.flatMap((team) =>
								team.gameProgress && team.gameProgress.games
									? team.gameProgress.games.map(
											(game: any, idx: number) => ({
												team,
												game,
												idx,
											})
									  )
									: []
							)
							.filter(({ game }) => game.editPending).length >
							0 && (
							<div className="mt-6">
								<h4 className="font-bold text-blue-800 mb-2">
									Edits Pending Review
								</h4>
								{teams
									.flatMap((team) =>
										team.gameProgress &&
										team.gameProgress.games
											? team.gameProgress.games.map(
													(
														game: any,
														idx: number
													) => ({ team, game, idx })
											  )
											: []
									)
									.filter(({ game }) => game.editPending)
									.map(({ team, game, idx }) => (
										<div
											key={
												team.username +
												game.name +
												"pending"
											}
											className="flex items-center justify-between border-b pb-2"
										>
											<div>
												<p className="font-semibold text-gray-800">
													{game.name} ({team.teamName}
													)
												</p>
												<p className="text-xs text-gray-600">
													Marshal: {team.marshalName}
												</p>
												<p className="text-xs text-blue-700">
													New Time:{" "}
													<span className="font-bold">
														{formatMMSS(
															game.time || 0
														)}
													</span>
												</p>
											</div>
											<Button
												size="sm"
												className="bg-blue-400 hover:bg-blue-500 text-white"
												onClick={async () => {
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
																	teamId: team.username,
																	data: team,
																	editAction:
																		"acceptEdit",
																	gameIndex:
																		idx,
																}
															),
														}
													);
													toast({
														title: "Edit Accepted",
														description: `New time for ${game.name} (${team.teamName}) accepted!`,
														className:
															"bg-blue-100 text-blue-800 border-blue-300",
														duration: 2000,
													});
													setNotifOpen(false);
													await fetchTeams();
												}}
											>
												Accept Edit
											</Button>
										</div>
									))}
							</div>
						)}
					</div>
				</DialogContent>
			</Dialog>
			{/* Leaderboard Details Modal */}
			{leaderboardModalTeam && (
				<Dialog
					open={leaderboardModalOpen}
					onOpenChange={() => setLeaderboardModalOpen(false)}
				>
					<DialogContent
						className="bg-white/95 border-none text-gray-800 rounded-2xl shadow-2xl p-0 sm:p-8 w-full max-w-5xl max-h-[90vh] overflow-y-auto"
						style={{ backdropFilter: "blur(6px)" }}
					>
						<DialogHeader className="w-full flex flex-col items-center">
							<DialogTitle className="text-3xl font-extrabold text-center flex items-center justify-center gap-2 text-gray-900 mb-2 tracking-tight">
								🎉 Competition Results 🎉
							</DialogTitle>
						</DialogHeader>
						<div className="w-full px-2 sm:px-8 text-center mb-4">
							<p className="text-lg text-gray-600 font-medium">
								Team:{" "}
								<span className="font-bold text-gray-900">
									{leaderboardModalTeam.teamName}
								</span>{" "}
								| Marshal:{" "}
								<span className="font-bold text-gray-900">
									{leaderboardModalTeam.marshalName}
								</span>
							</p>
							<p className="text-2xl font-bold text-yellow-600 mt-2">
								Total Time:{" "}
								{formatHMS(leaderboardModalTeam.totalTime)}
							</p>
						</div>
						{/* Animated Game Breakdown */}
						<div className="mb-8 w-full">
							<h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
								Game Breakdown
							</h2>
							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
								{(
									leaderboardModalTeam.gameProgress?.games ||
									[]
								).map(
									(game: any, index: number, arr: any[]) => {
										const place = arr.length - index;
										let placeLabel = `${place}th`;
										if (place === 1) placeLabel = "1st";
										else if (place === 2)
											placeLabel = "2nd";
										else if (place === 3)
											placeLabel = "3rd";
										return (
											<motion.div
												key={game.name}
												initial={{ opacity: 0, y: 40 }}
												animate={{ opacity: 1, y: 0 }}
												transition={{
													delay: 0.6 + index * 0.4,
												}}
											>
												<Card className="bg-gray-50 border-0 shadow-md hover:bg-gray-100 transition-all rounded-xl">
													<CardHeader className="p-4 flex flex-row items-center justify-between">
														<CardTitle className="text-gray-800 flex items-center gap-2 text-lg font-semibold">
															<span className="text-2xl">
																{game.icon}
															</span>
															{game.name}
														</CardTitle>
														{/* Removed place/rank Badge */}
													</CardHeader>
													<CardContent className="p-4 space-y-3">
														<div className="flex items-center justify-between text-sm">
															<span className="text-gray-600">
																Final Time:
															</span>
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
																<Badge
																	variant="secondary"
																	className="bg-green-100 text-green-800 border-green-300"
																>
																	{game.details &&
																	typeof game
																		.details
																		.finalScore ===
																		"number"
																		? formatHMS(
																				game
																					.details
																					.finalScore
																		  )
																		: formatHMS(
																				game.time ||
																					0
																		  )}
																</Badge>
															)}
														</div>
														<div className="flex items-center justify-between text-sm">
															<span className="text-gray-600">
																Score:
															</span>
															<Badge
																variant="secondary"
																className="bg-yellow-100 text-yellow-800 border-yellow-300"
															>
																{game.score}
															</Badge>
														</div>
														{game.completedAt && (
															<div className="flex items-center justify-between text-sm">
																<span className="text-gray-600">
																	Completed
																	At:
																</span>
																<Badge
																	variant="secondary"
																	className="bg-yellow-100 text-yellow-800 border-yellow-300"
																>
																	{
																		game.completedAt
																	}
																</Badge>
															</div>
														)}
														{game.name ===
															"Office Chair Race" &&
															game.details && (
																<></>
															)}
														{game.details &&
															index < 2 && (
																<div className="space-y-1 mt-2">
																	<div className="flex items-center justify-between text-sm">
																		<span className="text-gray-600">
																			Bonus
																			Seconds:
																		</span>
																		<Badge
																			variant="secondary"
																			className="bg-yellow-100 text-yellow-800 border-yellow-300"
																		>
																			{
																				game
																					.details
																					.bonusSeconds
																			}
																		</Badge>
																	</div>
																	<div className="flex items-center justify-between text-sm">
																		<span className="text-gray-600">
																			Penalty
																			Seconds:
																		</span>
																		<Badge
																			variant="secondary"
																			className="bg-yellow-100 text-yellow-800 border-yellow-300"
																		>
																			{
																				game
																					.details
																					.penaltySeconds
																			}
																		</Badge>
																	</div>
																	<div className="flex items-center justify-between text-sm">
																		<span className="text-gray-600">
																			Creativity
																			Bonus:
																		</span>
																		<Badge
																			variant="secondary"
																			className="bg-yellow-100 text-yellow-800 border-yellow-300"
																		>
																			{game
																				.details
																				.creativityBonus
																				? "Yes"
																				: "No"}
																		</Badge>
																	</div>
																</div>
															)}
													</CardContent>
												</Card>
											</motion.div>
										);
									}
								)}
							</div>
							{/* New Year Sparks Animation (client only) */}
							<SparksAnimation />
						</div>
					</DialogContent>
				</Dialog>
			)}
			{/* Progress Modal */}
			<Dialog
				open={progressModalOpen}
				onOpenChange={setProgressModalOpen}
			>
				<DialogContent className="max-w-lg w-full p-0 sm:p-6 rounded-2xl shadow-2xl bg-white/95 border-none">
					<DialogHeader>
						<DialogTitle className="text-2xl font-bold flex items-center justify-center gap-2 text-gray-900 mb-4">
							<Users className="w-7 h-7 text-yellow-500" /> Team
							Details
						</DialogTitle>
					</DialogHeader>
					{progressModalLoading ? (
						<div className="flex flex-col items-center justify-center min-h-[200px]">
							<span className="text-yellow-500 font-semibold text-lg">
								Loading...
							</span>
						</div>
					) : progressModalData &&
					  progressModalData.gameProgress &&
					  Array.isArray(progressModalData.gameProgress.games) &&
					  progressModalData.gameProgress.games.length > 0 ? (
						<div className="px-4 pb-6 w-full">
							<div className="mb-4 flex flex-col gap-2 items-start">
								<div className="flex items-center gap-2">
									<Users className="w-5 h-5 text-blue-500" />
									<span className="font-bold text-lg text-gray-800">
										Team Name:
									</span>
									<span className="font-semibold text-gray-900">
										{progressModalData.teamName}
									</span>
								</div>
								<div className="flex items-center gap-2">
									<User className="w-5 h-5 text-green-600" />
									<span className="font-bold text-lg text-gray-800">
										Marshal Name:
									</span>
									<span className="font-semibold text-gray-900">
										{progressModalData.marshalName}
									</span>
								</div>
								<div className="flex items-center gap-2">
									<Clock className="w-5 h-5 text-yellow-600" />
									<span className="font-bold text-lg text-gray-800">
										Total Time:
									</span>

									<span className="font-semibold text-yellow-700">
										{formatHMS(totalFinalTime)}
									</span>
								</div>
							</div>
							<div className="mt-4">
								<h3 className="text-base font-semibold text-gray-700 mb-2">
									Game Results:
								</h3>
								<div className="flex flex-col gap-2">
									{progressModalData.gameProgress.games.map(
										(game: any, idx: number) => {
											// Icon mapping for each game
											const iconMap: Record<
												string,
												React.ReactNode
											> = {
												"House of Cards": (
													<span className="text-2xl">
														🏠
													</span>
												),
												"Office Chair Race": (
													<span className="text-2xl">
														🪑
													</span>
												),
												"Around the Clock": (
													<span className="text-2xl">
														🕐
													</span>
												),
												"Pass the Spud": (
													<span className="text-2xl">
														🥔
													</span>
												),
												"Skin the Snake": (
													<span className="text-2xl">
														🐍
													</span>
												),
											};
											const penaltySeconds = game.details
												?.penaltySeconds
												? game.details.penaltySeconds *
												  5
												: 0;
											return (
												<motion.div
													key={game.name}
													initial={{
														opacity: 0,
														x: 40,
													}}
													animate={{
														opacity: 1,
														x: 0,
													}}
													transition={{
														delay: 0.1 * idx,
													}}
													className="flex flex-col gap-1"
												>
													<div className="flex items-center justify-between bg-gray-100 rounded-lg px-3 py-2">
														<span className="flex items-center gap-2 font-semibold text-gray-700">
															{iconMap[
																game.name
															] || (
																<Trophy className="w-5 h-5 text-gray-400" />
															)}{" "}
															{game.name}:
														</span>
														<span
															className={`font-mono font-bold ${
																game.time &&
																game.time > 0
																	? "text-green-600"
																	: "text-yellow-500"
															}`}
														>
															{(() => {
																if (
																	game.details &&
																	game.details
																		.finalScore >
																		0
																) {
																	return formatHMS(
																		game
																			.details
																			.finalScore
																	);
																} else if (
																	game.time &&
																	game.time >
																		0
																) {
																	return (
																		game.timeFormatted ||
																		formatMMSS(
																			game.time
																		)
																	);
																} else {
																	return "On Progress";
																}
															})()}
															{penaltySeconds >
																0 && (
																<span className="text-red-600 font-normal ml-2">
																	+
																	{
																		penaltySeconds
																	}
																	s penalty
																</span>
															)}
														</span>
													</div>
												</motion.div>
											);
										}
									)}
								</div>
							</div>
						</div>
					) : (
						<div className="flex flex-col items-center justify-center min-h-[200px]">
							<span className="text-gray-500 font-semibold text-lg">
								On Progress
							</span>
						</div>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}
