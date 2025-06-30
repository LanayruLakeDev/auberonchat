'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase-client'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Github, Mail, Lock, Eye, EyeOff, Users, X } from 'lucide-react'
import Image from 'next/image'
import { GuestNamePrompt } from '@/components/GuestNamePrompt'
import { LocalStorage } from '@/lib/localStorage'
import { LordIcon } from '@/components/LordIcon'

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [showGuestPrompt, setShowGuestPrompt] = useState(false)
  const [showEmailModal, setShowEmailModal] = useState(false)

  const supabase = createClient()
  const router = useRouter()

  const handleEmailModalOpen = () => {
    setShowEmailModal(true)
    setError('')
    setMessage('')
  }

  const handleEmailModalClose = () => {
    setShowEmailModal(false)
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setError('')
    setMessage('')
  }

  const handleGuestLogin = async () => {
    console.log('🎯 GUEST_LOGIN: Button clicked, showing prompt');
    setShowGuestPrompt(true)
  }

  const handleGuestNameSubmit = async (displayName: string) => {
    console.log('🎯 GUEST_NAME_SUBMIT: Starting with name:', displayName);
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/guest-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ displayName }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        console.log('✅ GUEST_NAME_SUBMIT: Guest user created:', result.guestUser);
        
        // Store guest user in localStorage
        LocalStorage.setUser(result.guestUser)
        console.log('🎯 GUEST_NAME_SUBMIT: Stored guest user, redirecting to chat...');
        
        // Hide the prompt immediately to prevent re-rendering
        setShowGuestPrompt(false);
        
        // Use the redirect URL from the API response
        window.location.href = result.redirectUrl
      } else {
        console.log('❌ GUEST_NAME_SUBMIT: Error during guest creation:', result.error);
        setError(result.error || 'Guest creation failed')
        setLoading(false)
      }
    } catch (err) {
      console.error('🎯 GUEST_NAME_SUBMIT: Unexpected error:', err);
      setError('An unexpected error occurred')
      setLoading(false)
    }
  }

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      if (isLogin) {
        console.log('🔐 EMAIL_AUTH: Attempting login for:', email);
        
        const response = await fetch('/api/auth/email-login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        })

        const result = await response.json()

        if (response.ok && result.success) {
          console.log('✅ EMAIL_AUTH: Login successful, user:', result.user.email);
          console.log('� EMAIL_AUTH: Redirecting to chat...');
          
          // Use the redirect URL from the API response
          window.location.href = result.redirectUrl
        } else {
          console.log('❌ EMAIL_AUTH: Error during login:', result.error);
          setError(result.error || 'Login failed')
        }
      } else {
        if (password !== confirmPassword) {
          setError('Passwords do not match')
          return
        }

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/chat`,
          },
        })
        
        if (error) {
          setError(error.message)
        } else {
          setMessage('Check your email for the confirmation link')
        }
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleGithubAuth = async () => {
    setLoading(true)
    setError('')

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/auth/callback?next=/chat`,
        },
      })
      
      if (error) {
        setError(error.message)
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleAuth = async () => {
    setLoading(true)
    setError('')

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/auth/callback?next=/chat`,
        },
      })
      
      if (error) {
        setError(error.message)
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (showGuestPrompt) {
    console.log('🎯 GUEST_PROMPT: Rendering GuestNamePrompt component');
    return (
      <GuestNamePrompt 
        onNameSubmit={handleGuestNameSubmit}
        isLoading={loading}
      />
    )
  }

  return (
    <div className="min-h-screen animated-bg flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl p-8 border border-white/10"
        >
          <div className="text-center mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="w-16 h-16 mx-auto mb-4 glass rounded-2xl flex items-center justify-center relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20"></div>
              <LordIcon
                src="https://cdn.lordicon.com/sswuvtso.json"
                trigger="loop"
                delay="2000"
                stroke="bold"
                colors="primary:#8b5cf6,secondary:#60a5fa"
                style={{width: '32px', height: '32px', position: 'relative', zIndex: 10}}
              />
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-bold text-white mb-2"
            >
              {isLogin ? 'Welcome back' : 'Create account'}
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-white/60"
            >
              {isLogin ? 'Sign in to your account or try as guest' : 'Create a new account to get started'}
            </motion.p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
            >
              {error}
            </motion.div>
          )}

          {message && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm"
            >
              {message}
            </motion.div>
          )}

          <div className="space-y-3 mb-6">
            <motion.button
              type="button"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              onClick={handleGuestLogin}
              disabled={loading}
              className="cursor-pointer w-full p-4 glass-hover rounded-xl border-2 border-purple-500/30 bg-purple-500/10 text-white flex items-center justify-center gap-3 transition-all hover:border-purple-400/50 hover:bg-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <Users size={20} className="text-purple-400" />
              <div className="text-left">
                <div className="font-semibold">Continue as Guest</div>
                <div className="text-xs text-white/60">Try AI chat instantly - no signup required</div>
              </div>
            </motion.button>

            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              onClick={handleGoogleAuth}
              disabled={loading}
              className="cursor-pointer w-full p-3 glass-hover rounded-xl border border-white/10 text-white flex items-center justify-center gap-3 transition-all hover:border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <Image 
                src="/logos/google.svg" 
                alt="Google" 
                width={18} 
                height={18}
                className="brightness-0 invert"
              />
              {isLogin ? 'Sign in with Google' : 'Sign up with Google'}
            </motion.button>

            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              onClick={handleGithubAuth}
              disabled={loading}
              className="cursor-pointer w-full p-3 glass-hover rounded-xl border border-white/10 text-white flex items-center justify-center gap-3 transition-all hover:border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <Github size={18} />
              {isLogin ? 'Sign in with GitHub' : 'Sign up with GitHub'}
            </motion.button>

            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              onClick={handleEmailModalOpen}
              disabled={loading}
              className="cursor-pointer w-full p-3 glass-hover rounded-xl border border-white/10 text-white flex items-center justify-center gap-3 transition-all hover:border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <Mail size={18} />
              {isLogin ? 'Sign in with Email' : 'Sign up with Email'}
            </motion.button>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="mt-6 text-center"
          >
            <span className="text-white/60">
              {isLogin ? "Don't have an account?" : 'Already registered?'}
            </span>
            {' '}
            <button
              onClick={() => {
                setIsLogin(!isLogin)
                setError('')
                setMessage('')
                setEmail('')
                setPassword('')
                setConfirmPassword('')
              }}
              className="cursor-pointer text-purple-400 hover:text-purple-300 font-medium transition-colors"
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.3 }}
            className="mt-6 pt-4 border-t border-white/10 text-center"
          >
            <div className="flex justify-center gap-4 text-xs text-white/40 mb-3">
              <a 
                href="/nutzungsbedingungen" 
                className="hover:text-white/60 transition-colors"
              >
                Terms
              </a>
              <span>•</span>
              <a 
                href="/datenschutz-chat" 
                className="hover:text-white/60 transition-colors"
              >
                Privacy
              </a>
              <span>•</span>
              <a 
                href="/haftungsausschluss" 
                className="hover:text-white/60 transition-colors"
              >
                Disclaimer
              </a>
            </div>              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.4 }}
                className="flex justify-center"
              >
              <motion.a
                href="https://github.com/LanayruLakeDev/auberonchat"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-2 text-white/40 hover:text-white/70 transition-all duration-200 hover:bg-white/5 rounded-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Image 
                  src="/logos/github.svg" 
                  alt="GitHub" 
                  width={16} 
                  height={16}
                  className="brightness-0 invert opacity-60"
                />
                <span className="text-xs font-medium">Project Info & Source Code</span>
              </motion.a>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Email Auth Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="w-full max-w-md glass rounded-2xl p-6 border border-white/10 relative"
          >
            <button
              onClick={handleEmailModalClose}
              className="cursor-pointer absolute top-4 right-4 p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X size={20} className="text-white/60" />
            </button>

            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-white mb-2">
                {isLogin ? 'Sign In' : 'Create Account'}
              </h3>
              <p className="text-white/60">
                {isLogin ? 'Enter your email and password to sign in' : 'Enter your details to create a new account'}
              </p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
              >
                {error}
              </motion.div>
            )}

            {message && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm"
              >
                {message}
              </motion.div>
            )}

            <form onSubmit={handleEmailAuth} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full !pl-11 pr-4 py-3 input-glass text-white placeholder:text-white/40"
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full !pl-11 !pr-12 py-3 input-glass text-white placeholder:text-white/40"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="cursor-pointer absolute right-3 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white/60"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="w-full !pl-11 !pr-12 py-3 input-glass text-white placeholder:text-white/40"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="cursor-pointer absolute right-3 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white/60"
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={handleEmailModalClose}
                  className="flex-1 px-4 py-3 text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {isLogin ? 'Signing in...' : 'Signing up...'}
                    </div>
                  ) : (
                    isLogin ? 'Sign In' : 'Sign Up'
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
} 