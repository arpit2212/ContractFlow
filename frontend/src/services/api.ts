import axios from 'axios'
import { supabase } from './supabase'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
})

// Attach Supabase JWT to every request
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession()
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`
  } else {
    console.warn('API Interceptor: No active session found')
  }
  return config
})

const PANDADOC_BASE = '/pandadoc'

export const pandaDocAPI = {
  getStatus: () => api.get(`${PANDADOC_BASE}/status`),
  getDocuments: () => api.get(`${PANDADOC_BASE}/documents`),
  getDocumentDetails: (id: string) => api.get(`${PANDADOC_BASE}/documents/${id}`),
  getTemplates: () => api.get(`${PANDADOC_BASE}/templates`),
  getTemplateDetails: (id: string) => api.get(`${PANDADOC_BASE}/templates/${id}/details`),
  createDocument: (payload: any) => api.post(`${PANDADOC_BASE}/documents`, payload),
  sendDocument: (id: string, payload: any) => api.post(`${PANDADOC_BASE}/documents/${id}/send`, payload),
  getAnalytics: () => api.get(`${PANDADOC_BASE}/analytics`),
  connect: () => api.get(`${PANDADOC_BASE}/connect`),
  callback: (code: string) => api.get(`${PANDADOC_BASE}/callback?code=${code}`),
}

export default api
