import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Users,
  Settings,
  Search,
} from 'lucide-react';
import { useData } from '../context/DataContext';

const pages = [
  { path: '/', label: 'Go to Dashboard', icon: LayoutDashboard },
  { path: '/projects', label: 'Go to Projects', icon: FolderKanban },
  { path: '/tasks', label: 'Go to Tasks', icon: CheckSquare },
  { path: '/team', label: 'Go to Team', icon: Users },
  { path: '/settings', label: 'Go to Settings', icon: Settings },
];

interface ResultItem {
  kind: 'page' | 'task';
  label: string;
  path?: string;
  icon?: any;
}

export default function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  const navigate = useNavigate();
  const { data } = useData();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQ('');
      setSel(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  const results = useMemo<ResultItem[]>(() => {
    const ql = q.toLowerCase();
    const pageItems: ResultItem[] = pages
      .filter(p => p.label.toLowerCase().includes(ql))
      .map(p => ({ kind: 'page', label: p.label, path: p.path, icon: p.icon }));
    const taskItems: ResultItem[] = data.tasks
      .filter(t => t.title.toLowerCase().includes(ql))
      .slice(0, 6)
      .map(t => ({ kind: 'task', label: t.title }));
    return [...pageItems, ...taskItems];
  }, [q, data.tasks]);

  useEffect(() => {
    setSel(0);
  }, [q]);

  const run = (item: ResultItem) => {
    if (item.kind === 'page' && item.path) {
      navigate(item.path);
    } else {
      navigate('/tasks');
      window.dispatchEvent(new CustomEvent('cf-task-search', { detail: item.label }));
    }
    onClose();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSel(s => Math.min(s + 1, results.length - 1));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSel(s => Math.max(s - 1, 0));
      }
      if (e.key === 'Enter' && results[sel]) {
        e.preventDefault();
        run(results[sel]);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[12vh] p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-lg bg-card border border-line rounded-2xl overflow-hidden shadow-2xl"
          >
            <div className="flex items-center gap-2 px-4 border-b border-line">
              <Search className="w-4 h-4 text-faint" />
              <input
                ref={inputRef}
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder="Search pages and tasks..."
                className="bg-transparent py-3.5 text-sm text-ink-dim placeholder-faint outline-none w-full"
              />
              <kbd className="text-[10px] text-faint border border-line rounded px-1.5 py-0.5">ESC</kbd>
            </div>
            <div className="max-h-72 overflow-y-auto p-2">
              {results.length === 0 && (
                <p className="text-sm text-faint px-3 py-6 text-center">Nothing found. Try a different word.</p>
              )}
              {results.map((item, i) => {
                const Icon = item.icon || CheckSquare;
                return (
                  <button
                    key={`${item.kind}-${item.label}`}
                    onClick={() => run(item)}
                    onMouseEnter={() => setSel(i)}
                    className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-left transition-colors ${
                      i === sel ? 'bg-plum/10 text-plum-light-lighter' : 'text-muted hover:bg-fill'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="flex-1 truncate">{item.label}</span>
                    <span className="text-[10px] text-faint uppercase">{item.kind}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
