"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import SparksAnimation from "@/components/sparks-animation";

interface GameCompletionAnimationProps {
	onComplete: () => void;
	duration?: number;
}

export default function GameCompletionAnimation() {
	return (
		<div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
			{/* Fire Sparks */}
			<SparksAnimation />
			{/* Confetti */}
			{[...Array(30)].map((_, i) => (
				<motion.div
					key={`confetti-${i}`}
					className="absolute"
					style={{
						left: `${Math.random() * 100}%`,
						top: `${Math.random() * 100}%`,
						width: 12,
						height: 12,
						borderRadius: 4,
						backgroundColor: [
							"#FFD700",
							"#FF6B6B",
							"#4ECDC4",
							"#45B7D1",
							"#96CEB4",
							"#FFEAA7",
						][Math.floor(Math.random() * 6)],
					}}
					animate={{
						y: [0, 200, 0],
						x: [0, Math.random() * 100 - 50, 0],
						rotate: [0, 360, 720],
						scale: [1, 0.5, 1],
						opacity: [1, 0.7, 1],
					}}
					transition={{
						duration: 3.5,
						repeat: Number.POSITIVE_INFINITY,
						delay: Math.random() * 2,
						ease: "linear",
					}}
				/>
			))}
			{/* Stars */}
			{[...Array(20)].map((_, i) => (
				<motion.div
					key={`star-${i}`}
					className="absolute text-yellow-200 text-3xl"
					style={{
						left: `${Math.random() * 100}%`,
						top: `${Math.random() * 100}%`,
					}}
					animate={{
						scale: [0, 1.2, 0],
						rotate: [0, 180, 360],
						opacity: [0, 1, 0],
					}}
					transition={{
						duration: 2.2,
						repeat: Number.POSITIVE_INFINITY,
						delay: Math.random() * 2,
						ease: "easeInOut",
					}}
				>
					✨
				</motion.div>
			))}
			
		</div>
	);
}
