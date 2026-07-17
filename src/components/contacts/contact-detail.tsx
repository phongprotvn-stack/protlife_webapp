'use client';

import { useState, useEffect, useRef } from 'react';
import { Modal } from '@/components/shared/modal';
import { contactService } from '@/lib/services/contact-service';
import type { Contact } from '@/types/database';
import {
  formatDate, getAvatarColor, getInitials, calculateAge,
  getRelationshipLabel, getRelationshipColor
} from '@/lib/utils';
import {
  Heart, Phone, Mail, Building2, Cake, Users, Award, Edit3, Trash2, Camera, X,
  ChevronDown, User, BookHeart, MapPin, FileText, Star
} from 'lucide-react';
import { useAppStore } from '@/stores/app-store';

interface Props { contactId: string | null; onClose: () => void; panelMode?: boolean; }

const RELATIONSHIPS = ['Family','Relative','Friend','Colleague','Neighbor','Teacher','Partner','Other'] as const;
const GENDERS = ['Male','Female','Other'] as const;
const STATUSES = ['Active','Lost Contact','Deceased','Blocked'] as const;

const SCORE_LABELS = [
  { min: 90, max: 100, label: 'Ruột thịt' },
  { min: 70, max: 89, label: 'Thâm tình' },
  { min: 50, max: 69, label: 'Thân' },
  { min: 30, max: 49, label: 'Bạn bè' },
  { min: 1,  max: 29, label: 'Quen biết' },
];

function getScoreLabel(score: number): string {
  for (const s of SCORE_LABELS) { if (score >= s.min && score <= s.max) return s.label; }
  return 'Chưa xác định';
}

