"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

export default function TeamSetupPage() {
	const [teamName, setTeamName] = useState("");
	const [marshalName, setMarshalName] = useState("");
	const [loading, setLoading] = useState(true);
	const [agreed, setAgreed] = useState(false);
	const [resetNoticeOpen, setResetNoticeOpen] = useState(false);
	const [deleteNoticeOpen, setDeleteNoticeOpen] = useState(false);
	const [wsConnected, setWsConnected] = useState(false);
	const router = useRouter();
	const { toast } = useToast();
	const [error, setError] = useState("");

	useEffect(() => {
		// Check authentication
		const token = localStorage.getItem("authToken");
		if (!token) {
			router.push("/");
			return;
		}
		const marshalData = JSON.parse(
			localStorage.getItem("marshalData") || "null"
		);
		if (!marshalData) {
			router.push("/");
			return;
		}
		setTeamName(marshalData.teamName || "");
		setMarshalName(marshalData.marshalName || "");
		setLoading(false);

		// WebSocket connection for real-time updates
		try {
			const protocol =
				window.location.protocol === "https:" ? "wss" : "ws";
			const ws = new WebSocket(
				`${protocol}://${window.location.host}/ws`
			);

			ws.onopen = () => {
				console.log("Team Setup WebSocket connected successfully");
				setWsConnected(true);
			};

			ws.onmessage = (event) => {
				try {
					const msg = JSON.parse(event.data);
					console.log("Team Setup WebSocket message received:", msg);

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
				console.log("Team Setup WebSocket disconnected");
				setWsConnected(false);
			};

			ws.onerror = (error) => {
				console.warn("Team Setup WebSocket connection failed:", error);
				setWsConnected(false);
			};

			// Cleanup on unmount
			return () => {
				ws.close();
			};
		} catch (error) {
			console.warn("Team Setup WebSocket setup failed:", error);
			setWsConnected(false);
		}
	}, [router]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		if (!agreed) return;
		const token = localStorage.getItem("authToken");
		const users = JSON.parse(localStorage.getItem("users") || "[]");
		const user = users.find(
			(u: any) => u.marshalName === marshalName && u.teamName === teamName
		);
		if (!token || !user) {
			setError(
				"Authentication failed: Marshal name and Team name do not match with registered account."
			);
			toast({
				title: "Authentication Error",
				description:
					"Marshal name and Team name do not match with registered account.",
				duration: 3000,
				variant: "destructive",
			});
			return;
		}
		// Save updated marshal name and team name
		const updatedUser = { ...user, marshalName, teamName };
		const updatedUsers = users.map((u: any) =>
			u.username === user.username ? updatedUser : u
		);
		localStorage.setItem("users", JSON.stringify(updatedUsers));
		localStorage.setItem("marshalData", JSON.stringify(updatedUser));
		router.push("/splash");
	};

	if (loading) return null;

	return (
		<div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
			<div className="flex justify-center mb-6">
				<Image
					src="/logo.png"
					alt="Fun Station Logo"
					width={200}
					height={150}
					className="object-contain"
				/>
			</div>
			<div className="w-full max-w-md bg-white rounded-lg p-6 border border-gray-200 shadow-lg">
				<h2 className="text-2xl font-bold mb-4 text-center">
					Team Setup
				</h2>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div>
						<Label htmlFor="marshalName">Marshal Name</Label>
						<Input
							id="marshalName"
							value={marshalName}
							onChange={(e) => setMarshalName(e.target.value)}
							required
						/>
					</div>
					<div>
						<Label htmlFor="teamName">Team Name</Label>
						<Input
							id="teamName"
							value={teamName}
							onChange={(e) => setTeamName(e.target.value)}
							required
						/>
					</div>
					<div className="flex items-center space-x-2">
						<input
							id="privacy"
							type="checkbox"
							checked={agreed}
							onChange={(e) => setAgreed(e.target.checked)}
							required
						/>
						<Label htmlFor="privacy" className="text-sm">
							I agree to the{" "}
							<a href="#" className="underline ">
								Privacy Policy
							</a>
						</Label>
					</div>
					{error && (
						<p className="text-red-500 text-sm text-center">
							{error}
						</p>
					)}
					<Button
						type="submit"
						className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-semibold"
						disabled={!agreed}
					>
						Save & Continue
					</Button>
				</form>
			</div>

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
				<DialogContent className="max-w-md w-full p-0 sm:p-6 rounded-2xl bg-white/95 border-none flex flex-col items-center">
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
