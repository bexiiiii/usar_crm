import { ReactNode } from 'react'

interface EmptyStateProps {
  message: string
  action?: ReactNode
  icon?: ReactNode
}

export default function EmptyState({ message, action, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && <div className="text-gray-300 mb-4">{icon}</div>}
      <p className="text-gray-500 text-base">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
