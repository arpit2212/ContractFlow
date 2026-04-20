import React, { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import { usePandaDocDocuments, usePandaDocAnalytics } from '../hooks/usePandaDoc'
import { pandaDocAPI } from '../services/api'
import DocumentsTable from '../components/DocumentsTable'
import StatusBadge from '../components/StatusBadge'
import type { PandaDocDocument } from '../types/pandadoc'

const Documents: React.FC = () => {
  const { documents, loading: docsLoading, error: docsError, refetch: refetchDocs } = usePandaDocDocuments()
  const { analytics, loading: analyticsLoading, error: analyticsError, refetch: refetchAnalytics } = usePandaDocAnalytics()
  
  const [searchParams, setSearchParams] = useSearchParams()
  const [filter, setFilter] = useState<string>('all')
  const [selectedDoc, setSelectedDoc] = useState<PandaDocDocument | null>(null)
  const [connecting, setConnecting] = useState(false)

  // Handle OAuth callback
  useEffect(() => {
    const code = searchParams.get('code')
    if (code) {
      const handleCallback = async () => {
        try {
          await pandaDocAPI.callback(code)
          // Clear search params
          setSearchParams({})
          // Refresh data
          refetchDocs()
          refetchAnalytics()
        } catch (err) {
          console.error('Failed to handle PandaDoc callback:', err)
        }
      }
      handleCallback()
    }
  }, [searchParams, setSearchParams, refetchDocs, refetchAnalytics])

  const handleConnect = async () => {
    setConnecting(true)
    try {
      const response = await pandaDocAPI.connect()
      if (response.data.url) {
        window.location.href = response.data.url
      }
    } catch (err) {
      console.error('Failed to get PandaDoc auth URL:', err)
      setConnecting(false)
    }
  }

  const filteredDocuments = useMemo(() => {
    if (filter === 'all') return documents
    return documents.filter((doc) => doc.status === `document.${filter}`)
  }, [documents, filter])

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const filters = ['all', 'draft', 'sent', 'viewed', 'completed', 'declined']

  return (
    <div className="flex h-screen bg-black text-white overflow-hidden">
      <Sidebar />
      
      <main className="flex-1 flex flex-col overflow-y-auto bg-zinc-950">
        <div className="max-w-7xl mx-auto w-full px-6 py-8 flex flex-col gap-8">
          {/* Header */}
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-bold tracking-tight mb-2">Documents</h1>
              <p className="text-zinc-500 text-sm">Manage and track your PandaDoc agreements</p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={handleConnect}
                disabled={connecting}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-sm font-semibold rounded-lg transition-all active:scale-95"
              >
                {connecting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                )}
                {connecting ? 'Connecting...' : 'Connect PandaDoc'}
              </button>
              <button 
                onClick={() => refetchDocs()}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-sm font-semibold rounded-lg transition-all active:scale-95"
              >
                <svg className={`w-4 h-4 ${docsLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>
          </div>

          {/* Analytics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {analyticsLoading ? (
              [...Array(5)].map((_, i) => (
                <div key={i} className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl animate-pulse">
                  <div className="h-3 w-16 bg-zinc-800 rounded mb-3" />
                  <div className="h-8 w-10 bg-zinc-800 rounded" />
                </div>
              ))
            ) : analyticsError ? (
              <div className="col-span-5 bg-red-900/10 border border-red-500/20 p-4 rounded-xl text-red-400 text-sm">
                Error loading analytics: {analyticsError}
              </div>
            ) : (
              <>
                <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl group hover:border-blue-500/50 transition-colors shadow-sm">
                  <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-2">Total</h3>
                  <p className="text-3xl font-bold text-white group-hover:text-blue-400 transition-colors">{analytics?.total}</p>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl group hover:border-amber-500/50 transition-colors shadow-sm">
                  <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-2">Sent</h3>
                  <p className="text-3xl font-bold text-white group-hover:text-amber-400 transition-colors">{analytics?.sent}</p>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl group hover:border-purple-500/50 transition-colors shadow-sm">
                  <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-2">Viewed</h3>
                  <p className="text-3xl font-bold text-white group-hover:text-purple-400 transition-colors">{analytics?.viewed}</p>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl group hover:border-emerald-500/50 transition-colors shadow-sm">
                  <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-2">Completed</h3>
                  <p className="text-3xl font-bold text-white group-hover:text-emerald-400 transition-colors">{analytics?.completed}</p>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl group hover:border-red-500/50 transition-colors shadow-sm">
                  <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-2">Declined</h3>
                  <p className="text-3xl font-bold text-white group-hover:text-red-400 transition-colors">{analytics?.declined}</p>
                </div>
              </>
            )}
          </div>

          {/* Main Content */}
          <div className="flex flex-col gap-6">
            {/* Filter Bar */}
            <div className="flex gap-2 p-1 bg-zinc-900 border border-zinc-800 rounded-xl w-fit">
              {filters.map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${
                    filter === f 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* Error Banner */}
            {docsError && (
              <div className="bg-red-900/10 border border-red-500/20 p-4 rounded-xl flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-red-400 text-sm font-medium">{docsError}</span>
                </div>
                <button 
                  onClick={() => refetchDocs()}
                  className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-bold rounded-lg transition-all"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Table */}
            <DocumentsTable 
              documents={filteredDocuments} 
              loading={docsLoading} 
              onViewDetails={setSelectedDoc}
            />
          </div>
        </div>
      </main>

      {/* Slide-over Panel */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex justify-end overflow-hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setSelectedDoc(null)}
          />
          
          {/* Panel */}
          <div className="relative w-full max-w-md h-full bg-zinc-950 border-l border-zinc-800 shadow-2xl flex flex-col transform transition-transform duration-300 ease-out translate-x-0">
            {/* Header */}
            <div className="px-6 py-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50 backdrop-blur-md">
              <h2 className="text-xl font-bold tracking-tight text-white">Document Details</h2>
              <button 
                onClick={() => setSelectedDoc(null)}
                className="p-2 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-all"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Basic Info */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-2">Name</h3>
                  <p className="text-xl font-bold text-white leading-tight">{selectedDoc.name}</p>
                </div>
                <div className="flex items-center gap-3">
                  <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Status</h3>
                  <StatusBadge status={selectedDoc.status} />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1.5">Created</h3>
                  <p className="text-sm text-zinc-300 font-medium">{formatDate(selectedDoc.date_created)}</p>
                </div>
                <div>
                  <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1.5">Modified</h3>
                  <p className="text-sm text-zinc-300 font-medium">{formatDate(selectedDoc.date_modified)}</p>
                </div>
              </div>

              {/* Metadata */}
              <div className="space-y-4 pt-4 border-t border-zinc-800">
                <div>
                  <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-2">Created By</h3>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-zinc-500">
                      {selectedDoc.created_by?.email?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {selectedDoc.created_by?.first_name || 'Unknown'} {selectedDoc.created_by?.last_name || ''}
                      </p>
                      <p className="text-xs text-zinc-500">{selectedDoc.created_by?.email || 'No email'}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-2">Recipients</h3>
                  <div className="space-y-2">
                    {selectedDoc.recipients?.map((recipient: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-zinc-900 border border-zinc-800 group hover:border-zinc-700 transition-all">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white truncate">
                            {recipient.first_name} {recipient.last_name}
                          </p>
                          <p className="text-xs text-zinc-500 truncate">{recipient.email}</p>
                          <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-wider mt-0.5">{recipient.role}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1.5 ml-4">
                          {recipient.has_completed ? (
                            <div className="flex items-center gap-1.5 text-emerald-500">
                              <span className="text-[10px] font-bold uppercase tracking-widest">Signed</span>
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-zinc-600 font-bold uppercase tracking-widest">
                              <span className="text-[10px]">Pending</span>
                              <div className="w-3 h-3 rounded-full border border-zinc-700" />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedDoc.expiration_date && (
                  <div>
                    <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1.5">Expiration</h3>
                    <p className="text-sm text-red-400 font-medium">{formatDate(selectedDoc.expiration_date)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 bg-zinc-900/50 backdrop-blur-md border-t border-zinc-800">
              <button 
                onClick={() => setSelectedDoc(null)}
                className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-all active:scale-95"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Documents
