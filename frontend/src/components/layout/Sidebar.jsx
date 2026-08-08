import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Building2, DoorOpen, Users, FileText, Wallet, ReceiptText,
  BarChart3, Search, Bell, Settings, ShieldCheck, ScrollText, X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const NAV = [
  { section: 'Vue d\'ensemble', items: [
    { to: '/', label: 'Tableau de bord', icon: LayoutDashboard, end: true },
  ]},
  { section: 'Gestion', items: [
    { to: '/houses', label: 'Maisons', icon: Building2 },
    { to: '/units', label: 'Logements', icon: DoorOpen },
    { to: '/tenants', label: 'Locataires', icon: Users },
    { to: '/contracts', label: 'Contrats', icon: FileText },
  ]},
  { section: 'Finances', items: [
    { to: '/payments', label: 'Loyers & Paiements', icon: Wallet },
    { to: '/expenses', label: 'Dépenses', icon: ReceiptText },
    { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  ]},
];

export default function Sidebar({ open, onClose }) {
  const { can } = useAuth();

  const systemItems = [
    { to: '/search', label: 'Recherche', icon: Search },
    { to: '/notifications', label: 'Notifications', icon: Bell },
    ...(can('manage-settings') ? [{ to: '/settings', label: 'Paramètres', icon: Settings }] : []),
    ...(can('manage-users') ? [{ to: '/users', label: 'Utilisateurs', icon: ShieldCheck }] : []),
    ...(can('view-audit') ? [{ to: '/audit', label: 'Journal d\'audit', icon: ScrollText }] : []),
  ];

  const linkClass = ({ isActive }) =>
    `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
      isActive
        ? 'bg-brand-600/10 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400'
        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800/70 dark:hover:text-gray-100'
    }`;

  return (
    <>
      {/* Overlay mobile */}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-gray-200/70 bg-white transition-transform duration-300 dark:border-gray-800 dark:bg-gray-950 lg:static lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-gray-200/70 px-5 dark:border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold tracking-tight text-gray-900 dark:text-white">ImmoManager</p>
              <p className="text-[11px] text-gray-400">Gestion locative</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 lg:hidden">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
          {NAV.map((group) => (
            <div key={group.section}>
              <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                {group.section}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavLink key={item.to} to={item.to} end={item.end} className={linkClass} onClick={onClose}>
                    <item.icon className="h-[18px] w-[18px] shrink-0" />
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}

          <div>
            <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Système</p>
            <div className="space-y-0.5">
              {systemItems.map((item) => (
                <NavLink key={item.to} to={item.to} className={linkClass} onClick={onClose}>
                  <item.icon className="h-[18px] w-[18px] shrink-0" />
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        </nav>

        {/* Version */}
        <div className="border-t border-gray-200/70 px-5 py-3 dark:border-gray-800">
          <p className="text-[11px] text-gray-400">ImmoManager v1.0.0</p>
        </div>
      </aside>
    </>
  );
}
