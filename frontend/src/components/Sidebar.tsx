import React from 'react'
import { Link, useLocation } from 'react-router-dom'

interface NavItemProps {
  to: string
  label: string
  icon: React.ReactNode
  active: boolean
}

const NavItem: React.FC<NavItemProps> = ({ to, label, icon, active }) => (
  <Link
    to={to}
    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
      active
        ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20 shadow-sm shadow-blue-600/10'
        : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
    }`}
  >
    <span className={active ? 'text-blue-400' : 'text-zinc-500 group-hover:text-white'}>
      {icon}
    </span>
    {label}
  </Link>
)

const Sidebar: React.FC = () => {
  const location = useLocation()

  const navItems = [
    {
      to: '/dashboard',
      label: 'Dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      to: '/documents',
      label: 'Documents',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      to: '/send-contract',
      label: 'Send Contract',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
      ),
    },
    {
      to: '/bulk-send',
      label: 'Mass Share',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
  ]

  return (
    <div className="w-64 border-r border-zinc-800 bg-zinc-950 flex flex-col h-full sticky top-0 overflow-y-auto">
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white">C</div>
          <h1 className="text-xl font-bold tracking-tight text-white">ContractFlow</h1>
        </div>
      </div>

      <nav className="flex-1 px-4 py-4 flex flex-col gap-2">
        {navItems.map((item) => (
          <NavItem
            key={item.to}
            to={item.to}
            label={item.label}
            icon={item.icon}
            active={location.pathname === item.to}
          />
        ))}
      </nav>

      <div className="p-4 border-t border-zinc-800">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">User Account</p>
            <p className="text-xs text-zinc-500 truncate">Settings</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Sidebar
