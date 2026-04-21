import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { signOut } from '../services/auth'
import Sidebar from '../components/Sidebar'
import { usePandaDocAnalytics } from '../hooks/usePandaDoc'
import { usePandaDocApiKey } from '../hooks/usePandaDocApiKey'

const Dashboard: React.FC = () => {
  const { user, loading } = useAuth()
  const { analytics, loading: analyticsLoading, error: analyticsError } = usePandaDocAnalytics()
  const { apiKey, isConfigured, setApiKey, removeApiKey } = usePandaDocApiKey()
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (err) {
      console.error('Error signing out:', err)
    }
  }

  const handleSaveApiKey = (e: React.FormEvent) => {
    e.preventDefault()
    if (apiKeyInput.trim()) {
      setApiKey(apiKeyInput.trim())
      setApiKeyInput('')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white">
        <div className="w-8 h-8 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-black text-white overflow-hidden">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-y-auto bg-zinc-950">
        <nav className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-10 px-6">
          <div className="flex justify-end h-16 items-center">
            <button
              onClick={handleSignOut}
              className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors"
            >
              Sign out
            </button>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto w-full px-6 py-12 space-y-12">
          {/* Profile Section */}
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-8 shadow-xl">
            <div className="flex items-center gap-6">
              {user?.user_metadata?.avatar_url ? (
                <img
                  src={user.user_metadata.avatar_url}
                  alt="Avatar"
                  className="w-20 h-20 rounded-full border-2 border-zinc-800"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center text-2xl font-bold text-zinc-400">
                  {user?.email?.[0].toUpperCase()}
                </div>
              )}
              <div>
                <h2 className="text-3xl font-bold text-white mb-1">
                  Welcome, {user?.user_metadata?.full_name || 'User'}
                </h2>
                <p className="text-zinc-400">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* PandaDoc API Key Section */}
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-8 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-white mb-1">PandaDoc API Key</h3>
                <p className="text-zinc-500 text-sm">Your API key is stored locally and never sent to our servers</p>
              </div>
              {isConfigured && (
                <div className="flex items-center gap-2 text-emerald-400">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full" />
                  <span className="text-sm font-medium">Configured</span>
                </div>
              )}
            </div>

            {isConfigured ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-zinc-950 rounded-xl border border-zinc-800">
                  <div className="flex-1">
                    <p className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-1">API Key</p>
                    <p className="text-white font-mono text-sm">
                      {showApiKey ? apiKey : '••••••••' + apiKey.slice(-4)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-all"
                    >
                      {showApiKey ? 'Hide' : 'Show'}
                    </button>
                    <button
                      onClick={removeApiKey}
                      className="px-3 py-1.5 text-xs font-medium text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-all"
                    >
                      Remove
                    </button>
                  </div>
                </div>
                <p className="text-zinc-600 text-xs">
                  Your session will expire in 30 minutes. After that, you will need to sign in again.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSaveApiKey} className="space-y-4">
                <div>
                  <label className="block text-zinc-400 text-sm font-medium mb-2">
                    Enter your PandaDoc API Key
                  </label>
                  <input
                    type="password"
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    placeholder="Paste your API key here..."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-600/50 focus:border-blue-600/50 transition-all"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!apiKeyInput.trim()}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 disabled:cursor-not-allowed text-sm font-bold rounded-xl transition-all"
                >
                  Save API Key
                </button>
                <p className="text-zinc-600 text-xs text-center">
                  Get your API key from{' '}
                  <a
                    href="https://app.pandadoc.com/api/overview"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300"
                  >
                    PandaDoc API Settings
                  </a>
                </p>
              </form>
            )}
          </div>

          {/* PandaDoc Section */}
          {!isConfigured && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6">
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 text-amber-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-amber-200 text-sm">
                  Please add your PandaDoc API key above to enable document features.
                </p>
              </div>
            </div>
          )}

          <div className="space-y-6">
            <div className="flex justify-between items-end">
              <h3 className="text-xl font-bold text-white">PandaDoc Overview</h3>
              <Link
                to="/documents"
                className="text-sm font-semibold text-blue-400 hover:text-blue-300 transition-colors"
              >
                View All Documents →
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {!isConfigured ? (
                <>
                  <div className="p-8 bg-zinc-900 rounded-2xl border border-zinc-800 opacity-50">
                    <h4 className="text-zinc-500 text-sm font-bold uppercase tracking-wider mb-4">Total Docs</h4>
                    <p className="text-5xl font-bold text-zinc-600">—</p>
                  </div>
                  <div className="p-8 bg-zinc-900 rounded-2xl border border-zinc-800 opacity-50">
                    <h4 className="text-zinc-500 text-sm font-bold uppercase tracking-wider mb-4">Completed</h4>
                    <p className="text-5xl font-bold text-zinc-600">—</p>
                  </div>
                  <div className="p-8 bg-zinc-900 rounded-2xl border border-zinc-800 opacity-50">
                    <h4 className="text-zinc-500 text-sm font-bold uppercase tracking-wider mb-4">Pending</h4>
                    <p className="text-5xl font-bold text-zinc-600">—</p>
                  </div>
                </>
              ) : analyticsLoading ? (
                [...Array(3)].map((_, i) => (
                  <div key={i} className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl animate-pulse">
                    <div className="h-4 w-24 bg-zinc-800 rounded mb-4" />
                    <div className="h-10 w-12 bg-zinc-800 rounded" />
                  </div>
                ))
              ) : analyticsError ? (
                <div className="col-span-3 bg-zinc-900 border border-zinc-800 p-8 rounded-2xl text-center">
                  <p className="text-zinc-500 font-medium italic">PandaDoc analytics unavailable</p>
                </div>
              ) : (
                <>
                  <div className="p-8 bg-zinc-900 rounded-2xl border border-zinc-800 group hover:border-blue-500/50 transition-colors">
                    <h4 className="text-zinc-500 text-sm font-bold uppercase tracking-wider mb-4">Total Docs</h4>
                    <p className="text-5xl font-bold text-white group-hover:text-blue-400 transition-colors">
                      {analytics?.total}
                    </p>
                  </div>
                  <div className="p-8 bg-zinc-900 rounded-2xl border border-zinc-800 group hover:border-emerald-500/50 transition-colors">
                    <h4 className="text-zinc-500 text-sm font-bold uppercase tracking-wider mb-4">Completed</h4>
                    <p className="text-5xl font-bold text-white group-hover:text-emerald-400 transition-colors">
                      {analytics?.completed}
                    </p>
                  </div>
                  <div className="p-8 bg-zinc-900 rounded-2xl border border-zinc-800 group hover:border-amber-500/50 transition-colors">
                    <h4 className="text-zinc-500 text-sm font-bold uppercase tracking-wider mb-4">Pending</h4>
                    <p className="text-5xl font-bold text-white group-hover:text-amber-400 transition-colors">
                      {(analytics?.total ?? 0) - (analytics?.completed ?? 0)}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Dashboard
