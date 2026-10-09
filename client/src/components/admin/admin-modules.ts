import {
  Award,
  BookOpen,
  BriefcaseBusiness,
  Cpu,
  DatabaseBackup,
  FileText,
  FolderKanban,
  GitBranch,
  History,
  House,
  Image,
  LayoutDashboard,
  ListChecks,
  type LucideIcon,
  Mail,
  MessageSquareQuote,
  NotebookPen,
  Search,
  Settings,
  Sparkles,
  Trophy,
  UserRound,
  Wrench,
} from "lucide-react";

export type AdminModule = {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Roadmap phase that builds it (portfolio.md §15). */
  phase: number;
  /** Flip to true when the module's pages exist; hidden from the sidebar until then. */
  available: boolean;
};

/** Admin modules from portfolio.md §5.2. */
export const adminModules: AdminModule[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard, phase: 2, available: true },
  { label: "Site Settings", href: "/admin/settings", icon: Settings, phase: 3, available: true },
  { label: "Homepage", href: "/admin/homepage", icon: House, phase: 3, available: true },
  { label: "About", href: "/admin/about", icon: UserRound, phase: 3, available: true },
  {
    label: "Experience",
    href: "/admin/experience",
    icon: BriefcaseBusiness,
    phase: 3,
    available: true,
  },
  { label: "Projects", href: "/admin/projects", icon: FolderKanban, phase: 3, available: true },
  { label: "Skills", href: "/admin/skills", icon: Cpu, phase: 3, available: true },
  { label: "Capabilities", href: "/admin/capabilities", icon: Sparkles, phase: 3, available: true },
  { label: "Resume", href: "/admin/resume", icon: FileText, phase: 3, available: true },
  { label: "Media Library", href: "/admin/media", icon: Image, phase: 3, available: true },
  {
    label: "Case Studies",
    href: "/admin/case-studies",
    icon: BookOpen,
    phase: 5,
    available: true,
  },
  { label: "Engineering", href: "/admin/engineering", icon: Wrench, phase: 5, available: true },
  { label: "What I Built", href: "/admin/built", icon: ListChecks, phase: 5, available: true },
  {
    label: "Testimonials",
    href: "/admin/testimonials",
    icon: MessageSquareQuote,
    phase: 5,
    available: true,
  },
  { label: "Achievements", href: "/admin/achievements", icon: Trophy, phase: 5, available: true },
  {
    label: "Certifications",
    href: "/admin/certifications",
    icon: Award,
    phase: 5,
    available: true,
  },
  { label: "Messages", href: "/admin/messages", icon: Mail, phase: 5, available: true },
  { label: "Blog", href: "/admin/blog", icon: NotebookPen, phase: 6, available: true },
  { label: "GitHub", href: "/admin/github", icon: GitBranch, phase: 6, available: true },
  { label: "Now / Uses / FAQ", href: "/admin/pages", icon: Sparkles, phase: 7, available: false },
  { label: "SEO", href: "/admin/seo", icon: Search, phase: 7, available: false },
  { label: "Revisions & Audit", href: "/admin/audit", icon: History, phase: 7, available: false },
  { label: "Backup", href: "/admin/backup", icon: DatabaseBackup, phase: 7, available: false },
];

export const availableModules = adminModules.filter((module) => module.available);
