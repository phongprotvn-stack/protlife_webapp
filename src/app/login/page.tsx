'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, Eye, EyeOff, LogIn } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle login
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Back button */}
      <div className="px-4 pt-[60px] pb-4">
        <Link href="/" className="w-10 h-10 rounded-full bg-[rgba(0,0,0,0.04)] flex items-center justify-center">
          <ArrowLeft size={20} className="text-[#111]" />
        </Link>
      </div>

      <div className="flex-1 px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
        >
          {/* Logo */}
          <div className="w-16 h-16 rounded-[18px] gradient-primary mb-6 flex items-center justify-center"
            style={{ boxShadow: '0 8px 24px rgba(230,0,45,0.25)' }}
          >
            <span className="text-white text-[26px] font-bold">PL</span>
          </div>

          <h1 className="text-[30px] font-bold text-[#111] mb-1">Đăng nhập</h1>
          <p className="text-[15px] text-[#6B7280] mb-8">Chào mừng trở lại với PROT LIFE</p>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email */}
            <div>
              <label className="text-[13px] font-semibold text-[#6B7280] mb-1.5 block">Email</label>
              <input
                type="email"
                placeholder="phongprot.vn@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-ios"
              />
            </div>

            {/* Password */}
            <div>
              <label className="text-[13px] font-semibold text-[#6B7280] mb-1.5 block">Mật khẩu</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-ios pr-[44px]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-[14px] top-1/2 -translate-y-1/2 text-[#8E8E93]"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Forgot password */}
            <div className="flex justify-end">
              <button className="text-[13px] font-medium text-[#E6002D]">
                Quên mật khẩu?
              </button>
            </div>

            {/* Login button */}
            <button type="submit" className="btn-ios-primary w-full">
              <LogIn size={18} className="mr-2" />
              Đăng nhập
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-[1px] bg-[rgba(0,0,0,0.06)]" />
            <span className="text-[13px] text-[#8E8E93] font-medium">hoặc</span>
            <div className="flex-1 h-[1px] bg-[rgba(0,0,0,0.06)]" />
          </div>

          {/* Social login */}
          <div className="space-y-3">
            <button className="w-full h-[50px] rounded-[14px] border border-[rgba(0,0,0,0.08)] flex items-center justify-center gap-3 text-[15px] font-medium text-[#111] hover:bg-[rgba(0,0,0,0.02)] transition-all active:scale-[0.98]">
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Tiếp tục với Google
            </button>
            <button className="w-full h-[50px] rounded-[14px] border border-[rgba(0,0,0,0.08)] flex items-center justify-center gap-3 text-[15px] font-medium text-[#111] hover:bg-[rgba(0,0,0,0.02)] transition-all active:scale-[0.98]">
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#111" d="M17.05 20.28c-.98.95-2.05.82-3.08.38-1.07-.44-2.06-.48-3.1 0-1.3.63-1.98.48-2.74-.38C5.06 16.78 5.39 11.55 9 9.37c1.35-.85 2.66-.82 3.73.02.76.58 1.16.58 1.88 0 .97-.78 2.14-.86 3.3-.44 1.84.68 2.9 2.2 2.77 4.22-.14 1.7-1.08 2.65-2.63 3.11zM12.03 9.25c-.14-2.08 1.48-3.94 3.3-4.25.24 1.92-1.27 3.82-3.3 4.25z" />
              </svg>
              Tiếp tục với Apple
            </button>
          </div>

          <p className="text-center mt-8 text-[13px] text-[#8E8E93]">
            Chưa có tài khoản?{' '}
            <Link href="/register" className="text-[#E6002D] font-medium">
              Đăng ký
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
