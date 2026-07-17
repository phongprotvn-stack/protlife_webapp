import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, format: 'short' | 'long' | 'relative' | 'ddmmyyyy' | 'ddmm' = 'short'): string {
  const d = new Date(date);
  if (format === 'relative') {
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Hôm nay';
    if (days === 1) return 'Hôm qua';
    if (days < 7) return `${days} ngày trước`;
    if (days < 30) return `${Math.floor(days / 7)} tuần trước`;
    if (days < 365) return `${Math.floor(days / 30)} tháng trước`;
    return `${Math.floor(days / 365)} năm trước`;
  }
  if (format === 'long') {
    return d.toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
  if (format === 'ddmmyyyy') {
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }
  if (format === 'ddmm') {
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${dd}/${mm}`;
  }
  // default 'short' — dd/mm/yyyy
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export function generateEventID(startDate: string, sequenceNo: number): string {
  const d = new Date(startDate);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const seq = String(sequenceNo).padStart(3, '0');
  return `EV${y}${m}${day}${seq}`;
}

export function formatCurrency(amount: number): string {
  return amount.toLocaleString('vi-VN', {
    style: 'currency',
    currency: 'VND',
  });
}

export function getRelationshipLabel(score: number): string {
  if (score >= 90) return 'Ruột thịt';
  if (score >= 70) return 'Thâm tình';
  if (score >= 50) return 'Thân';
  if (score >= 30) return 'Bạn bè';
  if (score >= 1) return 'Quen biết';
  return 'Chưa xác định';
}

export function getRelationshipColor(score: number): string {
  if (score >= 90) return '#E6002D';
  if (score >= 70) return '#FF4D6A';
  if (score >= 50) return '#FF9500';
  if (score >= 30) return '#007AFF';
  return '#8E8E93';
}

export function getMoodEmoji(mood: string): string {
  const map: Record<string, string> = {
    Happy: '😊',
    Normal: '😐',
    Sad: '😢',
    Excited: '🤩',
    Tired: '😴',
    Angry: '😠',
    Thoughtful: '🤔',
    Loved: '🥰',
  };
  return map[mood] || '😐';
}

export function getImportanceColor(importance: string): string {
  const map: Record<string, string> = {
    Lowest: '#8E8E93',
    Low: '#FF9500',
    Medium: '#007AFF',
    High: '#FF4D6A',
    Highest: '#E6002D',
  };
  return map[importance] || '#8E8E93';
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function getAvatarColor(name: string): string {
  const colors = [
    '#E6002D', '#FF4D6A', '#FF9500', '#FFCC00',
    '#34C759', '#007AFF', '#5856D6', '#AF52DE',
    '#FF2D55', '#8E8E93',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export function calculateAge(birthday: string): number {
  const today = new Date();
  const birth = new Date(birthday);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export function getDaysUntilNextBirthday(birthday: string): number {
  const today = new Date();
  const birth = new Date(birthday);
  const nextBirthday = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
  if (nextBirthday < today) {
    nextBirthday.setFullYear(today.getFullYear() + 1);
  }
  return Math.ceil((nextBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function getTimeUntil(birthday: string): string {
  const days = getDaysUntilNextBirthday(birthday);
  if (days === 0) return 'Hôm nay! 🎉';
  if (days === 1) return 'Ngày mai! 🎂';
  if (days <= 7) return `${days} ngày nữa 🎈`;
  return `${days} ngày nữa`;
}

/**
 * Format number as Vietnamese currency (VND) with . for thousands, , for decimals
 * Input: 1500000.5 → "1.500.000,50"
 */
export function formatVND(value: number): string {
  if (isNaN(value)) return '0';
  const parts = value.toFixed(0).split('.');
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${intPart}`;
}

/**
 * Parse a Vietnamese-formatted number string back to a number
 * Input: "1.500.000,50" → 1500000.5
 */
export function parseVND(str: string): number {
  const cleaned = str.replace(/\./g, '').replace(',', '.').replace(/[^0-9.-]/g, '');
  return parseFloat(cleaned) || 0;
}
