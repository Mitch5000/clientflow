import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Calendar,
  DollarSign,
  Users,
  Trash2,
  Edit3,
  X,
  Check,
  ArrowUpRight,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { Project } from '../types';
import { format, parseISO } from 'date-fns';

const statusOptions = ['active', 'completed', 'on-hold', 'cancelled'] as const;
const statusLabels: Record<string, string> = {
  active: 'Active',
  completed: 'Completed',
  'on-hold': 'On Hold',
  cancelled: 'Cancelled',
};
const statusBadgeStyles: Record<string, string> = {
  active: 'bg-plum/10 text-plum-light-light border-accent/20',
  completed: 'bg-moss/10 text-moss-light border-moss/20',
  'on-hold': 'bg-gold/10 text-gold border-gold/20',
  cancelled: 'bg-rust/10 text-rust-light border-rust/20',
};

export default function Projects() {
  const { data, addProject, updateProject, deleteProject } = useData();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  useEffect(() => {
    function handleClickOutside() {
      setMenuOpen(null);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [form, setForm] = useState({
    name: '',
    description: '',
    client: '',
    budget: '',
    startDate: '',
    endDate: '',
    status: 'active' as 'active' | 'completed' | 'on-hold' | 'cancelled',
    color: '#4f4665',
  });

  const filteredProjects = data.projects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.client.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const openCreate = () => {
    setEditingProject(null);
    setForm({ name: '', description: '', client: '', budget: '', startDate: '', endDate: '', status: 'active', color: '#4f4665' });
    setShowModal(true);
  };

  const openEdit = (project: Project) => {
    setEditingProject(project);
    setForm({
      name: project.name,
      description: project.description,
      client: project.client,
      budget: project.budget.toString(),
      startDate: project.startDate,
      endDate: project.endDate,
      status: project.status,
      color: project.color,
    });
    setMenuOpen(null);
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const projectData = {
      name: form.name,
      description: form.description,
      client: form.client,
      budget: Number(form.budget) || 0,
      startDate: form.startDate,
      endDate: form.endDate,
      status: form.status,
      color: form.color,
      progress: editingProject ? editingProject.progress : 0,
      members: editingProject ? editingProject.members : [],
    };

    if (editingProject) {
      updateProject(editingProject.id, projectData);
    } else {
      const newProject: Project = {
        ...projectData,
        id: `p${Date.now()}`,
        createdAt: new Date().toISOString().split('T')[0],
        members: [],
      };
      addProject(newProject);
    }
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    deleteProject(id);
    setMenuOpen(null);
  };

  const getMemberCount = (project: Project) => {
    return project.members.length;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-ink">Projects</h2>
          <p className="text-sm text-faint mt-0.5">Manage and track all your projects</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-accent hover:bg-accent-light text-ink text-sm font-medium rounded-xl transition-all shadow-lg shadow-black/25"
        >
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-faint" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search projects..."
            className="w-full pl-10 pr-4 py-2.5 bg-fill border border-line rounded-xl text-sm text-ink-dim placeholder-faint outline-none focus:border-plum/40 transition-colors"
          />
        </div>
        <div className="flex items-center gap-2 bg-fill border border-line rounded-xl px-3 py-2.5">
          <Filter className="w-4 h-4 text-faint" />
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="bg-transparent text-sm text-muted outline-none cursor-pointer"
          >
            <option value="all" className="bg-card">All Status</option>
            {statusOptions.map(s => (
              <option key={s} value={s} className="bg-card">{statusLabels[s]}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredProjects.map((project, index) => (
            <motion.div
              key={project.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, delay: index * 0.03 }}
              className="bg-card border border-line rounded-2xl p-5 hover:border-line-strong transition-colors group relative"
            >
              {/* Menu */}
              <div className="absolute top-4 right-4">
                <button
                  onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === project.id ? null : project.id); }}
                  className="p-1.5 rounded-lg hover:bg-fill-strong text-faint transition-colors"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
                <AnimatePresence>
                  {menuOpen === project.id && (
                    <motion.div
                      initial={{ opacity: 0, y: -4, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -4, scale: 0.95 }}
                      className="absolute right-0 top-full mt-1 w-40 bg-raised border border-line rounded-xl shadow-xl shadow-black/50 overflow-hidden z-20"
                    >
                      <button
                        onClick={() => openEdit(project)}
                        className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-muted hover:bg-fill transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(project.id)}
                        className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-rust-light hover:bg-rust/10 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Color bar */}
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${project.color}20` }}>
                  <ArrowUpRight className="w-5 h-5" style={{ color: project.color }} />
                </div>
                <div className="min-w-0 pr-8">
                  <h3 className="text-sm font-semibold text-ink truncate">{project.name}</h3>
                  <p className="text-xs text-faint truncate mt-0.5">{project.client}</p>
                </div>
              </div>

              <p className="text-sm text-muted line-clamp-2 mb-4 min-h-[40px]">{project.description}</p>

              {/* Progress */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-faint">Progress</span>
                  <span className="text-xs font-medium text-muted">{project.progress}%</span>
                </div>
                <div className="h-1.5 bg-fill-strong rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${project.progress}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' as const }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: project.color }}
                  />
                </div>
              </div>

              {/* Meta */}
              <div className="flex items-center justify-between pt-4 border-t border-line-faint">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-xs text-faint">
                    <Calendar className="w-3.5 h-3.5" />
                    {format(parseISO(project.endDate), 'MMM d')}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-faint">
                    <DollarSign className="w-3.5 h-3.5" />
                    ${(project.budget / 1000).toFixed(0)}k
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-faint" />
                  <span className="text-xs text-faint">{getMemberCount(project)}</span>
                </div>
              </div>

              {/* Status badge */}
              <div className="mt-3">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-medium border ${statusBadgeStyles[project.status]}`}>
                  {statusLabels[project.status]}
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredProjects.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-fill flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-ghost" />
          </div>
          <p className="text-muted font-medium">No projects found</p>
          <p className="text-sm text-ghost mt-1">Try adjusting your search or filters</p>
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-lg bg-card border border-line rounded-2xl p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-ink">
                  {editingProject ? 'Edit Project' : 'New Project'}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1.5 rounded-lg hover:bg-fill-strong text-faint transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-muted mb-1.5">Project name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    required
                    className="w-full px-4 py-2.5 bg-fill border border-line rounded-xl text-sm text-ink-dim outline-none focus:border-plum/40 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted mb-1.5">Description</label>
                  <textarea
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2.5 bg-fill border border-line rounded-xl text-sm text-ink-dim outline-none focus:border-plum/40 transition-colors resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-muted mb-1.5">Client</label>
                    <input
                      type="text"
                      value={form.client}
                      onChange={e => setForm({ ...form, client: e.target.value })}
                      required
                      className="w-full px-4 py-2.5 bg-fill border border-line rounded-xl text-sm text-ink-dim outline-none focus:border-plum/40 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted mb-1.5">Budget ($)</label>
                    <input
                      type="number"
                      value={form.budget}
                      onChange={e => setForm({ ...form, budget: e.target.value })}
                      required
                      className="w-full px-4 py-2.5 bg-fill border border-line rounded-xl text-sm text-ink-dim outline-none focus:border-plum/40 transition-colors"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-muted mb-1.5">Start date</label>
                    <input
                      type="date"
                      value={form.startDate}
                      onChange={e => setForm({ ...form, startDate: e.target.value })}
                      required
                      className="w-full px-4 py-2.5 bg-fill border border-line rounded-xl text-sm text-ink-dim outline-none focus:border-plum/40 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted mb-1.5">End date</label>
                    <input
                      type="date"
                      value={form.endDate}
                      onChange={e => setForm({ ...form, endDate: e.target.value })}
                      required
                      className="w-full px-4 py-2.5 bg-fill border border-line rounded-xl text-sm text-ink-dim outline-none focus:border-plum/40 transition-colors"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-muted mb-1.5">Status</label>
                    <select
                      value={form.status}
                      onChange={e => setForm({ ...form, status: e.target.value as typeof form.status })}
                      className="w-full px-4 py-2.5 bg-fill border border-line rounded-xl text-sm text-ink-dim outline-none focus:border-plum/40 transition-colors"
                    >
                      {statusOptions.map(s => (
                        <option key={s} value={s}>{statusLabels[s]}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted mb-1.5">Color</label>
                    <div className="flex items-center gap-2">
                      {['#4f4665', '#7d6f9c', '#8a6a3b', '#c9a35a', '#3f6b58', '#6f9c7e', '#7a4a68', '#c0705c'].map(color => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setForm({ ...form, color })}
                          className={`w-8 h-8 rounded-lg transition-all ${form.color === color ? 'ring-2 ring-white/30 scale-110' : 'hover:scale-105'}`}
                          style={{ backgroundColor: color }}
                        >
                          {form.color === color && <Check className="w-4 h-4 text-ink mx-auto" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2.5 text-sm font-medium text-muted hover:text-ink-dim transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-accent hover:bg-accent-light text-ink text-sm font-medium rounded-xl transition-all shadow-lg shadow-black/25"
                  >
                    {editingProject ? 'Save Changes' : 'Create Project'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
