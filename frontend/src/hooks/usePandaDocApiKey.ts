import { useState, useEffect } from 'react'

const STORAGE_KEY = 'pandadoc_api_key'

export function usePandaDocApiKey() {
  const [apiKey, setApiKeyState] = useState<string>('')
  const [isConfigured, setIsConfigured] = useState<boolean>(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      setApiKeyState(stored)
      setIsConfigured(true)
    }
  }, [])

  const setApiKey = (key: string) => {
    if (key.trim()) {
      localStorage.setItem(STORAGE_KEY, key.trim())
      setApiKeyState(key.trim())
      setIsConfigured(true)
    }
  }

  const removeApiKey = () => {
    localStorage.removeItem(STORAGE_KEY)
    setApiKeyState('')
    setIsConfigured(false)
  }

  return {
    apiKey,
    isConfigured,
    setApiKey,
    removeApiKey,
  }
}
