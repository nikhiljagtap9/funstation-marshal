"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, Trophy, Star, Calendar, CheckCircle, Minus, Plus } from "lucide-react"

interface GameDetailsModalProps {
  game: {
    name: string
    icon: string
    completed: boolean
    time?: number
    score?: number
    completedAt?: string
    details?: {
      bonusSeconds: number
      penaltySeconds: number
      creativityBonus: boolean
      finalScore: number
    }
  }
  isOpen: boolean
  onClose: () => void
}

export default function GameDetailsModal({ game, isOpen, onClose }: GameDetailsModalProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString)
    return date.toLocaleString()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto bg-white border-gray-200 text-gray-800">
        <DialogHeader>
          <DialogTitle className="text-xl md:text-2xl font-bold text-center flex items-center justify-center gap-2 text-gray-800">
            <span className="text-2xl md:text-3xl">{game.icon}</span>
            {game.name} - Game Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 md:space-y-6 p-2 md:p-4">
          {/* Status Badge */}
          <div className="text-center">
            <Badge className="bg-yellow-400 text-black font-semibold px-3 md:px-4 py-1 md:py-2">
              <CheckCircle className="w-3 h-3 md:w-4 md:h-4 mr-2" />
              Completed
            </Badge>
          </div>

          {/* Main Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <Card className="bg-gray-50 border-gray-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-gray-800 flex items-center gap-2 text-base md:text-lg">
                  <Clock className="w-4 h-4 md:w-5 md:h-5" />
                  Final Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl md:text-3xl font-bold text-gray-800">{formatTime(game.time || 0)}</div>
                <p className="text-xs md:text-sm text-gray-600 mt-1">Total completion time</p>
              </CardContent>
            </Card>

            <Card className="bg-gray-50 border-gray-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-gray-800 flex items-center gap-2 text-base md:text-lg">
                  <Trophy className="w-4 h-4 md:w-5 md:h-5" />
                  Base Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl md:text-3xl font-bold text-gray-800">{formatTime(game.score || 0)}</div>
                <p className="text-xs md:text-sm text-gray-600 mt-1">Original completion time</p>
              </CardContent>
            </Card>
          </div>

          {/* Completion Details */}
          {game.completedAt && (
            <Card className="bg-gray-50 border-gray-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-gray-800 flex items-center gap-2 text-base md:text-lg">
                  <Calendar className="w-4 h-4 md:w-5 md:h-5" />
                  Completion Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm md:text-base text-gray-600">{formatDateTime(game.completedAt)}</p>
              </CardContent>
            </Card>
          )}

          {/* Score Adjustments */}
          {game.details && (
            <Card className="bg-gray-50 border-gray-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-gray-800 flex items-center gap-2 text-base md:text-lg">
                  <Star className="w-4 h-4 md:w-5 md:h-5" />
                  Score Adjustments
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 md:space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm md:text-base text-gray-600">Base Time:</span>
                  <span className="text-sm md:text-base text-gray-800 font-semibold">
                    {formatTime(game.score || 0)}
                  </span>
                </div>

                {game.details.creativityBonus && (
                  <div className="flex items-center justify-between text-green-600">
                    <span className="flex items-center gap-2 text-sm md:text-base">
                      <Minus className="w-3 h-3 md:w-4 md:h-4" />
                      Creativity Bonus:
                    </span>
                    <span className="text-sm md:text-base font-semibold">-15 seconds</span>
                  </div>
                )}

                {game.details.penaltySeconds > 0 && (
                  <div className="flex items-center justify-between text-red-600">
                    <span className="flex items-center gap-2 text-sm md:text-base">
                      <Plus className="w-3 h-3 md:w-4 md:h-4" />
                      Penalties ({game.details.penaltySeconds} mistakes):
                    </span>
                    <span className="text-sm md:text-base font-semibold">
                      +{game.details.penaltySeconds * 5} seconds
                    </span>
                  </div>
                )}

                {game.details.bonusSeconds !== 0 && (
                  <div
                    className={`flex items-center justify-between ${
                      game.details.bonusSeconds > 0 ? "text-red-600" : "text-green-600"
                    }`}
                  >
                    <span className="flex items-center gap-2 text-sm md:text-base">
                      {game.details.bonusSeconds > 0 ? (
                        <Plus className="w-3 h-3 md:w-4 md:h-4" />
                      ) : (
                        <Minus className="w-3 h-3 md:w-4 md:h-4" />
                      )}
                      Other Adjustments:
                    </span>
                    <span className="text-sm md:text-base font-semibold">
                      {game.details.bonusSeconds > 0 ? "+" : ""}
                      {game.details.bonusSeconds} seconds
                    </span>
                  </div>
                )}

                <div className="border-t border-gray-200 pt-2 md:pt-3 mt-2 md:mt-3">
                  <div className="flex items-center justify-between text-gray-800 font-bold">
                    <span className="text-sm md:text-base">Final Score:</span>
                    <span className="text-lg md:text-xl">{formatTime(game.details.finalScore)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Performance Rating */}
          <Card className="bg-gray-50 border-gray-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-gray-800 flex items-center gap-2 text-base md:text-lg">
                <Star className="w-4 h-4 md:w-5 md:h-5" />
                Performance Rating
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1 mb-2">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 md:w-6 md:h-6 ${
                      i < ((game.time || 0) <= 300 ? 5 : (game.time || 0) <= 450 ? 4 : 3)
                        ? "text-yellow-400 fill-current"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs md:text-sm text-gray-600">
                {(game.time || 0) <= 300
                  ? "Excellent performance!"
                  : (game.time || 0) <= 450
                    ? "Good performance!"
                    : "Room for improvement!"}
              </p>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
