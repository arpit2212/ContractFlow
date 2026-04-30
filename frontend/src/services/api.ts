import axios from 'axios'
import { supabase } from './supabase'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
})

api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession()
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`
  } else {
    console.warn('API Interceptor: No active session found')
  }
  const apiKey = localStorage.getItem('pandadoc_api_key')
  if (apiKey) {
    config.headers['X-PandaDoc-Api-Key'] = apiKey
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Session expired or invalid - clear sensitive data
      localStorage.removeItem('pandadoc_api_key')
      
      // Clear any other PandaDoc related keys
      const keysToRemove = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && (key.includes('pandadoc') || key.includes('bulk_send'))) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key))
      
      // Optionally redirect to login or let the Auth provider handle it
      await supabase.auth.signOut()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

const PANDADOC_BASE = '/pandadoc'

export const pandaDocAPI = {
  getStatus: () => api.get(`${PANDADOC_BASE}/status`),
  getDocuments: (page = 1, limit = 25, refresh = false) => 
    api.get(`${PANDADOC_BASE}/documents?page=${page}&limit=${limit}${refresh ? '&refresh=true' : ''}`),
  getDocumentDetails: (id: string) => api.get(`${PANDADOC_BASE}/documents/${id}`),
  getTemplates: () => api.get(`${PANDADOC_BASE}/templates`),
  getTemplateDetails: (id: string) => api.get(`${PANDADOC_BASE}/templates/${id}/details`),
  createDocument: (payload: any) => api.post(`${PANDADOC_BASE}/documents`, payload),
  updateDocument: (id: string, payload: any) => api.patch(`${PANDADOC_BASE}/documents/${id}`, payload),
  createAndSendDocument: (payload: any) => api.post(`${PANDADOC_BASE}/documents/create-and-send`, payload),
  bulkCreateAndSendDocuments: (payloads: any[]) => api.post(`${PANDADOC_BASE}/documents/bulk-send`, payloads),
  sendDocument: (id: string, payload: any) => api.post(`${PANDADOC_BASE}/documents/${id}/send`, payload),
  getAnalytics: () => api.get(`${PANDADOC_BASE}/analytics`),
  connect: () => api.get(`${PANDADOC_BASE}/connect`),
  callback: (code: string) => api.get(`${PANDADOC_BASE}/callback?code=${code}`),
}

export default api
