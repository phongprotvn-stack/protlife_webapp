'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Sparkles, Heart, Users, Calendar, Clock, Shield } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden px-6 pt-20 pb-16">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-hero opacity-5" />
        
        <div className="relative z-10 max-w-lg mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
          >
            {/* App Icon */}
            <div className="w-20 h-20 rounded-[22px] gradient-primary mx-auto mb-6 flex items-center justify-center shadow-lg"
              style={{ boxShadow: '0 8px 32px rgba(230,0,45,0.25)' }}
            >
              <span className="text-white text-[32px] font-bold">PL</span>
            </div>

            <h1 className="text-[34px] font-bold text-[#111] mb-3 tracking-tight">
              PROT <span className="text-gradient">LIFE</span>
            </h1>
            <p className="text-[16px] text-[#6B7280] leading-relaxed mb-8">
              Hệ điều hành cuộc sống cá nhân — nơi lưu giữ những mối quan hệ, ký ức và hành trình cuộc đời bạn.
            </p>

            <div className="flex flex-col gap-3">
              <Link
                href="/dashboard"
                className="btn-ios-primary w-full text-center"
              >
                Bắt đầu hành trình
                <ArrowRight size={18} className="ml-2" />
              </Link>
              <Link
                href="/login"
                className="btn-ios-ghost w-full text-center"
              >
                Đăng nhập
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="px-6 pb-16">
        <div className="max-w-lg mx-auto space-y-4">
          <FeatureCard
            icon={Heart}
            title="Mối quan hệ"
            description="Quản lý các mối quan hệ gia đình, bạn bè, đồng nghiệp với điểm thân thiết thông minh."
            delay={0.1}
          />
          <FeatureCard
            icon={Calendar}
            title="Sự kiện & Ký ức"
            description="Ghi lại những khoảnh khắc đáng nhớ trên dòng thời gian cuộc đời."
            delay={0.2}
          />
          <FeatureCard
            icon={Clock}
            title="Bánh xe thời gian"
            description="Quay ngược quá khứ, tận hưởng hiện tại và hướng đến tương lai."
            delay={0.3}
          />
          <FeatureCard
            icon={Shield}
            title="Cá nhân & Riêng tư"
            description="Dữ liệu được bảo vệ. Chỉ bạn mới có quyền chỉnh sửa."
            delay={0.4}
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 pb-10 text-center">
        <p className="text-[13px] text-[#8E8E93]">
          Made with ❤️ by Prot
        </p>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
  delay,
}: {
  icon: any;
  title: string;
  description: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.32, 0.72, 0, 1] }}
      className="card-ios"
    >
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-[14px] bg-[#E6002D]/10 flex items-center justify-center flex-shrink-0">
          <Icon size={20} className="text-[#E6002D]" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-[16px] font-semibold text-[#111] mb-1">{title}</h3>
          <p className="text-[14px] text-[#6B7280] leading-relaxed">{description}</p>
        </div>
      </div>
    </motion.div>
  );
}
