'use client';

import { useState, useCallback } from 'react';
import { memoryService } from '@/lib/services/memory-service';
import type { MoodEmoji } from '@/types/database';
import { Image as ImageIcon } from 'lucide-react';

const MOOD_EMOJIS: { emoji: MoodEmoji; label: string }[] = [
  { emoji: '😊', label: 'Vui vẻ' },
  { emoji: '😢', label: 'Buồn' },
  { emoji: '🤩', label: 'Phấn khích' },
  { emoji: '😌', label: 'Bình yên' },
  { emoji: '😤', label: 'Tức giận' },
  { emoji: '😴', label: 'Mệt mỏi' },
];

interface MemoryFormFieldsProps {
  eventId?: string;
  initialTitle?: string;
  existingMemoryId?: string;
  initialContent?: string;
  initialMoodEmoji?: MoodEmoji | '';
  initialImage?: string;
  onSaved: (memoryId: string) => void;
  onCancel: () => void;
  /** Show title field? Set false to rely on initialTitle only */
  showTitleField?: boolean;
}

export default function MemoryFormFields({
  eventId,
  initialTitle = '',
  existingMemoryId,
  initialContent = '',
  initialMoodEmoji = '',
  initialImage = '',
  onSaved,
  onCancel,
  showTitleField = true,
}: MemoryFormFieldsProps) {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [moodEmoji, setMoodEmoji] = useState<MoodEmoji | ''>(initialMoodEmoji);
  const [image, setImage] = useState(initialImage);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = useCallback(async () => {
    if (showTitleField && !title.trim()) { setError('Vui lòng nhập tiêu đề'); return; }
    setSaving(true); setError('');
    try {
      if (existingMemoryId) {
        const updated = await memoryService.update(existingMemoryId, {
          Title: (showTitleField ? title.trim() : initialTitle) || 'Ký ức',
          Content: content.trim() || null,
          MoodEmoji: moodEmoji || null,
          Image: image.trim() || null,
          Mood: null,
        });
        onSaved(updated.MemoryID);
      } else {
        const mem = await memoryService.create({
          EventID: eventId || null,
          Title: title.trim(),
          Content: content.trim() || null,
          MoodEmoji: moodEmoji || null,
          Image: image.trim() || null,
          Mood: null,
        });
        onSaved(mem.MemoryID);
      }
    } catch (e: any) {
      setError(e?.message || 'Lỗi khi lưu');
    } finally {
      setSaving(false);
    }
  }, [title, content, moodEmoji, image, eventId, existingMemoryId, showTitleField, onSaved]);

  return (
    <>
      {/* Mood emoji picker */}
      <div className="mb-3">
        <p className="text-[9px] font-semibold text-[#6B7280] uppercase tracking-[0.3px] mb-1.5">Cảm xúc</p>
        <div className="flex gap-1.5">
          {MOOD_EMOJIS.map((item) => (
            <button key={item.emoji} onClick={() => setMoodEmoji(item.emoji)}
              className={`w-[34px] h-[34px] rounded-full flex items-center justify-center text-[16px] transition-all ${
                moodEmoji === item.emoji
                  ? 'bg-[#FF2D55]/10 ring-2 ring-[#FF2D55] scale-110'
                  : 'hover:bg-[rgba(0,0,0,0.04)]'
              }`}>
              {item.emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Title */}
      {showTitleField && (
        <div className="mb-3">
          <p className="text-[9px] font-semibold text-[#6B7280] uppercase tracking-[0.3px] mb-1">Tiêu đề</p>
          <input value={title} onChange={(e) => setTitle(e.target.value)}
            className="input-glass text-[13px] font-semibold w-full" placeholder="Tên ký ức..." />
        </div>
      )}

      {/* Content */}
      <div className="mb-3">
        <p className="text-[9px] font-semibold text-[#6B7280] uppercase tracking-[0.3px] mb-1">Nội dung</p>
        <textarea value={content} onChange={(e) => setContent(e.target.value)}
          className="input-glass text-[12px] min-h-[60px] w-full" rows={3}
          placeholder="Hãy viết về ký ức này..." />
      </div>

      {/* Image URL */}
      <div className="mb-3">
        <p className="text-[9px] font-semibold text-[#6B7280] uppercase tracking-[0.3px] mb-1">Ảnh (tuỳ chọn)</p>
        <input value={image} onChange={(e) => setImage(e.target.value)}
          className="input-glass text-[12px] w-full" placeholder="https://... (tối đa 1 ảnh)" />
        {image && (
          <div className="mt-1.5 rounded-[8px] overflow-hidden border border-[rgba(0,0,0,0.06)]">
            <img src={image} alt="preview" className="w-full h-[100px] object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          </div>
        )}
      </div>

      {error && <p className="text-[12px] text-[#E6002D] mb-3">{error}</p>}

      {/* Actions */}
      <div className="flex gap-2">
        <button onClick={onCancel}
          className="flex-1 py-2 rounded-[8px] text-[11px] font-medium bg-[rgba(0,0,0,0.04)] text-[#5F6368]">
          Huỷ
        </button>
        <button onClick={handleSave} disabled={saving || (showTitleField && !title.trim())}
          className="flex-1 py-2 rounded-[8px] text-[11px] font-medium text-white disabled:opacity-50"
          style={{ background: 'var(--color-primary, #FF2D55)' }}>
          {saving ? '...' : (existingMemoryId ? '💾 Cập nhật' : '💾 Lưu')}
        </button>
      </div>
    </>
  );
}
