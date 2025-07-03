"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface NewYearAnimationProps {
	message: string;
	duration?: number;
}

export default function NewYearAnimation({
	message,
	duration = 4000,
}: NewYearAnimationProps) {
	const [particles, setParticles] = useState<
		Array<{ id: number; x: number; y: number; color: string }>
	>([]);

	useEffect(() => {
		const newParticles = Array.from({ length: 50 }, (_, i) => ({
			id: i,
			x: Math.random() * 100,
			y: Math.random() * 100,
			color: [
				"#FFD700",
				"#FF6B6B",
				"#4ECDC4",
				"#45B7D1",
				"#96CEB4",
				"#FFEAA7",
			][Math.floor(Math.random() * 6)],
		}));
		setParticles(newParticles);
	}, []);

	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50"
		>
			{/* Particles */}
			{particles.map((particle) => (
				<motion.div
					key={particle.id}
					className="absolute w-2 h-2 rounded-full"
					style={{
						backgroundColor: particle.color,
						left: `${particle.x}%`,
						top: `${particle.y}%`,
					}}
					animate={{
						y: [0, -100, 0],
						x: [0, Math.random() * 100 - 50, 0],
						scale: [0, 1, 0],
						rotate: [0, 360],
					}}
					transition={{
						duration: 2,
						repeat: Number.POSITIVE_INFINITY,
						delay: Math.random() * 2,
						ease: "easeInOut",
					}}
				/>
			))}

			{/* Fireworks */}
			<motion.div
				className="absolute inset-0"
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ duration: 0.5 }}
			>
				{[...Array(8)].map((_, i) => (
					<motion.div
						key={i}
						className="absolute w-4 h-4 bg-yellow-400 rounded-full"
						style={{
							left: `${20 + i * 10}%`,
							top: `${20 + (i % 3) * 20}%`,
						}}
						animate={{
							scale: [0, 3, 0],
							opacity: [1, 0.5, 0],
						}}
						transition={{
							duration: 1.5,
							repeat: Number.POSITIVE_INFINITY,
							delay: i * 0.2,
							ease: "easeOut",
						}}
					/>
				))}
			</motion.div>

			{/* Main Message */}
			<motion.div
				initial={{ scale: 0, rotate: -180 }}
				animate={{ scale: 1, rotate: 0 }}
				transition={{ duration: 1, ease: "easeOut" }}
				className="text-center z-10"
			>
				<motion.h1
					className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500 bg-clip-text text-transparent mb-4"
					animate={{
						scale: [1, 1.1, 1],
					}}
					transition={{
						duration: 2,
						repeat: Number.POSITIVE_INFINITY,
						ease: "easeInOut",
					}}
				>
					🎉 {message} 🎉
				</motion.h1>

				<motion.div
					initial={{ opacity: 0, y: 50 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 1, delay: 0.5 }}
					className="text-white text-xl"
				>
					Get ready for an amazing competition!
				</motion.div>
			</motion.div>

			{/* Sparkles */}
			{[...Array(20)].map((_, i) => (
				<motion.div
					key={`sparkle-${i}`}
					className="absolute text-yellow-300 text-lg"
					style={{
						left: `${Math.random() * 100}%`,
						top: `${Math.random() * 100}%`,
					}}
					animate={{
						scale: [0, 1, 0],
						rotate: [0, 180, 360],
						opacity: [0, 1, 0],
					}}
					transition={{
						duration: 1.5,
						repeat: Number.POSITIVE_INFINITY,
						delay: Math.random() * 2,
						ease: "easeInOut",
					}}
				>
					✨
				</motion.div>
			))}
		</motion.div>
	);
}
