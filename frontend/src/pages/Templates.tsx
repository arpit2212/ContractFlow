import React, { useState, useMemo } from 'react'
import Sidebar from '../components/Sidebar'
import { usePandaDocTemplates } from '../hooks/usePandaDoc'
import { pandaDocAPI } from '../services/api'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, 
  RefreshCw, 
  FileText, 
  AlertCircle,
  X,
  ExternalLink,
  Calendar,
  Send,
  Loader2,
  ChevronRight,
  Info
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const Templates: React.FC = () => {
  const { templates, loading: templatesLoading, error: templatesError, refetch: refetchTemplates } = usePandaDocTemplates()
  const navigate = useNavigate()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)

  const handleViewDetails = async (template: any) => {
    setSelectedTemplate(template)
    setLoadingDetails(true)
    try {
      const response = await pandaDocAPI.getTemplateDetails(template.id)
      setSelectedTemplate(response.data)
    } catch (err) {
      console.error('Failed to fetch template details:', err)
    } finally {
      setLoadingDetails(false)
    }
  }

  const filteredTemplates = useMemo(() => {
    const safeTemplates = templates || []
    if (!searchQuery) return safeTemplates
    return safeTemplates.filter((template) => 
      template?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [templates, searchQuery])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="flex h-screen bg-[#F9FAFB] text-gray-900 overflow-hidden font-sans">
      <Sidebar />
      
      <main className="flex-1 flex flex-col overflow-y-auto">
        <div className="max-w-7xl mx-auto w-full px-8 py-8 space-y-6">
          {/* Page Title Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Template Library</h1>
              <p className="text-gray-500 text-sm font-medium">Browse and manage your PandaDoc templates.</p>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={() => refetchTemplates()}
                className="p-2 text-gray-400 hover:text-[#1D9E75] hover:bg-gray-50 rounded-lg transition-all"
                title="Refresh Templates"
              >
                <RefreshCw className={`w-5 h-5 ${templatesLoading ? 'animate-spin' : ''}`} />
              </button>
              <div className="px-3 py-1.5 bg-[#E1F5EE] text-[#1D9E75] rounded-full text-xs font-bold border border-[#1D9E75]/10">
                {templates.length} Total
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <div className="relative w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search templates by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-11 pl-11 pr-4 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/20 focus:border-[#1D9E75] transition-all"
              />
            </div>
          </div>

          {/* Templates Grid/List */}
          <AnimatePresence mode="wait">
            <motion.div
              key={searchQuery}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {templatesError ? (
                <div className="bg-red-50 border border-red-100 rounded-2xl p-12 text-center">
                  <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Failed to load templates</h3>
                  <p className="text-gray-500 max-w-md mx-auto mb-6">There was an error connecting to PandaDoc. Please check your API configuration or try again.</p>
                  <button 
                    onClick={() => refetchTemplates()}
                    className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-all shadow-sm"
                  >
                    Try Again
                  </button>
                </div>
              ) : filteredTemplates.length === 0 && !templatesLoading ? (
                <div className="bg-white border border-gray-100 rounded-2xl p-20 text-center shadow-sm">
                  <div className="w-20 h-20 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mx-auto mb-6">
                    <FileText className="w-10 h-10" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No templates found</h3>
                  <p className="text-gray-500 max-w-sm mx-auto font-medium">
                    {searchQuery ? `We couldn't find any templates matching "${searchQuery}"` : "You don't have any templates in your PandaDoc library yet."}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredTemplates.map((template) => (
                    <motion.div
                      key={template.id}
                      whileHover={{ y: -4 }}
                      className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 bg-gray-50 text-[#1D9E75] rounded-xl flex items-center justify-center group-hover:bg-[#E1F5EE] transition-colors">
                          <FileText className="w-6 h-6" />
                        </div>
                        <button 
                          onClick={() => handleViewDetails(template)}
                          className="p-2 text-gray-400 hover:text-[#1D9E75] transition-colors"
                        >
                          <Info className="w-5 h-5" />
                        </button>
                      </div>
                      
                      <h3 className="font-bold text-gray-900 mb-1 group-hover:text-[#1D9E75] transition-colors truncate" title={template.name}>
                        {template.name}
                      </h3>
                      
                      <div className="flex items-center gap-2 text-xs text-gray-400 font-medium mb-6">
                        <Calendar className="w-3.5 h-3.5" />
                        Created {formatDate(template.date_created)}
                      </div>

                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => navigate(`/send-contract?templateId=${template.id}`)}
                          className="flex-1 h-10 bg-[#E1F5EE] text-[#1D9E75] hover:bg-[#1D9E75] hover:text-white rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2"
                        >
                          <Send className="w-3.5 h-3.5" />
                          Use Template
                        </button>
                        <a 
                          href={`https://app.pandadoc.com/a/#/templates/${template.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-10 h-10 bg-gray-50 text-gray-400 hover:text-[#1D9E75] hover:bg-[#E1F5EE] rounded-xl flex items-center justify-center transition-all"
                          title="Open in PandaDoc"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Details Modal */}
      <AnimatePresence>
        {selectedTemplate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTemplate(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#E1F5EE] text-[#1D9E75] rounded-2xl flex items-center justify-center">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selectedTemplate.name}</h2>
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-widest mt-0.5">Template Details</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedTemplate(null)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-all text-gray-400"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-8 space-y-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
                {loadingDetails ? (
                  <div className="py-20 flex flex-col items-center justify-center space-y-4">
                    <Loader2 className="w-8 h-8 text-[#1D9E75] animate-spin" />
                    <p className="text-sm font-bold text-gray-400">Loading details...</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Template ID</p>
                        <p className="text-sm font-medium text-gray-700 font-mono bg-gray-50 px-2 py-1 rounded inline-block">
                          {selectedTemplate.id}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Created Date</p>
                        <p className="text-sm font-medium text-gray-700">{formatDate(selectedTemplate.date_created)}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Roles</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedTemplate.roles?.map((role: any) => (
                          <div key={role.name} className="px-3 py-1.5 bg-[#E1F5EE] text-[#1D9E75] rounded-lg text-xs font-bold border border-[#1D9E75]/10">
                            {role.name}
                          </div>
                        ))}
                        {(!selectedTemplate.roles || selectedTemplate.roles.length === 0) && (
                          <p className="text-sm text-gray-400 italic">No specific roles defined</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tokens / Variables</p>
                      <div className="grid grid-cols-2 gap-3">
                        {selectedTemplate.tokens?.map((token: any) => (
                          <div key={token.name} className="p-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold text-gray-600 truncate">
                            {token.name}
                          </div>
                        ))}
                        {(!selectedTemplate.tokens || selectedTemplate.tokens.length === 0) && (
                          <p className="text-sm text-gray-400 italic">No variables found in this template</p>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="p-8 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-4">
                <button 
                  onClick={() => setSelectedTemplate(null)}
                  className="px-6 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-700 transition-all"
                >
                  Close
                </button>
                <a 
                  href={`https://app.pandadoc.com/a/#/templates/${selectedTemplate.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl font-bold text-sm shadow-sm transition-all flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open in PandaDoc
                </a>
                <button 
                  onClick={() => {
                    navigate(`/send-contract?templateId=${selectedTemplate.id}`)
                    setSelectedTemplate(null)
                  }}
                  className="px-8 py-2.5 bg-[#1D9E75] hover:bg-[#0F6E56] text-white rounded-xl font-bold text-sm shadow-lg shadow-[#1D9E75]/20 transition-all flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Use this Template
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Templates
