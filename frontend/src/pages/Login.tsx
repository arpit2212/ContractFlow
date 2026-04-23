import React, { useState } from 'react'
import { signInWithGoogle } from '../services/auth'
import { motion, AnimatePresence } from 'framer-motion'
import { ShieldCheck, ArrowRight, Lock } from 'lucide-react'

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError(null)
    try {
      await signInWithGoogle()
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google')
      setLoading(false)
    }
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.6, 
        ease: "easeOut",
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f2f2f2] relative overflow-hidden font-sans">
      {/* Dynamic Background Elements */}
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          rotate: [0, 90, 0],
          x: [0, 50, 0],
          y: [0, 30, 0]
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] bg-[#E1F5EE] rounded-full blur-[100px] opacity-40" 
      />
      <motion.div 
        animate={{ 
          scale: [1, 1.1, 1],
          rotate: [0, -45, 0],
          x: [0, -30, 0],
          y: [0, -20, 0]
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-[-10%] right-[-5%] w-[45%] h-[45%] bg-[#1D9E75]/10 rounded-full blur-[120px] opacity-30" 
      />

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-md w-full mx-4 relative z-10"
      >
        {/* Secure Badge */}
        <motion.div 
          variants={itemVariants}
          className="flex justify-center mb-6"
        >
          <div className="flex items-center gap-2 px-4 py-1.5 bg-white/80 backdrop-blur-sm border border-gray-100 rounded-full shadow-sm">
            <ShieldCheck className="w-4 h-4 text-[#1D9E75]" />
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Enterprise Grade Security</span>
          </div>
        </motion.div>

        <div className="bg-white p-10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-white/50 relative overflow-hidden">
          {/* Subtle internal gradient */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#1D9E75]/20 to-transparent" />

          <div className="text-center mb-12">
            <motion.h1 
              variants={itemVariants}
              className="text-4xl font-extrabold text-gray-900 mb-3 tracking-tight"
            >
              Deccan <span className="text-[#1D9E75]">Vault</span>
            </motion.h1>
            <motion.p 
              variants={itemVariants}
              className="text-gray-400 text-xs font-bold uppercase tracking-[0.2em]"
            >
              document automation
            </motion.p>
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm flex items-center gap-3 overflow-hidden"
              >
                <div className="w-2 h-2 bg-red-500 rounded-full shrink-0" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-8">
            <motion.div variants={itemVariants} className="text-center space-y-2">
              <h3 className="text-lg font-bold text-gray-800">Welcome back</h3>
              <p className="text-gray-500 text-sm px-4 leading-relaxed">
                Connect your Google account to access your documents and automated workflows.
              </p>
            </motion.div>

            <motion.button
              variants={itemVariants}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full h-14 bg-white border border-gray-100 text-gray-700 font-bold rounded-2xl hover:border-[#1D9E75]/30 hover:shadow-lg hover:shadow-[#1D9E75]/5 transition-all duration-300 flex items-center justify-between px-6 group shadow-sm disabled:opacity-70 relative overflow-hidden"
            >
              <div className="flex items-center gap-4">
                {loading ? (
                  <div className="w-6 h-6 border-2 border-gray-100 border-t-[#1D9E75] rounded-full animate-spin" />
                ) : (
                  <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                  </svg>
                )}
                <span className="text-sm font-bold group-hover:text-gray-900 transition-colors">
                  {loading ? 'Authorizing...' : 'Continue with Google'}
                </span>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-[#1D9E75] group-hover:translate-x-1 transition-all" />
            </motion.button>
          </div>

          <motion.div 
            variants={itemVariants}
            className="mt-12 pt-8 border-t border-gray-50 text-center"
          >
            <div className="flex items-center justify-center gap-2 mb-4">
              <Lock className="w-3 h-3 text-gray-300" />
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Privacy First</p>
            </div>
            <p className="text-[10px] text-gray-400 font-medium leading-relaxed">
              Protected by industry standard encryption. <br />
              <a href="#" className="text-[#1D9E75] hover:text-[#0F6E56] font-bold transition-colors">Terms</a> & <a href="#" className="text-[#1D9E75] hover:text-[#0F6E56] font-bold transition-colors">Privacy</a>
            </p>
          </motion.div>
        </div>
        
        {/* Footer Support */}
        <motion.p 
          variants={itemVariants}
          className="text-center mt-8 text-[11px] font-bold text-gray-400 uppercase tracking-widest"
        >
          &copy; 2026 Deccan Vault Systems
        </motion.p>
      </motion.div>
    </div>
  )
}

export default Login
