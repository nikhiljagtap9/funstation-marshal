"use client"

import { motion } from "framer-motion"
import { useEffect, useState } from "react"

interface GameCompletionAnimationProps {
  onComplete: () => void
  duration?: number
}

export default function GameCompletionAnimation({ onComplete, duration = 5000 }: GameCompletionAnimationProps) {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; color: string }>>([])

  useEffect(() => {
    const newParticles = Array.from({ length: 60 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      color: ["#FFD700", "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#FD79A8", "#FDCB6E"][
        Math.floor(Math.random() * 8)
      ],
    }))
    setParticles(newParticles)

    // Auto-complete after duration
    const timer = setTimeout(() => {
      onComplete()
    }, duration)

    return () => clearTimeout(timer)
  }, [onComplete, duration])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/95 backdrop-blur-sm flex items-center justify-center z-50"
    >
      {/* Animated Background Particles */}
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute w-3 h-3 rounded-full"
          style={{
            backgroundColor: particle.color,
            left: `${particle.x}%`,
            top: `${particle.y}%`,
          }}
          animate={{
            y: [0, -150, 0],
            x: [0, Math.random() * 200 - 100, 0],
            scale: [0, 1.5, 0],
            rotate: [0, 360, 720],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 3,
            repeat: Number.POSITIVE_INFINITY,
            delay: Math.random() * 2,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Fireworks Bursts */}
      <motion.div className="absolute inset-0">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-6 h-6 bg-yellow-400 rounded-full"
            style={{
              left: `${15 + i * 7}%`,
              top: `${15 + (i % 4) * 20}%`,
            }}
            animate={{
              scale: [0, 4, 0],
              opacity: [1, 0.3, 0],
              rotate: [0, 180],
            }}
            transition={{
              duration: 2,
              repeat: Number.POSITIVE_INFINITY,
              delay: i * 0.3,
              ease: "easeOut",
            }}
          />
        ))}
      </motion.div>

      {/* Main Content */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className="text-center z-10"
      >
        <motion.h1
          className="text-7xl md:text-9xl font-bold bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500 bg-clip-text text-transparent mb-6"
          animate={{
            scale: [1, 1.15, 1],
            textShadow: [
              "0 0 20px rgba(255,193,7,0.5)",
              "0 0 40px rgba(255,193,7,0.9)",
              "0 0 20px rgba(255,193,7,0.5)",
            ],
          }}
          transition={{
            duration: 2.5,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        >
          🎉 GAME COMPLETED! 🎉
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="text-white text-2xl md:text-3xl font-semibold"
        >
          Congratulations on finishing all games!
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 1.2 }}
          className="mt-8 text-6xl"
        >
          🏆
        </motion.div>
      </motion.div>

      {/* Sparkles */}
      {[...Array(30)].map((_, i) => (
        <motion.div
          key={`sparkle-${i}`}
          className="absolute text-yellow-300 text-3xl"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            scale: [0, 1.5, 0],
            rotate: [0, 180, 360],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 2,
            repeat: Number.POSITIVE_INFINITY,
            delay: Math.random() * 3,
            ease: "easeInOut",
          }}
        >
          ✨
        </motion.div>
      ))}

      {/* Confetti */}
      {[...Array(25)].map((_, i) => (
        <motion.div
          key={`confetti-${i}`}
          className="absolute w-4 h-4"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            backgroundColor: ["#FF6B6B", "#4ECDC4", "#45B7D1", "#FFEAA7", "#FD79A8"][Math.floor(Math.random() * 5)],
          }}
          animate={{
            y: [0, -200, 200],
            x: [0, Math.random() * 100 - 50],
            rotate: [0, 360, 720],
            scale: [1, 0.5, 1],
          }}
          transition={{
            duration: 4,
            repeat: Number.POSITIVE_INFINITY,
            delay: Math.random() * 2,
            ease: "linear",
          }}
        />
      ))}
    </motion.div>
  )
}
