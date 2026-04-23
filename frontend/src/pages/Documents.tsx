import React, { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import { usePandaDocDocuments, usePandaDocAnalytics } from '../hooks/usePandaDoc'
import { pandaDocAPI } from '../services/api'
import DocumentsTable from '../components/DocumentsTable'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, 
  Filter, 
  Plus, 
  RefreshCw, 
  Link as LinkIcon, 
  ChevronRight,
  FileText,
  AlertCircle,
  X,
  ExternalLink,
  Calendar,
  Mail,
  User
} from 'lucide-react'
import type { PandaDocDocument } from '../types/pandadoc'
import StatusBadge from '../components/StatusBadge'

const Documents: React.FC = () => {
  const { documents, loading: docsLoading, error: docsError, refetch: refetchDocs } = usePandaDocDocuments()
  const { analytics, loading: analyticsLoading, error: analyticsError, refetch: refetchAnalytics } = usePandaDocAnalytics()
  
  const [searchParams, setSearchParams] = useSearchParams()
  const [filter, setFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [connecting, setConnecting] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState<PandaDocDocument | null>(null)
  const [loadingSelected, setLoadingSelected] = useState(false)

  // Helper to safely get recipients array
  const getRecipients = (doc: any): PandaDocRecipient[] => {
    if (!doc) return []
    if (Array.isArray(doc.recipients)) return doc.recipients
    if (doc.recipients && typeof doc.recipients === 'object') return [doc.recipients as PandaDocRecipient]
    if (Array.isArray(doc.contacts)) return doc.contacts
    return []
  }

  const handleViewDetails = async (doc: PandaDocDocument) => {
    setSelectedDoc(doc)
    setLoadingSelected(true)
    try {
      const response = await pandaDocAPI.getDocumentDetails(doc.id)
      setSelectedDoc(response.data)
    } catch (err) {
      console.error('Failed to fetch document details:', err)
    } finally {
      setLoadingSelected(false)
    }
  }
  useEffect(() => {
    const code = searchParams.get('code')
    if (code) {
      const handleCallback = async () => {
        try {
          await pandaDocAPI.callback(code)
          setSearchParams({})
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
    let filtered = documents
    if (filter !== 'all') {
      filtered = filtered.filter((doc) => doc.status === `document.${filter}`)
    }
    if (searchQuery) {
      filtered = filtered.filter((doc) => 
        doc.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    return filtered
  }, [documents, filter, searchQuery])

  const filters = ['all', 'draft', 'sent', 'viewed', 'completed', 'declined']

  return (
    <div className="flex h-screen bg-[#F9FAFB] text-gray-900 overflow-hidden font-sans">
      <Sidebar />
      
      <main className="flex-1 flex flex-col overflow-y-auto">
        <div className="max-w-7xl mx-auto w-full px-8 py-8 space-y-6">
          {/* Page Title Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Document Library</h1>
              <p className="text-gray-500 text-sm font-medium">Manage and track your PandaDoc agreements in real-time.</p>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={() => {
                  refetchDocs()
                  refetchAnalytics()
                }}
                className="p-2 text-gray-400 hover:text-[#1D9E75] hover:bg-gray-50 rounded-lg transition-all"
                title="Refresh Data"
              >
                <RefreshCw className={`w-5 h-5 ${docsLoading ? 'animate-spin' : ''}`} />
              </button>
              <div className="px-3 py-1.5 bg-[#E1F5EE] text-[#1D9E75] rounded-full text-xs font-bold border border-[#1D9E75]/10">
                {documents.length} Total
              </div>
            </div>
          </div>

          {/* Search and Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search documents by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-11 pl-11 pr-4 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/20 focus:border-[#1D9E75] transition-all"
              />
            </div>
            
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl border border-gray-100 overflow-x-auto no-scrollbar">
                {filters.map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-4 py-2 rounded-lg text-xs font-bold capitalize transition-all whitespace-nowrap ${
                      filter === f 
                        ? 'bg-white text-[#1D9E75] shadow-sm' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Documents Table Section */}
          <AnimatePresence mode="wait">
            <motion.div
              key={filter + searchQuery}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {docsError ? (
                <div className="bg-red-50 border border-red-100 rounded-2xl p-12 text-center">
                  <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Failed to load documents</h3>
                  <p className="text-gray-500 max-w-md mx-auto mb-6">There was an error connecting to PandaDoc. Please check your API configuration or try again.</p>
                  <button 
                    onClick={() => refetchDocs()}
                    className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-all shadow-sm"
                  >
                    Try Again
                  </button>
                </div>
              ) : filteredDocuments.length === 0 ? (
                <div className="bg-white border border-gray-100 rounded-2xl p-20 text-center shadow-sm">
                  <div className="w-20 h-20 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mx-auto mb-6">
                    <FileText className="w-10 h-10" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No documents found</h3>
                  <p className="text-gray-500 max-w-sm mx-auto mb-8 font-medium">
                    {searchQuery && `We couldn't find any documents matching "${searchQuery}"`}
                  </p>
                </div>
              ) : (
                <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                  <DocumentsTable 
                    documents={filteredDocuments} 
                    loading={docsLoading} 
                    onViewDetails={handleViewDetails}
                  />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Document Details Side Panel */}
      <AnimatePresence>
        {selectedDoc && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedDoc(null)}
              className="absolute inset-0 bg-gray-900/20 backdrop-blur-[2px]"
            />
            
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-lg bg-white h-full shadow-[-20px_0_50px_rgba(0,0,0,0.05)] border-l border-gray-100 flex flex-col"
            >
              <div className="p-8 flex-1 overflow-y-auto">
                <div className="flex items-start justify-between mb-10">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-[#E1F5EE] flex items-center justify-center text-[#1D9E75] shrink-0">
                      {loadingSelected ? (
                        <RefreshCw className="w-7 h-7 animate-spin" />
                      ) : (
                        <FileText className="w-7 h-7" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-xl font-bold text-gray-900 tracking-tight truncate">{selectedDoc.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <StatusBadge status={selectedDoc.status} size="sm" />
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">ID: {selectedDoc.id.slice(0, 8)}...</span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedDoc(null)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl transition-all shrink-0"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {loadingSelected ? (
                  <div className="flex flex-col items-center justify-center py-20 space-y-4">
                    <div className="w-10 h-10 border-4 border-[#1D9E75]/20 border-t-[#1D9E75] rounded-full animate-spin" />
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Fetching document details...</p>
                  </div>
                ) : (
                  <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <section className="space-y-6">
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-50 pb-2">Information</h4>
                      <div className="grid grid-cols-1 gap-6">
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <Calendar className="w-3 h-3" /> Created Date
                          </p>
                          <p className="text-sm font-bold text-gray-800">
                            {new Date(selectedDoc.date_created).toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                        
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <RefreshCw className="w-3 h-3" /> Last Updated
                          </p>
                          <p className="text-sm font-bold text-gray-800">
                            {new Date(selectedDoc.date_modified).toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                    </section>

                    <section className="space-y-6">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-50 pb-2">Recipients ({getRecipients(selectedDoc).length})</h4>
                    <div className="space-y-3">
                      {getRecipients(selectedDoc).length > 0 ? (
                        getRecipients(selectedDoc).map((recipient, i) => (
                          <div key={i} className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100 group hover:bg-white hover:shadow-md transition-all duration-300">
                            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#1D9E75] border border-gray-100 shadow-sm group-hover:border-[#1D9E75]/20">
                              <Mail className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-gray-900 truncate">{recipient.email || 'No email provided'}</p>
                              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
                                {recipient.first_name || recipient.last_name 
                                  ? `${recipient.first_name || ''} ${recipient.last_name || ''}`.trim() 
                                  : recipient.role || 'Recipient'}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="space-y-4">
                          <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">No recipients found</p>
                          </div>
                          {selectedDoc.created_by && (
                            <div className="space-y-3">
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Document Creator</p>
                              <div className="flex items-center gap-3 p-4 bg-[#E1F5EE]/30 rounded-2xl border border-[#1D9E75]/10 group hover:bg-white hover:shadow-md transition-all duration-300">
                                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#1D9E75] border border-gray-100 shadow-sm group-hover:border-[#1D9E75]/20">
                                  <User className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-bold text-gray-900 truncate">{selectedDoc.created_by.email}</p>
                                  <p className="text-[10px] text-[#1D9E75] font-black uppercase tracking-tighter">Admin / Owner</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </section>
                  </div>
                )}
              </div>

              <div className="p-8 bg-gray-50/50 border-t border-gray-100 flex flex-col gap-3">
                <a 
                  href={`https://app.pandadoc.com/a/#/documents/${selectedDoc.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-3 h-14 bg-[#1D9E75] hover:bg-[#0F6E56] text-white text-sm font-black rounded-2xl shadow-xl shadow-[#1D9E75]/20 transition-all uppercase tracking-widest"
                >
                  Open in PandaDoc
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button 
                  onClick={() => setSelectedDoc(null)}
                  className="w-full h-14 bg-white border border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50 text-sm font-black rounded-2xl transition-all uppercase tracking-widest shadow-sm"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Documents

