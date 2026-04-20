import React from 'react'

interface StatusBadgeProps {
  status: string
  size?: 'sm' | 'md'
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'document.draft':
        return { label: 'Draft', color: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' }
      case 'document.sent':
        return { label: 'Sent', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' }
      case 'document.viewed':
        return { label: 'Viewed', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' }
      case 'document.completed':
        return { label: 'Completed', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' }
      case 'document.declined':
        return { label: 'Declined', color: 'bg-red-500/10 text-red-400 border-red-500/20' }
      case 'document.waiting_approval':
        return { label: 'Waiting Approval', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' }
      default:
        return { label: status.replace('document.', ''), color: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' }
    }
  }

  const { label, color } = getStatusConfig(status)

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 font-medium tracking-wide ${
        size === 'sm' ? 'text-[10px]' : 'text-xs'
      } ${color}`}
    >
      {label}
    </span>
  )
}

export default StatusBadge
