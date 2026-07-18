'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, BookHeart, Image as ImageIcon } from 'lucide-react';
import { memoryService } from '@/lib/services/memory-service';
import type { MoodEmoji } from '@/types/database';

const MOOD_EMOJIS: { emoji: MoodEmoji; label: string }[] = [
  { emoji: '😊', label: 'Vui vẻ' },
  { emoji: '😢', label: 'Buồn' },
  { emoji: '🤩', label: 'Phấn khích' },
  { emoji: '😌', label: 'Bình yên' },
  { emoji: '😤', label: 'Tức giận' },
  { emoji: '😴', label: 'Mệt mỏi' },
];

export default function AddMemoryPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [moodEmoji, setMoodEmoji] = useState<MoodEmoji | ''>('');
  const [image, setImage] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!title.trim()) { setError('Vui lòng nhập tiêu đề'); return; }
    setSaving(true); setError('');
    try {
      await memoryService.create({
        Title: title.trim(),
        Content: content.trim() || null,
        MoodEmoji: moodEmoji || null,
        Image: image.trim() || null,
        Mood: null,
        EventID: null,
      });
      router.push('/memories');
    } catch (e: any) {
      setError(e.message || 'Lỗi khi lưu');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <button onClick={() => router.back()} className="p-1.5 rounded-lg hover:bg-[rgba(0,0,0,0.04)] text-[#8E8E93]">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-[18px] font-bold text-[#111]">Thêm ký ức mới</h1>
          <p className="text-[11px] text-[#8E8E93]">Lưu lại những khoảnh khắc đáng nhớ</p>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto px-1">
        {/* Mood emoji picker */}
        <div className="mb-4">
          <p className="text-[9px] font-semibold text-[#6B7280] uppercase tracking-[0.3px] mb-2">Cảm xúc</p>
          <div className="flex gap-2">
            {MOOD_EMOJIS.map((item) => (
              <button key={item.emoji} onClick={() => setMoodEmoji(item.emoji)}
                className={`w-[44px] h-[44px] rounded-full flex items-center justify-center text-[22px] transition-all ${
                  moodEmoji === item.emoji
                    ? 'bg-[#FF2D55]/10 scale-110 ring-2 ring-[#FF2D55]'
                    : 'hover:bg-[rgba(0,0,0,0.04)]'
                }`}>
                {item.emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div className="mb-4">
          <p className="text-[9px] font-semibold text-[#6B7280] uppercase tracking-[0.3px] mb-1">Tiêu đề</p>
          <input value={title} onChange={(e) => setTitle(e.target.value)}
            className="input-glass text-[14px] font-semibold w-full" placeholder="Tên ký ức..." />
        </div>

        {/* Content */}
        <div className="mb-4">
          <p className="text-[9px] font-semibold text-[#6B7280] uppercase tracking-[0.3px] mb-1">Nội dung</p>
          <textarea value={content} onChange={(e) => setContent(e.target.value)}
            className="input-glass text-[13px] min-h-[120px] w-full" rows={4}
            placeholder="Hãy viết về ký ức này... Điều gì làm nó đặc biệt?" />
        </div>

        {/* Image URL */}
        <div className="mb-4">
          <p className="text-[9px] font-semibold text-[#6B7280] uppercase tracking-[0.3px] mb-1">
            Ảnh (tuỳ chọn) <span className="text-[8px] text-[#8E8E93] normal-case">— tối đa 1 ảnh</span>
          </p>
          <div className="flex gap-2">
            <input value={image} onChange={(e) => setImage(e.target.value)}
              className="input-glass text-[13px] flex-1" placeholder="https://... hoặc để trống" />
          </div>
          {image && (
            <div className="mt-2 rounded-[10px] overflow-hidden border border-[rgba(0,0,0,0.06)]">
              <img src={image} alt="preview" className="w-full h-[140px] object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            </div>
          )}
        </div>

        {error && <p className="text-[12px] text-[#E6002D] mb-3">{error}</p>}
      </div>

      {/* Save button */}
      <div className="pt-3 border-t border-[rgba(0,0,0,0.04)] mt-3">
        <button onClick={handleSave} disabled={saving || !title.trim()}
          className="w-full py-3 rounded-[12px] text-[14px] font-bold text-white bg-gradient-to-r from-[#FF2D55] to-[#FF4D6A] disabled:opacity-50 active:scale-[0.98] transition-all">
          {saving ? '⏳ Đang lưu...' : '💾 Lưu ký ức'}
        </button>
      </div>
    </div>
  );
}
