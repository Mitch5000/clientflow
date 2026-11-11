import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Mail,
  Briefcase,
  Save,
  Loader2,
  AlertTriangle,
  Trash2,
  Check,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { resetData } from '../utils/storage';
import UserAvatar from '../components/UserAvatar';

export default function Settings() {
  const { user, updateUser } = useAuth();
  const { refreshData } = useData();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    role: user?.role || '',
  });

  const handleSave = async () => {
    setSaving(true);
    await new Promise(resolve => setTimeout(resolve, 600));
    updateUser({ name: form.name, email: form.email, role: form.role });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    resetData();
    refreshData();
    setShowResetConfirm(false);
  };

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-ink">Settings</h2>
        <p className="text-sm text-faint mt-0.5">Manage your account and workspace preferences</p>
      </div>

      {/* Profile Section */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-line rounded-2xl p-6"
      >
        <h3 className="text-base font-semibold text-ink mb-1">Profile</h3>
        <p className="text-sm text-faint mb-6">Update your personal information</p>

        <div className="flex items-center gap-4 mb-6">
          <UserAvatar email={user?.email} name={user?.name} size={16} className="rounded-2xl" />
          <div>
            <p className="text-sm font-medium text-ink">{user?.name}</p>
            <p className="text-xs text-faint">{user?.email}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted mb-1.5">Full name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-faint" />
              <input
                type="text"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 bg-fill border border-line rounded-xl text-sm text-ink-dim outline-none focus:border-plum/40 transition-colors"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-muted mb-1.5">Email address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-faint" />
              <input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 bg-fill border border-line rounded-xl text-sm text-ink-dim outline-none focus:border-plum/40 transition-colors"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-muted mb-1.5">Role</label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-faint" />
              <input
                type="text"
                value={form.role}
                onChange={e => setForm({ ...form, role: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 bg-fill border border-line rounded-xl text-sm text-ink-dim outline-none focus:border-plum/40 transition-colors"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-accent hover:bg-accent-light text-ink text-sm font-medium rounded-xl transition-all shadow-lg shadow-black/25 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : saved ? (
              <Check className="w-4 h-4" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saved ? 'Saved!' : 'Save Changes'}
          </button>
        </div>
      </motion.div>

      {/* Data Management */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card border border-line rounded-2xl p-6"
      >
        <h3 className="text-base font-semibold text-ink mb-1">Data Management</h3>
        <p className="text-sm text-faint mb-6">Manage your workspace data</p>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-fill/60 rounded-xl border border-line-faint">
            <div>
              <p className="text-sm font-medium text-ink-dim">Reset to demo data</p>
              <p className="text-xs text-faint mt-0.5">Restore all projects, tasks, and team members to default</p>
            </div>
            <button
              onClick={() => setShowResetConfirm(true)}
              className="px-4 py-2 text-sm font-medium text-gold bg-gold/10 hover:bg-gold/20 border border-gold/20 rounded-xl transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      </motion.div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm bg-card border border-line rounded-2xl p-6 shadow-2xl"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-gold" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-ink">Reset Data?</h3>
                <p className="text-xs text-faint">This cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-muted mb-6">
              All your changes will be lost and the demo data will be restored. Are you sure?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-muted hover:text-ink-dim transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-2 bg-rust/10 hover:bg-rust/20 text-rust-light text-sm font-medium rounded-xl border border-rust/20 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Reset Data
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
