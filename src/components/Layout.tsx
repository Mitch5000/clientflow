import { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { relativeTime } from '../utils/relativetime';
import Toasts from './Toasts';
import CommandPalette from './CommandPalette';
import UserAvatar from './UserAvatar';
import Logo from './Logo';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/projects', label: 'Projects', icon: FolderKanban },
  { path: '/tasks', label: 'Tasks', icon: CheckSquare },
  { path: '/team', label: 'Team', icon: Users },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();
  const { data } = useData();

  const sortedActivities = [...data.activities].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  const unreadCount = sortedActivities.filter(
    a => Date.now() - new Date(a.timestamp).getTime() < 86400000
  ).length;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen(o => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const pageTitle = navItems.find(n => n.path === location.pathname)?.label || 'Dashboard';

  return (
    <div className="min-h-screen bg-surface text-ink-dim flex">
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-72 bg-card border-r border-line flex flex-col transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 h-16 border-b border-line">
          <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center shadow-lg shadow-black/25 border border-line">
            <Logo size={20} />
          </div>
          <span className="text-lg font-bold text-ink tracking-tight">Clientflow</span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto lg:hidden p-1.5 rounded-lg hover:bg-fill text-muted"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          <p className="px-3 text-[11px] font-semibold text-faint uppercase tracking-wider mb-3">Main</p>
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? 'bg-plum/10 text-plum-light-light'
                    : 'text-muted hover:text-ink-dim hover:bg-fill'
                }`}
              >
                <Icon className={`w-[18px] h-[18px] transition-colors ${isActive ? 'text-plum-light' : 'text-faint group-hover:text-muted'}`} />
                {item.label}
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute left-0 w-1 h-6 bg-accent rounded-r-full"
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                  />
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Built-by line - the kind of footer a person leaves */}
        <div className="px-6 pb-3 -mt-2">
          <p className="text-[10px] text-ghost leading-relaxed">
            Demo built by Mitchell Osiago.<br />Data lives in your browser.
          </p>
        </div>

        {/* User */}
        <div className="p-4 border-t border-line" ref={profileRef}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-3 w-full p-2 rounded-xl hover:bg-fill transition-colors"
          >
            <UserAvatar email={user?.email} name={user?.name} size={9} rounded="rounded-full" />
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm font-medium text-ink-dim truncate">{user?.name}</p>
              <p className="text-xs text-faint truncate">{user?.email}</p>
            </div>
            <ChevronDown className={`w-4 h-4 text-faint transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
          </button>
          <AnimatePresence>
            {profileOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full mt-2 px-3 py-2 text-sm text-rust-light hover:bg-rust/10 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-30 h-16 bg-surface/80 backdrop-blur-xl border-b border-line flex items-center px-4 lg:px-8 gap-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-fill text-muted"
          >
            <Menu className="w-5 h-5" />
          </button>

          <h1 className="text-lg font-semibold text-ink hidden sm:block">{pageTitle}</h1>

          <div className="flex-1" />

          <button
            onClick={() => setPaletteOpen(true)}
            className="hidden md:flex items-center bg-fill border border-line rounded-xl px-3 py-2 w-72 text-left hover:border-line-strong transition-colors"
          >
            <Search className="w-4 h-4 text-faint mr-2" />
            <span className="text-sm text-faint flex-1">Search or jump to...</span>
            <kbd className="text-[10px] text-faint border border-line rounded px-1.5 py-0.5">Ctrl K</kbd>
          </button>

          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotifOpen(o => !o)}
              className="relative p-2 rounded-xl hover:bg-fill-strong text-muted transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-accent rounded-full text-[9px] font-bold text-ink flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
            <AnimatePresence>
              {notifOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-80 bg-card border border-line rounded-2xl shadow-2xl shadow-black/60 overflow-hidden z-50"
                >
                  <div className="px-4 py-3 border-b border-line flex items-center justify-between">
                    <p className="text-sm font-semibold text-ink">Notifications</p>
                    <span className="text-[10px] text-faint bg-fill px-2 py-0.5 rounded-full">{unreadCount} in last 24h</span>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {sortedActivities.slice(0, 8).map(a => (
                      <div key={a.id} className="px-4 py-3 flex items-start gap-3 border-b border-line-faint last:border-0 hover:bg-fill transition-colors">
                        <UserAvatar memberId={a.userId} size={8} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted leading-relaxed">
                            <span className="font-medium text-ink-dim">{data.teamMembers.find(m => m.id === a.userId)?.name || 'Someone'}</span>{' '}
                            {a.action} <span className="text-plum-light">{a.targetName}</span>
                          </p>
                          <p className="text-[10px] text-faint mt-0.5">{relativeTime(a.timestamp)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="px-4 py-2.5 bg-fill/60">
                    <p className="text-[10px] text-ghost">Older events live in your workspace history - this demo keeps the last 50.</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            {children}
          </motion.div>
        </main>
      </div>

      <Toasts />
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}
