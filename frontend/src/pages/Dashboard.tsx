import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { signOut } from '../services/auth'
import Sidebar from '../components/Sidebar'
import { usePandaDocAnalytics } from '../hooks/usePandaDoc'

const Dashboard: React.FC = () => {
  const { user, loading } = useAuth()
  const { analytics, loading: analyticsLoading, error: analyticsError } = usePandaDocAnalytics()

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (err) {
      console.error('Error signing out:', err)
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

          {/* PandaDoc Section */}
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
              {analyticsLoading ? (
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
