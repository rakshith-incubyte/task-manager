"use client"

import { motion, AnimatePresence } from 'motion/react'
import { CheckCircle2, XCircle, Info, X } from 'lucide-react'
import { type Toast } from '@/hooks/use-toast'

type ToastContainerProps = {
  toasts: Toast[]
  onRemove: (id: string) => void
}

const toastIcons = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
}

const toastColors = {
  success: 'bg-green-500',
  error: 'bg-destructive',
  info: 'bg-blue-500',
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => {
          const Icon = toastIcons[toast.type]
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 50, scale: 0.3 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
              className={`${toastColors[toast.type]} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px] max-w-[400px] pointer-events-auto`}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm font-medium flex-1">{toast.message}</p>
              <button
                onClick={() => onRemove(toast.id)}
                className="hover:bg-white/20 rounded p-1 transition-colors"
                aria-label="Close notification"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
