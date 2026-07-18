'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/shared/modal';
import { memoryService } from '@/lib/services/memory-service';
import type { Memory, Mood, MoodEmoji } from '@/types/database';
import { formatDate } from '@/lib/utils';
import { BookHeart, Calendar, Edit3, Trash2, X, Image, Smile } from 'lucide-react';
import { useAppStore } from '@/stores/app-store';

const MOOD_EMOJIS: { emoji: MoodEmoji; label: string; mood: Mood }[] = [
  { emoji: '😊', label: 'Vui vẻ', mood: 'Happy' },
  { emoji: '😢', label: 'Buồn', mood: 'Sad' },
  { emoji: '🤩', label: 'Phấn khích', mood: 'Excited' },
  { emoji: '😌', label: 'Bình yên', mood: 'Thoughtful' },
  { emoji: '😤', label: 'Tức giận', mood: 'Angry' },
  { emoji: '😴', label: 'Mệt mỏi', mood: 'Tired' },
];

function MoodDisplay({ emoji, mood, size = 24 }: { emoji?: string | null; mood?: string | null; size?: number }) {
  if (emoji) return <span style={{ fontSize: size }}>{emoji}</span>;
  if (mood) {
    const found = MOOD_EMOJIS.find(e => e.mood === mood);
    return <span style={{ fontSize: size }}>{found?.emoji || '😊'}</span>;
  }
  return null;
}

function moodColor(mood?: string | null): string {
  const colors: Record<string, string> = {
    Happy: '#FF9500', Sad: '#5856D6', Excited: '#FF2D55',
    Thoughtful: '#34C759', Angry: '#E6002D', Tired: '#8E8E93',
  };
  return colors[mood || ''] || '#8E8E93';
}

interface Props {
  memoryId: string | null;
  onClose: () => void;
  panelMode?: boolean;
}

