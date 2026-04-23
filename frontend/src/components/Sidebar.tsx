import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, FileText, LayoutGrid, Send, Users, LogOut, ChevronLeft, ChevronRight } from 'lucide-react'
import { signOut } from '../services/auth'
import { useAuth } from '../hooks/useAuth'
import { motion, AnimatePresence } from 'framer-motion'
import logoSvg from '../assets/deccan_vault_logo.svg'

interface NavItemProps {
  to: string
  label: string
  icon: React.ReactNode
  active: boolean
  isCollapsed: boolean
}

const NavItem: React.FC<NavItemProps> = ({ to, label, icon, active, isCollapsed }) => (
  <Link
    to={to}
    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative ${
      active
        ? 'bg-[#E1F5EE] text-[#1D9E75] shadow-sm'
        : 'text-gray-500 hover:text-[#1D9E75] hover:bg-gray-50'
    }`}
  >
    <span className={`${active ? 'text-[#1D9E75]' : 'text-gray-400 group-hover:text-[#1D9E75]'}`}>
      {icon}
    </span>
    {!isCollapsed && (
      <motion.span
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -10 }}
        className="whitespace-nowrap"
      >
        {label}
      </motion.span>
    )}
    {isCollapsed && (
      <div className="absolute left-full ml-4 px-2 py-1 bg-gray-900 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
        {label}
      </div>
    )}
  </Link>
)

const Sidebar: React.FC = () => {
  const location = useLocation()
  const { user } = useAuth()
  const [isCollapsed, setIsCollapsed] = useState(false)

  const navItems = [
    {
      to: '/dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      to: '/documents',
      label: 'Documents',
      icon: <FileText className="w-5 h-5" />,
    },
    {
      to: '/templates',
      label: 'Templates',
      icon: <LayoutGrid className="w-5 h-5" />,
    },
    {
      to: '/send-contract',
      label: 'Send Contract',
      icon: <Send className="w-5 h-5" />,
    },
    {
      to: '/bulk-send',
      label: 'Mass Share',
      icon: <Users className="w-5 h-5" />,
    },
  ]

  const handleLogout = async () => {
    try {
      await signOut()
      window.location.href = '/login'
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <motion.div
      animate={{ width: isCollapsed ? '80px' : '256px' }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="border-r border-gray-100 bg-white flex flex-col h-full sticky top-0 z-30 shadow-sm"
    >
      {/* Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-4 top-20 w-8 h-8 bg-white border border-gray-100 rounded-full shadow-sm flex items-center justify-center text-gray-400 hover:text-[#1D9E75] hover:shadow-md transition-all z-40"
      >
        {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
      </button>

      <div className="p-6">
        <Link to="/dashboard" className="flex items-center gap-3 group overflow-hidden">
          <div className="w-8 h-8 shrink-0 flex items-center justify-center transition-transform group-hover:scale-105">
            <img src={logoSvg} alt="Deccan Vault" className="w-full h-full object-contain" />
          </div>
          {!isCollapsed && (
            <motion.h1
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="text-lg font-bold tracking-tight text-gray-900 whitespace-nowrap"
            >
              Deccan Vault
            </motion.h1>
          )}
        </Link>
      </div>

      <nav className="flex-1 px-4 py-4 flex flex-col gap-1 overflow-hidden">
        <AnimatePresence>
          {!isCollapsed && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 whitespace-nowrap"
            >
              Main Menu
            </motion.p>
          )}
        </AnimatePresence>
        {navItems.map((item) => (
          <NavItem
            key={item.to}
            to={item.to}
            label={item.label}
            icon={item.icon}
            active={location.pathname === item.to}
            isCollapsed={isCollapsed}
          />
        ))}
      </nav>

      <div className="p-4 border-t border-gray-50 overflow-hidden">
        <div className="space-y-1">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-all duration-200 group relative`}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
              >
                Logout
              </motion.span>
            )}
            {isCollapsed && (
              <div className="absolute left-full ml-4 px-2 py-1 bg-gray-900 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                Logout
              </div>
            )}
          </button>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-50 flex items-center gap-3 px-2 min-h-[56px]">
          {user?.user_metadata?.avatar_url ? (
            <img
              src={user.user_metadata.avatar_url}
              alt="Avatar"
              className="w-9 h-9 rounded-xl border border-gray-100 shadow-sm shrink-0"
            />
          ) : (
            <div className="w-9 h-9 rounded-xl bg-[#E1F5EE] text-[#1D9E75] flex items-center justify-center font-bold shadow-sm shrink-0">
              {user?.email?.[0].toUpperCase()}
            </div>
          )}
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex-1 min-w-0"
            >
              <p className="text-xs font-bold text-gray-900 truncate">
                {user?.user_metadata?.full_name || 'User'}
              </p>
              <p className="text-[10px] text-gray-500 truncate">
                {user?.email || 'Admin Account'}
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default Sidebar
