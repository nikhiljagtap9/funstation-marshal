"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
	Clock,
	Trophy,
	Star,
	Calendar,
	CheckCircle,
	Minus,
	Plus,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./ui/select";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";

interface GameDetailsModalProps {
	game: {
		name: string;
		icon: string;
		completed: boolean;
		time?: number;
		score?: number;
		completedAt?: string;
		details?: {
			bonusSeconds: number;
			penaltySeconds: number;
			creativityBonus: boolean;
			finalScore: number;
			winnerStatus?: string;
		};
	};
	isOpen: boolean;
	onClose: () => void;
	canEdit?: boolean;
	onEditSubmit?: (values: {
		time: number;
		score: number;
		bonusSeconds: number;
		penaltySeconds: number;
		creativityBonus: boolean;
		finalScore: number;
		winnerStatus?: string;
	}) => void;
}

export default function GameDetailsModal({
	game,
	isOpen,
	onClose,
	canEdit = false,
	onEditSubmit,
}: GameDetailsModalProps) {
	const [editValues, setEditValues] = useState({
		time: game.time || 0,
		score: game.score || 0,
		bonusSeconds: game.details?.bonusSeconds || 0,
		penaltySeconds: game.details?.penaltySeconds || 0,
		creativityBonus: !!game.details?.creativityBonus, // always boolean, default false
		finalScore: game.details?.finalScore || 0,
		winnerStatus: game.details?.winnerStatus || "",
		minutes: Math.floor((game.time || 0) / 60),
		seconds: (game.time || 0) % 60,
	});
	const [calculatedTime, setCalculatedTime] = useState(game.time || 0);

	useEffect(() => {
		if (!isOpen) return;
		setEditValues({
			time: game.time || 0,
			score: game.score || 0,
			bonusSeconds: game.details?.bonusSeconds || 0,
			penaltySeconds: game.details?.penaltySeconds || 0,
			creativityBonus: !!game.details?.creativityBonus, // always boolean, default false
			finalScore: game.details?.finalScore || 0,
			winnerStatus: game.details?.winnerStatus || "",
			minutes: Math.floor((game.time || 0) / 60),
			seconds: (game.time || 0) % 60,
		});
	}, [game, isOpen]);

	useEffect(() => {
		// Calculate time as in game-timer
		let baseTime = editValues.minutes * 60 + editValues.seconds;
		let adjustments = 0;
		if (game.name === "House of Cards") {
			if (editValues.creativityBonus) adjustments -= 15;
			if (editValues.winnerStatus === "first") adjustments += 60;
			else if (editValues.winnerStatus === "second") adjustments += 75;
			else if (editValues.winnerStatus === "third") adjustments += 90;
			else if (editValues.winnerStatus === "fourth") adjustments += 105;
			else if (editValues.winnerStatus === "fifth") adjustments += 120;
			setCalculatedTime(Math.max(0, baseTime + adjustments));
		} else if (game.name === "Office Chair Race") {
			setCalculatedTime(Math.max(0, baseTime)); // do not add penalties
		} else {
			setCalculatedTime(baseTime);
		}
	}, [editValues, game.name]);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value, type, checked } = e.target;
		setEditValues((prev) => ({
			...prev,
			[name]: type === "checkbox" ? checked : Number(value),
		}));
	};

	const handleRadioChange = (value: string) => {
		setEditValues((prev) => ({ ...prev, winnerStatus: value }));
	};

	const handleIncrement = (field: string) => {
		setEditValues((prev) => ({
			...prev,
			[field]: (prev as any)[field] + 1,
		}));
	};
	const handleDecrement = (field: string) => {
		setEditValues((prev) => ({
			...prev,
			[field]: Math.max(0, (prev as any)[field] - 1),
		}));
	};

	const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const { name, value } = e.target;
		if (name === "minutes" && Number(value) === 10) {
			setEditValues((prev) => ({ ...prev, minutes: 10, seconds: 0 }));
		} else {
			setEditValues((prev) => ({
				...prev,
				[name]: Math.max(0, Number(value)),
			}));
		}
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (onEditSubmit) {
			onEditSubmit({
				...editValues,
				time: calculatedTime,
				finalScore: calculatedTime,
			});
		}
	};

	const formatTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, "0")}`;
	};

	const formatDateTime = (isoString: string) => {
		const date = new Date(isoString);
		return date.toLocaleString();
	};

	// For House of Cards: highlight original creativity bonus and team position
	const originalCreativityBonus = game.details?.creativityBonus || false;
	const originalWinnerStatus = game.details?.winnerStatus || "";

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto bg-white border-gray-200 text-gray-800">
				<DialogHeader>
					<DialogTitle className="text-xl md:text-2xl font-bold text-center flex items-center justify-center gap-2 text-gray-800">
						<span className="text-2xl md:text-3xl">
							{game.icon}
						</span>
						{game.name} - Game Details
					</DialogTitle>
				</DialogHeader>
				{canEdit ? (
					<form onSubmit={handleSubmit} className="space-y-6">
						{game.name === "House of Cards" ? (
							<>
								<div className="mb-4">
									<label
										className={`flex items-center gap-2 text-base font-medium text-gray-700 ${
											originalCreativityBonus
												? "bg-yellow-100 border-2 border-yellow-400 rounded px-2 py-1"
												: ""
										}`}
									>
										<input
											type="checkbox"
											id="creativity"
											name="creativityBonus"
											checked={editValues.creativityBonus}
											onChange={handleChange}
											className="rounded accent-yellow-400"
										/>
										Creativity Bonus (-15 seconds)
									</label>
									<div className="text-sm text-gray-500 ml-6">
										Check if the team built something
										creative and awesome
									</div>
								</div>
								<div className="mb-4">
									<div className="font-semibold text-gray-700 mb-1">
										Team Position
									</div>
									<RadioGroup
										value={editValues.winnerStatus}
										onValueChange={handleRadioChange}
										className="flex flex-col gap-2"
									>
										<label
											className={`flex items-center gap-2 ${
												originalWinnerStatus === "first"
													? "bg-yellow-100 border-2 border-yellow-400 rounded px-2 py-1"
													: ""
											}`}
										>
											<RadioGroupItem
												value="first"
												id="first"
											/>
											1st Place (+1:00 minute)
										</label>
										<label
											className={`flex items-center gap-2 ${
												originalWinnerStatus ===
												"second"
													? "bg-yellow-100 border-2 border-yellow-400 rounded px-2 py-1"
													: ""
											}`}
										>
											<RadioGroupItem
												value="second"
												id="second"
											/>
											2nd Place (+1:15 minutes)
										</label>
										<label
											className={`flex items-center gap-2 ${
												originalWinnerStatus === "third"
													? "bg-yellow-100 border-2 border-yellow-400 rounded px-2 py-1"
													: ""
											}`}
										>
											<RadioGroupItem
												value="third"
												id="third"
											/>
											3rd Place (+1:30 minutes)
										</label>
									</RadioGroup>
									<div className="text-sm text-gray-500 ml-1 mt-1">
										Position-based time adjustments for
										competitive scoring
									</div>
								</div>
								{editValues.minutes === 10 ? (
									<div className="mb-4">
										<div className="bg-yellow-100 border-l-4 border-yellow-400 text-yellow-800 p-4 rounded-md text-center font-semibold">
											Maximum allowed time is 10:00.
										</div>
									</div>
								) : (
									<>
										<div className="mb-4">
											<div className="font-semibold text-gray-700 mb-1">
												Completion Time
											</div>
										</div>
									</>
								)}
								<div className="bg-gray-50 rounded-lg p-4 text-center border border-gray-200 mt-4">
									<div className="flex items-center justify-center gap-2 mb-2">
										<span className="text-gray-700">
											Current Time
										</span>
									</div>
									<div className="text-3xl font-bold text-gray-800 bg-yellow-100 border-2 border-yellow-400 rounded-lg px-8 py-3 shadow-sm">
										{Math.floor(calculatedTime / 60)
											.toString()
											.padStart(2, "0")}
										:
										{(calculatedTime % 60)
											.toString()
											.padStart(2, "0")}
									</div>
								</div>
							</>
						) : game.name === "Office Chair Race" ? (
							<>
								<div className="mb-4">
									<div className="font-semibold text-gray-700 mb-1">
										Completion Time
									</div>
									<div className="flex gap-4 items-end">
										<div>
											<label className="block text-sm font-medium text-gray-700">
												Minutes
											</label>
											<Select
												value={editValues.minutes.toString()}
												onValueChange={(value) =>
													setEditValues({
														...editValues,
														minutes: Number(value),
													})
												}
											>
												<SelectTrigger className="w-[180px]">
													<SelectValue placeholder="Select a minute" />
												</SelectTrigger>
												<SelectContent>
													{[...Array(11).keys()].map(
														(m) => (
															<SelectItem
																key={m}
																value={m.toString()}
															>
																{m}
															</SelectItem>
														)
													)}
												</SelectContent>
											</Select>
										</div>
										<div>
											<label className="block text-sm font-medium text-gray-700">
												Seconds
											</label>
											<Select
												value={editValues.seconds
													.toString()
													.padStart(2, "0")}
												onValueChange={(value) =>
													setEditValues({
														...editValues,
														seconds: Number(value),
													})
												}
											>
												<SelectTrigger className="w-[180px]">
													<SelectValue placeholder="Select a second" />
												</SelectTrigger>
												<SelectContent>
													{[...Array(60).keys()].map(
														(s) => (
															<SelectItem
																key={s}
																value={s
																	.toString()
																	.padStart(
																		2,
																		"0"
																	)}
															>
																{s
																	.toString()
																	.padStart(
																		2,
																		"0"
																	)}
															</SelectItem>
														)
													)}
												</SelectContent>
											</Select>
										</div>
										<div>
											<label className="block text-sm font-medium text-gray-700">
												Penalties (mistakes)
											</label>
											<div className="flex items-center space-x-2 mt-1">
												<Button
													type="button"
													variant="outline"
													size="sm"
													onClick={() =>
														handleDecrement(
															"penaltySeconds"
														)
													}
													disabled={
														calculatedTime >= 600 ||
														editValues.penaltySeconds <=
															0
													}
												>
													-
												</Button>
												<span className="text-gray-800 px-4 font-semibold">
													{editValues.penaltySeconds}
												</span>
												<Button
													type="button"
													variant="outline"
													size="sm"
													onClick={() =>
														handleIncrement(
															"penaltySeconds"
														)
													}
													disabled={
														calculatedTime >= 600
													}
												>
													+
												</Button>
											</div>
											<div className="text-sm text-gray-500 mt-1">
												Each mistake adds 5 seconds (+
												{editValues.penaltySeconds * 5}s
												total)
											</div>
										</div>
									</div>
								</div>
								<div className="bg-gray-50 rounded-lg p-4 text-center border border-gray-200 mt-4">
									<div className="flex items-center justify-center gap-2 mb-2">
										<span className="text-gray-700">
											Current Time
										</span>
									</div>
									<div className="text-3xl font-bold text-gray-800">
										{Math.floor(
											(editValues.minutes * 60 +
												editValues.seconds +
												editValues.penaltySeconds * 5) /
												60
										)
											.toString()
											.padStart(2, "0")}
										:
										{(
											(editValues.minutes * 60 +
												editValues.seconds +
												editValues.penaltySeconds * 5) %
											60
										)
											.toString()
											.padStart(2, "0")}
									</div>
								</div>
								{game.name === "Office Chair Race" &&
									editValues.penaltySeconds > 0 && (
										<>
											<div className="text-red-600 text-sm font-semibold mt-2">
												Penalties: +
												{editValues.penaltySeconds * 5}s
											</div>
											<div className="text-green-700 text-base font-bold mt-1">
												Final Score:{" "}
												{Math.floor(
													(editValues.minutes * 60 +
														editValues.seconds +
														editValues.penaltySeconds *
															5) /
														60
												)
													.toString()
													.padStart(2, "0")}
												:
												{(
													(editValues.minutes * 60 +
														editValues.seconds +
														editValues.penaltySeconds *
															5) %
													60
												)
													.toString()
													.padStart(2, "0")}
											</div>
										</>
									)}
							</>
						) : (
							<>
								{[
									"Around the Clock",
									"Pass the Spud",
									"Skin the Snake",
								].includes(game.name) &&
									(editValues.minutes > 10 ||
										(editValues.minutes === 10 &&
											editValues.seconds > 0)) && (
										<div className="mb-4">
											<div className="bg-yellow-100 border-l-4 border-yellow-400 text-yellow-800 p-4 rounded-md text-center font-semibold">
												Maximum allowed time is 10:00.
												Please select a valid time.
											</div>
										</div>
									)}
								<div className="mb-4">
									<div className="font-semibold text-gray-700 mb-1">
										Completion Time
									</div>
									<div className="flex gap-4 items-end">
										<div>
											<label className="block text-sm font-medium text-gray-700">
												Minutes
											</label>
											<Select
												onValueChange={(value) =>
													setEditValues((prev) => ({
														...prev,
														minutes: Number(value),
													}))
												}
												value={editValues.minutes.toString()}
											>
												<SelectTrigger className="w-[180px]">
													<SelectValue placeholder="Select a minute" />
												</SelectTrigger>
												<SelectContent>
													{[...Array(11).keys()].map(
														(m) => (
															<SelectItem
																key={m}
																value={m.toString()}
															>
																{m}
															</SelectItem>
														)
													)}
												</SelectContent>
											</Select>
										</div>
										<div>
											<label className="block text-sm font-medium text-gray-700">
												Seconds
											</label>
											<Select
												onValueChange={(value) =>
													setEditValues((prev) => ({
														...prev,
														seconds: Number(value),
													}))
												}
												value={editValues.seconds
													.toString()
													.padStart(2, "0")}
											>
												<SelectTrigger className="w-[180px]">
													<SelectValue placeholder="Select a second" />
												</SelectTrigger>
												<SelectContent>
													{[...Array(60).keys()].map(
														(s) => (
															<SelectItem
																key={s}
																value={s
																	.toString()
																	.padStart(
																		2,
																		"0"
																	)}
															>
																{s
																	.toString()
																	.padStart(
																		2,
																		"0"
																	)}
															</SelectItem>
														)
													)}
												</SelectContent>
											</Select>
										</div>
									</div>
								</div>
								<div className="bg-gray-50 rounded-lg p-4 text-center border border-gray-200 mt-4">
									<div className="flex items-center justify-center gap-2 mb-2">
										<span className="text-gray-700">
											Current Time
										</span>
									</div>
									<div className="text-3xl font-bold text-gray-800">
										{Math.floor(calculatedTime / 60)
											.toString()
											.padStart(2, "0")}
										:
										{(calculatedTime % 60)
											.toString()
											.padStart(2, "0")}
									</div>
								</div>
							</>
						)}
						<div className="flex justify-end mt-4">
							<Button
								type="submit"
								className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold px-6 py-2 rounded"
								disabled={
									editValues.minutes * 60 +
										editValues.seconds >
									600
								}
							>
								Submit Edit
							</Button>
						</div>
					</form>
				) : (
					<div className="space-y-4 md:space-y-6 p-2 md:p-4">
						{/* Status Badge */}
						<div className="text-center">
							<Badge className="bg-yellow-400 text-black font-semibold px-3 md:px-4 py-1 md:py-2">
								<CheckCircle className="w-3 h-3 md:w-4 md:h-4 mr-2" />
								Completed
							</Badge>
						</div>

						{/* Main Stats */}
						<div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
							<Card className="bg-gray-50 border-gray-200">
								<CardHeader className="pb-2">
									<CardTitle className="text-gray-800 flex items-center gap-2 text-base md:text-lg">
										<Clock className="w-4 h-4 md:w-5 md:h-5" />
										Final Time
									</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="text-2xl md:text-3xl font-bold text-gray-800">
										{Math.floor(
											(editValues.minutes * 60 +
												editValues.seconds +
												editValues.penaltySeconds * 5) /
												60
										)
											.toString()
											.padStart(2, "0")}
										:
										{(
											(editValues.minutes * 60 +
												editValues.seconds +
												editValues.penaltySeconds * 5) %
											60
										)
											.toString()
											.padStart(2, "0")}
									</div>
									<p className="text-xs md:text-sm text-gray-600 mt-1">
										Total completion time
									</p>
								</CardContent>
							</Card>

							<Card className="bg-gray-50 border-gray-200">
								<CardHeader className="pb-2">
									<CardTitle className="text-gray-800 flex items-center gap-2 text-base md:text-lg">
										<Trophy className="w-4 h-4 md:w-5 md:h-5" />
										Base Score
									</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="text-2xl md:text-3xl font-bold text-gray-800">
										{formatTime(game.score || 0)}
									</div>
									<p className="text-xs md:text-sm text-gray-600 mt-1">
										Original completion time
									</p>
								</CardContent>
							</Card>
						</div>

						{/* Completion Details */}
						{game.completedAt && (
							<Card className="bg-gray-50 border-gray-200">
								<CardHeader className="pb-2">
									<CardTitle className="text-gray-800 flex items-center gap-2 text-base md:text-lg">
										<Calendar className="w-4 h-4 md:w-5 md:h-5" />
										Completion Time
									</CardTitle>
								</CardHeader>
								<CardContent>
									<p className="text-sm md:text-base text-gray-600">
										{formatDateTime(game.completedAt)}
									</p>
								</CardContent>
							</Card>
						)}

						{/* Score Adjustments */}
						{game.details && (
							<Card className="bg-gray-50 border-gray-200">
								<CardHeader className="pb-2">
									<CardTitle className="text-gray-800 flex items-center gap-2 text-base md:text-lg">
										<Star className="w-4 h-4 md:w-5 md:h-5" />
										Score Adjustments
									</CardTitle>
								</CardHeader>
								<CardContent className="space-y-2 md:space-y-3">
									<div className="flex items-center justify-between">
										<span className="text-sm md:text-base text-gray-600">
											Base Time:
										</span>
										<span className="text-sm md:text-base text-gray-800 font-semibold">
											{formatTime(game.score || 0)}
										</span>
									</div>

									{game.details.creativityBonus && (
										<div className="flex items-center justify-between text-green-600">
											<span className="flex items-center gap-2 text-sm md:text-base">
												<Minus className="w-3 h-3 md:w-4 md:h-4" />
												Creativity Bonus:
											</span>
											<span className="text-sm md:text-base font-semibold">
												-15 seconds
											</span>
										</div>
									)}

									{game.details.penaltySeconds > 0 && (
										<div className="flex items-center justify-between text-red-600">
											<span className="flex items-center gap-2 text-sm md:text-base">
												<Plus className="w-3 h-3 md:w-4 md:h-4" />
												Penalties (
												{game.details.penaltySeconds}{" "}
												mistakes):
											</span>
											<span className="text-sm md:text-base font-semibold">
												+
												{game.details.penaltySeconds *
													5}{" "}
												seconds
											</span>
										</div>
									)}

									{game.details.bonusSeconds !== 0 && (
										<div
											className={`flex items-center justify-between ${
												game.details.bonusSeconds > 0
													? "text-red-600"
													: "text-green-600"
											}`}
										>
											<span className="flex items-center gap-2 text-sm md:text-base">
												{game.details.bonusSeconds >
												0 ? (
													<Plus className="w-3 h-3 md:w-4 md:h-4" />
												) : (
													<Minus className="w-3 h-3 md:w-4 md:h-4" />
												)}
												Other Adjustments:
											</span>
											<span className="text-sm md:text-base font-semibold">
												{game.details.bonusSeconds > 0
													? "+"
													: ""}
												{game.details.bonusSeconds}{" "}
												seconds
											</span>
										</div>
									)}

									<div className="border-t border-gray-200 pt-2 md:pt-3 mt-2 md:mt-3">
										<div className="flex items-center justify-between text-gray-800 font-bold">
											<span className="text-sm md:text-base">
												Final Score:
											</span>
											<span className="text-lg md:text-xl">
												{Math.floor(
													(editValues.minutes * 60 +
														editValues.seconds +
														editValues.penaltySeconds *
															5) /
														60
												)
													.toString()
													.padStart(2, "0")}
												:
												{(
													(editValues.minutes * 60 +
														editValues.seconds +
														editValues.penaltySeconds *
															5) %
													60
												)
													.toString()
													.padStart(2, "0")}
											</span>
										</div>
									</div>
								</CardContent>
							</Card>
						)}

						{/* Performance Rating */}
						<Card className="bg-gray-50 border-gray-200">
							<CardHeader className="pb-2">
								<CardTitle className="text-gray-800 flex items-center gap-2 text-base md:text-lg">
									<Star className="w-4 h-4 md:w-5 md:h-5" />
									Performance Rating
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="flex items-center gap-1 mb-2">
									{Array.from({ length: 5 }, (_, i) => (
										<Star
											key={i}
											className={`w-5 h-5 md:w-6 md:h-6 ${
												i <
												((game.time || 0) <= 300
													? 5
													: (game.time || 0) <= 450
													? 4
													: 3)
													? "text-yellow-400 fill-current"
													: "text-gray-300"
											}`}
										/>
									))}
								</div>
								<p className="text-xs md:text-sm text-gray-600">
									{(game.time || 0) <= 300
										? "Excellent performance!"
										: (game.time || 0) <= 450
										? "Good performance!"
										: "Room for improvement!"}
								</p>
							</CardContent>
						</Card>
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}
