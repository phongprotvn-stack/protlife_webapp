// Dữ liệu 24 tên con gái họ Nghiêm (v0 style) — icon Lucide + màu pastel + ý nghĩa
import {
  Leaf, Gem, CloudDrizzle, Moon, Bird, Diamond, Compass, Sprout, Waves, Gift,
  Feather, Music, TreePine, Flower2, Shell, BookOpen, MoonStar, CloudRain, Mountain,
  Flower, Cherry, Sun, Sparkles, CloudMoon,
  type LucideIcon,
} from 'lucide-react';

export interface DaughterName {
  given: string;   // Tên chính (không gồm họ)
  family: string;  // Họ
  meaning: string; // Ý nghĩa ngắn gọn
  icon: LucideIcon;
  color: string;   // Màu pastel riêng
}

export const DAUGHTER_NAMES: DaughterName[] = [
  { given: 'Thu Sang',   family: 'Nghiêm', meaning: 'Mùa thu trong trẻo',       icon: Leaf,        color: '#FFD1DC' },
  { given: 'Như Ngọc',   family: 'Nghiêm', meaning: 'Đẹp như ngọc quý',         icon: Gem,         color: '#E0F7FA' },
  { given: 'Như Sương',  family: 'Nghiêm', meaning: 'Mong manh như sương',      icon: CloudDrizzle, color: '#F3E5F5' },
  { given: 'Như Nguyệt', family: 'Nghiêm', meaning: 'Sáng như trăng rằm',       icon: Moon,        color: '#FFF9C4' },
  { given: 'Như Quyên',  family: 'Nghiêm', meaning: 'Xinh đẹp như chim quyên',  icon: Bird,        color: '#E8F5E9' },
  { given: 'Ngọc Ẩn',    family: 'Nghiêm', meaning: 'Viên ngọc ẩn mình',        icon: Diamond,     color: '#E0F2FE' },
  { given: 'Phương Châm',family: 'Nghiêm', meaning: 'Phương hướng rõ ràng',     icon: Compass,     color: '#FFE8D1' },
  { given: 'Ngọc Thảo',  family: 'Nghiêm', meaning: 'Ngọc giữa thảo xanh',      icon: Sprout,      color: '#E6F4EA' },
  { given: 'Hà An',      family: 'Nghiêm', meaning: 'Dòng sông bình yên',       icon: Waves,       color: '#DCEEFB' },
  { given: 'Bảo Trâm',   family: 'Nghiêm', meaning: 'Báu vật trân quý',         icon: Gift,        color: '#FFE4EC' },
  { given: 'Kim Tuyến',  family: 'Nghiêm', meaning: 'Sợi chỉ vàng óng',         icon: Feather,     color: '#FFF3D6' },
  { given: 'Thanh Quyên',family: 'Nghiêm', meaning: 'Tiếng hót trong veo',      icon: Music,       color: '#E3F2FD' },
  { given: 'Hà Thu',     family: 'Nghiêm', meaning: 'Dòng sông mùa thu',        icon: TreePine,    color: '#FFF0DC' },
  { given: 'Thanh Mai',  family: 'Nghiêm', meaning: 'Mai nở thanh khiết',       icon: Flower2,     color: '#FFFDE7' },
  { given: 'Châu Loan',  family: 'Nghiêm', meaning: 'Viên châu lung linh',      icon: Shell,       color: '#FFE9F3' },
  { given: 'Anh Thư',    family: 'Nghiêm', meaning: 'Tài hoa tri thức',         icon: BookOpen,    color: '#EDE7F6' },
  { given: 'Thị Nguyệt', family: 'Nghiêm', meaning: 'Ánh trăng dịu êm',         icon: MoonStar,    color: '#EDE7F6' },
  { given: 'Thu Hoài',   family: 'Nghiêm', meaning: 'Mưa thu lãng đãng',        icon: CloudRain,   color: '#FFF0DC' },
  { given: 'Thảo Nguyên',family: 'Nghiêm', meaning: 'Thảo nguyên rộng mở',      icon: Mountain,    color: '#E6F4EA' },
  { given: 'Thảo Chi',   family: 'Nghiêm', meaning: 'Cỏ cây tươi tốt',          icon: Flower,      color: '#E6F4EA' },
  { given: 'Mai Thương', family: 'Nghiêm', meaning: 'Hoa mai thương nhớ',       icon: Cherry,      color: '#FFE4EC' },
  { given: 'Nhật Linh',  family: 'Nghiêm', meaning: 'Nắng sớm tinh khôi',       icon: Sun,         color: '#FFF3D6' },
  { given: 'Bích Ngọc',  family: 'Nghiêm', meaning: 'Ngọc bích xanh biếc',      icon: Sparkles,    color: '#DCEEE8' },
  { given: 'Thu Uyên',   family: 'Nghiêm', meaning: 'Uyên ương mùa thu',        icon: CloudMoon,   color: '#E3F2FD' },
];
