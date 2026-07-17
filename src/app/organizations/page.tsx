'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Building2, RefreshCw, ChevronLeft, ChevronRight, ArrowUpDown, Users } from 'lucide-react';
import { organizationService, type Organization } from '@/lib/services/organization-service';
import { contactService } from '@/lib/services/contact-service';
import { useRouter } from 'next/navigation';

export default function OrganizationsPage() {
  const router = useRouter();
  const [isDesktop, setIsDesktop] = useState(false);
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setIsDesktop(window.innerWidth >= 768);
    loadOrgs();
  }, []);

  const loadOrgs = async () => {
    setLoading(true);
    try {
      const data = await organizationService.getAll();
      setOrgs(data);
    } catch {}
    setLoading(false);
  };

  if (!isDesktop) {
    return (
      <div className="page-content">
        <div className="flex items-center justify-between mb-4">
          <div><h1 className="text-[22px] font-bold text-[#111] tracking-tight">Tổ chức</h1><p className="text-[12px] text-[#8E8E93] mt-0.5">{orgs.length} tổ chức</p></div>
        </div>
        <div className="glass-card p-10 text-center">
          <div className="w-14 h-14 rounded-full bg-[#5856D6]/5 mx-auto mb-3 flex items-center justify-center">
            <Building2 size={24} className="text-[#5856D6]/30" />
          </div>
          <p className="text-[14px] font-medium text-[#6B7280]">{loading ? 'Đang tải...' : 'Chưa có tổ chức nào'}</p>
          <p className="text-[12px] text-[#9CA3AF] mt-1">Quản lý công ty, câu lạc bộ, nhóm của bạn</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 relative">
          <Search size={15} className="absolute left-[12px] top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
          <input type="text" placeholder="Tìm kiếm tổ chức..."
            className="w-full h-[38px] pl-[34px] pr-[12px] rounded-[8px] bg-white border border-[rgba(0,0,0,0.06)] text-[13px] outline-none focus:border-[#E6002D]" />
        </div>
        <button onClick={() => router.push('/organizations/add')}
          className="h-[38px] px-4 rounded-[8px] bg-[#E6002D] text-white text-[12px] font-semibold flex items-center gap-1.5 hover:bg-[#D40028] transition-all shadow-sm">
          <Plus size={16} strokeWidth={2.5} /> Thêm tổ chức
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-[#E6002D]/20 border-t-[#E6002D] rounded-full animate-spin" />
        </div>
      ) : orgs.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-[rgba(88,86,214,0.06)] flex items-center justify-center mb-4">
            <Building2 size={28} className="text-[#5856D6]/30" />
          </div>
          <p className="text-[14px] font-medium text-[#6B7280]">Chưa có tổ chức nào</p>
          <p className="text-[12px] text-[#9CA3AF] mt-1">Nhấn "Thêm tổ chức" để bắt đầu</p>
        </div>
      ) : (
        <div className="glass-card-compact overflow-hidden" style={{ borderRadius: '12px', border: '1px solid rgba(0,0,0,0.04)' }}>
          <table className="w-full border-collapse">
            <thead><tr className="bg-[rgba(0,0,0,0.02)]">
              <th className="py-2.5 px-3 text-[11px] font-semibold text-[#8E8E93] uppercase tracking-[0.3px] text-left">Tên tổ chức</th>
              <th className="py-2.5 px-3 text-[11px] font-semibold text-[#8E8E93] uppercase tracking-[0.3px] text-left" style={{width:'160px'}}>Liên hệ</th>
              <th className="py-2.5 px-3 text-[11px] font-semibold text-[#8E8E93] uppercase tracking-[0.3px] text-left" style={{width:'180px'}}>Email</th>
              <th className="py-2.5 px-3 text-[11px] font-semibold text-[#8E8E93] uppercase tracking-[0.3px] text-left" style={{width:'140px'}}>SĐT</th>
            </tr></thead>
            <tbody>
              {orgs.map((org) => (
                <tr key={org.OrganizationID} className="border-t border-[rgba(0,0,0,0.03)] hover:bg-[rgba(0,0,0,0.01)] transition-colors cursor-pointer"
                  onClick={() => router.push(`/organizations/${org.OrganizationID}`)}>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-[26px] h-[26px] rounded-full bg-[rgba(88,86,214,0.08)] flex items-center justify-center">
                        <Building2 size={12} className="text-[#5856D6]"/>
                      </div>
                      <span className="text-[13px] font-medium text-[#111]">{org.Name}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-[12px] text-[#5F6368]">{org.Contact || '—'}</td>
                  <td className="py-2.5 px-3 text-[12px] text-[#007AFF]">{org.Email || '—'}</td>
                  <td className="py-2.5 px-3 text-[12px] text-[#5F6368]">{org.Phone || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
