import React, { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import { usePandaDocTemplates } from '../hooks/usePandaDoc'
import { pandaDocAPI } from '../services/api'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Send, 
  ChevronRight, 
  FileText, 
  Users, 
  Variable, 
  Mail, 
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Plus,
  X
} from 'lucide-react'

const SendContract: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const templateIdFromUrl = searchParams.get('templateId')
  const { templates, loading: templatesLoading } = usePandaDocTemplates()
  
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(templateIdFromUrl || '')
  const [templateDetails, setTemplateDetails] = useState<any>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [recipients, setRecipients] = useState<Record<string, { email: string, first_name: string, last_name: string }>>({})
  const [tokens, setTokens] = useState<Record<string, string>>({})
  const [subject, setSubject] = useState<string>('')
  const [message, setMessage] = useState<string>('')
  const [activeField, setActiveField] = useState<'subject' | 'message'>('message')

  const insertPlaceholder = (placeholder: string) => {
    if (activeField === 'subject') {
      setSubject(prev => prev.endsWith(' ') || prev === '' ? prev + placeholder : prev + ' ' + placeholder)
    } else {
      setMessage(prev => prev.endsWith(' ') || prev === '' ? prev + placeholder : prev + ' ' + placeholder)
    }
  }

  useEffect(() => {
    if (selectedTemplateId) {
      fetchDetails(selectedTemplateId)
    }
  }, [selectedTemplateId])

  const fetchDetails = async (id: string) => {
    setLoadingDetails(true)
    setError(null)
    try {
      const response = await pandaDocAPI.getTemplateDetails(id)
      const details = response.data
      setTemplateDetails(details)
      setSubject(`Contract: ${details.name}`)
      setMessage(`Hello,\n\nPlease review and sign the ${details.name}.`)
      
      const initialRecipients: any = {}
      details.roles.forEach((role: any) => {
        initialRecipients[role.name] = { email: '', first_name: '', last_name: '' }
      })
      setRecipients(initialRecipients)

      const initialTokens: any = {}
      details.tokens.forEach((token: any) => {
        initialTokens[token.name] = ''
      })
      setTokens(initialTokens)

    } catch (err: any) {
      setError('Failed to fetch template details')
      console.error(err)
    } finally {
      setLoadingDetails(false)
    }
  }

  const handleRecipientChange = (role: string, field: string, value: string) => {
    setRecipients(prev => ({
      ...prev,
      [role]: { ...prev[role], [field]: value }
    }))
  }

  const handleTokenChange = (name: string, value: string) => {
    setTokens(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const replacePlaceholders = (text: string) => {
    let result = text
    // Replace role-based placeholders like [Signer.first_name] or [Signer.first name]
    Object.entries(recipients).forEach(([role, data]) => {
      // Standard role.field
      result = result.replace(new RegExp(`\\[${role}\\.first_name\\]`, 'gi'), data.first_name || '')
      result = result.replace(new RegExp(`\\[${role}\\.last_name\\]`, 'gi'), data.last_name || '')
      result = result.replace(new RegExp(`\\[${role}\\.email\\]`, 'gi'), data.email || '')
      
      // Role.field with spaces
      result = result.replace(new RegExp(`\\[${role}\\.first name\\]`, 'gi'), data.first_name || '')
      result = result.replace(new RegExp(`\\[${role}\\.last name\\]`, 'gi'), data.last_name || '')
      result = result.replace(new RegExp(`\\[${role}\\.email address\\]`, 'gi'), data.email || '')
      
      // Also support shorthand if there's only one recipient or for convenience
      if (Object.keys(recipients).length === 1) {
        result = result.replace(/\[first_name\]/gi, data.first_name || '')
        result = result.replace(/\[last_name\]/gi, data.last_name || '')
        result = result.replace(/\[email\]/gi, data.email || '')
        
        result = result.replace(/\[first name\]/gi, data.first_name || '')
        result = result.replace(/\[last name\]/gi, data.last_name || '')
        result = result.replace(/\[email address\]/gi, data.email || '')
        result = result.replace(/\[email adress\]/gi, data.email || '') // Handle typo from user input
      }
    })
    // Replace tokens
    Object.entries(tokens).forEach(([name, value]) => {
      result = result.replace(new RegExp(`\\[${name}\\]`, 'gi'), value || '')
      // Also support tokens with spaces if they are usually stored with underscores
      result = result.replace(new RegExp(`\\[${name.replace(/_/g, ' ')}\\]`, 'gi'), value || '')
    })
    return result
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    setError(null)

    try {
      const firstRecipient = Object.values(recipients)[0]
      const recipientName = firstRecipient ? `${firstRecipient.first_name} ${firstRecipient.last_name}`.trim() : ''
      const docName = recipientName ? `${recipientName} - Contract` : `Contract - ${new Date().toLocaleDateString()}`

      // Separate main recipients and CC recipients
      const mainRecipients = Object.entries(recipients).map(([role, data]) => ({
        ...data,
        role
      }))

      const payload = {
        name: docName,
        template_uuid: selectedTemplateId,
        recipients: mainRecipients,
        metadata: {
          primary_recipient: firstRecipient?.email || ''
        },
        tokens: Object.entries(tokens).map(([name, value]) => ({
          name,
          value
        })),
        autonumbering_sequence_name_or_id: templateDetails.autonumbering_sequence_name_or_id,
        subject: replacePlaceholders(subject),
        message: replacePlaceholders(message)
      }

      await pandaDocAPI.createAndSendDocument(payload)
      navigate('/documents')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send contract')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex h-screen bg-[#F9FAFB] text-gray-900 overflow-hidden font-sans">
      <Sidebar />
      
      <main className="flex-1 flex flex-col overflow-y-auto">
        <div className="max-w-4xl mx-auto w-full px-8 py-10 space-y-8">
          <header className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">Send Contract</h1>
              <p className="text-gray-500 text-sm font-medium">Configure and send a new document from your PandaDoc templates.</p>
            </div>
            <button 
              onClick={() => navigate('/documents')}
              className="px-4 py-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-bold rounded-xl transition-all shadow-sm"
            >
              Cancel
            </button>
          </header>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm flex items-center gap-3"
              >
                <AlertCircle className="w-5 h-5 shrink-0" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-8 pb-20">
            {/* Step 1: Select Template */}
            <motion.section 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-[#E1F5EE] text-[#1D9E75] font-bold text-sm">
                  1
                </div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#1D9E75]" />
                  Choose Template
                </h2>
              </div>
              
              <div className="relative">
                <select 
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 h-12 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/20 focus:border-[#1D9E75] transition-all appearance-none cursor-pointer font-medium"
                  disabled={templatesLoading}
                >
                  <option value="">Select a template...</option>
                  {templates.map((t: any) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  <ChevronRight className="w-5 h-5 rotate-90" />
                </div>
              </div>
              {templatesLoading && (
                <div className="flex items-center gap-2 mt-3 text-xs text-gray-400 font-medium">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Refreshing templates from PandaDoc...
                </div>
              )}
            </motion.section>

            {/* Step 2 & 3 & 4 */}
            <AnimatePresence>
              {loadingDetails ? (
                <div className="flex flex-col items-center justify-center p-20 space-y-4">
                  <div className="w-10 h-10 border-4 border-[#1D9E75]/20 border-t-[#1D9E75] rounded-full animate-spin" />
                  <p className="text-sm font-bold text-gray-400">Fetching template fields...</p>
                </div>
              ) : templateDetails && (
                <motion.form 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  onSubmit={handleSend} 
                  className="space-y-8"
                >
                  {/* Recipients */}
                  <section className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-[#E1F5EE] text-[#1D9E75] font-bold text-sm">
                        2
                      </div>
                      <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Users className="w-5 h-5 text-[#1D9E75]" />
                        Recipients
                      </h2>
                    </div>

                    <div className="space-y-10">
                      {templateDetails.roles.map((role: any) => (
                        <div key={role.name} className="space-y-4">
                          <div className="flex items-center gap-2">
                            <span className="px-3 py-1 bg-gray-50 border border-gray-100 rounded-lg text-xs font-bold text-[#1D9E75] uppercase tracking-wider">
                              {role.name}
                            </span>
                            <div className="h-px bg-gray-50 flex-1"></div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            <div className="space-y-1.5">
                              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">First Name</label>
                              <input
                                type="text"
                                placeholder="John"
                                required
                                className="w-full h-11 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/20 focus:border-[#1D9E75] transition-all"
                                value={recipients[role.name]?.first_name || ''}
                                onChange={(e) => handleRecipientChange(role.name, 'first_name', e.target.value)}
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Last Name</label>
                              <input
                                type="text"
                                placeholder="Doe"
                                required
                                className="w-full h-11 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/20 focus:border-[#1D9E75] transition-all"
                                value={recipients[role.name]?.last_name || ''}
                                onChange={(e) => handleRecipientChange(role.name, 'last_name', e.target.value)}
                              />
                            </div>
                            <div className="space-y-1.5 md:col-span-2 lg:col-span-1">
                              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
                              <input
                                type="email"
                                placeholder="john@example.com"
                                required
                                className="w-full h-11 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/20 focus:border-[#1D9E75] transition-all"
                                value={recipients[role.name]?.email || ''}
                                onChange={(e) => handleRecipientChange(role.name, 'email', e.target.value)}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Tokens / Variables */}
                  {templateDetails.tokens.length > 0 && (
                    <section className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm">
                      <div className="flex items-center gap-3 mb-8">
                        <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-[#E1F5EE] text-[#1D9E75] font-bold text-sm">
                          3
                        </div>
                        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                          <Variable className="w-5 h-5 text-[#1D9E75]" />
                          Contract Variables
                        </h2>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
                        {templateDetails.tokens.map((token: any) => (
                          <div key={token.name} className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">{token.name.replace(/_/g, ' ')}</label>
                            <input
                              type="text"
                              placeholder={`Enter ${token.name.replace(/_/g, ' ')}`}
                              className="w-full h-11 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/20 focus:border-[#1D9E75] transition-all"
                              value={tokens[token.name] || ''}
                              onChange={(e) => handleTokenChange(token.name, e.target.value)}
                            />
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Email Settings */}
                  <section className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-[#E1F5EE] text-[#1D9E75] font-bold text-sm">
                        4
                      </div>
                      <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Mail className="w-5 h-5 text-[#1D9E75]" />
                        Email Customization
                      </h2>
                    </div>

                    <div className="space-y-8">
                      <div className="space-y-6">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Email Subject</label>
                          </div>
                          <input
                            type="text"
                            placeholder="Please sign this agreement"
                            required
                            className={`w-full h-11 bg-gray-50 border ${activeField === 'subject' ? 'border-[#1D9E75] ring-2 ring-[#1D9E75]/10' : 'border-gray-200'} rounded-xl px-4 text-sm focus:outline-none transition-all`}
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            onFocus={() => setActiveField('subject')}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Message for Recipient</label>
                          </div>
                          <textarea
                            placeholder="Hello, please review and sign this document at your earliest convenience."
                            required
                            rows={4}
                            className={`w-full bg-gray-50 border ${activeField === 'message' ? 'border-[#1D9E75] ring-2 ring-[#1D9E75]/10' : 'border-gray-200'} rounded-xl px-4 py-3 text-sm focus:outline-none transition-all resize-none`}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onFocus={() => setActiveField('message')}
                          />
                        </div>
                      </div>

                      {/* Variables Helper */}
                      <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            Available Placeholders 
                            <span className="ml-2 text-[9px] font-medium normal-case text-gray-400">
                              (Inserting into <span className="text-[#1D9E75] font-bold uppercase">{activeField}</span>)
                            </span>
                          </p>
                          <p className="text-[9px] text-[#1D9E75] font-medium italic">Click to insert at end</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {templateDetails.roles.map((role: any) => (
                            <div key={role.name} className="flex flex-wrap gap-2">
                              <button 
                                type="button"
                                onClick={() => insertPlaceholder(`[${role.name}.first name]`)}
                                className="text-[10px] bg-white border border-gray-200 px-2 py-1 rounded text-[#1D9E75] font-bold hover:border-[#1D9E75] transition-all"
                              >
                                [{role.name}.first name]
                              </button>
                              <button 
                                type="button"
                                onClick={() => insertPlaceholder(`[${role.name}.last name]`)}
                                className="text-[10px] bg-white border border-gray-200 px-2 py-1 rounded text-[#1D9E75] font-bold hover:border-[#1D9E75] transition-all"
                              >
                                [{role.name}.last name]
                              </button>
                              <button 
                                type="button"
                                onClick={() => insertPlaceholder(`[${role.name}.email]`)}
                                className="text-[10px] bg-white border border-gray-200 px-2 py-1 rounded text-[#1D9E75] font-bold hover:border-[#1D9E75] transition-all"
                              >
                                [{role.name}.email]
                              </button>
                            </div>
                          ))}
                          {templateDetails.tokens.map((token: any) => (
                            <button 
                              key={token.name}
                              type="button"
                              onClick={() => insertPlaceholder(`[${token.name}]`)}
                              className="text-[10px] bg-white border border-gray-200 px-2 py-1 rounded text-[#1D9E75] font-bold hover:border-[#1D9E75] transition-all"
                            >
                              [{token.name}]
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Final Actions */}
                  <div className="flex items-center justify-end gap-4 pt-4">
                    <button
                      type="button"
                      onClick={() => navigate('/documents')}
                      className="px-8 h-12 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-all shadow-sm"
                    >
                      Discard
                    </button>
                    <button
                      type="submit"
                      disabled={sending}
                      className="px-10 h-12 bg-[#1D9E75] hover:bg-[#0F6E56] text-white font-bold rounded-xl shadow-lg shadow-[#1D9E75]/20 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {sending ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          Send Contract
                        </>
                      )}
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  )
}

export default SendContract
