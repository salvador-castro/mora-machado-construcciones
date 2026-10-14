import {
  Building2,
  FileText,
  Hammer,
  Image as ImageIcon,
  Images,
  Inbox,
  LayoutDashboard,
  LayoutTemplate,
  ListOrdered,
  MessageSquareQuote,
  Newspaper,
  Settings,
  Sparkles,
  Tags,
  UserCircle,
  Users,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  adminOnly?: boolean;
  badge?: "newLeads";
};
export type NavGroup = { label?: string; items: NavItem[] };

export const ADMIN_NAV: NavGroup[] = [
  {
    items: [
      { href: "/admin", label: "Inicio", icon: LayoutDashboard },
      { href: "/admin/consultas", label: "Consultas", icon: Inbox, badge: "newLeads" },
    ],
  },
  {
    label: "Contenido",
    items: [
      { href: "/admin/secciones", label: "Secciones", icon: LayoutTemplate },
      { href: "/admin/obras", label: "Obras", icon: Building2 },
      { href: "/admin/categorias", label: "Categorías de obra", icon: Tags },
      { href: "/admin/servicios", label: "Servicios", icon: Hammer },
      { href: "/admin/listas", label: "Listas de inicio", icon: ListOrdered },
      { href: "/admin/galeria", label: "Galería", icon: Images },
      { href: "/admin/testimonios", label: "Testimonios", icon: MessageSquareQuote },
      { href: "/admin/logos", label: "Logos de clientes", icon: Sparkles },
      { href: "/admin/blog", label: "Blog", icon: Newspaper },
      { href: "/admin/paginas", label: "Páginas", icon: FileText },
    ],
  },
  {
    label: "Sitio",
    items: [
      { href: "/admin/medios", label: "Medios", icon: ImageIcon },
      { href: "/admin/configuracion", label: "Configuración", icon: Settings },
      { href: "/admin/usuarios", label: "Usuarios", icon: Users, adminOnly: true },
      { href: "/admin/cuenta", label: "Mi cuenta", icon: UserCircle },
    ],
  },
];
