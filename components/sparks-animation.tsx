import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function SparksAnimation() {
	const [sparks, setSparks] = useState<
		{
			left: number;
			top: number;
			delay: number;
			type: "star" | "confetti";
		}[]
	>([]);

	useEffect(() => {
		// Only run on client
		const arr = Array.from({ length: 40 }, () => {
			const type: "star" | "confetti" =
				Math.random() > 0.5 ? "star" : "confetti";
			return {
				left: Math.random() * 100,
				top: Math.random() * 100,
				delay: Math.random() * 2,
				type,
			};
		});
		setSparks(arr);
	}, []);

	if (sparks.length === 0) return null;

	return (
		<div className="fixed inset-0 pointer-events-none overflow-hidden z-10">
			{sparks.map((spark, i) => (
				<motion.div
					key={i}
					className={`absolute ${
						spark.type === "star" ? "text-yellow-400" : ""
					} text-3xl`}
					style={{ left: `${spark.left}%`, top: `${spark.top}%` }}
					animate={{
						y: [0, -30, 0],
						rotate: [0, 360],
						opacity: [0.3, 1, 0.3],
						scale: [1, 1.3, 1],
					}}
					transition={{
						duration: 3,
						repeat: Number.POSITIVE_INFINITY,
						delay: spark.delay,
						ease: "easeInOut",
					}}
				>
					{spark.type === "star" ? "✨" : "🎉"}
				</motion.div>
			))}
		</div>
	);
}
