'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, FileText, RefreshCw, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';
import { documentService, type Document } from '@/lib/services/document-service';
import { useRouter } from 'next/navigation';

export default function DocumentsPage() {
  const router = useRouter();
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    setIsDesktop(window.innerWidth >= 768);
  }, []);

  const { data: docs = [], isLoading: loading, refetch } = useQuery({
    queryKey: ['documents'],
    queryFn: async () => {
      const data = await documentService.getAll();
      return data;
    },
    staleTime: 60_000,
    retry: 3,
    retryDelay: (attempt) => Math.min(1500 * attempt, 5000),
    refetchOnWindowFocus: false,
  });

  if (!isDesktop) {
    return (
      <div className="page-content">
        <div className="flex items-center justify-between mb-4">
          <div><h1 className="text-[22px] font-bold text-[#111] tracking-tight">Tài liệu</h1><p className="text-[12px] text-[#8E8E93] mt-0.5">{docs.length} tài liệu</p></div>
          <div className="flex items-center gap-2">
            <button onClick={() => refetch()} className="w-[38px] h-[38px] rounded-[10px] bg-[rgba(0,0,0,0.04)] flex items-center justify-center">
              <RefreshCw size={15} className="text-[#8E8E93]" />
            </button>
            <button onClick={() => router.push('/documents/add')}
              className="w-[38px] h-[38px] rounded-[10px] bg-[#E6002D] text-white flex items-center justify-center shadow-md active:scale-90 transition-all">
              <Plus size={18} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Featured: Người tình kiếp trước (trang 6.1) */}
        <button onClick={() => router.push('/documents/daughter-names')}
          className="w-full mb-3 overflow-hidden rounded-[16px] border border-white/40 p-4 text-left shadow-lg active:scale-[0.98] transition-transform"
          style={{ background: 'linear-gradient(135deg, #6d28d9 0%, #db2777 55%, #f59e0b 120%)', boxShadow: '0 8px 24px rgba(219,39,119,0.25)' }}>
          <div className="flex items-center gap-3">
            <div className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-[14px] bg-white/20 text-[20px] backdrop-blur-sm">💖</div>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-bold text-white" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>Người tình kiếp trước</p>
              <p className="mt-0.5 text-[11px] text-white/80">24 cái tên dành cho con gái tương lai · Bento Aurora</p>
            </div>
            <span className="text-white/70 text-[18px]">›</span>
          </div>
        </button>

        {/* Featured: Người tình kiếp trước v0 (trang 6.2) */}
        <button onClick={() => router.push('/documents/daughter-names2')}
          className="w-full mb-3 overflow-hidden rounded-[16px] border border-white/40 p-4 text-left shadow-lg active:scale-[0.98] transition-transform"
          style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #8b5cf6 50%, #f472b6 120%)', boxShadow: '0 8px 24px rgba(139,92,246,0.28)' }}>
          <div className="flex items-center gap-3">
            <div className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-[14px] bg-white/20 text-[20px] backdrop-blur-sm">💠</div>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-bold text-white" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>Người tình kiếp trước · v0</p>
              <p className="mt-0.5 text-[11px] text-white/80">24 tên · Bento Glass · Ghim yêu thích</p>
            </div>
            <span className="text-white/70 text-[18px]">›</span>
          </div>
                  </button>

                  {/* Featured: Người tình kiếp trước 3 (trang 6.3) */}
                  <button onClick={() => router.push('/documents/daughter-names3')}
                    className="w-full mb-3 overflow-hidden rounded-[16px] border border-white/40 p-4 text-left shadow-lg active:scale-[0.98] transition-transform"
                    style={{ background: 'linear-gradient(135deg, #1a1030 0%, #2d1b4e 45%, #1e3a5f 85%, #0f2e2e 130%)', boxShadow: '0 8px 24px rgba(46,27,78,0.4)' }}>
                    <div className="flex items-center gap-3">
                      <div className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-[14px] bg-white/15 text-[20px] backdrop-blur-sm">✨</div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[14px] font-bold text-white" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>Người tình kiếp trước 3</p>
                        <p className="mt-0.5 text-[11px] text-white/80">24 tên · Aurora Gradient · Cormorant Serif</p>
                      </div>
                      <span className="text-white/70 text-[18px]">›</span>
                    </div>
                  </button>

                  {/* Featured: Người tình kiếp trước 4 (trang 6.4) */}
                  <button onClick={() => router.push('/documents/daughter-names4')}
          className="w-full mb-3 overflow-hidden rounded-[16px] border border-white/40 p-4 text-left shadow-lg active:scale-[0.98] transition-transform"
          style={{ background: 'linear-gradient(135deg, #0b0a12 0%, #2d2a4a 60%, #5c4a8a 120%)', boxShadow: '0 8px 24px rgba(90,74,138,0.35)' }}>
          <div className="flex items-center gap-3">
            <div className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-[14px] bg-white/10 text-[20px] backdrop-blur-sm">🕯️</div>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-bold text-white" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>Người tình kiếp trước 4</p>
              <p className="mt-0.5 text-[11px] text-white/70">24 names · kept in glass · Cormorant Serif</p>
            </div>
            <span className="text-white/60 text-[18px]">›</span>
          </div>
        </button>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-[#E6002D]/20 border-t-[#E6002D] rounded-full animate-spin" />
          </div>
        ) : docs.length === 0 ? (
          <div className="glass-card p-10 text-center">
            <div className="w-14 h-14 rounded-full bg-[#FF9500]/5 mx-auto mb-3 flex items-center justify-center">
              <FileText size={24} className="text-[#FF9500]/30" />
            </div>
            <p className="text-[14px] font-medium text-[#6B7280]">Chưa có tài liệu nào</p>
            <p className="text-[12px] text-[#9CA3AF] mt-1">Nhấn + để thêm tài liệu mới</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {docs.map((doc) => (
              <div key={doc.DocumentID}
                className="glass-card p-3.5 rounded-[14px] flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-transform"
                onClick={() => router.push(`/documents/${doc.DocumentID}`)}>
                <div className="w-9 h-9 rounded-full bg-[rgba(255,149,0,0.08)] flex items-center justify-center shrink-0">
                  <FileText size={16} className="text-[#FF9500]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-semibold text-[#111] truncate">{doc.Title}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="inline-block px-1.5 py-0.5 rounded-[4px] text-[9px] font-medium bg-[rgba(0,0,0,0.04)] text-[#5F6368]">{doc.Type}</span>
                    <span className="text-[11px] text-[#8E8E93]">{doc.Date || '—'}</span>
                    <span className="text-[11px] text-[#8E8E93]">· {doc.Size || '—'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 relative">
          <Search size={15} className="absolute left-[12px] top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
          <input type="text" placeholder="Tìm kiếm tài liệu..."
            className="w-full h-[38px] pl-[34px] pr-[12px] rounded-[8px] bg-white border border-[rgba(0,0,0,0.06)] text-[13px] outline-none focus:border-[#E6002D]" />
        </div>
        <button onClick={() => router.push('/documents/add')}
          className="h-[38px] px-4 rounded-[8px] bg-[#E6002D] text-white text-[12px] font-semibold flex items-center gap-1.5 hover:bg-[#D40028] transition-all shadow-sm">
          <Plus size={16} strokeWidth={2.5} /> Thêm tài liệu
        </button>
      </div>

      {/* Featured: Người tình kiếp trước (trang 6.1) */}
      <button onClick={() => router.push('/documents/daughter-names')}
        className="group w-full mb-3 flex items-center gap-4 overflow-hidden rounded-[14px] border border-white/40 p-4 text-left shadow-lg transition-all hover:shadow-xl active:scale-[0.99]"
        style={{ background: 'linear-gradient(120deg, #6d28d9 0%, #db2777 55%, #f59e0b 130%)', boxShadow: '0 8px 28px rgba(219,39,119,0.22)' }}>
        <div className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-[13px] bg-white/20 text-[22px] backdrop-blur-sm transition-transform group-hover:scale-110">💖</div>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-bold text-white" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>Người tình kiếp trước</p>
          <p className="mt-0.5 text-[11px] text-white/80">24 cái tên dành cho con gái tương lai · Bento Aurora Glass</p>
        </div>
        <span className="text-[20px] text-white/70 transition-transform group-hover:translate-x-1">›</span>
      </button>

      {/* Featured: Người tình kiếp trước v0 (trang 6.2) */}
      <button onClick={() => router.push('/documents/daughter-names2')}
        className="group w-full mb-5 flex items-center gap-4 overflow-hidden rounded-[14px] border border-white/40 p-4 text-left shadow-lg transition-all hover:shadow-xl active:scale-[0.99]"
        style={{ background: 'linear-gradient(120deg, #0ea5e9 0%, #8b5cf6 55%, #f472b6 130%)', boxShadow: '0 8px 28px rgba(139,92,246,0.22)' }}>
        <div className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-[13px] bg-white/20 text-[22px] backdrop-blur-sm transition-transform group-hover:scale-110">💠</div>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-bold text-white" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>Người tình kiếp trước · v0</p>
          <p className="mt-0.5 text-[11px] text-white/80">24 tên · Bento Glass · Ghim yêu thích</p>
        </div>
        <span className="text-[20px] text-white/70 transition-transform group-hover:translate-x-1">›</span>
      </button>

      {/* Featured: Người tình kiếp trước 3 (trang 6.3) */}
      <button onClick={() => router.push('/documents/daughter-names3')}
        className="group w-full mb-5 flex items-center gap-4 overflow-hidden rounded-[14px] border border-white/40 p-4 text-left shadow-lg transition-all hover:shadow-xl active:scale-[0.99]"
        style={{ background: 'linear-gradient(120deg, #1a1030 0%, #2d1b4e 45%, #1e3a5f 85%, #0f2e2e 130%)', boxShadow: '0 8px 28px rgba(46,27,78,0.4)' }}>
        <div className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-[13px] bg-white/15 text-[22px] backdrop-blur-sm transition-transform group-hover:scale-110">✨</div>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-bold text-white" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>Người tình kiếp trước 3</p>
          <p className="mt-0.5 text-[11px] text-white/80">24 tên · Aurora Gradient · Cormorant Serif</p>
        </div>
        <span className="text-[20px] text-white/70 transition-transform group-hover:translate-x-1">›</span>
      </button>

      {/* Featured: Người tình kiếp trước 4 (trang 6.4) */}
      <button onClick={() => router.push('/documents/daughter-names4')}
        className="group w-full mb-5 flex items-center gap-4 overflow-hidden rounded-[14px] border border-white/40 p-4 text-left shadow-lg transition-all hover:shadow-xl active:scale-[0.99]"
        style={{ background: 'linear-gradient(120deg, #0b0a12 0%, #2d2a4a 60%, #5c4a8a 130%)', boxShadow: '0 8px 28px rgba(90,74,138,0.35)' }}>
        <div className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-[13px] bg-white/10 text-[22px] backdrop-blur-sm transition-transform group-hover:scale-110">🕯️</div>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-bold text-white" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>Người tình kiếp trước 4</p>
          <p className="mt-0.5 text-[11px] text-white/70">24 names · kept in glass · Cormorant Serif</p>
        </div>
        <span className="text-[20px] text-white/60 transition-transform group-hover:translate-x-1">›</span>
      </button>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-[#E6002D]/20 border-t-[#E6002D] rounded-full animate-spin" />
        </div>
      ) : docs.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-[rgba(255,149,0,0.06)] flex items-center justify-center mb-4">
            <FileText size={28} className="text-[#FF9500]/30" />
          </div>
          <p className="text-[14px] font-medium text-[#6B7280]">Chưa có tài liệu nào</p>
          <p className="text-[12px] text-[#9CA3AF] mt-1">Nhấn "Thêm tài liệu" để bắt đầu</p>
        </div>
      ) : (
        <div className="glass-card-compact overflow-hidden" style={{ borderRadius: '12px', border: '1px solid rgba(0,0,0,0.04)' }}>
          <table className="w-full border-collapse">
            <thead><tr className="bg-[rgba(0,0,0,0.02)]">
              <th className="py-2.5 px-3 text-[11px] font-semibold text-[#8E8E93] uppercase tracking-[0.3px] text-left">Tên tài liệu</th>
              <th className="py-2.5 px-3 text-[11px] font-semibold text-[#8E8E93] uppercase tracking-[0.3px] text-center" style={{width:'100px'}}>Loại</th>
              <th className="py-2.5 px-3 text-[11px] font-semibold text-[#8E8E93] uppercase tracking-[0.3px] text-center" style={{width:'100px'}}>Ngày</th>
              <th className="py-2.5 px-3 text-[11px] font-semibold text-[#8E8E93] uppercase tracking-[0.3px] text-center" style={{width:'80px'}}>Kích cỡ</th>
            </tr></thead>
            <tbody>
              {docs.map((doc) => (
                <tr key={doc.DocumentID} className="border-t border-[rgba(0,0,0,0.03)] hover:bg-[rgba(0,0,0,0.01)] transition-colors cursor-pointer"
                  onClick={() => router.push(`/documents/${doc.DocumentID}`)}>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-[26px] h-[26px] rounded-full bg-[rgba(255,149,0,0.08)] flex items-center justify-center">
                        <FileText size={12} className="text-[#FF9500]"/>
                      </div>
                      <span className="text-[13px] font-medium text-[#111]">{doc.Title}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="inline-block px-2 py-0.5 rounded-[4px] text-[10px] font-medium bg-[rgba(0,0,0,0.04)] text-[#5F6368]">{doc.Type}</span>
                  </td>
                  <td className="py-2.5 px-3 text-center text-[12px] text-[#5F6368]">{doc.Date || '—'}</td>
                  <td className="py-2.5 px-3 text-center text-[12px] text-[#5F6368]">{doc.Size || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
