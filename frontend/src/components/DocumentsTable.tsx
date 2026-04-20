import React from 'react'
import type { PandaDocDocument } from '../types/pandadoc'
import StatusBadge from './StatusBadge'

interface DocumentsTableProps {
  documents: PandaDocDocument[]
  loading: boolean
  onViewDetails: (doc: PandaDocDocument) => void
}

const DocumentsTable: React.FC<DocumentsTableProps> = ({ documents, loading, onViewDetails }) => {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/50">
        <table className="w-full text-left">
          <thead className="border-b border-zinc-800 bg-zinc-900/50 text-zinc-400">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">#</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Document Name</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Recipients</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Created</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, i) => (
              <tr key={i} className="animate-pulse border-b border-zinc-800/50 last:border-0">
                <td className="px-6 py-4"><div className="h-4 w-4 rounded bg-zinc-800" /></td>
                <td className="px-6 py-4"><div className="h-4 w-48 rounded bg-zinc-800" /></td>
                <td className="px-6 py-4"><div className="h-6 w-20 rounded-full bg-zinc-800" /></td>
                <td className="px-6 py-4"><div className="h-4 w-32 rounded bg-zinc-800" /></td>
                <td className="px-6 py-4"><div className="h-4 w-24 rounded bg-zinc-800" /></td>
                <td className="px-6 py-4"><div className="h-8 w-24 rounded bg-zinc-800" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/50 shadow-sm backdrop-blur-sm">
      <table className="w-full text-left">
        <thead className="border-b border-zinc-800 bg-zinc-900/50 text-zinc-400">
          <tr>
            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">#</th>
            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Document Name</th>
            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Status</th>
            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Recipients</th>
            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Created</th>
            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/50">
          {documents.map((doc, index) => (
            <tr key={doc.id} className="group hover:bg-zinc-800/30 transition-colors">
              <td className="px-6 py-4 text-sm text-zinc-500 font-medium">{index + 1}</td>
              <td className="px-6 py-4">
                <span className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">
                  {doc.name}
                </span>
              </td>
              <td className="px-6 py-4">
                <StatusBadge status={doc.status} />
              </td>
              <td className="px-6 py-4">
                <div className="flex flex-col">
                  <span className="text-sm text-zinc-300">
                    {doc.recipients?.[0]?.email || 'No recipients'}
                  </span>
                  {(doc.recipients?.length ?? 0) > 1 && (
                    <span className="text-[11px] text-zinc-500 font-medium">
                      +{(doc.recipients?.length ?? 0) - 1} more
                    </span>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 text-sm text-zinc-400">
                {formatDate(doc.date_created)}
              </td>
              <td className="px-6 py-4 text-right">
                <button
                  onClick={() => onViewDetails(doc)}
                  className="inline-flex items-center rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-700 transition-all active:scale-95"
                >
                  View Details
                </button>
              </td>
            </tr>
          ))}
          {documents.length === 0 && (
            <tr>
              <td colSpan={6} className="px-6 py-12 text-center">
                <div className="flex flex-col items-center gap-3">
                  <svg className="h-10 w-10 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <div className="text-lg font-semibold text-zinc-400">No documents found</div>
                  <p className="text-sm text-zinc-500">Documents you create in PandaDoc will appear here</p>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

export default DocumentsTable
