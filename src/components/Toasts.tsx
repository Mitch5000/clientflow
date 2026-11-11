import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '../utils/toast';

interface ToastItem {
  id: number;
  msg: string;
}

export default function Toasts() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    const on = (e: Event) => {
      const msg = (e as CustomEvent).detail as string;
      const id = Date.now() + Math.random();
      setItems(prev => [...prev.slice(-3), { id, msg }]);
      setTimeout(() => setItems(prev => prev.filter(i => i.id !== id)), 3200);
    };
    window.addEventListener('cf-toast', on);
    return () => window.removeEventListener('cf-toast', on);
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-[100] space-y-2 w-72 pointer-events-none">
      <AnimatePresence>
        {items.map(t => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            className="bg-raised border border-line border-l-2 border-l-accent rounded-xl px-4 py-3 text-sm text-ink-dim shadow-xl shadow-black/40"
          >
            {t.msg}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export { toast };
