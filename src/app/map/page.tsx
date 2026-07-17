'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Map, Navigation, MapPin } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';

export default function MapPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="page-content">
      <div className="section-title">
        <h2>Bản đồ</h2>
      </div>

      <div className="glass-card p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-[rgba(0,122,255,0.08)] mx-auto mb-4 flex items-center justify-center">
          <Map size={28} className="text-[#007AFF]" />
        </div>
        <h3 className="text-[18px] font-bold text-[#111] mb-2">Bản đồ tương tác</h3>
        <p className="text-[13px] text-[#8E8E93] max-w-sm mx-auto leading-relaxed">
          Xem tất cả địa điểm gắn với sự kiện và mối quan hệ trên bản đồ.
        </p>
        <button className="btn-glass-primary mt-5">
          <MapPin size={16} />
          Khám phá địa điểm
        </button>
      </div>
    </div>
  );
}
