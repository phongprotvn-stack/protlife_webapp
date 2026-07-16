# PROT LIFE — Hệ điều hành cuộc sống cá nhân

PROT LIFE là ứng dụng web quản lý cuộc sống cá nhân toàn diện, giúp lưu trữ các mối quan hệ, sự kiện, ký ức và hành trình cuộc đời.

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16 + React 19 + TypeScript |
| **Styling** | Tailwind CSS v4 + shadcn/ui |
| **Animation** | Framer Motion (motion) |
| **State** | Zustand |
| **Data Fetching** | TanStack Query |
| **Database** | Supabase (PostgreSQL + RLS) |
| **Auth** | Supabase Auth |
| **Storage** | Supabase Storage |
| **Deploy** | Vercel + GitHub |

## 📱 Tính năng chính

- **Quản lý Quan hệ** — Family, Relative, Friend, Colleague, Neighbor, Teacher, Partner, Other
- **Quản lý Sự kiện** — 14 loại sự kiện với chi phí, địa điểm, tâm trạng
- **Dòng thời gian (Timeline)** — Bánh xe thời gian tương tác
- **Ký ức** — Gắn kèm media, cảm xúc
- **Dashboard** — Thống kê, Life Score, sinh nhật sắp tới
- **Tổ chức** — Quản lý công ty, câu lạc bộ
- **Tài liệu** — Knowledge Vault
- **Mục tiêu** — Theo dõi mục tiêu cuộc sống
- **AI Insights** — Phân tích và gợi ý thông minh

## 🎨 Thiết kế

- **Mobile:** iOS 26 Liquid Glass — glassmorphism, Dynamic Island, bottom tab bar
- **Desktop:** Notion/Linear 3-column layout — sidebar | main | inspector

## 🛠️ Cài đặt

```bash
# Clone repo
git clone https://github.com/phongprotvn-stack/protlife_webapp.git
cd protlife_webapp

# Install dependencies
npm install

# Copy env
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Run dev
npm run dev
```

## 🔧 Cấu hình Supabase

1. Vào [Supabase Dashboard](https://supabase.com/dashboard/project/hwgrdhnsuvohgtcuemag)
2. Vào SQL Editor → chạy toàn bộ `supabase/schema.sql`
3. Vào Authentication → Settings → config Google + Apple providers
4. Vào Storage → tạo buckets: `avatars`, `photos`, `documents`

## 🌐 Deploy lên Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/phongprotvn-stack/protlife_webapp)

```bash
npm run build    # Build production
vercel deploy --prod
```

## 📄 License

MIT
