"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import Image from "next/image";
import Link from "next/link";
import { useToast } from "../../hooks/use-toast";

export default function TeamSetupPage() {
	const [teamName, setTeamName] = useState("");
	const [marshalName, setMarshalName] = useState("");
	const [loading, setLoading] = useState(true);
	const [agreed, setAgreed] = useState(false);
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
		</div>
	);
}
