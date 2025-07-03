"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, RefreshCw } from "lucide-react"

interface ResetConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
}

export default function ResetConfirmationModal({ isOpen, onClose, onConfirm }: ResetConfirmationModalProps) {
  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white border-gray-200 text-gray-800">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center flex items-center justify-center gap-2 text-gray-800">
            <AlertTriangle className="w-6 h-6 text-red-500" />
            Reset Game Competition
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Alert className="bg-red-50 border-red-200">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <AlertDescription className="text-red-700">
              This action cannot be undone. All game progress and results will be permanently deleted.
            </AlertDescription>
          </Alert>

          <div className="text-center space-y-2">
            <p className="text-gray-600">Are you sure you want to reset all games?</p>
            <p className="text-sm text-gray-500">
              This will clear all completed games, times, and scores. You'll be able to start a fresh competition.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button onClick={handleConfirm} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold">
              <RefreshCw className="w-4 h-4 mr-2" />
              Reset All Games
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
