'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Target, RefreshCw, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';
import { goalService, type Goal } from '@/lib/services/goal-service';
import { useRouter } from 'next/navigation';

export default function GoalsPage() {
  const router = useRouter();
  const [isDesktop, setIsDesktop] = useState(false);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setIsDesktop(window.innerWidth >= 768);
    loadGoals();
  }, []);

  const loadGoals = async () => {
    setLoading(true);
    try {
      const data = await goalService.getAll();
      setGoals(data);
    } catch {}
    setLoading(false);
  };

  if (!isDesktop) {
    return (
      <div className="page-content">
        <div className="flex items-center justify-between mb-4">
          <div><h1 className="text-[22px] font-bold text-[#111] tracking-tight">Mục tiêu</h1><p className="text-[12px] text-[#8E8E93] mt-0.5">{goals.length} mục tiêu</p></div>
        </div>
        <div className="glass-card p-10 text-center">
          <div className="w-14 h-14 rounded-full bg-[#34C759]/5 mx-auto mb-3 flex items-center justify-center">
            <Target size={24} className="text-[#34C759]/30" />
          </div>
          <p className="text-[14px] font-medium text-[#6B7280]">{loading ? 'Đang tải...' : 'Chưa có mục tiêu nào'}</p>
          <p className="text-[12px] text-[#9CA3AF] mt-1">Đặt mục tiêu và theo dõi tiến độ</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 relative">
          <Search size={15} className="absolute left-[12px] top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
          <input type="text" placeholder="Tìm kiếm mục tiêu..."
            className="w-full h-[38px] pl-[34px] pr-[12px] rounded-[8px] bg-white border border-[rgba(0,0,0,0.06)] text-[13px] outline-none focus:border-[#E6002D]" />
        </div>
        <button onClick={() => router.push('/goals/add')}
          className="h-[38px] px-4 rounded-[8px] bg-[#E6002D] text-white text-[12px] font-semibold flex items-center gap-1.5 hover:bg-[#D40028] transition-all shadow-sm">
          <Plus size={16} strokeWidth={2.5} /> Thêm mục tiêu
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-[#E6002D]/20 border-t-[#E6002D] rounded-full animate-spin" />
        </div>
      ) : goals.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-[rgba(52,199,89,0.06)] flex items-center justify-center mb-4">
            <Target size={28} className="text-[#34C759]/30" />
          </div>
          <p className="text-[14px] font-medium text-[#6B7280]">Chưa có mục tiêu nào</p>
          <p className="text-[12px] text-[#9CA3AF] mt-1">Nhấn "Thêm mục tiêu" để bắt đầu</p>
        </div>
      ) : (
        <div className="glass-card-compact overflow-hidden" style={{ borderRadius: '12px', border: '1px solid rgba(0,0,0,0.04)' }}>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[rgba(0,0,0,0.02)]">
                <th className="py-2.5 px-3 text-[11px] font-semibold text-[#8E8E93] uppercase text-left">Mục tiêu</th>
                <th className="py-2.5 px-3 text-[11px] font-semibold text-[#8E8E93] uppercase text-center w-[100px]">Trạng thái</th>
                <th className="py-2.5 px-3 text-[11px] font-semibold text-[#8E8E93] uppercase text-center w-[100px]">Hạn chót</th>
                <th className="py-2.5 px-3 text-[11px] font-semibold text-[#8E8E93] uppercase text-center w-[80px]">Ưu tiên</th>
                <th className="py-2.5 px-3 text-[11px] font-semibold text-[#8E8E93] uppercase text-center w-[100px]">Tiến độ</th>
              </tr>
            </thead>
            <tbody>
              {goals.map((goal) => (
                <tr key={goal.GoalID} className="border-t border-[rgba(0,0,0,0.03)] hover:bg-[rgba(0,0,0,0.01)] transition-colors cursor-pointer"
                  onClick={() => router.push(`/goals/${goal.GoalID}`)}>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-[26px] h-[26px] rounded-full bg-[rgba(52,199,89,0.08)] flex items-center justify-center">
                        <Target size={12} className="text-[#34C759]"/>
                      </div>
                      <span className="text-[13px] font-medium text-[#111]">{goal.Title}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded-[4px] text-[10px] font-medium ${
                      goal.Status === 'Completed' ? 'bg-[#34C759]/10 text-[#34C759]' :
                      goal.Status === 'In Progress' ? 'bg-[#007AFF]/10 text-[#007AFF]' :
                      'bg-[#8E8E93]/10 text-[#8E8E93]'
                    }`}>{goal.Status || 'Not Started'}</span>
                  </td>
                  <td className="py-2.5 px-3 text-center text-[12px] text-[#5F6368]">{goal.Deadline || '—'}</td>
                  <td className="py-2.5 px-3 text-center text-[12px] text-[#5F6368]">{goal.Priority || '—'}</td>
                  <td className="py-2.5 px-3 text-center">
                    <div className="flex items-center gap-1.5 justify-center">
                      <div className="w-[50px] h-[4px] rounded-full bg-[rgba(0,0,0,0.06)] overflow-hidden">
                        <div className="h-full rounded-full bg-[#34C759] transition-all" style={{ width: `${goal.Progress || 0}%` }} />
                      </div>
                      <span className="text-[10px] text-[#8E8E93]">{goal.Progress || 0}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