export function MemoryDetail({ memoryId, onClose, panelMode }: Props) {
  const [memory, setMemory] = useState<Memory | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ Title: '', Content: '', Mood: '' as Mood | '', MoodEmoji: '' as MoodEmoji | '' });
  const selectMemory = useAppStore((s) => s.selectMemory);

  useEffect(() => {
    if (!memoryId) { setMemory(null); return; }
    memoryService.getById(memoryId).then((m) => {
      setMemory(m);
      if (m) {
        setForm({ Title: m.Title, Content: m.Content || '', Mood: m.Mood || '', MoodEmoji: m.MoodEmoji || '' });
        setEditMode(false);
      }
    });
  }, [memoryId]);

  const handleSave = async () => {
    if (!memory) return;
    await memoryService.update(memory.MemoryID, {
      Title: form.Title,
      Content: form.Content || null,
      Mood: form.Mood || null,
      MoodEmoji: form.MoodEmoji || null,
    });
    const updated = await memoryService.getById(memory.MemoryID);
    setMemory(updated);
    setEditMode(false);
  };

  const handleDelete = async () => {
    if (!memory || !confirm('Xoá ký ức này?')) return;
    await memoryService.delete(memory.MemoryID);
    selectMemory(null);
    onClose();
  };

  const content = (
    <div className="memory-detail">
      {memory ? (
        <>
          {/* Edit / Delete buttons */}
          <div className="flex items-center justify-end gap-1 mb-2">
            {!panelMode && (
              <button onClick={() => setEditMode(!editMode)}
                className="w-[32px] h-[32px] rounded-[8px] flex items-center justify-center hover:bg-[rgba(0,0,0,0.04)]">
                <Edit3 size={14} className="text-[#8E8E93]" />
              </button>
            )}
            <button onClick={handleDelete}
              className="w-[32px] h-[32px] rounded-[8px] flex items-center justify-center hover:bg-[rgba(0,0,0,0.04)]">
              <Trash2 size={14} className="text-[#E6002D]" />
            </button>
            {panelMode && (
              <button onClick={onClose}
                className="w-[32px] h-[32px] rounded-[8px] flex items-center justify-center hover:bg-[rgba(0,0,0,0.04)]">
                <X size={14} className="text-[#8E8E93]" />
              </button>
            )}
          </div>

          {/* Mood Emoji */}
          <div className="flex justify-center mb-3">
            {editMode ? (
              <div className="flex gap-2">
                {MOOD_EMOJIS.map((item) => (
                  <button key={item.emoji} onClick={() => setForm((f) => ({ ...f, Mood: item.mood, MoodEmoji: item.emoji }))}
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-[18px] transition-all ${
                      form.MoodEmoji === item.emoji ? 'bg-[#E6002D]/10 scale-110 ring-2 ring-[#E6002D]' : 'hover:bg-[rgba(0,0,0,0.04)]'
                    }`}>
                    {item.emoji}
                  </button>
                ))}
              </div>
            ) : (
              <div className="w-[60px] h-[60px] rounded-full flex items-center justify-center text-[32px]"
                style={{ background: `${moodColor(memory.Mood)}15` }}>
                <MoodDisplay emoji={memory.MoodEmoji} mood={memory.Mood} size={32} />
              </div>
            )}
          </div>

          {/* Title */}
          {editMode ? (
            <input value={form.Title} onChange={(e) => setForm((f) => ({ ...f, Title: e.target.value }))}
              className="input-glass text-center text-[17px] font-bold w-full" />
          ) : (
            <h2 className="text-[18px] font-bold text-[#111] text-center">{memory.Title}</h2>
          )}

          {/* Date */}
          <div className="flex items-center justify-center gap-1.5 mt-2 mb-3">
            <Calendar size={12} className="text-[#FF9500]" />
            <span className="text-[11px] text-[#8E8E93]">{formatDate(memory.CreatedDate, 'ddmmyyyy')}</span>
            {memory.Mood && <span className="text-[11px] text-[#8E8E93]">· {memory.Mood}</span>}
          </div>

          {/* Image */}
          {memory.Image && !editMode && (
            <div className="mb-3 rounded-[12px] overflow-hidden">
              <img src={memory.Image} alt={memory.Title} className="w-full h-[200px] object-cover" />
            </div>
          )}

          {/* Content */}
          <div className="mt-3">
            {editMode ? (
              <>
                <label className="text-[9px] font-semibold text-[#6B7280] uppercase mb-1 block">Nội dung ký ức</label>
                <textarea value={form.Content} onChange={(e) => setForm((f) => ({ ...f, Content: e.target.value }))}
                  className="input-glass text-[13px] min-h-[100px] w-full" rows={4} placeholder="Cảm nghĩ của bạn về ký ức này..." />
              </>
            ) : memory.Content ? (
              <div className="p-3 rounded-[10px] bg-[rgba(0,0,0,0.02)]">
                <p className="text-[13px] text-[#111] whitespace-pre-wrap leading-relaxed">{memory.Content}</p>
              </div>
            ) : (
              <p className="text-[12px] text-[#8E8E93] text-center italic">Chưa có nội dung</p>
            )}
          </div>

          {/* Event link */}
          {memory.EventID && (
            <div className="mt-3 p-2.5 rounded-[10px] bg-[rgba(88,86,214,0.05)] text-center">
              <span className="text-[11px] text-[#5856D6] font-medium">🔗 Liên kết với sự kiện</span>
            </div>
          )}

          {/* Save / Cancel in edit mode */}
          {editMode && (
            <div className="flex gap-2 mt-4">
              <button onClick={() => setEditMode(false)}
                className="flex-1 py-2.5 rounded-[10px] text-[12px] font-medium bg-[rgba(0,0,0,0.04)] text-[#5F6368]">
                Huỷ
              </button>
              <button onClick={handleSave}
                className="flex-1 py-2.5 rounded-[10px] text-[12px] font-medium text-white bg-[#E6002D]">
                Lưu
              </button>
            </div>
          )}
        </>
      ) : (
        <p className="text-center text-[#8E8E93] py-6 text-[13px]">Không tìm thấy ký ức</p>
      )}
    </div>
  );

  // Render modal or panel
  if (panelMode) {
    return <div className="panel-detail">{content}</div>;
  }
  return (
    <Modal open={!!memoryId} onClose={onClose} title="" maxWidth="420px">
      {content}
    </Modal>
  );
}
