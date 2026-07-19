'use client'

import { createClient } from '@/utils/supabase/client'
import { useState } from 'react'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [isLogin, setIsLogin] = useState(false)
  const supabase = createClient()

  const handleGoogleLogin = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    
    if (error) {
      console.error(error)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex font-sans">
      {/* Left side - Banner */}
      <div className="hidden lg:flex w-[45%] bg-[#b892ff] flex-col justify-center items-center p-12 relative overflow-hidden">
        <div className="z-10 w-full max-w-lg">
          <h1 className="text-[44px] font-bold text-[#0a092d] mb-4 leading-tight tracking-tight">
            The best way to study.<br/>Sign up for free.
          </h1>
          <p className="text-xl text-[#0a092d]/80 font-medium mt-4">
            Master any subject with flashcards and practice tests.
          </p>
        </div>
        {/* Decorative background elements to simulate books/headphones */}
        <div className="absolute -bottom-32 -right-32 w-[600px] h-[600px] bg-gradient-to-tr from-[#9b66ff] to-[#ff6699] rounded-full blur-3xl opacity-60"></div>
        <div className="absolute top-10 -left-20 w-[400px] h-[400px] bg-gradient-to-br from-white to-[#66ffcc] rounded-full blur-3xl opacity-40"></div>
        <div className="absolute bottom-20 left-10 text-[200px] opacity-10 font-black text-[#0a092d] transform -rotate-12 select-none">Q</div>
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-[55%] bg-white flex flex-col py-12 px-8 sm:px-20 lg:px-32 relative">
        <div className="max-w-[480px] w-full mx-auto mt-12">
          
          {/* Tabs */}
          <div className="flex gap-8 border-b-2 border-gray-100 mb-10 pb-2 relative">
            <button 
              onClick={() => setIsLogin(false)}
              className={`text-2xl font-bold pb-2 -mb-[2px] transition-colors ${!isLogin ? 'text-[#0a092d] border-b-4 border-[#4255ff]' : 'text-muted-foreground hover:text-[#0a092d]'}`}
            >
              Sign up
            </button>
            <button 
              onClick={() => setIsLogin(true)}
              className={`text-2xl font-bold pb-2 -mb-[2px] transition-colors ${isLogin ? 'text-[#0a092d] border-b-4 border-[#4255ff]' : 'text-muted-foreground hover:text-[#0a092d]'}`}
            >
              Log in
            </button>
          </div>

          {/* OAuth Buttons */}
          <div className="space-y-4">
            <button 
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 border-2 border-[#e5e7eb] rounded-xl p-3.5 text-[#0a092d] font-bold text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                <path fill="none" d="M0 0h48v48H0z"/>
              </svg>
              {loading ? 'Connecting...' : `Continue with Google`}
            </button>
          </div>
          
          {/* Divider */}
          <div className="mt-8 mb-6 flex items-center gap-4">
            <div className="flex-1 h-[2px] bg-[#f6f7fb]"></div>
            <span className="text-muted-foreground text-xs font-bold uppercase tracking-wider">or email</span>
            <div className="flex-1 h-[2px] bg-[#f6f7fb]"></div>
          </div>

          {/* Placeholder for Email Form (To be implemented later if needed) */}
          <div className="space-y-5">
            <div>
              <label className="block text-[13px] font-bold text-[#586380] mb-1">Email</label>
              <input type="email" placeholder="user@email.com" className="w-full border-2 border-[#e5e7eb] rounded-xl p-3.5 bg-[#f6f7fb] text-[#0a092d] font-semibold outline-none focus:border-[#4255ff] transition-colors cursor-not-allowed placeholder:text-muted-foreground" disabled />
            </div>
            
            {!isLogin && (
              <div>
                <label className="block text-[13px] font-bold text-[#586380] mb-1">Username</label>
                <input type="text" placeholder="andrew123" className="w-full border-2 border-[#e5e7eb] rounded-xl p-3.5 bg-[#f6f7fb] text-[#0a092d] font-semibold outline-none focus:border-[#4255ff] transition-colors cursor-not-allowed placeholder:text-muted-foreground" disabled />
              </div>
            )}

            <div>
              <label className="block text-[13px] font-bold text-[#586380] mb-1">Password</label>
              <input type="password" placeholder="••••••••" className="w-full border-2 border-[#e5e7eb] rounded-xl p-3.5 bg-[#f6f7fb] text-[#0a092d] font-semibold outline-none focus:border-[#4255ff] transition-colors cursor-not-allowed placeholder:text-muted-foreground" disabled />
            </div>

            {!isLogin && (
              <div className="flex items-start gap-3 mt-4">
                <input type="checkbox" className="mt-1 w-5 h-5 border-2 border-[#e5e7eb] rounded cursor-not-allowed" disabled />
                <span className="text-[13px] text-[#586380] font-semibold">I accept Quiz-Flash's Terms of Service and Privacy Policy</span>
              </div>
            )}

            <button className="w-full bg-[#4255ff] text-foreground font-bold rounded-xl p-4 mt-8 hover:bg-[#5b6aff] transition-colors cursor-not-allowed" disabled>
              {isLogin ? 'Log in' : 'Sign up'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
