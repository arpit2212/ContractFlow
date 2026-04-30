import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Sidebar from '../components/Sidebar'
import { usePandaDocAnalytics, usePandaDocDocuments } from '../hooks/usePandaDoc'
import { usePandaDocApiKey } from '../hooks/usePandaDocApiKey'
import { motion } from 'framer-motion'
import { 
  Key, 
  Eye, 
  EyeOff, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  FileStack,
  AlertCircle,
  ExternalLink,
  Send,
  FileText,
  Activity,
  ChevronRight
} from 'lucide-react'

const Dashboard: React.FC = () => {
  const { user, loading } = useAuth()
  const { analytics, loading: analyticsLoading } = usePandaDocAnalytics()
  const { documents, loading: documentsLoading } = usePandaDocDocuments()
  const { apiKey, isConfigured, setApiKey, removeApiKey } = usePandaDocApiKey()
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)

  const handleSaveApiKey = (e: React.FormEvent) => {
    e.preventDefault()
    if (apiKeyInput.trim()) {
      setApiKey(apiKeyInput.trim())
      setApiKeyInput('')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f2f2f2]">
        <div className="w-10 h-10 border-4 border-[#1D9E75]/20 border-t-[#1D9E75] rounded-full animate-spin" />
      </div>
    )
  }

  const cardVariants = {
    hover: { 
      y: -8,
      transition: { duration: 0.3, ease: "easeOut" }
    }
  }

  return (
    <div className="flex h-screen bg-[#f2f2f2] text-gray-900 overflow-hidden font-sans">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-y-auto">
        <div className="max-w-7xl mx-auto w-full px-8 py-6 space-y-8">
          {/* Welcome Header */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center justify-between"
          >
            <div>
              <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                Welcome back, <span className="text-[#1D9E75]">{user?.user_metadata?.full_name?.split(' ')[0] || 'User'}</span>
              </h2>
              <p className="text-gray-400 text-sm font-medium">Monitor your document lifecycle and vault activity.</p>
            </div>
          </motion.div>

          {/* Metric Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { 
                label: 'Total Vault Documents', 
                value: analytics?.total, 
                icon: <FileStack className="w-6 h-6" />, 
                color: 'blue', 
                accent: 'bg-blue-500',
                shadow: 'hover:shadow-blue-500/10'
              },
              { 
                label: 'Completed & Signed', 
                value: analytics?.completed, 
                icon: <CheckCircle2 className="w-6 h-6" />, 
                color: 'teal', 
                accent: 'bg-[#1D9E75]',
                shadow: 'hover:shadow-[#1D9E75]/10'
              },
              { 
                label: 'Pending Requirements', 
                value: (analytics?.total ?? 0) - (analytics?.completed ?? 0), 
                icon: <Clock className="w-6 h-6" />, 
                color: 'amber', 
                accent: 'bg-amber-500',
                shadow: 'hover:shadow-amber-500/10'
              }
            ].map((stat, idx) => (
              <motion.div
                key={stat.label}
                variants={cardVariants}
                whileHover="hover"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`bg-white rounded-[2rem] p-8 border border-white shadow-[0_10px_30px_rgba(0,0,0,0.03)] flex flex-col gap-6 relative overflow-hidden group transition-shadow ${stat.shadow} hover:shadow-2xl`}
              >
                <div className={`absolute top-0 left-0 w-full h-1.5 ${stat.accent}`} />
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-gray-50 text-gray-400 group-hover:bg-[#E1F5EE] group-hover:text-[#1D9E75] transition-all duration-300`}>
                  {stat.icon}
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                  <p className="text-3xl font-black text-gray-900">
                    {!isConfigured ? '—' : (analyticsLoading ? '...' : stat.value)}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* PandaDoc API Key Section */}
            <div className="lg:col-span-2 space-y-8">
              <motion.div 
                whileHover={{ y: -5 }}
                className="bg-white rounded-[2.5rem] border border-white p-10 shadow-[0_10px_40px_rgba(0,0,0,0.03)] hover:shadow-2xl transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-10">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-[#E1F5EE] rounded-2xl">
                      <Key className="w-6 h-6 text-[#1D9E75]" />
                    </div>
                    <div>
                      <h3 className="text-xl font-extrabold text-gray-900">Vault Integration</h3>
                      <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">PandaDoc Secure API</p>
                    </div>
                  </div>
                  {isConfigured && (
                    <span className="flex items-center gap-2 px-4 py-1.5 bg-green-50 text-green-700 text-[10px] font-black rounded-full border border-green-100 uppercase tracking-widest">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      Encrypted & Active
                    </span>
                  )}
                </div>

                {isConfigured ? (
                  <div className="space-y-6">
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between group">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Access Token</p>
                        <p className="text-gray-900 font-mono text-xs tracking-tighter bg-white px-3 py-1 rounded-lg border border-gray-100">
                          {showApiKey ? apiKey : '••••••••••••••••••••' + apiKey.slice(-6)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="p-2 text-gray-400 hover:text-[#1D9E75] hover:bg-white rounded-lg border border-transparent hover:border-gray-100 transition-all shadow-sm"
                        >
                          {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={removeApiKey}
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-100 transition-all shadow-sm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-4 bg-blue-50/30 rounded-xl border border-blue-100/30">
                      <div className="p-1.5 bg-white rounded-md shadow-sm">
                        <AlertCircle className="w-3.5 h-3.5 text-blue-500" />
                      </div>
                      <p className="text-[10px] text-blue-700/70 leading-relaxed font-bold">
                        Security Notice: Your API key is hashed and stored in your local vault. It is never transmitted or visible to our backend systems.
                      </p>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSaveApiKey} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] ml-1">
                        Production API Key
                      </label>
                      <input
                        type="password"
                        value={apiKeyInput}
                        onChange={(e) => setApiKeyInput(e.target.value)}
                        placeholder="Paste your PandaDoc production key..."
                        className="w-full h-11 bg-gray-50 border border-gray-200 rounded-xl px-4 text-xs focus:outline-none focus:ring-4 focus:ring-[#1D9E75]/5 focus:border-[#1D9E75] transition-all font-medium"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={!apiKeyInput.trim()}
                      className="w-full h-11 bg-[#1D9E75] hover:bg-[#0F6E56] disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed text-white text-[10px] font-black rounded-xl shadow-lg shadow-[#1D9E75]/10 transition-all uppercase tracking-widest"
                    >
                      Authorize Connection
                    </button>
                    <p className="text-gray-400 text-[10px] text-center font-bold uppercase tracking-widest">
                      Missing your key?{' '}
                      <a
                        href="https://app.pandadoc.com/a/#/api-dashboard/configuration"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#1D9E75] hover:underline"
                      >
                        Visit PandaDoc Settings
                      </a>
                    </p>
                  </form>
                )}
              </motion.div>
            </div>

            {/* Recent Activity / Side Card */}
            <div className="space-y-8">
              <motion.div 
                whileHover={{ y: -5 }}
                className="bg-white rounded-[2.5rem] border border-white p-8 shadow-[0_10px_40px_rgba(0,0,0,0.03)] hover:shadow-2xl transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <Activity className="w-5 h-5 text-[#1D9E75]" />
                    <h3 className="font-extrabold text-gray-900 tracking-tight">Recent Activity</h3>
                  </div>
                  <Link to="/documents" className="text-[10px] font-black text-[#1D9E75] uppercase tracking-widest hover:text-[#0F6E56]">View All</Link>
                </div>
                
                <div className="space-y-6">
                  {analyticsLoading || documentsLoading ? (
                    [...Array(3)].map((_, i) => (
                      <div key={i} className="flex gap-4 animate-pulse">
                        <div className="w-12 h-12 bg-gray-100 rounded-2xl shrink-0" />
                        <div className="space-y-2 flex-1">
                          <div className="h-3 bg-gray-100 rounded w-3/4" />
                          <div className="h-2 bg-gray-50 rounded w-1/2" />
                        </div>
                      </div>
                    ))
                  ) : !isConfigured ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileStack className="w-8 h-8 text-gray-200" />
                      </div>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-widest italic">No activity logs</p>
                    </div>
                  ) : (documents || []).length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileStack className="w-8 h-8 text-gray-200" />
                      </div>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-widest italic">No documents found</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {(documents || []).slice(0, 3).map((doc) => {
                        const statusLabel = doc.status.replace('document.', '').replace('_', ' ')
                        const timeStr = new Date(doc.date_created).toLocaleDateString()
                        
                        return (
                          <div key={doc.id} className="flex items-center gap-4 group cursor-pointer p-2 rounded-2xl hover:bg-gray-50 transition-colors">
                            <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-[#E1F5EE] group-hover:text-[#1D9E75] transition-all">
                              <FileText className="w-6 h-6" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-gray-900 truncate group-hover:text-[#1D9E75] transition-colors">{doc.name}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter ${
                                  doc.status === 'document.completed' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'
                                }`}>
                                  {statusLabel}
                                </span>
                                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">• {timeStr}</span>
                                {(doc.recipients?.[0]?.email || doc.metadata?.primary_recipient) && (
                                  <span className="text-[9px] text-gray-400 font-medium truncate max-w-[120px]">
                                    • {doc.recipients?.[0]?.email || doc.metadata?.primary_recipient}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </motion.div>

              </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Dashboard
