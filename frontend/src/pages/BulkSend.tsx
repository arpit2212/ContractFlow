import React, { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import { usePandaDocTemplates } from '../hooks/usePandaDoc'
import { pandaDocAPI } from '../services/api'
import { useNavigate } from 'react-router-dom'

const BulkSend: React.FC = () => {
  const navigate = useNavigate()
  const { templates, loading: templatesLoading } = usePandaDocTemplates()
  
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
  const [templateDetails, setTemplateDetails] = useState<any>(null)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sendMode, setSendMode] = useState<'csv' | 'manual'>('manual')
  const [progress, setProgress] = useState<{ current: number, total: number, status: string } | null>(null)
  const [results, setResults] = useState<{ id: number, name: string, status: 'success' | 'error', error?: string }[]>([])

  // Bulk data state
  const [bulkRecipients, setBulkRecipients] = useState<any[]>([])
  const [subjectTemplate, setSubjectTemplate] = useState<string>('')
  const [messageTemplate, setMessageTemplate] = useState<string>('')

  useEffect(() => {
    if (selectedTemplateId) {
      fetchDetails(selectedTemplateId)
    }
  }, [selectedTemplateId])

  const fetchDetails = async (id: string) => {
    setError(null)
    try {
      const response = await pandaDocAPI.getTemplateDetails(id)
      const details = response.data
      setTemplateDetails(details)
      setSubjectTemplate(`Contract: [Recipient_Name]`)
      setMessageTemplate(`Hello [Recipient_Name],\n\nPlease review and sign the contract.`)
      
      // Initialize with one empty entry for manual mode
      if (sendMode === 'manual') {
        addEmptyRecipient(details)
      }
    } catch (err: any) {
      setError('Failed to fetch template details')
      console.error(err)
    }
  }

  const addEmptyRecipient = (details: any) => {
    const entry: any = { id: Date.now(), recipients: {}, tokens: {} }
    details.roles.forEach((role: any) => {
      entry.recipients[role.name] = { email: '', first_name: '', last_name: '' }
    })
    details.tokens.forEach((token: any) => {
      entry.tokens[token.name] = ''
    })
    setBulkRecipients(prev => [...prev, entry])
  }

  const handleManualRecipientChange = (id: number, role: string, field: string, value: string) => {
    setBulkRecipients(prev => prev.map(item => {
      if (item.id === id) {
        return {
          ...item,
          recipients: {
            ...item.recipients,
            [role]: { ...item.recipients[role], [field]: value }
          }
        }
      }
      return item
    }))
  }

  const handleManualTokenChange = (id: number, tokenName: string, value: string) => {
    setBulkRecipients(prev => prev.map(item => {
      if (item.id === id) {
        return {
          ...item,
          tokens: {
            ...item.tokens,
            [tokenName]: value
          }
        }
      }
      return item
    }))
  }

  const removeRecipient = (id: number) => {
    setBulkRecipients(prev => prev.filter(item => item.id !== id))
  }

  const downloadCSVTemplate = () => {
    if (!templateDetails) return
    
    const headers: string[] = []
    templateDetails.roles.forEach((role: any) => {
      headers.push(`${role.name} First Name`, `${role.name} Last Name`, `${role.name} Email`)
    })
    templateDetails.tokens.forEach((token: any) => {
      headers.push(token.name)
    })
    
    const csvContent = headers.join(',') + '\n'
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${templateDetails.name}_template.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !templateDetails) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      const lines = text.split('\n')
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
      
      const newRecipients: any[] = []
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue
        const values = lines[i].split(',').map(v => v.trim())
        const entry: any = { id: Date.now() + i, recipients: {}, tokens: {} }
        
        headers.forEach((header, index) => {
          const value = values[index] || ''
          if (header.endsWith(' first name')) {
            const roleKey = header.replace(' first name', '')
            const actualRole = templateDetails.roles.find((r: any) => r.name.toLowerCase() === roleKey)
            if (actualRole) {
              if (!entry.recipients[actualRole.name]) entry.recipients[actualRole.name] = {}
              entry.recipients[actualRole.name].first_name = value
            }
          } else if (header.endsWith(' last name')) {
            const roleKey = header.replace(' last name', '')
            const actualRole = templateDetails.roles.find((r: any) => r.name.toLowerCase() === roleKey)
            if (actualRole) {
              if (!entry.recipients[actualRole.name]) entry.recipients[actualRole.name] = {}
              entry.recipients[actualRole.name].last_name = value
            }
          } else if (header.endsWith(' email')) {
            const roleKey = header.replace(' email', '')
            const actualRole = templateDetails.roles.find((r: any) => r.name.toLowerCase() === roleKey)
            if (actualRole) {
              if (!entry.recipients[actualRole.name]) entry.recipients[actualRole.name] = {}
              entry.recipients[actualRole.name].email = value
            }
          } else {
            // Check if it's a token
            const actualToken = templateDetails.tokens.find((t: any) => t.name.toLowerCase() === header)
            if (actualToken) {
              entry.tokens[actualToken.name] = value
            }
          }
        })
        newRecipients.push(entry)
      }
      setBulkRecipients(newRecipients)
    }
    reader.readAsText(file)
  }

  const replacePlaceholders = (text: string, data: any) => {
    let result = text
    // Replace [Recipient_Name] with first recipient's full name
    const firstRole = templateDetails.roles[0].name
    const recipient = data.recipients[firstRole]
    const fullName = `${recipient.first_name} ${recipient.last_name}`.trim() || 'Recipient'
    
    result = result.replace(/\[Recipient_Name\]/g, fullName)
    
    // Replace token placeholders like [token_name]
    Object.entries(data.tokens).forEach(([name, value]) => {
      const placeholder = `[${name}]`
      result = result.split(placeholder).join(value as string)
    })
    
    return result
  }

  const parsePandaDocError = (err: any) => {
    const errorStr = err.response?.data?.error || err.message || 'Unknown error'
    
    if (errorStr.includes('outside of your organization')) {
      return 'Domain Restriction: You can only send to emails with your own domain.'
    }
    if (errorStr.includes('throttled')) {
      // Try to extract the wait time if present
      const match = errorStr.match(/(\d+) seconds/)
      const waitTime = match ? Math.ceil(parseInt(match[1]) / 60) : 30
      return `Rate Limit: PandaDoc is busy. Please wait about ${waitTime} minutes.`
    }
    
    try {
      // If it's a JSON string inside the error message
      const jsonStart = errorStr.indexOf('{')
      if (jsonStart !== -1) {
        const jsonStr = errorStr.substring(jsonStart)
        const parsed = JSON.parse(jsonStr)
        return parsed.detail || parsed.info_message || errorStr
      }
    } catch (e) {
      // fallback to original string
    }
    
    return errorStr
  }

  const handleBulkSend = async (retryOnly: boolean = false) => {
    setSending(true)
    setError(null)
    
    const itemsToSend = retryOnly 
      ? bulkRecipients.filter(item => results.some(r => r.id === item.id && r.status === 'error'))
      : bulkRecipients

    if (itemsToSend.length === 0) {
      setSending(false)
      return
    }

    // Reset results only if it's a full send
    if (!retryOnly) {
      setResults([])
    } else {
      // Clear specific failed results that are being retried
      setResults(prev => prev.filter(r => !itemsToSend.some(item => item.id === r.id)))
    }

    const total = itemsToSend.length
    setProgress({ current: 0, total, status: 'Preparing documents...' })
    const currentResults: any[] = []
    
    try {
      const firstRole = templateDetails.roles[0].name
      
      for (let i = 0; i < itemsToSend.length; i++) {
        const item = itemsToSend[i]
        const firstRecipient = item.recipients[firstRole]
        const recipientName = firstRecipient ? `${firstRecipient.first_name} ${firstRecipient.last_name}`.trim() : 'Recipient'
        const docName = recipientName ? `${recipientName} - Contract` : `Contract - ${new Date().toLocaleDateString()}`

        setProgress({ current: i + 1, total, status: `Sending to ${recipientName}...` })

        const payload = {
          name: docName,
          template_uuid: selectedTemplateId,
          recipients: Object.entries(item.recipients)
            .filter(([_, data]: any) => data.email && data.first_name)
            .map(([role, data]: any) => ({
              ...data,
              role
            })),
          tokens: Object.entries(item.tokens)
            .filter(([_, value]) => value !== '')
            .map(([name, value]) => ({
              name,
              value
            })),
          subject: replacePlaceholders(subjectTemplate, item),
          message: replacePlaceholders(messageTemplate, item)
        }

        try {
          // Send each document individually for better reliability and progress tracking
          await pandaDocAPI.createAndSendDocument(payload)
          const result = { id: item.id, name: recipientName, status: 'success' as const }
          currentResults.push(result)
          setResults(prev => [...prev, result])
          
          // Wait 2 seconds between successful sends to respect API rate limits
          if (i < itemsToSend.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 2000))
          }
        } catch (err: any) {
          console.error(`Failed to send to ${recipientName}:`, err)
          const result = { 
            id: item.id, 
            name: recipientName, 
            status: 'error' as const, 
            error: parsePandaDocError(err)
          }
          currentResults.push(result)
          setResults(prev => [...prev, result])
        }
      }

      setProgress(null)
      const failures = currentResults.filter(r => r.status === 'error')
      if (failures.length === 0 && currentResults.length > 0) {
        navigate('/documents')
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'An error occurred during bulk sending')
      setProgress(null)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex h-screen bg-black text-white overflow-hidden">
      <Sidebar />
      
      <main className="flex-1 flex flex-col overflow-y-auto bg-zinc-950 p-8">
        <div className="max-w-6xl mx-auto w-full">
          <header className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight mb-2">Mass Contract Share</h1>
            <p className="text-zinc-500 text-sm">Send documents to multiple recipients at once</p>
          </header>

            {error && (
              <div className="mb-6 p-4 bg-red-900/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                {error}
              </div>
            )}

            {progress && (
              <div className="mb-6 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl animate-in fade-in slide-in-from-top-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-blue-400 flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                    {progress.status}
                  </h3>
                  <span className="text-xs font-mono text-zinc-500">{progress.current} / {progress.total}</span>
                </div>
                <div className="w-full h-2 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
                  <div 
                    className="h-full bg-blue-600 transition-all duration-500 ease-out shadow-[0_0_10px_rgba(37,99,235,0.5)]" 
                    style={{ width: `${(progress.current / progress.total) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {results.length > 0 && !progress && (
              <div className="mb-6 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  Sending Summary 
                  <span className="text-xs font-normal text-zinc-500">
                    ({results.filter(r => r.status === 'success').length} Success, {results.filter(r => r.status === 'error').length} Failed)
                  </span>
                </h3>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                  {results.map((result, i) => (
                    <div key={i} className={`flex items-center justify-between p-3 rounded-xl border ${result.status === 'success' ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' : 'bg-red-500/5 border-red-500/20 text-red-400'}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${result.status === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        <span className="text-sm font-medium">{result.name}</span>
                      </div>
                      <div className="text-xs">
                        {result.status === 'success' ? (
                          <span className="font-bold uppercase tracking-widest text-[10px]">Success</span>
                        ) : (
                          <span className="font-bold uppercase tracking-widest text-[10px]">{result.error}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {results.some(r => r.status === 'error') && (
                  <div className="mt-4 flex gap-3">
                    <button 
                      onClick={() => handleBulkSend(true)}
                      disabled={sending}
                      className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                    >
                      Retry Failed Contracts
                    </button>
                    <button 
                      onClick={() => setResults([])}
                      className="px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-bold hover:bg-zinc-800 transition-all"
                    >
                      Clear
                    </button>
                  </div>
                )}
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
            </section>

            {templateDetails && (
              <>
                {/* Step 2: Choose Method */}
                <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-xs">2</span>
                    Input Method
                  </h2>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setSendMode('manual')}
                      className={`flex-1 py-4 rounded-xl border transition-all ${sendMode === 'manual' ? 'bg-blue-600/10 border-blue-600 text-blue-400' : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700'}`}
                    >
                      <p className="font-bold">Manual Entry</p>
                      <p className="text-xs opacity-60">Add people one by one</p>
                    </button>
                    <button
                      onClick={() => setSendMode('csv')}
                      className={`flex-1 py-4 rounded-xl border transition-all ${sendMode === 'csv' ? 'bg-blue-600/10 border-blue-600 text-blue-400' : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700'}`}
                    >
                      <p className="font-bold">CSV Upload</p>
                      <p className="text-xs opacity-60">Import from a spreadsheet</p>
                    </button>
                  </div>
                </section>

                {/* Step 3: Input Data */}
                <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-xs">3</span>
                      {sendMode === 'manual' ? 'Recipient Details' : 'Upload CSV'}
                    </h2>
                    {sendMode === 'csv' && (
                      <button 
                        onClick={downloadCSVTemplate}
                        className="text-blue-400 text-xs font-bold hover:underline flex items-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        Download CSV Template
                      </button>
                    )}
                  </div>

                  {sendMode === 'manual' ? (
                    <div className="space-y-6">
                      {bulkRecipients.map((item, index) => (
                        <div key={item.id} className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl relative group">
                          <div className="flex justify-between items-center mb-4">
                            <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Recipient #{index + 1}</span>
                            {bulkRecipients.length > 1 && (
                              <button onClick={() => removeRecipient(item.id)} className="text-red-500 hover:text-red-400">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                              </button>
                            )}
                          </div>
                          
                          <div className="space-y-4">
                            {templateDetails.roles.map((role: any) => (
                              <div key={role.name} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <input
                                  placeholder={`${role.name} First Name`}
                                  className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/50"
                                  value={item.recipients[role.name]?.first_name || ''}
                                  onChange={(e) => handleManualRecipientChange(item.id, role.name, 'first_name', e.target.value)}
                                />
                                <input
                                  placeholder={`${role.name} Last Name`}
                                  className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/50"
                                  value={item.recipients[role.name]?.last_name || ''}
                                  onChange={(e) => handleManualRecipientChange(item.id, role.name, 'last_name', e.target.value)}
                                />
                                <input
                                  type="email"
                                  placeholder={`${role.name} Email`}
                                  className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/50"
                                  value={item.recipients[role.name]?.email || ''}
                                  onChange={(e) => handleManualRecipientChange(item.id, role.name, 'email', e.target.value)}
                                />
                              </div>
                            ))}
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                              {templateDetails.tokens.map((token: any) => (
                                <input
                                  key={token.name}
                                  placeholder={token.name}
                                  className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600/50"
                                  value={item.tokens[token.name] || ''}
                                  onChange={(e) => handleManualTokenChange(item.id, token.name, e.target.value)}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                      <button 
                        onClick={() => addEmptyRecipient(templateDetails)}
                        className="w-full py-3 border-2 border-dashed border-zinc-800 rounded-xl text-zinc-500 hover:text-zinc-400 hover:border-zinc-700 transition-all flex items-center justify-center gap-2 font-bold"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        Add Another Person
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="border-2 border-dashed border-zinc-800 rounded-2xl p-12 text-center">
                        <input
                          type="file"
                          accept=".csv"
                          onChange={handleCSVUpload}
                          className="hidden"
                          id="csv-upload"
                        />
                        <label htmlFor="csv-upload" className="cursor-pointer group">
                          <div className="w-16 h-16 bg-blue-600/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-all">
                            <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                          </div>
                          <p className="font-bold text-lg mb-1">Click to upload CSV</p>
                          <p className="text-zinc-500 text-sm">or drag and drop your file here</p>
                        </label>
                      </div>
                      
                      {bulkRecipients.length > 0 && (
                        <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden">
                          <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
                            <p className="text-sm font-bold">{bulkRecipients.length} recipients found</p>
                            <button onClick={() => setBulkRecipients([])} className="text-xs text-red-500 font-bold hover:underline">Clear all</button>
                          </div>
                          <div className="max-h-60 overflow-y-auto">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-zinc-900 text-zinc-500 uppercase">
                                <tr>
                                  <th className="px-4 py-2">Name</th>
                                  <th className="px-4 py-2">Email</th>
                                  {templateDetails.tokens.slice(0, 2).map((t: any) => (
                                    <th key={t.name} className="px-4 py-2">{t.name}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {bulkRecipients.map((item, i) => (
                                  <tr key={i} className="border-t border-zinc-900">
                                    <td className="px-4 py-2">{item.recipients[templateDetails.roles[0].name]?.first_name} {item.recipients[templateDetails.roles[0].name]?.last_name}</td>
                                    <td className="px-4 py-2">{item.recipients[templateDetails.roles[0].name]?.email}</td>
                                    {templateDetails.tokens.slice(0, 2).map((t: any) => (
                                      <td key={t.name} className="px-4 py-2">{item.tokens[t.name]}</td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </section>

                {/* Step 4: Email Template */}
                <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-xs">4</span>
                    Dynamic Email Template
                  </h2>
                  <div className="space-y-4">
                    <p className="text-xs text-zinc-500">
                      Use placeholders like <code className="text-blue-400">[Recipient_Name]</code> or any token name like {templateDetails.tokens.map((t: any) => <code key={t.name} className="text-blue-400 mx-1">[{t.name}]</code>)}
                    </p>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-400 block">Email Subject</label>
                      <input
                        value={subjectTemplate}
                        onChange={(e) => setSubjectTemplate(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/50"
                        placeholder="e.g. Contract for [Recipient_Name]"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-400 block">Email Message</label>
                      <textarea
                        value={messageTemplate}
                        onChange={(e) => setMessageTemplate(e.target.value)}
                        rows={4}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/50 resize-none"
                        placeholder="e.g. Hello [Recipient_Name], please sign this..."
                      />
                    </div>
                  </div>
                </section>

                <div className="flex justify-end gap-4 pb-12">
                  <button
                    type="button"
                    onClick={() => navigate('/documents')}
                    className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-sm font-semibold rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBulkSend}
                    disabled={sending || bulkRecipients.length === 0}
                    className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-sm font-semibold rounded-xl transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2"
                  >
                    {sending ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Sending Bulk ({bulkRecipients.length})...
                      </>
                    ) : (
                      `Send ${bulkRecipients.length} Contracts`
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default BulkSend
