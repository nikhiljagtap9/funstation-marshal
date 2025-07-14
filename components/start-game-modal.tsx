"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Trophy, AlertTriangle } from "lucide-react"
import NewYearAnimation from "@/components/new-year-animation"

interface StartGameModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function StartGameModal({ isOpen, onClose }: StartGameModalProps) {
  const [showAnimation, setShowAnimation] = useState(false)
  const router = useRouter()

  const handleStartGame = () => {
    setShowAnimation(true)
    setTimeout(() => {
      router.push("/games")
    }, 4000)
  }

  const gameRules = [
    "Each game has a maximum time limit of 10 minutes",
    "Teams must complete all 5 games in sequence",
    "The team with the least total time wins",
    "Winner gets 1 minute bonus for next game",
    "Other teams get +15 seconds automatically",
  ]

  if (showAnimation) {
    return <NewYearAnimation message="Let the Games Begin!" />
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-white border-gray-200 text-gray-800 max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2 text-gray-800">
            <Trophy className="w-6 h-6 text-yellow-400" />
            Game Competition Rules
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Alert className="bg-blue-100 border-blue-200">
            <AlertTriangle className="h-4 w-4 text-blue-500" />
            <AlertDescription className="text-blue-700">
              Please read all rules carefully before starting the competition.
            </AlertDescription>
          </Alert>

          <div className="bg-white/5 backdrop-blur-md rounded-lg p-4">
            <h3 className="font-semibold mb-3 text-yellow-600">Competition Rules:</h3>
            <ul className="space-y-2 text-sm">
              {gameRules.map((rule, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="flex items-start gap-2"
                >
                  <span className="text-green-600 mt-1">•</span>
                  <span className="text-gray-600">{rule}</span>
                </motion.li>
              ))}
            </ul>
          </div>

          <div className="bg-gradient-to-r from-red-600/5 to-orange-600/5 rounded-lg p-4 border border-red-400/10">
            <h3 className="font-semibold mb-2 text-red-600">Important Notes:</h3>
            <p className="text-sm text-gray-600">
              All game times are manually input by the marshal. Make sure to track each team's performance accurately.
              The system will automatically calculate bonuses and penalties based on the game rules.
            </p>
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 bg-white/10 backdrop-blur-md border-gray-200 text-gray-800 hover:bg-gray-100"
            >
              Cancel
            </Button>
            <Button
              onClick={handleStartGame}
              className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-black font-semibold"
            >
              Start Competition
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
