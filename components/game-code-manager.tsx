"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Key, Edit, Plus, Copy } from "lucide-react";

interface GameCodeData {
	code: string;
	createdAt: string;
	updatedAt: string;
	active: boolean;
}

export default function GameCodeManager() {
	const [gameCodeData, setGameCodeData] = useState<GameCodeData | null>(null);
	const [isEditing, setIsEditing] = useState(false);
	const [newGameCode, setNewGameCode] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState("");
	const { toast } = useToast();

	const fetchGameCode = async () => {
		try {
			const res = await fetch("/api/get-game-code");
			if (res.ok) {
				const data = await res.json();
				setGameCodeData(data);
				if (!data) {
					setIsEditing(true);
				}
			}
		} catch (err) {
			console.error("Failed to fetch game code:", err);
		}
	};

	useEffect(() => {
		fetchGameCode();
	}, []);

	const handleCreateOrUpdate = async () => {
		if (!newGameCode.trim()) {
			setError("Game code is required");
			return;
		}

		if (!/^[A-Za-z0-9]{6,12}$/.test(newGameCode)) {
			setError("Game code must be 6-12 alphanumeric characters");
			return;
		}

		setIsLoading(true);
		setError("");

		try {
			const res = await fetch("/api/create-game-code", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ gameCode: newGameCode }),
			});

			const result = await res.json();

			if (res.ok) {
				toast({
					title: gameCodeData
						? "Game Code Updated!"
						: "Game Code Created!",
					description: `Game code "${result.gameCode}" is now active`,
					duration: 3000,
					className: "bg-green-100 text-green-800 border-green-300",
				});
				setIsEditing(false);
				setNewGameCode("");
				await fetchGameCode();
			} else {
				setError(result.error || "Failed to save game code");
			}
		} catch (err) {
			setError("Failed to save game code");
		} finally {
			setIsLoading(false);
		}
	};

	const handleCopyCode = () => {
		if (gameCodeData?.code) {
			navigator.clipboard.writeText(gameCodeData.code);
			toast({
				title: "Copied!",
				description: "Game code copied to clipboard",
				duration: 2000,
			});
		}
	};

	const handleEdit = () => {
		setIsEditing(true);
		setNewGameCode(gameCodeData?.code || "");
		setError("");
	};

	const handleCancel = () => {
		setIsEditing(false);
		setNewGameCode("");
		setError("");
	};

	return (
		<Card className="bg-white border-gray-200 shadow-lg">
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle className="text-lg font-medium text-gray-700 flex items-center gap-2">
					<Key className="h-5 w-5 text-yellow-500" />
					Game Code Management
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				{!isEditing && gameCodeData ? (
					<div className="space-y-4">
						<div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
							<div>
								<p className="text-sm text-gray-600">
									Current Game Code:
								</p>
								<p className="text-2xl font-bold text-gray-800 font-mono">
									{gameCodeData.code}
								</p>
								<p className="text-xs text-gray-500">
									Created:{" "}
									{new Date(
										gameCodeData.createdAt
									).toLocaleString()}
								</p>
								{gameCodeData.updatedAt !==
									gameCodeData.createdAt && (
									<p className="text-xs text-gray-500">
										Updated:{" "}
										{new Date(
											gameCodeData.updatedAt
										).toLocaleString()}
									</p>
								)}
							</div>
							<div className="flex gap-2">
								<Button
									onClick={handleCopyCode}
									variant="outline"
									size="sm"
									className="text-gray-600 hover:text-gray-800"
								>
									<Copy className="h-4 w-4" />
								</Button>
								<Button
									onClick={handleEdit}
									variant="outline"
									size="sm"
									className="text-blue-600 hover:text-blue-800"
								>
									<Edit className="h-4 w-4 mr-1" />
									Edit
								</Button>
							</div>
						</div>
					</div>
				) : (
					<div className="space-y-4">
						<div>
							<Label htmlFor="gameCode" className="text-gray-700">
								{gameCodeData
									? "Update Game Code"
									: "Create Game Code"}
							</Label>
							<Input
								id="gameCode"
								type="text"
								value={newGameCode}
								onChange={(e) => {
									setNewGameCode(
										e.target.value.toUpperCase()
									);
									setError("");
								}}
								className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-yellow-400 focus:ring-yellow-400 font-mono"
								placeholder="Enter 6-12 character code"
								maxLength={12}
								autoComplete="off"
							/>
							{error && (
								<p className="text-red-500 text-sm mt-1">
									{error}
								</p>
							)}
							<p className="text-xs text-gray-500 mt-1">
								Use alphanumeric characters only (A-Z, 0-9)
							</p>
						</div>
						<div className="flex gap-2">
							<Button
								onClick={handleCreateOrUpdate}
								disabled={isLoading}
								className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold"
							>
								{isLoading ? (
									"Saving..."
								) : (
									<>
										{gameCodeData ? (
											<Edit className="h-4 w-4 mr-1" />
										) : (
											<Plus className="h-4 w-4 mr-1" />
										)}
										{gameCodeData ? "Update" : "Create"}
									</>
								)}
							</Button>
							{gameCodeData && (
								<Button
									onClick={handleCancel}
									variant="outline"
									className="text-gray-600 hover:text-gray-800"
								>
									Cancel
								</Button>
							)}
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