export function ContactDetail({ contactId, onClose, panelMode }: Props) {
  const triggerRefresh = useAppStore((s) => s.triggerRefresh);
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    Name:'', Relationship:'Family', Gender:'', Birthday:'', Phone:'', Email:'',
    Organization1:'', Organization2:'', RelationshipScore:50, Status:'Active', IsFavorite:false, Avatar:'', Notes:'',
  });

  useEffect(() => {
    if (!contactId) return;
    setLoading(true);
    contactService.getById(contactId).then((data) => {
      setContact(data);
      if (data) {
        setForm({
          Name:data.Name, Relationship:data.Relationship, Gender:data.Gender||'',
          Birthday:data.Birthday||'', Phone:data.Phone||'', Email:data.Email||'',
          Organization1:data.Organization1||'', Organization2:data.Organization2||'',
          RelationshipScore:data.RelationshipScore||50, Status:data.Status||'Active',
          IsFavorite:data.IsFavorite||false, Avatar:data.Avatar||'', Notes:data.Notes||'',
        });
      }
      setLoading(false);
    }).catch(() => setLoading(false));
    setEditMode(false); setConfirmDelete(false); setError('');
  }, [contactId]);

  const handleSave = async () => {
    if (!contact?.ContactID) return;
    if (!form.Name.trim()) { setError('Vui lòng nhập tên'); return; }
    setSaving(true); setError('');
    try {
      await contactService.update(contact.ContactID, {
        Name:form.Name.trim(), Relationship:form.Relationship as any,
        Gender:form.Gender||undefined as any, Birthday:form.Birthday||undefined,
        Phone:form.Phone||undefined, Email:form.Email||undefined,
        Organization1:form.Organization1||undefined, Organization2:form.Organization2||undefined,
        RelationshipScore:form.RelationshipScore, Status:form.Status as any,
        IsFavorite:form.IsFavorite, Avatar:form.Avatar||undefined, Notes:form.Notes||undefined,
      });
      triggerRefresh(); setEditMode(false);
      const d = await contactService.getById(contact.ContactID);
      setContact(d);
    } catch(e:any) { setError(e.message||'Lỗi khi lưu'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!contactId) return;
    try { await contactService.delete(contactId); triggerRefresh(); onClose(); }
    catch(e:any) { setError(e.message||'Lỗi khi xoá'); }
  };

  const handleAvatarUpload = (e:React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setForm((f)=>({...f, Avatar: ev.target?.result as string}));
    reader.readAsDataURL(file);
  };

  const scoreLabel = getScoreLabel(form.RelationshipScore);

  const content = (
    <div>
      <div className="flex items-center justify-between mb-4">
        {panelMode && (
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[rgba(0,0,0,0.04)] text-[#8E8E93]"><X size={15}/></button>
        )}
        <div className="flex gap-1 ml-auto">
          {!editMode ? (
            <>
              <button onClick={()=>setEditMode(true)} className="px-3 py-1.5 rounded-[8px] text-[11px] font-medium text-[#5F6368] bg-[rgba(0,0,0,0.04)] hover:bg-[rgba(0,0,0,0.08)] flex items-center gap-1">
                <Edit3 size={12}/> Sửa
              </button>
              <button onClick={()=>setConfirmDelete(true)} className="px-3 py-1.5 rounded-[8px] text-[11px] font-medium text-[#E6002D] bg-[rgba(230,0,45,0.06)] hover:bg-[rgba(230,0,45,0.1)] flex items-center gap-1">
                <Trash2 size={12}/> Xoá
              </button>
            </>
          ) : (
            <div className="flex gap-2">
              <button onClick={()=>{setEditMode(false);setError('');}}
                className="px-3 py-1.5 rounded-[8px] text-[11px] font-medium text-[#5F6368] bg-[rgba(0,0,0,0.04)]">Huỷ</button>
              <button onClick={handleSave} disabled={saving}
                className="px-4 py-1.5 rounded-[8px] text-[11px] font-medium text-white bg-[#E6002D]">{saving?'...':'Lưu'}</button>
            </div>
          )}
        </div>
      </div>

      {confirmDelete && (
        <div className="mb-4 p-4 rounded-[14px] bg-[rgba(230,0,45,0.06)] border border-[rgba(230,0,45,0.12)] text-center">
          <div className="w-10 h-10 rounded-full bg-[rgba(230,0,45,0.1)] mx-auto mb-2 flex items-center justify-center"><Trash2 size={18} className="text-[#E6002D]"/></div>
          <p className="text-[14px] font-semibold text-[#E6002D] mb-1">Xoá quan hệ này?</p>
          <p className="text-[12px] text-[#8E8E93] mb-3">Hành động này không thể hoàn tác.</p>
          <div className="flex gap-2 justify-center">
            <button onClick={()=>setConfirmDelete(false)} className="px-5 py-2 rounded-[10px] text-[12px] font-medium text-[#5F6368] bg-white border border-[rgba(0,0,0,0.06)]">Không</button>
            <button onClick={handleDelete} className="px-5 py-2 rounded-[10px] text-[12px] font-medium text-white bg-[#E6002D]">Xoá</button>
          </div>
        </div>
      )}

      {error && <p className="mb-3 text-[11px] text-[#E6002D] text-center">{error}</p>}

      {loading ? (
        <div className="flex flex-col items-center py-10">
          <div className="w-6 h-6 border-2 border-[#E6002D]/20 border-t-[#E6002D] rounded-full animate-spin mb-2"/>
          <p className="text-[12px] text-[#8E8E93]">Đang tải...</p>
        </div>
      ) : contact ? (
        <>
          <div className="text-center mb-5">
            {editMode ? (
              <div className="relative inline-block cursor-pointer mb-3" onClick={()=>fileInputRef.current?.click()}>
                <div className="w-[72px] h-[72px] rounded-full flex items-center justify-center text-white font-bold text-[26px] mx-auto overflow-hidden"
                  style={{backgroundColor: form.Avatar?'transparent':getAvatarColor(form.Name||'?')}}>
                  {form.Avatar ? <img src={form.Avatar} alt="" className="w-full h-full object-cover"/> : getInitials(form.Name||'?')}
                </div>
                <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center"><Camera size={18} className="text-white"/></div>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload}/>
              </div>
            ) : (
              <div className="w-[72px] h-[72px] rounded-full flex items-center justify-center text-white font-bold text-[26px] mx-auto mb-2"
                style={{backgroundColor:getAvatarColor(contact.Name)}}>{getInitials(contact.Name)}</div>
            )}

            {editMode ? (
              <input value={form.Name} onChange={(e)=>setForm((f)=>({...f,Name:e.target.value}))}
                className="input-glass text-center text-[17px] font-bold mb-2" placeholder="Tên"/>
            ) : (
              <h2 className="text-[20px] font-bold text-[#111]">{contact.Name}</h2>
            )}

            {!editMode && (
              <div className="flex items-center justify-center gap-1.5 mt-1 flex-wrap">
                <span className="text-[12px] text-[#6B7280]">{contact.Relationship}</span>
                <span className="w-[3px] h-[3px] rounded-full bg-[#D1D5DB]"/>
                <span className="text-[11px] font-medium" style={{color:getRelationshipColor(contact.RelationshipScore)}}>{getRelationshipLabel(contact.RelationshipScore)}</span>
                {contact.IsFavorite && <Heart size={12} className="text-[#E6002D] fill-[#E6002D]"/>}
              </div>
            )}
          </div>

          {!editMode ? (
            <div className="space-y-2">
              <Field icon={<Cake size={14} className="text-[#FF9500]"/>} label={contact.Birthday ? `${formatDate(contact.Birthday,'ddmmyyyy')} (${calculateAge(contact.Birthday)} tuổi)` : ''}/>
              <Field icon={<Users size={14} className="text-[#5856D6]"/>} label={contact.Gender ? (contact.Gender==='Male'?'Nam':contact.Gender==='Female'?'Nữ':'Khác') : ''}/>
              <Field icon={<Phone size={14} className="text-[#34C759]"/>} label={contact.Phone||''} link={`tel:${contact.Phone}`}/>
              <Field icon={<Mail size={14} className="text-[#007AFF]"/>} label={contact.Email||''} link={`mailto:${contact.Email}`}/>
              <Field icon={<Building2 size={14} className="text-[#5856D6]"/>} label={[contact.Organization1,contact.Organization2].filter(Boolean).join(' · ')}/>
              <div className="flex items-center justify-between p-2.5 rounded-[10px] bg-[rgba(0,0,0,0.02)]">
                <div className="flex items-center gap-2.5"><Award size={14} style={{color:getRelationshipColor(contact.RelationshipScore)}}/><span className="text-[12px] text-[#5F6368]">Điểm kết nối</span></div>
                <span className="text-[14px] font-bold" style={{color:getRelationshipColor(contact.RelationshipScore)}}>{contact.RelationshipScore}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-[10px] bg-[rgba(0,0,0,0.02)]">
                <div className="flex items-center gap-2.5">
                  <div className={`w-[8px] h-[8px] rounded-full ${contact.Status==='Active'?'bg-[#34C759]':contact.Status==='Lost Contact'?'bg-[#FF9500]':'bg-[#8E8E93]'}`}/>
                  <span className="text-[12px] text-[#5F6368]">Trạng thái</span>
                </div>
                <span className="text-[12px] font-medium text-[#5F6368]">{contact.Status==='Active'?'Đang liên lạc':contact.Status==='Lost Contact'?'Mất liên lạc':contact.Status==='Deceased'?'Đã mất':'Chặn'}</span>
              </div>
              {contact.Notes && <Field icon={<FileText size={14} className="text-[#8E8E93]"/>} label={contact.Notes}/>}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <FieldEdit label="Giới tính">
                  <select value={form.Gender} onChange={(e)=>setForm((f)=>({...f,Gender:e.target.value}))} className="input-glass text-[13px]">
                    <option value="">Chọn</option>
                    {GENDERS.map((g)=><option key={g} value={g}>{g==='Male'?'Nam':g==='Female'?'Nữ':'Khác'}</option>)}
                  </select>
                </FieldEdit>
                <FieldEdit label="Ngày sinh">
                  <input type="date" value={form.Birthday} onChange={(e)=>setForm((f)=>({...f,Birthday:e.target.value}))} className="input-glass text-[13px]"/>
                </FieldEdit>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <FieldEdit label="Số điện thoại">
                  <input value={form.Phone} onChange={(e)=>setForm((f)=>({...f,Phone:e.target.value}))} className="input-glass text-[13px]" placeholder="VD: 090..."/>
                </FieldEdit>
                <FieldEdit label="Email">
                  <input value={form.Email} onChange={(e)=>setForm((f)=>({...f,Email:e.target.value}))} className="input-glass text-[13px]" placeholder="email@domain.com"/>
                </FieldEdit>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <FieldEdit label="Tổ chức 1">
                  <input value={form.Organization1} onChange={(e)=>setForm((f)=>({...f,Organization1:e.target.value}))} className="input-glass text-[13px]" placeholder="Công ty / CLB"/>
                </FieldEdit>
                <FieldEdit label="Tổ chức 2">
                  <input value={form.Organization2} onChange={(e)=>setForm((f)=>({...f,Organization2:e.target.value}))} className="input-glass text-[13px]" placeholder="Công ty / CLB"/>
                </FieldEdit>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <FieldEdit label="Mối quan hệ">
                  <select value={form.Relationship} onChange={(e)=>setForm((f)=>({...f,Relationship:e.target.value}))} className="input-glass text-[13px]">
                    {RELATIONSHIPS.map((r)=><option key={r} value={r}>{r}</option>)}
                  </select>
                </FieldEdit>
                <FieldEdit label="Trạng thái">
                  <select value={form.Status} onChange={(e)=>setForm((f)=>({...f,Status:e.target.value}))} className="input-glass text-[13px]">
                    {STATUSES.map((s)=><option key={s} value={s}>{s==='Active'?'Đang liên lạc':s==='Lost Contact'?'Mất liên lạc':s==='Deceased'?'Đã mất':'Chặn'}</option>)}
                  </select>
                </FieldEdit>
              </div>
              <div>
                <p className="text-[9px] font-semibold text-[#6B7280] uppercase mb-1">Mức độ thân thiết: {form.RelationshipScore}</p>
                <input type="range" min={0} max={100} value={form.RelationshipScore}
                  onChange={(e)=>setForm((f)=>({...f,RelationshipScore:Number(e.target.value)}))}
                  className="w-full h-1.5 accent-[#E6002D] rounded-full"/>
                <div className="flex mt-2 gap-1">
                  {SCORE_LABELS.map((s) => {
                    const active = form.RelationshipScore >= s.min && form.RelationshipScore <= s.max;
                    return (
                      <div key={s.label}
                        className={`flex-1 text-center text-[9px] font-semibold py-1 rounded-[4px] transition-colors ${
                          active ? 'bg-[#E6002D] text-white' : 'text-[#9CA3AF] bg-[rgba(0,0,0,0.02)]'
                        }`}>{s.label}</div>
                    );
                  })}
                </div>
              </div>
              <button type="button" onClick={()=>setForm((f)=>({...f,IsFavorite:!f.IsFavorite}))}
                className={`w-full h-[44px] rounded-[10px] flex items-center justify-center gap-2 text-[12px] font-semibold transition-all border ${
                  form.IsFavorite ? 'bg-[rgba(230,0,45,0.06)] text-[#E6002D] border-[rgba(230,0,45,0.15)]' : 'bg-white text-[#6B7280] border-[rgba(0,0,0,0.06)]'
                }`}>
                <Heart size={15} className={form.IsFavorite?'fill-[#E6002D]':''}/>
                {form.IsFavorite?'Đã yêu thích':'Thêm vào yêu thích'}
              </button>
              <FieldEdit label="Ghi chú">
                <textarea value={form.Notes} onChange={(e)=>setForm((f)=>({...f,Notes:e.target.value}))}
                  className="input-glass text-[13px] min-h-[60px]" rows={2} placeholder="Ghi chú thêm..."/>
              </FieldEdit>
            </div>
          )}
        </>
      ) : (
        <p className="text-center text-[#8E8E93] py-6 text-[13px]">Không tìm thấy</p>
      )}
    </div>
  );

  if (panelMode) return <div className="panel-detail">{content}</div>;
  return <Modal open={!!contactId} onClose={onClose} title="" maxWidth="420px">{content}</Modal>;
}

function Field({icon, label, link}:{icon:React.ReactNode;label:string;link?:string}) {
  if (!label) return null;
  const inner = <div className="flex items-center gap-2.5 p-2.5 rounded-[10px] bg-[rgba(0,0,0,0.02)]">{icon}<span className="text-[13px] text-[#111]">{label}</span></div>;
  if (link) return <a href={link} className="block no-underline">{inner}</a>;
  return inner;
}
function FieldEdit({label, children}:{label:string;children:React.ReactNode}) {
  return <div><p className="text-[9px] font-semibold text-[#6B7280] uppercase mb-1">{label}</p>{children}</div>;
}
