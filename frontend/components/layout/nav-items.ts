import {
  Activity,
  AlertTriangle,
  Database,
  FolderInput,
  Gauge,
  GitCompare,
  CircleHelp,
  History,
  LayoutDashboard,
  Settings,
  Sparkles,
  Table2,
  Workflow,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export type NavGroup = {
  label: string;
  items: readonly NavItem[];
};

export const NAV_GROUPS: readonly NavGroup[] = [
  {
    label: "Monitor",
    items: [
      { href: "/", label: "Overview", icon: LayoutDashboard },
      { href: "/pipeline", label: "Pipeline", icon: Workflow },
      { href: "/runs", label: "Runs", icon: Activity },
      { href: "/activity", label: "Activity", icon: History },
      { href: "/insights", label: "Insights", icon: Sparkles },
    ],
  },
  {
    label: "Warehouse",
    items: [
      { href: "/files", label: "Files", icon: FolderInput },
      { href: "/metrics", label: "Metrics", icon: Gauge },
      { href: "/quarantine", label: "Quarantine", icon: AlertTriangle },
      { href: "/explorer", label: "Data Explorer", icon: Table2 },
      { href: "/compare", label: "Compare", icon: GitCompare },
    ],
  },
  {
    label: "Admin",
    items: [
      { href: "/system", label: "System", icon: Database },
      { href: "/settings", label: "Settings", icon: Settings },
      { href: "/help", label: "Help", icon: CircleHelp },
    ],
  },
];

export const NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((group) => [...group.items]);
