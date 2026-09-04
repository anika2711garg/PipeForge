import {
  Activity,
  AlertTriangle,
  Database,
  FolderInput,
  Gauge,
  LayoutDashboard,
  Settings,
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
    ],
  },
  {
    label: "Warehouse",
    items: [
      { href: "/files", label: "Files", icon: FolderInput },
      { href: "/metrics", label: "Metrics", icon: Gauge },
      { href: "/quarantine", label: "Quarantine", icon: AlertTriangle },
      { href: "/explorer", label: "Data Explorer", icon: Table2 },
    ],
  },
  {
    label: "Admin",
    items: [
      { href: "/system", label: "System", icon: Database },
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

export const NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((group) => [...group.items]);
