'use client';

import { createClient } from '@/utils/supabase/client';
import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(false);
  const initializedRef = useRef(false);

  // Read initial mode from URL once on mount safely
  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      const mode = searchParams.get('mode');
      if (mode === 'login') {
        setIsLogin(true);
      }
    }
  }, [searchParams]);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    if (loading) return;
    setLoading(true);
    setErrorMsg(null);
    const loadingToast = toast.loading('Đang chuyển hướng sang Google Login...');

    try {
      const supabase = createClient();
      const redirectUrl = `${window.location.origin}/auth/callback`;
      console.log('Google Auth Redirect URL:', redirectUrl);

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (error) {
        console.error('Google Auth Error:', error);
        setErrorMsg(`Lỗi Google Login: ${error.message}`);
        toast.dismiss(loadingToast);
        toast.error(`Google Login thất bại: ${error.message}`);
        setLoading(false);
      }
    } catch (err: any) {
      console.error('Google Auth Exception:', err);
      const msg = err.message || 'Không thể kết nối đến Google OAuth.';
      setErrorMsg(msg);
      toast.dismiss(loadingToast);
      toast.error(msg);
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email.trim() || !password.trim()) {
      const msg = 'Vui lòng nhập đầy đủ Email và Mật khẩu!';
      setErrorMsg(msg);
      toast.error(msg);
      return;
    }

    if (!isLogin && !acceptTerms) {
      const msg = 'Vui lòng tích chọn đồng ý Điều khoản dịch vụ!';
      setErrorMsg(msg);
      toast.error(msg);
      return;
    }

    setLoading(true);
    const authToast = toast.loading(isLogin ? 'Đang đăng nhập...' : 'Đang tạo tài khoản...');

    try {
      const supabase = createClient();
      if (isLogin) {
        // Sign In
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          toast.dismiss(authToast);
          setErrorMsg(error.message);
          toast.error(`Đăng nhập thất bại: ${error.message}`);
          setLoading(false);
          return;
        }

        toast.dismiss(authToast);
        toast.success('Đăng nhập thành công!');
        router.push('/');
        router.refresh();
      } else {
        // Sign Up
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName.trim() || email.split('@')[0],
            },
          },
        });

        if (error) {
          toast.dismiss(authToast);
          setErrorMsg(error.message);
          toast.error(`Đăng ký thất bại: ${error.message}`);
          setLoading(false);
          return;
        }

        if (data?.user?.identities?.length === 0) {
          toast.dismiss(authToast);
          const msg = 'Email này đã được đăng ký tài khoản trước đó.';
          setErrorMsg(msg);
          toast.error(msg);
          setLoading(false);
          return;
        }

        toast.dismiss(authToast);
        toast.success('Đăng ký thành công! Chào mừng bạn đến với QuizFlash.');
        router.push('/');
        router.refresh();
      }
    } catch (err: any) {
      console.error(err);
      toast.dismiss(authToast);
      const msg = err.message || 'Xảy ra lỗi trong quá trình xác thực.';
      setErrorMsg(msg);
      toast.error(msg);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex font-sans bg-white text-slate-900">
      {/* Left side - Banner */}
      <div className="hidden lg:flex w-[45%] bg-[#b892ff] flex-col justify-center items-center p-12 relative overflow-hidden">
        <div className="z-10 w-full max-w-lg">
          <h1 className="text-[44px] font-bold text-[#0a092d] mb-4 leading-tight tracking-tight">
            The best way to study.<br />Sign up for free.
          </h1>
          <p className="text-xl text-[#0a092d]/80 font-medium mt-4">
            Master any subject with flashcards and practice tests.
          </p>
        </div>
        {/* Decorative background elements */}
        <div className="absolute -bottom-32 -right-32 w-[600px] h-[600px] bg-gradient-to-tr from-[#9b66ff] to-[#ff6699] rounded-full blur-3xl opacity-60 pointer-events-none"></div>
        <div className="absolute top-10 -left-20 w-[400px] h-[400px] bg-gradient-to-br from-white to-[#66ffcc] rounded-full blur-3xl opacity-40 pointer-events-none"></div>
        <div className="absolute bottom-20 left-10 text-[200px] opacity-10 font-black text-[#0a092d] transform -rotate-12 select-none pointer-events-none">Q</div>
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-[55%] bg-white flex flex-col py-8 sm:py-12 px-6 sm:px-20 lg:px-32 relative z-20">
        <div className="max-w-[480px] w-full mx-auto mt-2 sm:mt-6">
          
          {/* High-Contrast Segmented Tab Switcher */}
          <div className="flex p-1.5 rounded-2xl bg-slate-100 border border-slate-200 mb-6 relative z-50 shadow-inner">
            <button 
              type="button"
              onClick={() => {
                console.log("Tab Sign up clicked");
                setIsLogin(false);
                setErrorMsg(null);
              }}
              className={`flex-1 py-3 text-base sm:text-lg font-black rounded-xl transition-all duration-200 select-none cursor-pointer text-center touch-manipulation ${
                !isLogin 
                  ? 'bg-white text-[#4255ff] shadow-md border border-slate-200' 
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Sign up
            </button>
            <button 
              type="button"
              onClick={() => {
                console.log("Tab Log in clicked");
                setIsLogin(true);
                setErrorMsg(null);
              }}
              className={`flex-1 py-3 text-base sm:text-lg font-black rounded-xl transition-all duration-200 select-none cursor-pointer text-center touch-manipulation ${
                isLogin 
                  ? 'bg-[#4255ff] text-white shadow-md' 
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Log in
            </button>
          </div>

          {/* Mode Description Indicator */}
          <div className="mb-6 px-4 py-3 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-900 text-xs sm:text-sm font-bold flex items-center justify-between">
            <span>Đang chọn chế độ: <strong className="text-[#4255ff] uppercase font-black ml-1">{isLogin ? 'Đăng nhập (Log in)' : 'Tạo tài khoản (Sign up)'}</strong></span>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs sm:text-sm font-semibold relative z-30">
              ⚠️ {errorMsg}
            </div>
          )}

          {/* OAuth Buttons */}
          <div className="space-y-4 relative z-30">
            <button 
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 border-2 border-[#e5e7eb] rounded-xl p-3.5 text-[#0a092d] font-bold text-sm bg-white hover:bg-gray-50 active:bg-gray-100 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer select-none touch-manipulation shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5 shrink-0">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                <path fill="none" d="M0 0h48v48H0z"/>
              </svg>
              <span>{loading ? 'Đang xử lý...' : 'Continue with Google'}</span>
            </button>
          </div>
          
          {/* Divider */}
          <div className="mt-6 mb-6 flex items-center gap-4 relative z-30">
            <div className="flex-1 h-[2px] bg-slate-100"></div>
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">hoặc dùng email</span>
            <div className="flex-1 h-[2px] bg-slate-100"></div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4 relative z-30">
            <div>
              <label className="block text-[13px] font-bold text-[#586380] mb-1">Email</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@email.com" 
                className="w-full border-2 border-[#e5e7eb] rounded-xl p-3.5 bg-[#f6f7fb] text-[#0a092d] font-semibold outline-none focus:border-[#4255ff] focus:bg-white transition-colors placeholder:text-slate-400" 
              />
            </div>
            
            {!isLogin && (
              <div>
                <label className="block text-[13px] font-bold text-[#586380] mb-1">Full Name</label>
                <input 
                  type="text" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Alex Andrew" 
                  className="w-full border-2 border-[#e5e7eb] rounded-xl p-3.5 bg-[#f6f7fb] text-[#0a092d] font-semibold outline-none focus:border-[#4255ff] focus:bg-white transition-colors placeholder:text-slate-400" 
                />
              </div>
            )}

            <div>
              <label className="block text-[13px] font-bold text-[#586380] mb-1">Password</label>
              <input 
                type="password" 
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" 
                className="w-full border-2 border-[#e5e7eb] rounded-xl p-3.5 bg-[#f6f7fb] text-[#0a092d] font-semibold outline-none focus:border-[#4255ff] focus:bg-white transition-colors placeholder:text-slate-400" 
              />
            </div>

            {!isLogin && (
              <div className="flex items-start gap-3 mt-3">
                <input 
                  type="checkbox" 
                  id="terms"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="mt-1 w-5 h-5 border-2 border-[#e5e7eb] rounded cursor-pointer accent-[#4255ff] shrink-0" 
                />
                <label htmlFor="terms" className="text-[13px] text-[#586380] font-semibold cursor-pointer select-none">
                  Tôi đồng ý với Điều khoản dịch vụ và Chính sách bảo mật của QuizFlash.
                </label>
              </div>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-[#4255ff] text-white font-bold rounded-xl p-4 mt-6 hover:bg-[#5b6aff] active:bg-[#3646d9] active:scale-[0.98] transition-all cursor-pointer shadow-lg disabled:opacity-50 select-none touch-manipulation"
            >
              {loading ? 'Đang xử lý...' : (isLogin ? 'Đăng nhập (Log in)' : 'Tạo tài khoản (Sign up)')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center font-bold text-slate-800">Đang tải trang xác thực...</div>}>
      <LoginContent />
    </Suspense>
  );
}
