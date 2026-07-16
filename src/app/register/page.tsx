'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Eye, EyeOff, UserPlus, ArrowLeft } from 'lucide-react';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(true);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col relative overflow-hidden">
      <div className="absolute -top-[160px] -right-[120px] w-[400px] h-[400px] rounded-full opacity-[0.06] pointer-events-none"
        style={{ background: 'radial-gradient(circle, #5856D6 0%, transparent 70%)' }} />
      <div className="absolute -bottom-[200px] -left-[120px] w-[500px] h-[500px] rounded-full opacity-[0.04] pointer-events-none"
        style={{ background: 'radial-gradient(circle, #E6002D 0%, transparent 70%)' }} />

      <div className="px-4 pt-[60px] pb-4">
        <Link href="/login" className="w-10 h-10 rounded-full bg-[rgba(0,0,0,0.04)] flex items-center justify-center hover:bg-[rgba(0,0,0,0.06)] transition-colors">
          <ArrowLeft size={20} className="text-[#111]" />
        </Link>
      </div>

      <div className="flex-1 flex flex-col justify-center px-6 max-w-[420px] mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          {success ? (
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-[72px] h-[72px] rounded-full bg-[#34C759] mx-auto mb-5 flex items-center justify-center"
              >
                <span className="text-white text-[32px]">✓</span>
              </motion.div>
              <h1 className="text-[28px] font-bold text-[#111] mb-2">Đăng ký thành công!</h1>
              <p className="text-[15px] text-[#6B7280] mb-8">
                Tài khoản <strong className="text-[#111]">{email}</strong> đã được tạo.
              </p>
              <Link
                href="/login"
                className="btn-ios-primary inline-flex items-center justify-center px-8 h-[52px]"
              >
                Đăng nhập ngay
              </Link>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <div className="w-[72px] h-[72px] rounded-[20px] bg-[#5856D6] mx-auto mb-5 flex items-center justify-center"
                  style={{ boxShadow: '0 12px 32px rgba(88,86,214,0.25)' }}
                >
                  <UserPlus size={30} className="text-white" />
                </div>
                <h1 className="text-[32px] font-bold text-[#111] tracking-tight">Đăng ký</h1>
                <p className="text-[15px] text-[#6B7280] mt-1.5 font-medium">
                  Tạo tài khoản PROT LIFE
                </p>
              </div>

              <form onSubmit={handleRegister} className="space-y-[18px]">
                <div>
                  <label className="text-[12px] font-semibold text-[#6B7280] mb-[6px] block tracking-[0.3px] uppercase">
                    Họ tên
                  </label>
                  <input
                    type="text"
                    placeholder="Nguyễn Văn A"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input-ios"
                    required
                  />
                </div>
                <div>
                  <label className="text-[12px] font-semibold text-[#6B7280] mb-[6px] block tracking-[0.3px] uppercase">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-ios"
                    required
                  />
                </div>
                <div>
                  <label className="text-[12px] font-semibold text-[#6B7280] mb-[6px] block tracking-[0.3px] uppercase">
                    Mật khẩu
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input-ios pr-[44px]"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-[14px] top-1/2 -translate-y-1/2 text-[#8E8E93]"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <motion.button
                  type="submit"
                  whileTap={{ scale: 0.97 }}
                  className="btn-ios-primary w-full h-[52px] text-[15px]"
                >
                  <UserPlus size={18} className="mr-2" />
                  Đăng ký
                </motion.button>
              </form>

              <p className="text-center mt-8 text-[13px] text-[#8E8E93] font-medium">
                Đã có tài khoản?{' '}
                <Link href="/login" className="text-[#5856D6] font-semibold hover:opacity-80 transition-opacity">
                  Đăng nhập
                </Link>
              </p>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
