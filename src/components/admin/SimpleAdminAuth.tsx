import React, { useState } from 'react'
import { X, Eye, EyeOff } from 'lucide-react'

interface SimpleAdminAuthProps {
  onAuthenticated: (role: 'admin' | 'moderator') => void
  onClose: () => void
}

export default function SimpleAdminAuth({ onAuthenticated, onClose }: SimpleAdminAuthProps) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Unified password system with role differentiation
  const UNIFIED_PASSWORD = 'BLKOUT2025!'
  const ADMIN_SUFFIX = 'admin'
  const MODERATOR_SUFFIX = 'mod'

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    let role: 'admin' | 'moderator' | null = null
    
    if (password === `${UNIFIED_PASSWORD}${ADMIN_SUFFIX}`) {
      role = 'admin'
    } else if (password === `${UNIFIED_PASSWORD}${MODERATOR_SUFFIX}`) {
      role = 'moderator'
    } else if (password === UNIFIED_PASSWORD) {
      // Default to admin for base password
      role = 'admin'
    } else {
      setError('Invalid password. Use BLKOUT2025! (admin) or BLKOUT2025!mod (moderator)')
      setPassword('')
      return
    }

    onAuthenticated(role)
    setError('')
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-slate-800 border border-slate-600 rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">Admin Authentication</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="BLKOUT2025! or BLKOUT2025!mod"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2 text-slate-400 hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-600/50 rounded p-3 text-red-200 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 transition-colors"
          >
            Authenticate
          </button>
        </form>
      </div>
    </div>
  )
}