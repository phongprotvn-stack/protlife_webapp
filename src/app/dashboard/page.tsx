'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users, Calendar, Heart, TrendingUp, Clock, MapPin,
  Sparkles, Target, PieChart, Layers, RefreshCw, Gift,
  BookHeart, FileText, Building2, Star
} from 'lucide-react';
import { contactService } from '@/lib/services/contact-service';
import { eventService } from '@/lib/services/event-service';
import { useAuthStore } from '@/stores/auth-store';
import { useRouter } from 'next/navigation';
import type { Contact, EventItem } from '@/types/database';
import { formatDate, getAvatarColor, getInitials, formatCurrency } from '@/lib/utils';

export default function DashboardPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setIsLoading(true); setError('');
    try {
      const [c, e] = await Promise.all([contactService.getAll(), eventService.getAll()]);
      setContacts(c); setEvents(e);
    } catch (err: any) { setError(err.message || 'Không thể tải dữ liệu'); }
    finally { setIsLoading(false); }
  };

  const statsCards = [
    { id: 'contacts', label: 'Quan hệ', value: contacts.length, icon: Users, color: '#E6002D', href: '/contacts' },
    { id: 'events', label: 'Sự kiện', value: events.length, icon: Calendar, color: '#007AFF', href: '/events' },
    { id: 'memories', label: 'Ký ức', value: '0', icon: BookHeart, color: '#FF4D6A', href: '/memories' },
    { id: 'places', label: 'Địa điểm', value: new Set(events.filter(e => e.Place).map(e => e.Place)).size, icon: MapPin, color: '#34C759', href: '/map' },
  ];

  const favoriteContacts = contacts.filter(c => c.IsFavorite).slice(0, 6);

  const upcomingBirthdays = contacts
    .filter(c => c.Birthday && c.Status === 'Active')
    .map(c => {
      const bd = new Date(c.Birthday!);
      const next = new Date(new Date().getFullYear(), bd.getMonth(), bd.getDate());
      if (next < new Date()) next.setFullYear(new Date().getFullYear() + 1);
      const diff = Math.ceil((next.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      return { contact: c, days: diff, nextDate: next };
    })
    .filter(b => b.days >= 0 && b.days <= 90)
    .sort((a, b) => a.days - b.days)
    .slice(0, 5);

  const recentEvents = [...events]
    .sort((a, b) => new Date(b.StartDate).getTime() - new Date(a.StartDate).getTime())
    .slice(0, 5);

  const relationshipMap: Record<string, { label: string; color: string; count: number }> = {
    Family: { label: 'Gia đình', color: '#E6002D', count: 0 },
    Relative: { label: 'Họ hàng', color: '#FF4D6A', count: 0 },
    Friend: { label: 'Bạn bè', color: '#007AFF', count: 0 },
    Colleague: { label: 'Đồng nghiệp', color: '#FF9500', count: 0 },
    Other: { label: 'Khác', color: '#8E8E93', count: 0 },
  };
  contacts.forEach((c) => { const key = relationshipMap[c.Relationship] ? c.Relationship : 'Other'; relationshipMap[key].count++; });
  const totalRel = contacts.length || 1;
  const relationshipStats = Object.values(relationshipMap).map(r => ({ ...r, pct: Math.round((r.count / totalRel) * 100) }));

  const recentContactBirthdays = [...contacts]
    .filter(c => c.Birthday)
    .sort((a, b) => {
      const ma = (a.Birthday || '').slice(5);
      const mb = (b.Birthday || '').slice(5);
      return ma.localeCompare(mb);
    })
    .slice(0, 6);

  const totalBirthdays = contacts.filter(c => c.Birthday).length;
  const monthNames = ['Thg 1','Thg 2','Thg 3','Thg 4','Thg 5','Thg 6','Thg 7','Thg 8','Thg 9','Thg 10','Thg 11','Thg 12'];
  const birthdayByMonth = new Array(12).fill(0);
  contacts.filter(c => c.Birthday).forEach(c => {
    const m = new Date(c.Birthday!).getMonth();
    birthdayByMonth[m]++;
  });

  return (
    <>
      {/* ===== MOBILE VIEW ===== */}
      <div className="md:hidden p-3 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[22px] font-bold text-[#111] tracking-tight">
              Xin chào, {user?.name || 'FREE'} 👋
            </h1>
            <p className="text-[12px] text-[#6B7280] mt-0.5">Quản lý cuộc sống của bạn</p>
          </div>
          <button onClick={loadData} className="w-[36px] h-[36px] rounded-[10px] bg-[rgba(0,0,0,0.04)] flex items-center justify-center">
            <RefreshCw size={15} className="text-[#8E8E93]" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-[12px] bg-[rgba(230,0,45,0.06)] text-[12px] text-[#E6002D] text-center">
            {error}
            <button onClick={loadData} className="ml-2 underline font-medium">Thử lại</button>
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-2">
          {statsCards.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.button key={stat.id} onClick={() => router.push(stat.href)}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                className={`bg-white rounded-[14px] p-3 text-center shadow-sm border border-[rgba(0,0,0,0.04)] ${isLoading ? 'animate-pulse' : ''}`}>
                {isLoading ? (
                  <><div className="w-7 h-7 rounded-[8px] bg-[rgba(0,0,0,0.04)] mx-auto mb-2"/><div className="w-8 h-5 rounded bg-[rgba(0,0,0,0.04)] mx-auto"/></>
                ) : (
                  <><Icon size={18} className="mx-auto mb-1.5" style={{ color: stat.color }} />
                  <p className="text-[17px] font-bold text-[#111]">{stat.value}</p>
                  <p className="text-[9px] text-[#8E8E93] font-medium truncate">{stat.label}</p></>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Quick access */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-3 px-3">
          <QuickChip icon={Heart} label="Yêu thích" color="#E6002D" count={favoriteContacts.length} />
          <QuickChip icon={Gift} label="Sinh nhật" color="#FF9500" count={totalBirthdays} />
          <QuickChip icon={Building2} label="Tổ chức" color="#5856D6" count={0} />
          <QuickChip icon={FileText} label="Tài liệu" color="#007AFF" count={0} />
        </div>

        {/* Favorites */}
        {favoriteContacts.length > 0 && (
          <div className="bg-white rounded-[16px] p-4 shadow-sm border border-[rgba(0,0,0,0.04)]">
            <h2 className="text-[14px] font-semibold text-[#111] flex items-center gap-1.5 mb-3">
              <Heart size={14} className="text-[#E6002D] fill-[#E6002D]"/> Yêu thích
            </h2>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {favoriteContacts.map(c => (
                <div key={c.ContactID} className="flex flex-col items-center gap-1 min-w-[56px]" onClick={() => router.push('/contacts')}>
                  <AvatarCircle contact={c} size={44} />
                  <p className="text-[9px] text-[#5F6368] font-medium text-center truncate w-[56px]">{c.Name.split(' ').pop()}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Events */}
        <div className="bg-white rounded-[16px] p-4 shadow-sm border border-[rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[14px] font-semibold text-[#111] flex items-center gap-1.5">
              <Clock size={14} className="text-[#007AFF]"/> Gần đây
            </h2>
            <button onClick={() => router.push('/events')} className="text-[11px] font-medium text-[#007AFF]">Xem tất cả</button>
          </div>
          {recentEvents.length === 0 ? (
            <div className="text-center py-6">
              <Calendar size={24} className="mx-auto text-[#007AFF]/20 mb-2"/>
              <p className="text-[12px] text-[#8E8E93]">Chưa có sự kiện</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentEvents.map(e => (
                <div key={e.EventID} className="flex items-center gap-2.5 p-2 rounded-[10px] bg-[rgba(0,0,0,0.02)]">
                  <div className="w-[32px] h-[36px] rounded-[8px] bg-[rgba(0,122,255,0.08)] flex flex-col items-center justify-center shrink-0">
                    <span className="text-[11px] font-bold text-[#007AFF] leading-none">{new Date(e.StartDate).getDate()}</span>
                    <span className="text-[7px] text-[#007AFF]/60">{monthNames[new Date(e.StartDate).getMonth()]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium text-[#111] truncate">{e.Title}</p>
                    <p className="text-[10px] text-[#8E8E93]">{e.EventType}{e.Place ? ` · ${e.Place}` : ''}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Birthdays */}
        {upcomingBirthdays.length > 0 && (
          <div className="bg-white rounded-[16px] p-4 shadow-sm border border-[rgba(0,0,0,0.04)]">
            <h2 className="text-[14px] font-semibold text-[#111] flex items-center gap-1.5 mb-3">
              <Gift size={14} className="text-[#FF9500]"/> Sinh nhật sắp tới
            </h2>
            <div className="space-y-2">
              {upcomingBirthdays.map(b => (
                <div key={b.contact.ContactID} className="flex items-center gap-2.5 p-2 rounded-[10px] bg-[rgba(0,0,0,0.02)]">
                  <AvatarCircle contact={b.contact} size={36} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium text-[#111] truncate">{b.contact.Name}</p>
                    <p className="text-[10px] text-[#FF9500]">{b.days === 0 ? 'Hôm nay! 🎉' : `${b.days} ngày nữa`}</p>
                  </div>
                  <span className="text-[10px] font-semibold text-[#FF9500]">{formatDate(b.nextDate, 'ddmm')}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Relationship Stats */}
        <div className="bg-white rounded-[16px] p-4 shadow-sm border border-[rgba(0,0,0,0.04)]">
          <h2 className="text-[14px] font-semibold text-[#111] flex items-center gap-1.5 mb-3">
            <PieChart size={14} className="text-[#E6002D]"/> Quan hệ
          </h2>
          {contacts.length === 0 ? (
            <p className="text-[12px] text-[#8E8E93] text-center py-4">Chưa có dữ liệu</p>
          ) : (
            <div className="space-y-2">
              {relationshipStats.filter(r => r.count > 0).sort((a, b) => b.count - a.count).map(r => (
                <div key={r.label}>
                  <div className="flex items-center justify-between text-[11px] mb-0.5">
                    <span className="text-[#111] font-medium">{r.label}</span>
                    <span className="text-[#8E8E93]">{r.count}</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-[rgba(0,0,0,0.04)] overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${r.pct}%`, backgroundColor: r.color }}/>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ===== DESKTOP VIEW ===== */}
      <div className="hidden md:block p-5 lg:p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-[26px] font-bold text-[#111] tracking-tight">
              Xin chào, {user?.name || 'FREE'} 👋
            </h1>
            <p className="text-[13px] text-[#6B7280] mt-1">Hôm nay là một ngày tuyệt vời để ghi lại những khoảnh khắc.</p>
          </div>
          <button onClick={loadData} className="w-[38px] h-[38px] rounded-[10px] bg-[rgba(0,0,0,0.04)] flex items-center justify-center hover:bg-[rgba(0,0,0,0.08)]">
            <RefreshCw size={16} className="text-[#8E8E93]" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-[12px] bg-[rgba(230,0,45,0.06)] text-[13px] text-[#E6002D] text-center">
            {error} <button onClick={loadData} className="ml-2 underline font-medium">Thử lại</button>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-4 mb-5">
          {statsCards.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.button key={stat.id} onClick={() => router.push(stat.href)}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                className="bg-white rounded-[14px] p-4 border border-[rgba(0,0,0,0.04)] shadow-sm text-left hover:shadow-md hover:border-[rgba(230,0,45,0.1)] transition-all">
                {isLoading ? (
                  <><div className="w-9 h-9 rounded-[10px] bg-[rgba(0,0,0,0.04)] mb-3"/><div className="w-14 h-8 bg-[rgba(0,0,0,0.04)] mb-1"/><div className="w-20 h-4 bg-[rgba(0,0,0,0.03)]"/></>
                ) : (
                  <><div className="w-9 h-9 rounded-[10px] flex items-center justify-center mb-3" style={{ backgroundColor: `${stat.color}12` }}>
                    <Icon size={18} style={{ color: stat.color }} />
                  </div>
                  <p className="text-[26px] font-bold text-[#111]">{stat.value}</p>
                  <p className="text-[12px] text-[#8E8E93] font-medium mt-0.5">{stat.label}</p></>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Row 1: Favorites + Birthdays */}
        <div className="grid grid-cols-3 gap-4 mb-5">
          {/* Favorite Contacts */}
          <div className="bg-white rounded-[14px] p-4 border border-[rgba(0,0,0,0.04)] shadow-sm">
            <h2 className="text-[14px] font-semibold text-[#111] flex items-center gap-1.5 mb-3">
              <Heart size={14} className="text-[#E6002D] fill-[#E6002D]"/> Yêu thích
            </h2>
            {favoriteContacts.length === 0 ? (
              <p className="text-[12px] text-[#8E8E93] text-center py-6">Chưa có</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {favoriteContacts.map(c => (
                  <div key={c.ContactID} className="flex items-center gap-2 p-1.5 rounded-[8px] hover:bg-[rgba(0,0,0,0.02)] transition-colors cursor-pointer" onClick={() => router.push('/contacts')}>
                    <AvatarCircle contact={c} size={32} />
                    <span className="text-[11px] font-medium text-[#5F6368] truncate max-w-[80px]">{c.Name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Birthdays */}
          <div className="bg-white rounded-[14px] p-4 border border-[rgba(0,0,0,0.04)] shadow-sm">
            <h2 className="text-[14px] font-semibold text-[#111] flex items-center gap-1.5 mb-3">
              <Gift size={14} className="text-[#FF9500]"/> Sinh nhật sắp tới
            </h2>
            {upcomingBirthdays.length === 0 ? (
              <p className="text-[12px] text-[#8E8E93] text-center py-6">Chưa có</p>
            ) : (
              <div className="space-y-1.5">
                {upcomingBirthdays.map(b => (
                  <div key={b.contact.ContactID} className="flex items-center gap-2 p-1.5 rounded-[8px] hover:bg-[rgba(0,0,0,0.02)]">
                    <AvatarCircle contact={b.contact} size={28} />
                    <span className="flex-1 text-[12px] font-medium text-[#111] truncate">{b.contact.Name}</span>
                    <span className="text-[10px] font-medium text-[#FF9500]">{b.days === 0 ? '🎉 Hôm nay' : `${b.days} ngày`}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Birthday Distribution */}
          <div className="bg-white rounded-[14px] p-4 border border-[rgba(0,0,0,0.04)] shadow-sm">
            <h2 className="text-[14px] font-semibold text-[#111] flex items-center gap-1.5 mb-3">
              <PieChart size={14} className="text-[#E6002D]"/> Sinh nhật theo tháng
            </h2>
            <div className="flex items-end gap-1 h-[84px]">
              {birthdayByMonth.map((count, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                  <div
                    className="w-full rounded-[3px] transition-all duration-300"
                    style={{ height: `${Math.max(count * 12, count > 0 ? 4 : 0)}px`, backgroundColor: count > 0 ? '#E6002D' : 'rgba(0,0,0,0.04)' }}
                  />
                  <span className="text-[7px] text-[#8E8E93] font-medium">{i + 1}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Row 2: Recent Events + Quick Access */}
        <div className="grid grid-cols-2 gap-4 mb-5">
          {/* Recent Events */}
          <div className="bg-white rounded-[14px] p-4 border border-[rgba(0,0,0,0.04)] shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[14px] font-semibold text-[#111] flex items-center gap-1.5">
                <Clock size={14} className="text-[#007AFF]"/> Hoạt động gần đây
              </h2>
              <button onClick={() => router.push('/events')} className="text-[11px] font-medium text-[#007AFF] hover:underline">Xem tất cả</button>
            </div>
            {recentEvents.length === 0 ? (
              <p className="text-[12px] text-[#8E8E93] text-center py-6">Chưa có sự kiện</p>
            ) : (
              <div className="space-y-1.5">
                {recentEvents.map(e => (
                  <div key={e.EventID} className="flex items-center gap-2.5 p-2 rounded-[8px] bg-[rgba(0,0,0,0.02)]">
                    <div className="w-[34px] h-[38px] rounded-[8px] bg-[rgba(0,122,255,0.08)] flex flex-col items-center justify-center shrink-0">
                      <span className="text-[12px] font-bold text-[#007AFF] leading-none">{new Date(e.StartDate).getDate()}</span>
                      <span className="text-[7px] text-[#007AFF]/60">{monthNames[new Date(e.StartDate).getMonth()]}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-[#111] truncate">{e.Title}</p>
                      <p className="text-[10px] text-[#8E8E93]">{e.EventType}{e.Place ? ` · ${e.Place}` : ''}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Relationship Stats */}
          <div className="bg-white rounded-[14px] p-4 border border-[rgba(0,0,0,0.04)] shadow-sm">
            <h2 className="text-[14px] font-semibold text-[#111] flex items-center gap-1.5 mb-3">
              <PieChart size={14} className="text-[#E6002D]"/> Thống kê mối quan hệ
            </h2>
            {contacts.length === 0 ? (
              <p className="text-[12px] text-[#8E8E93] text-center py-6">Chưa có dữ liệu</p>
            ) : (
              <div className="space-y-2.5">
                {relationshipStats.filter(r => r.count > 0).sort((a, b) => b.count - a.count).map(r => (
                  <div key={r.label}>
                    <div className="flex items-center justify-between text-[12px] mb-0.5">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: r.color }} />
                        <span className="text-[#111] font-medium">{r.label}</span>
                      </div>
                      <span className="text-[#8E8E93]">{r.count}</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[rgba(0,0,0,0.04)] overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${r.pct}%`, backgroundColor: r.color }}/>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Row 3: Life Score + Quick Actions */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-[14px] p-4 border border-[rgba(0,0,0,0.04)] shadow-sm col-span-1 text-center">
            <h2 className="text-[14px] font-semibold text-[#111] flex items-center justify-center gap-1.5 mb-2">
              <TrendingUp size={14} className="text-[#E6002D]"/> Life Score
            </h2>
            <div className="text-[42px] font-bold text-[#111]">{contacts.length + events.length}</div>
            <p className="text-[11px] text-[#8E8E93]">{contacts.length} quan hệ · {events.length} sự kiện</p>
          </div>
          <div className="col-span-2 grid grid-cols-3 gap-3">
            <QuickAction icon={Heart} label="Thêm quan hệ" color="#E6002D" onClick={() => router.push('/contacts/add')} />
            <QuickAction icon={Calendar} label="Thêm sự kiện" color="#007AFF" onClick={() => router.push('/events/add')} />
            <QuickAction icon={BookHeart} label="Thêm ký ức" color="#FF4D6A" onClick={() => router.push('/memories/add')} />
            <QuickAction icon={Building2} label="Thêm tổ chức" color="#5856D6" onClick={() => router.push('/organizations/add')} />
            <QuickAction icon={FileText} label="Thêm tài liệu" color="#FF9500" onClick={() => router.push('/documents/add')} />
            <QuickAction icon={Target} label="Thêm mục tiêu" color="#AF52DE" onClick={() => router.push('/goals/add')} />
          </div>
        </div>
      </div>
    </>
  );
}

function AvatarCircle({ contact, size }: { contact: { Avatar?: string | null; Name: string }; size: number }) {
  if (contact.Avatar) {
    return (
      <div className="rounded-full overflow-hidden shrink-0" style={{ width: size, height: size }}>
        <img src={contact.Avatar} alt="" className="w-full h-full object-cover" />
      </div>
    );
  }
  return (
    <div className="rounded-full flex items-center justify-center text-white font-bold shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.4, backgroundColor: getAvatarColor(contact.Name) }}>
      {getInitials(contact.Name)}
    </div>
  );
}

function QuickChip({ icon: Icon, label, color, count }: { icon: any; label: string; color: string; count: number }) {
  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[rgba(0,0,0,0.06)] whitespace-nowrap shadow-sm">
      <Icon size={12} style={{ color }} />
      <span className="text-[11px] font-medium text-[#5F6368]">{label}</span>
      {count > 0 && <span className="text-[10px] font-semibold" style={{ color }}>{count}</span>}
    </div>
  );
}

function QuickAction({ icon: Icon, label, color, onClick }: { icon: any; label: string; color: string; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-[10px] bg-white border border-[rgba(0,0,0,0.04)] shadow-sm hover:shadow-md hover:border-[rgba(0,0,0,0.08)] transition-all">
      <div className="w-8 h-8 rounded-[8px] flex items-center justify-center" style={{ backgroundColor: `${color}12` }}>
        <Icon size={15} style={{ color }} />
      </div>
      <span className="text-[10px] font-medium text-[#5F6368] text-center">{label}</span>
    </button>
  );
}
