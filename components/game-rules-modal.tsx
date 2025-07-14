"use client";

import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface GameRulesModalProps {
	isOpen: boolean;
	onClose: () => void;
	gameName: string;
}

const gameRules = {
	"House of Cards": {
		description: "Build the tallest card tower",
		rules: [
			"Provide each team with 4 decks of cards",
			"Teams need to create a tower that will be rated based on the tallest structure",
			"The most creative team will earn an extra 15 second reductions",
			"In total we will have 10 minutes to build",
			"Taller structures receive higher scores, while shorter ones receive lower scores",
			"The tallest house gets: 30 seconds, the 2nd place gets 1:00, the 3rd place gets 1:30, 4th place 2:00min and 5th place 2:30",
			"If someone is creative we remove 00:15 sec",
		],
	},
	"Office Chair Race": {
		description: "Navigate obstacles on wheels",
		rules: [
			"Teams will set out on a relay race with office chairs from point A to B",
			"The chair needs to touch the tape",
			"The fastest team to finish wins the game",
			"You get a penalty of 5 seconds if you get out of your lane",
			"Marshal runs with each contestant to capture and announce the penalties",
			"The FASTEST team that finishes wins",
		],
	},
	"Around the Clock": {
		description: "Complete tasks in sequence",
		rules: [
			"1st person in the team will place his hands on the cone and then his head",
			"Turn around 5 times and then race from point A to B",
			"Cups need to be stuck, 4-3-2-1 to create a pyramid",
			"They will then unstuck the cups and race back",
			"Tap the second person and so on",
			"Fastest team to finish wins the play",
		],
	},
	"Pass the Spud": {
		description: "Team coordination challenge",
		rules: [
			"Teams will stand side by side, spacing 1.5m apart",
			"The first person will collect one ball at a time, using only their elbows",
			"The ball will be passed to the last member using only elbows and collected at point B",
			"The fastest team wins",
			"Only the person with the ball should move",
			"If the ball falls it has to go back to point A",
			"This is managed by the Marshalls",
		],
	},
	"Skin the Snake": {
		description: "Team coordination snake game",
		rules: [
			"Teams will stand side by side, and marshals will tape their hands",
			"On the cue of the host, marshals will place a hula hoop",
			"The teams will have to pass it to the last person",
			"The fastest team wins",
			"If there is time, they will perform un-skin",
		],
	},
};

export default function GameRulesModal({
	isOpen,
	onClose,
	gameName,
}: GameRulesModalProps) {
	const game = gameRules[gameName as keyof typeof gameRules];

	if (!game) {
		return null;
	}

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="text-xl font-bold text-gray-800">
						<div className="flex items-center gap-3">
							<span className="text-3xl">
								{gameName === "House of Cards" && "🏠"}
								{gameName === "Office Chair Race" && "🪑"}
								{gameName === "Around the Clock" && "🕐"}
								{gameName === "Pass the Spud" && "🥔"}
								{gameName === "Skin the Snake" && "🐍"}
							</span>
							{gameName}
						</div>
					</DialogTitle>
				</DialogHeader>

				<div className="space-y-6">
					<div>
						<h3 className="text-lg font-semibold text-gray-700 mb-2">
							Description
						</h3>
						<p className="text-gray-600">{game.description}</p>
					</div>

					<div>
						<h3 className="text-lg font-semibold text-gray-700 mb-3">
							Game Rules
						</h3>
						<ul className="space-y-2">
							{game.rules.map((rule, index) => (
								<li
									key={index}
									className="flex items-start gap-2"
								>
									<span className="text-yellow-500 font-bold text-sm mt-1">
										•
									</span>
									<span className="text-gray-700">
										{rule}
									</span>
								</li>
							))}
						</ul>
					</div>

					<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
						<h4 className="font-semibold text-yellow-800 mb-2">
							⏱️ Time Limit
						</h4>
						<p className="text-yellow-700">
							Each game has a maximum time limit of 10 minutes
						</p>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
