import React from 'react'
import type { PandaDocDocument } from '../types/pandadoc'
import StatusBadge from './StatusBadge'
import { MoreHorizontal, ExternalLink, Mail, Calendar } from 'lucide-react'

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
      <div className="w-full">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100 text-gray-500">
            <tr>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider">Document</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider">Recipients</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider">Date</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, i) => (
              <tr key={i} className="animate-pulse border-b border-gray-50 last:border-0">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-xl" />
                    <div className="h-4 w-48 bg-gray-100 rounded" />
                  </div>
                </td>
                <td className="px-6 py-4"><div className="h-7 w-20 rounded-full bg-gray-100" /></td>
                <td className="px-6 py-4"><div className="h-4 w-32 bg-gray-100 rounded" /></td>
                <td className="px-6 py-4"><div className="h-4 w-24 bg-gray-100 rounded" /></td>
                <td className="px-6 py-4"><div className="h-8 w-24 bg-gray-100 rounded-lg ml-auto" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="w-full">
      <table className="w-full text-left">
        <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 sticky top-0 z-10">
          <tr>
            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider">Document Name</th>
            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider">Status</th>
            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider">Primary Recipient</th>
            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider">Created Date</th>
            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {documents.map((doc) => (
            <tr key={doc.id} className="group hover:bg-[#E1F5EE]/30 transition-all duration-200">
              <td className="px-6 py-4">
                <div className="flex items-center gap-4">
                  <a
                    href={`https://app.pandadoc.com/a/#/documents/${doc.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-[#1D9E75] group-hover:bg-white transition-colors hover:shadow-md"
                    title="Open in PandaDoc"
                  >
                    <ExternalLink className="w-5 h-5 opacity-40 group-hover:opacity-100 transition-opacity" />
                  </a>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-bold text-gray-900 truncate max-w-[200px] lg:max-w-xs group-hover:text-[#1D9E75] transition-colors">
                      {doc.name}
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium truncate">ID: {doc.id.slice(0, 8)}...</span>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <StatusBadge status={doc.status} />
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-gray-400" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-semibold text-gray-700 truncate">
                      {doc.recipients && doc.recipients.length > 0 
                        ? doc.recipients[0].email 
                        : doc.metadata?.primary_recipient
                          ? doc.metadata.primary_recipient
                          : doc.created_by?.email 
                            ? doc.created_by.email 
                            : 'No recipients'}
                    </span>
                    {doc.recipients && doc.recipients.length > 1 ? (
                      <span className="text-[10px] text-gray-400 font-bold">
                        +{doc.recipients.length - 1} others
                      </span>
                    ) : (doc.metadata?.primary_recipient || doc.created_by?.email) && (!doc.recipients || doc.recipients.length === 0) ? (
                      <span className="text-[9px] text-[#1D9E75] font-black uppercase tracking-tighter">
                        {doc.metadata?.primary_recipient ? 'Recipient' : 'Owner'}
                      </span>
                    ) : null}
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatDate(doc.date_created)}
                </div>
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end">
                  <button
                    onClick={() => onViewDetails(doc)}
                    className="px-4 py-1.5 bg-white border border-gray-200 text-xs font-bold text-gray-700 rounded-lg hover:border-[#1D9E75] hover:text-[#1D9E75] transition-all shadow-sm active:scale-95"
                  >
                    Details
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default DocumentsTable
