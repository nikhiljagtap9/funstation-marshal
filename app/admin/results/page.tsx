"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import SparksAnimation from "@/components/sparks-animation";
import GameCompletionAnimation from "@/components/game-completion-animation";
import NewYearAnimation from "@/components/new-year-animation";

interface TeamData {
	username: string;
	marshalName: string;
	teamName: string;
	totalTime: number;
	// groupName?: string;
}

export default function AdminResultsReveal() {
	const [teams, setTeams] = useState<TeamData[]>([]);
	const [loading, setLoading] = useState(true);
	const [step, setStep] = useState<"splash" | "team" | "final">("splash");
	const [currentIdx, setCurrentIdx] = useState(0);
	const [showSparks, setShowSparks] = useState(false);
	const [showRevealAnimation, setShowRevealAnimation] = useState(false);
	const router = useRouter();

	useEffect(() => {
		// Placeholder: fetch teams from API (should match dashboard logic)
		async function fetchTeams() {
			setLoading(true);
			const res = await fetch("/api/list-users");
			const users = await res.json();
			// For demo, just use teamName and totalTime
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
				};
			});
			let teamsData = (await Promise.all(teamPromises)).filter(
				Boolean
			) as TeamData[];
			teamsData = teamsData.sort((a, b) => a.totalTime - b.totalTime); // shortest first
			setTeams(teamsData);
			setLoading(false);
		}
		fetchTeams();
	}, []);

	useEffect(() => {
		if (step === "final") {
			const timer = setTimeout(() => {
				handleFinish();
			}, 4000);
			return () => clearTimeout(timer);
		}
	}, [step]);

	// Reveal order: last place to first
	const revealOrder = [...teams].reverse();
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

	const handleNext = () => {
		// Trigger sparks animation
		setShowSparks(true);
		setTimeout(() => setShowSparks(false), 2000); // Hide after 2 seconds

		if (step === "splash") {
			setStep("team");
			setCurrentIdx(0);
		} else if (step === "team") {
			setShowRevealAnimation(true);
			setTimeout(() => {
				setShowRevealAnimation(false);
				if (currentIdx < revealOrder.length - 1) {
					setCurrentIdx(currentIdx + 1);
				} else {
					setStep("final");
				}
			}, 2000);
		}
	};

	const handleFinish = async () => {
		try {
			// Save to cloud storage
			await fetch("/api/save-admin-settings", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ resultsRevealed: true }),
			});
		} catch (error) {
			console.error("Failed to save admin settings:", error);
		}
		router.push("/admin/dashboard");
	};

	return (
		<div className="min-h-screen w-full bg-black flex flex-col items-center justify-center relative px-2">
			<SparksAnimation />
			{showSparks && (
				<div className="absolute inset-0 z-20">
					<SparksAnimation />
				</div>
			)}
			<div className="absolute inset-0 flex flex-col items-center justify-center z-10">
				<AnimatePresence mode="wait">
					{step === "splash" && (
						<motion.div
							key="splash"
							initial={{ opacity: 0, scale: 0.95 }}
							animate={{ opacity: 1, scale: 1 }}
							exit={{ opacity: 0, scale: 0.95 }}
							transition={{ duration: 0.5 }}
							className="bg-black bg-opacity-80 rounded-xl px-4 py-10 md:px-8 md:py-16 flex flex-col items-center w-full max-w-xl"
						>
							<h1
								className="text-3xl md:text-5xl font-extrabold text-yellow-400 text-center mb-10"
								style={{ textShadow: "0 2px 8px #000" }}
							>
								Are you ready to see the results
							</h1>
							<button
								className="mt-8 bg-yellow-400 hover:bg-yellow-500 text-black font-bold text-xl md:text-2xl px-8 py-3 md:px-10 md:py-4 rounded-lg shadow-lg transition-all w-full max-w-xs"
								onClick={handleNext}
							>
								Next &rarr;
							</button>
						</motion.div>
					)}
					{step === "team" && !loading && revealOrder[currentIdx] && (
						<>
							{showRevealAnimation && <GameCompletionAnimation />}
							<motion.div
								key={revealOrder[currentIdx].username}
								initial={{ opacity: 0, y: 40 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -40 }}
								transition={{ duration: 0.5 }}
								className="bg-black bg-opacity-80 rounded-xl px-4 py-10 md:px-8 md:py-16 flex flex-col items-center w-full max-w-xl"
								style={{
									pointerEvents: showRevealAnimation
										? "none"
										: "auto",
									opacity: showRevealAnimation ? 0.3 : 1,
								}}
							>
								<h2
									className="text-5xl md:text-8xl font-extrabold text-orange-500 text-center mb-6"
									style={{ textShadow: "0 2px 8px #000" }}
								>
									CONGRATULATIONS
								</h2>
								<h3
									className="text-2xl md:text-4xl lg:text-5xl font-extrabold text-yellow-400 text-center mb-2"
									style={{ textShadow: "0 2px 8px #000" }}
								>
									{revealOrder[
										currentIdx
									].teamName.toUpperCase()}{" "}
									-{" "}
									{placeLabels[
										revealOrder.length - 1 - currentIdx
									] ||
										`${
											revealOrder.length - currentIdx
										}TH PLACE`}
								</h3>
								<button
									className="mt-8 bg-yellow-400 hover:bg-yellow-500 text-black font-bold text-xl md:text-2xl px-8 py-3 md:px-10 md:py-4 rounded-lg shadow-lg transition-all w-full max-w-xs"
									onClick={handleNext}
									disabled={showRevealAnimation}
								>
									{currentIdx === revealOrder.length - 1
										? "Finish"
										: "Next →"}
								</button>
							</motion.div>
						</>
					)}
					{step === "final" && (
						<>
							<NewYearAnimation
								message="🎉 All Results Revealed! 🎉"
								subtitle="Thank you for an FUNTASTIC Competition!"
								duration={4000}
							/>
							<motion.div
								key="final"
								initial={{ opacity: 0, scale: 0.95 }}
								animate={{ opacity: 1, scale: 1 }}
								exit={{ opacity: 0, scale: 0.95 }}
								transition={{ duration: 0.5 }}
								className="bg-black bg-opacity-80 rounded-xl px-4 py-10 md:px-8 md:py-16 flex flex-col items-center w-full max-w-xl z-20"
							>
								<h2
									className="text-2xl md:text-4xl font-extrabold text-yellow-400 text-center mb-10"
									style={{ textShadow: "0 2px 8px #000" }}
								>
									All Results Revealed!
								</h2>
								<button
									className="mt-8 bg-yellow-400 hover:bg-yellow-500 text-black font-bold text-xl md:text-2xl px-8 py-3 md:px-10 md:py-4 rounded-lg shadow-lg transition-all w-full max-w-xs"
									onClick={handleFinish}
								>
									Finish
								</button>
							</motion.div>
						</>
					)}
				</AnimatePresence>
			</div>
		</div>
	);
}
