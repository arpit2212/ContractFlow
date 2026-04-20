import React, { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import { usePandaDocTemplates } from '../hooks/usePandaDoc'
import { pandaDocAPI } from '../services/api'
import { useNavigate } from 'react-router-dom'

const SendContract: React.FC = () => {
  const navigate = useNavigate()
  const { templates, loading: templatesLoading, error: templatesError } = usePandaDocTemplates()
  
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
  const [templateDetails, setTemplateDetails] = useState<any>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [recipients, setRecipients] = useState<Record<string, { email: string, first_name: string, last_name: string }>>({})
  const [tokens, setTokens] = useState<Record<string, string>>({})
  const [subject, setSubject] = useState<string>('')
  const [message, setMessage] = useState<string>('')

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
      
      // Initialize recipients based on roles
      const initialRecipients: any = {}
      details.roles.forEach((role: any) => {
        initialRecipients[role.name] = { email: '', first_name: '', last_name: '' }
      })
      setRecipients(initialRecipients)

      // Initialize tokens
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

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    setError(null)

    try {
      const createPayload = {
        name: `${templateDetails.name} - ${new Date().toLocaleDateString()}`,
        template_uuid: selectedTemplateId,
        recipients: Object.entries(recipients).map(([role, data]) => ({
          ...data,
          role
        })),
        tokens: Object.entries(tokens).map(([name, value]) => ({
          name,
          value
        })),
        autonumbering_sequence_name_or_id: templateDetails.autonumbering_sequence_name_or_id
      }

      // 1. Create the document
      const createResponse = await pandaDocAPI.createDocument(createPayload)
      const documentId = createResponse.data.id

      // 2. Send the document with custom subject and message
      await pandaDocAPI.sendDocument(documentId, {
        subject,
        message,
        silent: false // Ensures the email is actually sent
      })

      navigate('/documents')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send contract')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex h-screen bg-black text-white overflow-hidden">
      <Sidebar />
      
      <main className="flex-1 flex flex-col overflow-y-auto bg-zinc-950 p-8">
        <div className="max-w-4xl mx-auto w-full">
          <header className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight mb-2">Send Contract</h1>
            <p className="text-zinc-500 text-sm">Create and send a new document from a template</p>
          </header>

          {error && (
            <div className="mb-6 p-4 bg-red-900/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-8">
            {/* Step 1: Select Template */}
            <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-xs">1</span>
                Select Template
              </h2>
              <select 
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-all"
                disabled={templatesLoading}
              >
                <option value="">Select a template...</option>
                {templates.map((t: any) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              {templatesLoading && <p className="text-xs text-zinc-500 mt-2">Loading templates...</p>}
            </section>

            {/* Step 2: Fill Details */}
            {loadingDetails ? (
              <div className="flex items-center justify-center p-12">
                <div className="w-8 h-8 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
              </div>
            ) : templateDetails && (
              <form onSubmit={handleSend} className="space-y-8">
                {/* Recipients */}
                <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-xs">2</span>
                    Recipients
                  </h2>
                  <div className="space-y-6">
                    {templateDetails.roles.map((role: any) => (
                      <div key={role.name} className="space-y-3">
                        <label className="text-sm font-medium text-zinc-400 block">{role.name}</label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <input
                            type="text"
                            placeholder="First Name"
                            required
                            className="bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/50"
                            value={recipients[role.name]?.first_name || ''}
                            onChange={(e) => handleRecipientChange(role.name, 'first_name', e.target.value)}
                          />
                          <input
                            type="text"
                            placeholder="Last Name"
                            required
                            className="bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/50"
                            value={recipients[role.name]?.last_name || ''}
                            onChange={(e) => handleRecipientChange(role.name, 'last_name', e.target.value)}
                          />
                          <input
                            type="email"
                            placeholder="Email Address"
                            required
                            className="bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/50"
                            value={recipients[role.name]?.email || ''}
                            onChange={(e) => handleRecipientChange(role.name, 'email', e.target.value)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Tokens / Variables */}
                {templateDetails.tokens.length > 0 && (
                  <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-xs">3</span>
                      Contract Details (Variables)
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {templateDetails.tokens.map((token: any) => (
                        <div key={token.name} className="space-y-2">
                          <label className="text-sm font-medium text-zinc-400 block">{token.name.replace(/_/g, ' ')}</label>
                          <input
                            type="text"
                            placeholder={`Value for ${token.name}`}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/50"
                            value={tokens[token.name] || ''}
                            onChange={(e) => handleTokenChange(token.name, e.target.value)}
                          />
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Email Settings */}
                <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-xs">4</span>
                    Email Settings
                  </h2>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-400 block">Email Subject</label>
                      <input
                        type="text"
                        placeholder="Enter email subject"
                        required
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/50"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-400 block">Email Message</label>
                      <textarea
                        placeholder="Enter your message to the recipient..."
                        required
                        rows={4}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/50 resize-none"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                      />
                    </div>
                  </div>
                </section>

                <div className="flex justify-end gap-4">
                  <button
                    type="button"
                    onClick={() => navigate('/documents')}
                    className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-sm font-semibold rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sending}
                    className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-sm font-semibold rounded-xl transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2"
                  >
                    {sending ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Sending...
                      </>
                    ) : (
                      'Create & Send Contract'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default SendContract
