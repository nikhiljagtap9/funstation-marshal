"use client"

import { useEffect } from "react"
import { useToast } from "@/hooks/use-toast"

interface GameProgressValidatorProps {
  currentGame: number
  games: Array<{ completed: boolean; name: string }>
  onValidationError: () => void
}

export default function GameProgressValidator({ currentGame, games, onValidationError }: GameProgressValidatorProps) {
  const { toast } = useToast()

  useEffect(() => {
    // Only validate if trying to access a game beyond the first
    if (currentGame > 0) {
      // Check if the previous game is completed
      const previousGame = games[currentGame - 1]
      if (!previousGame?.completed) {
        toast({
          title: "Game Sequence Error",
          description: `You must complete ${previousGame?.name || "the previous game"} before proceeding to the next game.`,
          variant: "destructive",
          duration: 5000,
        })
        onValidationError()
        return
      }
    }

    // Check if all previous games are completed in sequence
    for (let i = 0; i < currentGame; i++) {
      if (!games[i]?.completed) {
        toast({
          title: "Incomplete Games Detected",
          description: `Please complete all previous games in sequence. ${games[i]?.name} is still pending.`,
          variant: "destructive",
          duration: 5000,
        })
        onValidationError()
        return
      }
    }
  }, [currentGame, games, toast, onValidationError])

  return null
}
