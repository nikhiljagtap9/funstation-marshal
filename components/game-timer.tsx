"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Label } from "./ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./ui/select";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { useToast } from "../hooks/use-toast";
import { Clock, Trophy, Plus, Minus, Lock, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "./ui/alert";

interface GameTimerProps {
	game: {
		name: string;
		icon: string;
		description: string;
	};
	gameIndex: number;
	onComplete: (time: number, bonusSeconds: number, details: any) => void;
	canPlay: boolean;
}

export default function GameTimer({
	game,
	gameIndex,
	onComplete,
	canPlay,
}: GameTimerProps) {
	const [minutes, setMinutes] = useState(0);
	const [seconds, setSeconds] = useState(0);
	const [penaltySeconds, setPenaltySeconds] = useState(0);
	const [creativityBonus, setCreativityBonus] = useState(false);
	const [winnerStatus, setWinnerStatus] = useState<string>("");
	const [calculatedTime, setCalculatedTime] = useState(0);
	const { toast } = useToast();

	// Clear all data when game changes
	useEffect(() => {
		setMinutes(0);
		setSeconds(0);
		setPenaltySeconds(0);
		setCreativityBonus(false);
		setWinnerStatus("");
		setCalculatedTime(0);
	}, [gameIndex, game.name]); // Reset when game changes

	// Auto-calculate final time whenever inputs change
	useEffect(() => {
		const baseTime = minutes * 60 + seconds;
		let adjustments = 0;

		if (gameIndex === 0) {
			// House of Cards - Updated bonus system with 5th place (2 minutes)
			if (creativityBonus) {
				adjustments -= 15; // Creativity bonus removes 15 seconds
			}

			// Winner bonus system: 1st gets 1:00, 2nd gets 1:15, 3rd gets 1:30, 4th gets 1:45, 5th gets 2:00
			if (winnerStatus === "first") {
				adjustments += 60; // 1st place gets 1:00 added
			} else if (winnerStatus === "second") {
				adjustments += 75; // 2nd place gets 1:15 added
			} else if (winnerStatus === "third") {
				adjustments += 90; // 3rd place gets 1:30 added
			} else if (winnerStatus === "fourth") {
				adjustments += 105; // 4th place gets 1:45 added
			} else if (winnerStatus === "fifth") {
				adjustments += 120; // 5th place gets 2:00 added
			}
		} else if (gameIndex === 1) {
			// Office Chair Race
			adjustments += penaltySeconds * 5; // Each mistake adds 5 seconds
		}

		setCalculatedTime(Math.max(0, baseTime + adjustments));
	}, [
		minutes,
		seconds,
		penaltySeconds,
		creativityBonus,
		winnerStatus,
		gameIndex,
	]);

	// House of Cards: Only handle bonus and position, no time
	if (gameIndex === 0) {
		// Calculate House of Cards time based on options
		let baseTime = 0;
		let adjustments = 0;
		if (creativityBonus) adjustments -= 15;
		if (winnerStatus === "first") adjustments += 60;
		else if (winnerStatus === "second") adjustments += 75;
		else if (winnerStatus === "third") adjustments += 90;
		const houseOfCardsTime = Math.max(0, baseTime + adjustments);

		const handleCompleteHouseOfCards = () => {
			if (!canPlay) {
				toast({
					title: "Game Locked",
					description: "Please complete the previous game first.",
					variant: "destructive",
					duration: 4000,
				});
				return;
			}
			if (!winnerStatus) {
				toast({
					title: "Missing Team Position",
					description:
						"Please select the team's position before completing the game.",
					variant: "destructive",
					duration: 4000,
				});
				return;
			}
			// No time validation, just pass calculated time
			const details = {
				penaltySeconds: 0,
				creativityBonus,
				winnerStatus,
				bonusSeconds: adjustments,
			};
			toast({
				title: "Game Completed!",
				description: `${game.name} completed!`,
				duration: 2000,
			});
			setTimeout(() => {
				onComplete(houseOfCardsTime, 0, details);
			}, 1000);
		};
		return (
			<Card className="bg-white border-gray-200 shadow-lg">
				<CardHeader>
					<CardTitle className="text-gray-800 flex items-center gap-2">
						<span className="text-2xl">{game.icon}</span>
						{game.name}
					</CardTitle>
					<p className="text-gray-600">{game.description}</p>
				</CardHeader>
				<CardContent className="space-y-6">
					<div className="space-y-6">
						{/* Creativity Bonus */}
						<div className="space-y-3">
							<div className="flex items-center space-x-2">
								<input
									type="checkbox"
									id="creativity"
									checked={creativityBonus}
									onChange={(e) =>
										setCreativityBonus(e.target.checked)
									}
									className="rounded accent-yellow-400"
								/>
								<Label
									htmlFor="creativity"
									className="text-gray-700"
								>
									Creativity Bonus (-15 seconds)
								</Label>
							</div>
							<p className="text-sm text-gray-600">
								Check if the team built something creative and
								awesome
							</p>
						</div>

						{/* Winner Status */}
						<div className="space-y-3">
							<Label className="text-gray-700 font-medium">
								Team Position
							</Label>
							<RadioGroup
								value={winnerStatus}
								onValueChange={setWinnerStatus}
							>
								<div className="flex items-center space-x-2">
									<RadioGroupItem value="first" id="first" />
									<Label
										htmlFor="first"
										className="text-gray-700"
									>
										1st Place (+1:00 minute)
									</Label>
								</div>
								<div className="flex items-center space-x-2">
									<RadioGroupItem
										value="second"
										id="second"
									/>
									<Label
										htmlFor="second"
										className="text-gray-700"
									>
										2nd Place (+1:15 minutes)
									</Label>
								</div>
								<div className="flex items-center space-x-2">
									<RadioGroupItem value="third" id="third" />
									<Label
										htmlFor="third"
										className="text-gray-700"
									>
										3rd Place (+1:30 minutes)
									</Label>
								</div>
							</RadioGroup>
							<p className="text-sm text-gray-600">
								Position-based time adjustments for competitive
								scoring
							</p>
						</div>
					</div>
					{/* Show calculated time */}
					<div className="bg-gray-50 rounded-lg p-4 text-center border border-gray-200">
						<div className="flex items-center justify-center gap-2 mb-2">
							<Clock className="w-5 h-5 text-gray-700" />
							<span className="text-gray-700">Current Time</span>
						</div>
						<div className="text-3xl font-bold text-gray-800">
							{Math.floor(houseOfCardsTime / 60)
								.toString()
								.padStart(2, "0")}
							:
							{(houseOfCardsTime % 60)
								.toString()
								.padStart(2, "0")}
						</div>
						<div className="text-sm text-gray-600 mt-3 space-y-1">
							<div>
								Base Time:{" "}
								{`${minutes
									.toString()
									.padStart(2, "0")}:${seconds
									.toString()
									.padStart(2, "0")}`}
							</div>
							{creativityBonus && (
								<div className="text-green-600">
									Creativity Bonus: -15s
								</div>
							)}
							{winnerStatus === "first" && (
								<div className="text-blue-600">
									1st Place: +1:00
								</div>
							)}
							{winnerStatus === "second" && (
								<div className="text-orange-600">
									2nd Place: +1:15
								</div>
							)}
							{winnerStatus === "third" && (
								<div className="text-purple-600">
									3rd Place: +1:30
								</div>
							)}
							<div className="border-t pt-1 font-semibold">
								Final:{" "}
								{Math.floor(houseOfCardsTime / 60)
									.toString()
									.padStart(2, "0")}
								:
								{(houseOfCardsTime % 60)
									.toString()
									.padStart(2, "0")}
							</div>
						</div>
					</div>
					<Button
						onClick={handleCompleteHouseOfCards}
						className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-semibold"
						size="lg"
					>
						<Trophy className="w-5 h-5 mr-2" />
						Complete Game
					</Button>
				</CardContent>
			</Card>
		);
	}

	const handleComplete = () => {
		if (!canPlay) {
			toast({
				title: "Game Locked",
				description: "Please complete the previous game first.",
				variant: "destructive",
				duration: 4000,
			});
			return;
		}

		if (minutes === 0 && seconds === 0) {
			toast({
				title: "Invalid Time",
				description: "Please enter a valid completion time.",
				variant: "destructive",
				duration: 4000,
			});
			return;
		}

		if (minutes > 10) {
			toast({
				title: "Time Exceeded",
				description: "Game time cannot exceed 10 minutes.",
				variant: "destructive",
				duration: 4000,
			});
			return;
		}

		const details = {
			penaltySeconds,
			creativityBonus,
			winnerStatus,
			bonusSeconds: calculatedTime - (minutes * 60 + seconds),
		};

		toast({
			title: "Game Completed!",
			description: `${game.name} completed in ${Math.floor(
				calculatedTime / 60
			)}:${(calculatedTime % 60).toString().padStart(2, "0")}`,
			duration: 3000,
		});

		// Complete the game immediately without showing completion state
		setTimeout(() => {
			onComplete(calculatedTime, 0, details);
		}, 1000);
	};

	const getGameSpecificControls = () => {
		switch (gameIndex) {
			case 1: // Office Chair Race
				return (
					<div className="space-y-4">
						<div>
							<Label className="text-gray-700">
								Penalties (mistakes)
							</Label>
							<div className="flex items-center space-x-2 mt-2">
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={() =>
										setPenaltySeconds(
											Math.max(0, penaltySeconds - 1)
										)
									}
									className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
								>
									<Minus className="w-4 h-4" />
								</Button>
								<span className="text-gray-800 px-4 font-semibold">
									{penaltySeconds}
								</span>
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={() =>
										setPenaltySeconds(penaltySeconds + 1)
									}
									className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
								>
									<Plus className="w-4 h-4" />
								</Button>
							</div>
							<p className="text-sm text-gray-600 mt-1">
								Each mistake adds 5 seconds (+
								{penaltySeconds * 5}s total)
							</p>
						</div>
					</div>
				);

			default:
				return null;
		}
	};

	return (
		<Card className="bg-white border-gray-200 shadow-lg">
			<CardHeader>
				<CardTitle className="text-gray-800 flex items-center gap-2">
					<span className="text-2xl">{game.icon}</span>
					{game.name}
				</CardTitle>
				<p className="text-gray-600">{game.description}</p>
			</CardHeader>
			<CardContent className="space-y-6">
				{/* Time Input */}
				<div className="space-y-4">
					<Label className="text-gray-800 text-lg">
						Completion Time
					</Label>
					<div className="grid grid-cols-2 gap-4">
						<div>
							<Label className="text-gray-700">Minutes</Label>
							<Select
								value={minutes.toString()}
								onValueChange={(value) =>
									setMinutes(Number.parseInt(value))
								}
							>
								<SelectTrigger className="bg-white border-gray-300 text-gray-800 focus:border-yellow-400">
									<SelectValue />
								</SelectTrigger>
								<SelectContent className="bg-white border-gray-300">
									{Array.from({ length: 11 }, (_, i) => (
										<SelectItem
											key={i}
											value={i.toString()}
											className="text-gray-800 focus:bg-yellow-50"
										>
											{i}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div>
							<Label className="text-gray-700">Seconds</Label>
							<Select
								value={seconds.toString()}
								onValueChange={(value) =>
									setSeconds(Number.parseInt(value))
								}
								disabled={minutes === 10}
							>
								<SelectTrigger
									className={`bg-white border-gray-300 text-gray-800 focus:border-yellow-400 ${
										minutes === 10
											? "opacity-50 cursor-not-allowed"
											: ""
									}`}
								>
									<SelectValue />
								</SelectTrigger>
								<SelectContent className="bg-white border-gray-300">
									{minutes === 10 ? (
										<SelectItem
											key={0}
											value={"0"}
											className="text-gray-800 focus:bg-yellow-50"
											disabled
										>
											0
										</SelectItem>
									) : (
										Array.from({ length: 60 }, (_, i) => (
											<SelectItem
												key={i}
												value={i.toString()}
												className="text-gray-800 focus:bg-yellow-50"
											>
												{i}
											</SelectItem>
										))
									)}
								</SelectContent>
							</Select>
						</div>
					</div>
				</div>
				{getGameSpecificControls()}
				{/* Time Display with Auto-calculation */}
				<div className="bg-gray-50 rounded-lg p-4 text-center border border-gray-200">
					<div className="flex items-center justify-center gap-2 mb-2">
						<Clock className="w-5 h-5 text-gray-700" />
						<span className="text-gray-700">Current Time</span>
					</div>
					<div className="text-3xl font-bold text-gray-800">
						{Math.floor(calculatedTime / 60)
							.toString()
							.padStart(2, "0")}
						:{(calculatedTime % 60).toString().padStart(2, "0")}
					</div>
					{/* Show adjustments breakdown */}
					{(penaltySeconds !== 0 ||
						creativityBonus ||
						winnerStatus) && (
						<div className="text-sm text-gray-600 mt-3 space-y-1">
							<div>
								Base Time:{" "}
								{`${minutes
									.toString()
									.padStart(2, "0")}:${seconds
									.toString()
									.padStart(2, "0")}`}
							</div>
							{creativityBonus && (
								<div className="text-green-600">
									Creativity Bonus: -15s
								</div>
							)}
							{penaltySeconds > 0 && (
								<div className="text-red-600">
									Penalties: +{penaltySeconds * 5}s
								</div>
							)}
							{winnerStatus === "first" && (
								<div className="text-blue-600">
									1st Place: +1:00
								</div>
							)}
							{winnerStatus === "second" && (
								<div className="text-orange-600">
									2nd Place: +1:15
								</div>
							)}
							{winnerStatus === "third" && (
								<div className="text-purple-600">
									3rd Place: +1:30
								</div>
							)}
							<div className="border-t pt-1 font-semibold">
								Final:{" "}
								{Math.floor(calculatedTime / 60)
									.toString()
									.padStart(2, "0")}
								:
								{(calculatedTime % 60)
									.toString()
									.padStart(2, "0")}
							</div>
						</div>
					)}
				</div>
				<Button
					onClick={handleComplete}
					className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-semibold"
					size="lg"
				>
					<Trophy className="w-5 h-5 mr-2" />
					Complete Game
				</Button>
			</CardContent>
		</Card>
	);
}
