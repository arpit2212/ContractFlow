import React from 'react'

interface StatusBadgeProps {
  status: string
  size?: 'sm' | 'md'
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'document.draft':
        return { label: 'Draft', color: 'bg-gray-100 text-gray-600 border-gray-200' }
      case 'document.sent':
        return { label: 'Sent', color: 'bg-blue-50 text-blue-600 border-blue-100' }
      case 'document.viewed':
        return { label: 'Viewed', color: 'bg-purple-50 text-purple-600 border-purple-100' }
      case 'document.completed':
        return { label: 'Completed', color: 'bg-green-100 text-green-700 border-green-200' }
      case 'document.declined':
        return { label: 'Declined', color: 'bg-red-50 text-red-600 border-red-100' }
      case 'document.waiting_approval':
        return { label: 'Waiting Approval', color: 'bg-amber-100 text-amber-700 border-amber-200' }
      default:
        const cleanLabel = status.replace('document.', '').replace('_', ' ')
        return { label: cleanLabel, color: 'bg-gray-100 text-gray-600 border-gray-200' }
    }
  }

  const { label, color } = getStatusConfig(status)

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 font-bold tracking-tight ${
        size === 'sm' ? 'text-[10px]' : 'text-xs'
      } ${color}`}
    >
      {label}
    </span>
  )
}

export default StatusBadge
