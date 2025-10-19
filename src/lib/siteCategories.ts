import type { LucideIcon } from 'lucide-react'
import {
  Code2,
  ShoppingCart,
  Megaphone,
  Calculator,
  Truck,
  Factory,
  Hammer,
  ClipboardList,
  Users,
  User,
  UserPlus,
  UserCheck,
  Stethoscope,
  Shapes,
  Cpu,
  Zap,
  Shield,
  Layers,
  Box,
} from 'lucide-react'

export type SiteCategoryKey =
  | 'IT'
  | 'ENGINEERING'
  | 'ELECTRONICS'
  | 'BIOTECH'
  | 'CYBERSEC'
  | 'ENERGY'
  | 'MATERIALS'
  | 'INTERN'
  | 'JUNIOR'
  | 'MIDDLE'
  | 'SENIOR'
  | 'OTHER'

export const SITE_CATEGORY_META: Record<SiteCategoryKey, { label: string; icon: LucideIcon }> = {
  IT: { label: 'Информационные технологии', icon: Code2 },
  ENGINEERING: { label: 'Инженерия и робототехника', icon: Factory },
  ELECTRONICS: { label: 'Электроника и микроэлектроника', icon: Cpu },
  BIOTECH: { label: 'Биотехнологии', icon: Stethoscope },
  CYBERSEC: { label: 'Кибербезопасность', icon: Shield },
  ENERGY: { label: 'Энергетика и экология', icon: Zap },
  MATERIALS: { label: 'Материаловедение и нанотехнологии', icon: Layers },
  INTERN: { label: 'Стажёр', icon: Box },
  JUNIOR: { label: 'Junior', icon: UserPlus },
  MIDDLE: { label: 'Middle', icon: User },
  SENIOR: { label: 'Senior', icon: UserCheck },
  OTHER: { label: 'Другое', icon: Shapes },
}


