'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { memoryService } from '@/lib/services/memory-service';
import type { MoodEmoji } from '@/types/database';
import { Image as ImageIcon, Upload, Link2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

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

// ── Speech Recognition ──
const SpeechRecognitionCtor =
  (typeof window !== 'undefined' && (window as any).SpeechRecognition) ||
  (typeof window !== 'undefined' && (window as any).webkitSpeechRecognition) ||
  null;
const speechSupported = !!SpeechRecognitionCtor;

// ── Toast helper ──
function showToast(msg: string) {
  const el = document.getElementById('img-toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout((el as any)._it);
  (el as any)._it = setTimeout(() => el.classList.remove('show'), 2200);
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
  const [isRecording, setIsRecording] = useState(false);
  const [imageTab, setImageTab] = useState<'url' | 'upload'>('url');
  const [imageUploading, setImageUploading] = useState(false);
  const [imageUploadError, setImageUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const contentRef = useRef(content);
  contentRef.current = content;

  // ── Voice recording ──
  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
    };
  }, []);

  const toggleRecording = useCallback(() => {
    if (!speechSupported) return;
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = 'vi-VN';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript + ' ';
        } else {
          interimTranscript += result[0].transcript;
        }
      }
      // Append final results to content; interim is shown but not committed yet
      if (finalTranscript) {
        setContent((prev) => prev + finalTranscript);
      }
    };

    recognition.onerror = () => {
      setIsRecording(false);
      const el = document.getElementById('voice-toast');
      if (el) {
        el.textContent = 'Không nghe rõ, thử lại hoặc gõ tay';
        el.classList.add('show');
        clearTimeout((el as any)._vt);
        (el as any)._vt = setTimeout(() => el.classList.remove('show'), 2500);
      }
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
    recognitionRef.current = recognition;
    setIsRecording(true);
  }, [isRecording]);

  // ── Image compress + upload ──
  const compressImage = useCallback((file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      if (file.size > 20 * 1024 * 1024) {
        reject(new Error('Ảnh > 20MB không thể xử lý'));
        return;
      }
      const img = new Image();
      img.onload = () => {
        let w = img.width;
        let h = img.height;
        const max = 1600;
        if (w > max || h > max) {
          const ratio = Math.min(max / w, max / h);
          w = Math.round(w * ratio);
          h = Math.round(h * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('Canvas not supported')); return; }
        ctx.drawImage(img, 0, 0, w, h);
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Nén ảnh thất bại'));
        }, 'image/jpeg', 0.8);
      };
      img.onerror = () => reject(new Error('Không đọc được ảnh'));
      img.src = URL.createObjectURL(file);
    });
  }, []);

  const handleFilePick = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageUploadError('');
    setImageUploading(true);
    try {
      const compressed = await compressImage(file);
      const ext = 'jpg';
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || 'anonymous';
      const filePath = `${userId}/${fileName}`;
      const { error: uploadError } = await supabase.storage
        .from('memory-images')
        .upload(filePath, compressed, {
          contentType: 'image/jpeg',
          upsert: false,
        });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage
        .from('memory-images')
        .getPublicUrl(filePath);
      setImage(publicUrl);
      showToast('✅ Đã tải ảnh lên');
    } catch (err: any) {
      setImageUploadError(err?.message || 'Lỗi khi tải ảnh');
    } finally {
      setImageUploading(false);
      // Reset file input so same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [compressImage]);

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
      {/* Voice toast */}
      <div id="voice-toast"
        className="fixed top-5 left-1/2 -translate-x-1/2 -translate-y-5 scale-90 bg-black/85 backdrop-blur-xl text-white px-[22px] py-3 rounded-[26px] text-[13px] font-semibold z-[100] opacity-0 pointer-events-none shadow-[0_16px_40px_rgba(0,0,0,.25)] transition-all duration-[400ms]"
        style={{ transitionTimingFunction: 'cubic-bezier(.34,1.4,.64,1)' }} />
      <style>{`#voice-toast.show{opacity:1;transform:translateX(-50%)translateY(0)scale(1)}`}</style>

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
        <div className="flex items-center justify-between mb-1">
          <p className="text-[9px] font-semibold text-[#6B7280] uppercase tracking-[0.3px]">Nội dung</p>
          {speechSupported && (
            <button
              type="button"
              onClick={toggleRecording}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-[6px] text-[10px] font-medium transition-all ${
                isRecording
                  ? 'text-[#E6002D] bg-[rgba(230,0,45,0.08)] animate-pulse'
                  : 'text-[#6B7280] hover:bg-[rgba(0,0,0,0.04)]'
              }`}
              title={isRecording ? 'Dừng ghi âm' : 'Ghi âm giọng nói'}
            >
              <span className={`text-[13px] ${isRecording ? 'inline-block' : ''}`}>
                {isRecording ? '🔴' : '🎙️'}
              </span>
              {isRecording ? 'Đang nghe...' : 'Ghi âm'}
            </button>
          )}
        </div>
        <textarea value={content} onChange={(e) => setContent(e.target.value)}
          className="input-glass text-[12px] min-h-[60px] w-full" rows={3}
          placeholder="Hãy viết về ký ức này..." />
      </div>

      {/* Image */}
      <div className="mb-3">
        {/* Image toast */}
        <div id="img-toast"
          className="fixed top-14 left-1/2 -translate-x-1/2 -translate-y-5 scale-90 bg-black/85 backdrop-blur-xl text-white px-[22px] py-3 rounded-[26px] text-[13px] font-semibold z-[100] opacity-0 pointer-events-none shadow-[0_16px_40px_rgba(0,0,0,.25)] transition-all duration-[400ms]"
          style={{ transitionTimingFunction: 'cubic-bezier(.34,1.4,.64,1)' }} />
        <style>{`#img-toast.show{opacity:1;transform:translateX(-50%)translateY(0)scale(1)}`}</style>

        <p className="text-[9px] font-semibold text-[#6B7280] uppercase tracking-[0.3px] mb-1.5">
          Ảnh (tuỳ chọn) <span className="text-[8px] text-[#8E8E93] normal-case">— tối đa 1 ảnh</span>
        </p>

        {/* Tabs */}
        <div className="flex gap-0 mb-2 bg-[#F2F2F7] rounded-[8px] p-0.5">
          <button
            type="button"
            onClick={() => setImageTab('url')}
            className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-[7px] text-[10px] font-semibold transition-all ${
              imageTab === 'url' ? 'bg-white shadow-sm text-[#111]' : 'text-[#8E8E93]'
            }`}
          >
            <Link2 size={11} /> Dán link
          </button>
          <button
            type="button"
            onClick={() => setImageTab('upload')}
            className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-[7px] text-[10px] font-semibold transition-all ${
              imageTab === 'upload' ? 'bg-white shadow-sm text-[#111]' : 'text-[#8E8E93]'
            }`}
          >
            <Upload size={11} /> Tải ảnh lên
          </button>
        </div>

        {/* Tab: URL */}
        {imageTab === 'url' && (
          <input value={image} onChange={(e) => setImage(e.target.value)}
            className="input-glass text-[12px] w-full" placeholder="https://... hoặc để trống" />
        )}

        {/* Tab: Upload */}
        {imageTab === 'upload' && (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFilePick}
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-[10px] p-4 text-center cursor-pointer transition-all ${
                imageUploading ? 'border-[var(--color-primary)] bg-[rgba(230,0,45,0.04)]' : 'border-[#EDEDF1] hover:border-[#D1D1D6] hover:bg-[rgba(0,0,0,0.02)]'
              }`}
            >
              {imageUploading ? (
                <div className="text-[12px] text-[#6B7280]">⏳ Đang nén & tải lên...</div>
              ) : image ? (
                <div className="text-[12px] text-[var(--color-primary)] font-medium">✅ Đã chọn ảnh. Bấm để đổi ảnh khác</div>
              ) : (
                <div className="text-[12px] text-[#6B7280]">
                  <Upload size={20} className="mx-auto mb-1 opacity-50" />
                  Bấm để chọn ảnh từ máy<br />
                  <span className="text-[10px] text-[#9CA3AF]">Tự động nén trước khi tải lên</span>
                </div>
              )}
            </div>
            {imageUploadError && (
              <p className="text-[11px] text-[#E6002D] mt-1">{imageUploadError}</p>
            )}
          </div>
        )}

        {/* Preview (shared) */}
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
