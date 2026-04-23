import React, { useState, useEffect, useRef } from 'react'
import Sidebar from '../components/Sidebar'
import { usePandaDocTemplates } from '../hooks/usePandaDoc'
import { pandaDocAPI } from '../services/api'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, 
  FileSpreadsheet, 
  Upload, 
  Download, 
  Trash2, 
  Plus, 
  ChevronRight,
  ChevronLeft,
  Send,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Mail,
  FileText,
  Variable,
  Check,
  X,
  UserPlus
} from 'lucide-react'

type Step = 1 | 2 | 3 | 4

const BulkSend: React.FC = () => {
  const navigate = useNavigate()
  const { templates, loading: templatesLoading } = usePandaDocTemplates()
  
  // Workflow State
  const [currentStep, setCurrentStep] = useState<Step>(1)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
  const [templateDetails, setTemplateDetails] = useState<any>(null)
  const [sendMode, setSendMode] = useState<'csv' | 'manual'>('manual')
  
  // Data State
  const [bulkRecipients, setBulkRecipients] = useState<any[]>([])
  const [subjectTemplate, setSubjectTemplate] = useState<string>('')
  const [messageTemplate, setMessageTemplate] = useState<string>('')
  const [activeField, setActiveField] = useState<'subject' | 'message'>('message')
  
  // UI State
  const [sending, setSending] = useState(false)

  const insertPlaceholder = (placeholder: string) => {
    if (activeField === 'subject') {
      setSubjectTemplate(prev => prev.endsWith(' ') || prev === '' ? prev + placeholder : prev + ' ' + placeholder)
    } else {
      setMessageTemplate(prev => prev.endsWith(' ') || prev === '' ? prev + placeholder : prev + ' ' + placeholder)
    }
  }
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState<{ current: number, total: number, status: string } | null>(null)
  const [results, setResults] = useState<{ id: number, name: string, status: 'success' | 'error', error?: string }[]>([])
  const [showConfirm, setShowConfirm] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
      
      // Don't clear recipients if they already added some, but add one if empty and in manual mode
      if (sendMode === 'manual' && bulkRecipients.length === 0) {
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
      if (lines.length < 2) {
        setError("The uploaded CSV file appears to be empty.")
        return
      }

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
            const actualToken = templateDetails.tokens.find((t: any) => t.name.toLowerCase() === header)
            if (actualToken) {
              entry.tokens[actualToken.name] = value
            }
          }
        })
        newRecipients.push(entry)
      }
      setBulkRecipients(newRecipients)
      setError(null)
      // Show a temporary success message or just rely on the preview appearing
    }
    reader.readAsText(file)
  }

  const replacePlaceholders = (text: string, data: any) => {
    let result = text
    const firstRole = templateDetails.roles[0].name
    const recipient = data.recipients[firstRole]
    const fullName = `${recipient.first_name} ${recipient.last_name}`.trim() || 'Recipient'
    
    result = result.replace(/\[Recipient_Name\]/g, fullName)
    
    Object.entries(data.tokens).forEach(([name, value]) => {
      const placeholder = `[${name}]`
      result = result.split(placeholder).join(value as string)
    })
    
    return result
  }

  const handleBulkSend = async (retryOnly: boolean = false) => {
    setSending(true)
    setError(null)
    setShowConfirm(false)
    
    const itemsToSend = retryOnly 
      ? bulkRecipients.filter(item => results.some(r => r.id === item.id && r.status === 'error'))
      : bulkRecipients

    if (itemsToSend.length === 0) {
      setSending(false)
      return
    }

    if (!retryOnly) {
      setResults([])
    } else {
      setResults(prev => prev.filter(r => !itemsToSend.some(item => item.id === r.id)))
    }

    const total = itemsToSend.length
    setProgress({ current: 0, total, status: 'Preparing documents...' })
    
    const firstRole = templateDetails.roles[0].name
    
    for (let i = 0; i < itemsToSend.length; i++) {
      const item = itemsToSend[i]
      const firstRecipient = item.recipients[firstRole]
      const recipientName = firstRecipient ? `${firstRecipient.first_name} ${firstRecipient.last_name}`.trim() : 'Recipient'
      const docName = recipientName ? `${recipientName} - Contract` : `Contract - ${new Date().toLocaleDateString()}`

      setProgress(prev => prev ? { ...prev, current: i + 1, status: `Sending to ${recipientName}...` } : null)

      try {
        const payload = {
          name: docName,
          template_uuid: selectedTemplateId,
          recipients: Object.entries(item.recipients).map(([role, data]) => ({
            ...data as any,
            role
          })),
          metadata: {
            primary_recipient: firstRecipient?.email || ''
          },
          tokens: Object.entries(item.tokens).map(([name, value]) => ({
            name,
            value
          })),
          subject: replacePlaceholders(subjectTemplate, item),
          message: replacePlaceholders(messageTemplate, item)
        }

        await pandaDocAPI.createAndSendDocument(payload)
        setResults(prev => [...prev, { id: item.id, name: recipientName, status: 'success' }])
      } catch (err: any) {
        setResults(prev => [...prev, { id: item.id, name: recipientName, status: 'error', error: err.response?.data?.error || err.message }])
      }
    }

    setSending(false)
    setProgress(null)
  }

  const validateStep = (step: Step): boolean => {
    setError(null)
    if (step === 1) {
      if (!selectedTemplateId) {
        setError("Please select a template to continue.")
        return false
      }
    } else if (step === 2) {
      if (bulkRecipients.length === 0) {
        setError("Please add at least one recipient.")
        return false
      }
      // Basic validation for manual entry
      if (sendMode === 'manual') {
        const firstRole = templateDetails.roles[0].name
        const invalid = bulkRecipients.some(item => {
          const r = item.recipients[firstRole]
          return !r.email || !r.first_name || !r.last_name
        })
        if (invalid) {
          setError("Please complete all required recipient fields.")
          return false
        }
      }
    } else if (step === 3) {
      if (!subjectTemplate || !messageTemplate) {
        setError("Please provide both an email subject and message.")
        return false
      }
    }
    return true
  }

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => (prev + 1) as Step)
    }
  }

  const prevStep = () => {
    setCurrentStep(prev => (prev - 1) as Step)
  }

  const steps = [
    { id: 1, name: 'Select Template', icon: <FileText className="w-4 h-4" /> },
    { id: 2, name: 'Recipients', icon: <Users className="w-4 h-4" /> },
    { id: 3, name: 'Email Content', icon: <Mail className="w-4 h-4" /> },
    { id: 4, name: 'Review & Send', icon: <Send className="w-4 h-4" /> },
  ]

  return (
    <div className="flex h-screen bg-[#F9FAFB] text-gray-900 overflow-hidden font-sans">
      <Sidebar />
      
      <main className="flex-1 flex flex-col overflow-y-auto">
        <div className="max-w-5xl mx-auto w-full px-8 py-10 flex flex-col min-h-full">
          {/* Header */}
          <header className="mb-10">
            <h1 className="text-4xl font-black text-gray-900 mb-2 tracking-tight">Mass Share</h1>
            <p className="text-gray-500 font-medium">Streamline your contract distribution in 4 simple steps.</p>
          </header>

          {/* Step Indicator */}
          <div className="mb-12">
            <div className="flex items-center justify-between relative">
              <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-100 -translate-y-1/2 z-0" />
              {steps.map((step) => (
                <div key={step.id} className="relative z-10 flex flex-col items-center gap-3">
                  <div 
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-300 border-2 ${
                      currentStep >= step.id 
                        ? 'bg-[#1D9E75] border-[#1D9E75] text-white shadow-lg shadow-[#1D9E75]/20' 
                        : 'bg-white border-gray-100 text-gray-300'
                    }`}
                  >
                    {currentStep > step.id ? <Check className="w-5 h-5" /> : step.icon}
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${currentStep >= step.id ? 'text-[#1D9E75]' : 'text-gray-300'}`}>
                    {step.name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Main Content Card */}
          <div className="flex-1 flex flex-col">
            <AnimatePresence mode="wait">
              {/* Error Message */}
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm flex items-center gap-3 font-medium"
                >
                  <AlertCircle className="w-5 h-5" />
                  {error}
                </motion.div>
              )}

              {/* Step 1: Template Selection */}
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm"
                >
                  <div className="max-w-2xl mx-auto space-y-8 py-10">
                    <div className="text-center space-y-2">
                      <div className="w-16 h-16 bg-[#E1F5EE] text-[#1D9E75] rounded-3xl flex items-center justify-center mx-auto mb-4">
                        <FileText className="w-8 h-8" />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900">Choose your template</h2>
                      <p className="text-gray-500 text-sm">Select the PandaDoc template you want to share with multiple people.</p>
                    </div>

                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Available Templates</label>
                      <select 
                        value={selectedTemplateId}
                        onChange={(e) => setSelectedTemplateId(e.target.value)}
                        className="w-full h-14 bg-gray-50 border border-gray-100 rounded-2xl px-6 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-[#1D9E75]/10 focus:border-[#1D9E75] transition-all appearance-none cursor-pointer"
                        disabled={templatesLoading}
                      >
                        <option value="">Select a template...</option>
                        {templates.map((t: any) => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                      {templatesLoading && (
                        <div className="flex items-center gap-2 px-2 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Fetching templates...
                        </div>
                      )}
                    </div>

                    {templateDetails && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-6 bg-[#F9FAFB] rounded-2xl border border-gray-100 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[#1D9E75] shadow-sm">
                            <Check className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Selected Template</p>
                            <p className="text-sm font-bold text-gray-900">{templateDetails.name}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => setSelectedTemplateId('')}
                          className="text-xs font-bold text-[#1D9E75] hover:underline"
                        >
                          Change
                        </button>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Step 2: Recipients */}
              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-1">Add Recipients</h2>
                        <p className="text-gray-500 text-sm">Choose how you want to add people to this contract.</p>
                      </div>
                      
                      <div className="flex p-1 bg-gray-50 rounded-2xl border border-gray-100 w-fit">
                        <button
                          onClick={() => {
                            setSendMode('manual')
                            setBulkRecipients([])
                            if (templateDetails) addEmptyRecipient(templateDetails)
                          }}
                          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                            sendMode === 'manual' 
                              ? 'bg-white text-[#1D9E75] shadow-md' 
                              : 'text-gray-400 hover:text-gray-600'
                          }`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Manual
                        </button>
                        <button
                          onClick={() => {
                            setSendMode('csv')
                            setBulkRecipients([])
                          }}
                          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                            sendMode === 'csv' 
                              ? 'bg-white text-[#1D9E75] shadow-md' 
                              : 'text-gray-400 hover:text-gray-600'
                          }`}
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5" />
                          CSV Upload
                        </button>
                      </div>
                    </div>

                    {sendMode === 'csv' ? (
                      <div className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-6">
                          <div className="p-8 border-2 border-dashed border-gray-100 rounded-3xl flex flex-col items-center text-center space-y-4 hover:border-[#1D9E75]/30 transition-colors">
                            <div className="w-12 h-12 bg-gray-50 text-gray-400 rounded-2xl flex items-center justify-center">
                              <Download className="w-6 h-6" />
                            </div>
                            <div>
                              <h3 className="font-bold text-gray-900 mb-1">1. Download Template</h3>
                              <p className="text-xs text-gray-500 leading-relaxed">Get a CSV file pre-formatted with your template's specific roles and variables.</p>
                            </div>
                            <button 
                              onClick={downloadCSVTemplate}
                              className="px-6 py-2.5 bg-gray-50 text-gray-700 hover:text-[#1D9E75] hover:bg-[#E1F5EE] rounded-xl text-xs font-black uppercase tracking-wider transition-all"
                            >
                              Download CSV
                            </button>
                          </div>
                          
                          <div className="p-8 border-2 border-dashed border-gray-100 rounded-3xl flex flex-col items-center text-center space-y-4 hover:border-[#1D9E75]/30 transition-colors">
                            <div className="w-12 h-12 bg-[#E1F5EE] text-[#1D9E75] rounded-2xl flex items-center justify-center">
                              <Upload className="w-6 h-6" />
                            </div>
                            <div>
                              <h3 className="font-bold text-gray-900 mb-1">2. Upload List</h3>
                              <p className="text-xs text-gray-500 leading-relaxed">Fill in the downloaded file and upload it here to import all recipients at once.</p>
                            </div>
                            <label className="px-8 py-3 bg-[#1D9E75] text-white hover:bg-[#0F6E56] rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-[#1D9E75]/10">
                              Select File
                              <input type="file" accept=".csv" className="hidden" onChange={handleCSVUpload} />
                            </label>
                          </div>
                        </div>

                        {bulkRecipients.length > 0 && (
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-4"
                          >
                            <div className="flex items-center justify-between px-1">
                              <div className="flex items-center gap-2">
                                <FileSpreadsheet className="w-4 h-4 text-[#1D9E75]" />
                                <h3 className="text-sm font-bold text-gray-900">CSV Data Preview</h3>
                              </div>
                              <button 
                                onClick={() => setBulkRecipients([])}
                                className="text-xs font-bold text-red-500 hover:underline"
                              >
                                Clear All
                              </button>
                            </div>
                            <div className="bg-gray-50 border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                              <div className="overflow-x-auto custom-scrollbar">
                                <table className="w-full text-left border-collapse">
                                  <thead>
                                    <tr className="bg-gray-100/50 border-b border-gray-100">
                                      <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">#</th>
                                      {templateDetails.roles.map((role: any) => (
                                        <React.Fragment key={role.name}>
                                          <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">{role.name} Name</th>
                                          <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">{role.name} Email</th>
                                        </React.Fragment>
                                      ))}
                                      {templateDetails.tokens.map((token: any) => (
                                        <th key={token.name} className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">{token.name.replace(/_/g, ' ')}</th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-100">
                                    {bulkRecipients.slice(0, 10).map((item, idx) => (
                                      <tr key={item.id} className="bg-white hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3 text-[11px] font-bold text-gray-400">{idx + 1}</td>
                                        {templateDetails.roles.map((role: any) => (
                                          <React.Fragment key={role.name}>
                                            <td className="px-4 py-3 text-xs font-bold text-gray-700">
                                              {item.recipients[role.name]?.first_name} {item.recipients[role.name]?.last_name}
                                            </td>
                                            <td className="px-4 py-3 text-xs font-medium text-gray-500">
                                              {item.recipients[role.name]?.email}
                                            </td>
                                          </React.Fragment>
                                        ))}
                                        {templateDetails.tokens.map((token: any) => (
                                          <td key={token.name} className="px-4 py-3 text-xs font-medium text-gray-500">
                                            {item.tokens[token.name] || '-'}
                                          </td>
                                        ))}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                              {bulkRecipients.length > 10 && (
                                <div className="p-3 bg-white border-t border-gray-50 text-center">
                                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                    + {bulkRecipients.length - 10} more recipients in list
                                  </p>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="max-h-[400px] overflow-y-auto pr-2 space-y-4 custom-scrollbar">
                          {bulkRecipients.map((item, idx) => (
                            <div key={item.id} className="p-6 bg-[#F9FAFB] border border-gray-100 rounded-2xl relative group">
                              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                  onClick={() => removeRecipient(item.id)}
                                  className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                              <div className="flex items-center gap-3 mb-6">
                                <div className="w-6 h-6 bg-white border border-gray-100 text-[#1D9E75] rounded-lg flex items-center justify-center text-[10px] font-black shadow-sm">
                                  {idx + 1}
                                </div>
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Recipient Info</h4>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {templateDetails.roles.map((role: any) => (
                                  <React.Fragment key={role.name}>
                                    <div className="space-y-1.5">
                                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">First Name</label>
                                      <input 
                                        placeholder="Jane"
                                        value={item.recipients[role.name]?.first_name || ''}
                                        onChange={(e) => handleManualRecipientChange(item.id, role.name, 'first_name', e.target.value)}
                                        className="w-full h-11 bg-white border border-gray-100 rounded-xl px-4 text-xs font-bold focus:outline-none focus:border-[#1D9E75] transition-all"
                                      />
                                    </div>
                                    <div className="space-y-1.5">
                                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Last Name</label>
                                      <input 
                                        placeholder="Smith"
                                        value={item.recipients[role.name]?.last_name || ''}
                                        onChange={(e) => handleManualRecipientChange(item.id, role.name, 'last_name', e.target.value)}
                                        className="w-full h-11 bg-white border border-gray-100 rounded-xl px-4 text-xs font-bold focus:outline-none focus:border-[#1D9E75] transition-all"
                                      />
                                    </div>
                                    <div className="space-y-1.5">
                                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
                                      <input 
                                        placeholder="jane@example.com"
                                        value={item.recipients[role.name]?.email || ''}
                                        onChange={(e) => handleManualRecipientChange(item.id, role.name, 'email', e.target.value)}
                                        className="w-full h-11 bg-white border border-gray-100 rounded-xl px-4 text-xs font-bold focus:outline-none focus:border-[#1D9E75] transition-all"
                                      />
                                    </div>
                                  </React.Fragment>
                                ))}
                              </div>

                              {templateDetails.tokens.length > 0 && (
                                <div className="mt-6 pt-6 border-t border-gray-100 space-y-4">
                                  <div className="flex items-center gap-2">
                                    <Variable className="w-3 h-3 text-[#1D9E75]" />
                                    <h5 className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Contract Variables</h5>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {templateDetails.tokens.map((token: any) => (
                                      <div key={token.name} className="space-y-1.5">
                                        <label className="text-[9px] font-bold text-gray-400 uppercase tracking-tight ml-1">{token.name.replace(/_/g, ' ')}</label>
                                        <input 
                                          placeholder={`Enter ${token.name.replace(/_/g, ' ')}`}
                                          value={item.tokens[token.name] || ''}
                                          onChange={(e) => handleManualTokenChange(item.id, token.name, e.target.value)}
                                          className="w-full h-10 bg-white border border-gray-100 rounded-xl px-4 text-[11px] font-bold focus:outline-none focus:border-[#1D9E75] transition-all"
                                        />
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        <button 
                          onClick={() => addEmptyRecipient(templateDetails)}
                          className="w-full py-4 border-2 border-dashed border-gray-100 rounded-2xl text-gray-400 hover:text-[#1D9E75] hover:border-[#1D9E75]/30 hover:bg-[#F9FAFB] transition-all flex items-center justify-center gap-2 font-bold text-sm"
                        >
                          <Plus className="w-4 h-4" />
                          Add another recipient
                        </button>
                      </div>
                    )}
                  </div>

                  {bulkRecipients.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-[#1D9E75] rounded-3xl p-6 flex items-center justify-between text-white shadow-lg shadow-[#1D9E75]/20"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                          <Users className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-xs font-black uppercase tracking-widest opacity-70">Total Recipients</p>
                          <p className="text-xl font-black">{bulkRecipients.length} Added</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold opacity-70 mb-1">Ready for next step</p>
                        <div className="flex items-center gap-1 justify-end">
                          <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                          <div className="w-2 h-2 rounded-full bg-white animate-pulse delay-75" />
                          <div className="w-2 h-2 rounded-full bg-white animate-pulse delay-150" />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {/* Step 3: Email Content */}
              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm"
                >
                  <div className="max-w-3xl mx-auto space-y-10 py-6">
                    <div className="text-center space-y-2">
                      <div className="w-16 h-16 bg-[#E1F5EE] text-[#1D9E75] rounded-3xl flex items-center justify-center mx-auto mb-4">
                        <Mail className="w-8 h-8" />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900">Customize your email</h2>
                      <p className="text-gray-500 text-sm">Personalize the invitation that recipients will receive.</p>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between px-1">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Email Subject</label>
                        </div>
                        <input 
                          type="text" 
                          value={subjectTemplate}
                          onChange={(e) => setSubjectTemplate(e.target.value)}
                          onFocus={() => setActiveField('subject')}
                          placeholder="Enter email subject..."
                          className={`w-full h-14 bg-gray-50 border ${activeField === 'subject' ? 'border-[#1D9E75] ring-4 ring-[#1D9E75]/10' : 'border-gray-100'} rounded-2xl px-6 text-sm font-bold focus:outline-none transition-all`}
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between px-1">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Message Body</label>
                        </div>
                        <textarea 
                          rows={6}
                          value={messageTemplate}
                          onChange={(e) => setMessageTemplate(e.target.value)}
                          onFocus={() => setActiveField('message')}
                          placeholder="Hello, please review and sign this agreement..."
                          className={`w-full bg-gray-50 border ${activeField === 'message' ? 'border-[#1D9E75] ring-4 ring-[#1D9E75]/10' : 'border-gray-100'} rounded-2xl px-6 py-4 text-sm font-medium focus:outline-none transition-all resize-none leading-relaxed`}
                        />
                      </div>

                      <div className="p-6 bg-[#F9FAFB] rounded-2xl border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <Variable className="w-4 h-4 text-[#1D9E75]" />
                            <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-widest">
                              Available Placeholders 
                              <span className="ml-2 text-[9px] font-medium normal-case text-gray-400">
                                (Inserting into <span className="text-[#1D9E75] font-bold uppercase">{activeField}</span>)
                              </span>
                            </h4>
                          </div>
                          <p className="text-[9px] text-[#1D9E75] font-medium italic">Click to insert at end</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button 
                            onClick={() => insertPlaceholder('[Recipient_Name]')}
                            className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-[10px] font-bold text-gray-600 hover:border-[#1D9E75] hover:text-[#1D9E75] transition-all"
                          >
                            [Recipient_Name]
                          </button>
                          {templateDetails.tokens.map((token: any) => (
                            <button 
                              key={token.name}
                              onClick={() => insertPlaceholder(`[${token.name}]`)}
                              className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-[10px] font-bold text-gray-600 hover:border-[#1D9E75] hover:text-[#1D9E75] transition-all"
                            >
                              [{token.name}]
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 4: Review & Send */}
              {currentStep === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm">
                    <h2 className="text-2xl font-bold text-gray-900 mb-8">Review details</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="space-y-6">
                        <div className="space-y-4">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Configuration</p>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                              <span className="text-xs font-bold text-gray-500">Template</span>
                              <span className="text-xs font-black text-gray-900">{templateDetails.name}</span>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                              <span className="text-xs font-bold text-gray-500">Total Recipients</span>
                              <span className="text-xs font-black text-gray-900">{bulkRecipients.length}</span>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                              <span className="text-xs font-bold text-gray-500">Method</span>
                              <span className="text-xs font-black text-gray-900 uppercase">{sendMode}</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email Preview</p>
                          <div className="p-6 bg-[#F9FAFB] rounded-3xl border border-gray-100 space-y-4">
                            <div>
                              <p className="text-[10px] font-black text-gray-300 uppercase mb-1">Subject</p>
                              <p className="text-sm font-bold text-gray-900">{replacePlaceholders(subjectTemplate, bulkRecipients[0])}</p>
                            </div>
                            <div className="h-px bg-gray-100 w-full" />
                            <div>
                              <p className="text-[10px] font-black text-gray-300 uppercase mb-2">Message</p>
                              <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">{replacePlaceholders(messageTemplate, bulkRecipients[0])}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4 flex flex-col h-full">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Recipients List</p>
                        <div className="flex-1 bg-gray-50 rounded-3xl border border-gray-100 overflow-hidden flex flex-col">
                          <div className="overflow-y-auto max-h-[400px] divide-y divide-gray-100 custom-scrollbar">
                            {bulkRecipients.map((item, i) => {
                              const role = templateDetails.roles[0].name
                              const r = item.recipients[role]
                              return (
                                <div key={i} className="p-4 flex items-center justify-between hover:bg-white/50 transition-all">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-[10px] font-black text-[#1D9E75] shadow-sm">
                                      {i + 1}
                                    </div>
                                    <div>
                                      <p className="text-xs font-bold text-gray-900">{r.first_name} {r.last_name}</p>
                                      <p className="text-[10px] text-gray-400 font-medium">{r.email}</p>
                                      {Object.keys(item.tokens).length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-2">
                                          {Object.entries(item.tokens).map(([name, value]) => value && (
                                            <span key={name} className="px-1.5 py-0.5 bg-white border border-gray-100 rounded text-[8px] font-bold text-[#1D9E75]">
                                              {name.replace(/_/g, ' ')}: {value as string}
                                            </span>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <Check className="w-4 h-4 text-[#1D9E75]" />
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {results.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm"
                    >
                      <div className="px-8 py-4 border-b border-gray-50 bg-[#F9FAFB] flex items-center justify-between">
                        <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">Distribution Results</h3>
                        {results.some(r => r.status === 'error') && (
                          <button 
                            onClick={() => handleBulkSend(true)}
                            className="text-[10px] font-black text-[#1D9E75] hover:underline"
                          >
                            Retry Failed
                          </button>
                        )}
                      </div>
                      <div className="max-h-60 overflow-y-auto divide-y divide-gray-50 custom-scrollbar">
                        {results.map((res, i) => (
                          <div key={i} className="px-8 py-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {res.status === 'success' ? (
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-500" />
                              )}
                              <span className="text-xs font-bold text-gray-700">{res.name}</span>
                            </div>
                            {res.status === 'error' && (
                              <span className="text-[10px] text-red-400 font-medium truncate max-w-[200px]">{res.error}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Navigation Actions */}
          <div className="mt-12 pt-8 border-t border-gray-100 flex items-center justify-between gap-4 mb-10">
            <button
              onClick={currentStep === 1 ? () => navigate('/dashboard') : prevStep}
              className="flex items-center mb-10 gap-2 px-8 py-4 bg-white border border-gray-100 text-gray-600 hover:text-gray-900 hover:border-gray-200 rounded-2xl text-sm font-black uppercase tracking-widest transition-all shadow-sm"
            >
              {currentStep === 1 ? <X className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              {currentStep === 1 ? 'Cancel' : 'Back'}
            </button>
            
            {currentStep < 4 ? (
              <button
                onClick={nextStep}
                className="flex items-center mb-10 gap-2 px-10 py-4 bg-[#1D9E75] text-white hover:bg-[#0F6E56] rounded-2xl text-sm font-black uppercase tracking-widest transition-all shadow-lg shadow-[#1D9E75]/20"
              >
                Continue
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => setShowConfirm(true)}
                disabled={sending || bulkRecipients.length === 0}
                className="flex items-center mb-10 gap-2 px-12 py-4 bg-[#1D9E75] text-white hover:bg-[#0F6E56] rounded-2xl text-sm font-black uppercase tracking-widest transition-all shadow-lg shadow-[#1D9E75]/20 disabled:opacity-50"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {sending ? 'Processing...' : 'Start Distribution'}
              </button>
            )}
          </div>

          {/* Progress Overlay */}
          <AnimatePresence>
            {progress && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] bg-white/80 backdrop-blur-md flex items-center justify-center p-8"
              >
                <div className="max-w-md w-full bg-white rounded-[40px] p-10 shadow-2xl border border-gray-100 text-center space-y-8">
                  <div className="relative w-32 h-32 mx-auto">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="45" fill="none" stroke="#F3F4F6" strokeWidth="8" />
                      <circle cx="50" cy="50" r="45" fill="none" stroke="#1D9E75" strokeWidth="8" strokeDasharray={`${2 * Math.PI * 45}`} strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress.current / progress.total)}`} strokeLinecap="round" className="transition-all duration-500" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-black text-[#1D9E75]">{Math.round((progress.current / progress.total) * 100)}%</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-gray-900 mb-2">{progress.status}</h3>
                    <p className="text-sm text-gray-500 font-medium">Processing {progress.current} of {progress.total} recipients</p>
                  </div>
                  <div className="flex items-center gap-2 justify-center">
                    <Loader2 className="w-4 h-4 text-[#1D9E75] animate-spin" />
                    <span className="text-xs font-black text-[#1D9E75] uppercase tracking-widest">Do not close this window</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Confirmation Dialog */}
          <AnimatePresence>
            {showConfirm && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] bg-black/20 backdrop-blur-sm flex items-center justify-center p-8"
              >
                <motion.div 
                  initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  className="max-w-md w-full bg-white rounded-[40px] p-10 shadow-2xl border border-gray-100 space-y-8"
                >
                  <div className="w-20 h-20 bg-[#E1F5EE] text-[#1D9E75] rounded-[30px] flex items-center justify-center mx-auto">
                    <Send className="w-10 h-10" />
                  </div>
                  <div className="text-center space-y-2">
                    <h3 className="text-2xl font-black text-gray-900">Ready to send?</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">
                      You are about to send <span className="font-bold text-gray-900">{bulkRecipients.length} contracts</span> using the <span className="font-bold text-gray-900">{templateDetails.name}</span> template. This action cannot be undone.
                    </p>
                  </div>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => setShowConfirm(false)}
                      className="flex-1 py-4 bg-gray-50 text-gray-700 hover:bg-gray-100 rounded-2xl text-sm font-black uppercase tracking-wider transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => handleBulkSend()}
                      className="flex-1 py-4 bg-[#1D9E75] text-white hover:bg-[#0F6E56] rounded-2xl text-sm font-black uppercase tracking-wider transition-all shadow-lg shadow-[#1D9E75]/20"
                    >
                      Confirm & Send
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}

export default BulkSend
