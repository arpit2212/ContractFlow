import { useState, useEffect, useCallback } from 'react'
import { pandaDocAPI } from '../services/api'
import type { PandaDocDocument, PandaDocAnalytics } from '../types/pandadoc'

export const usePandaDocDocuments = () => {
  const [documents, setDocuments] = useState<PandaDocDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDocuments = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await pandaDocAPI.getDocuments()
      setDocuments(response.data)
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to fetch documents')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  return { documents, loading, error, refetch: fetchDocuments }
}

export const usePandaDocAnalytics = () => {
  const [analytics, setAnalytics] = useState<PandaDocAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAnalytics = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await pandaDocAPI.getAnalytics()
      setAnalytics(response.data)
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to fetch analytics')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  return { analytics, loading, error, refetch: fetchAnalytics }
}

export const usePandaDocTemplates = () => {
  const [templates, setTemplates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTemplates = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await pandaDocAPI.getTemplates()
      setTemplates(response.data)
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to fetch templates')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  return { templates, loading, error, refetch: fetchTemplates }
}
