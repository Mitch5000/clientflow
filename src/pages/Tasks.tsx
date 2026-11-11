import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Trash2,
  Edit3,
  X,
  Calendar,
  Flag,
  FolderKanban,
  Pin,
  MessageSquare,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Task, TaskComment } from '../types';
import UserAvatar from '../components/UserAvatar';
import { relativeTime } from '../utils/relativetime';
import { format, parseISO } from 'date-fns';
import { toast } from '../utils/toast';
import { confetti } from '../utils/confetti';

const statusOptions = ['todo', 'in-progress', 'review', 'done'] as const;
const statusLabels: Record<string, string> = {
  todo: 'To Do',
  'in-progress': 'In Progress',
  review: 'Review',
  done: 'Done',
};
const statusBadgeStyles: Record<string, string> = {
  todo: 'bg-fill text-muted border-line',
  'in-progress': 'bg-plum/10 text-plum-light-light border-accent/20',
  review: 'bg-gold/10 text-gold border-gold/20',
  done: 'bg-moss/10 text-moss-light border-moss/20',
};
const priorityColors: Record<string, string> = {
  low: '#665f70',
  medium: '#c9a35a',
  high: '#c08a6e',
  urgent: '#c0705c',
};

export default function Tasks() {
  const { data, addTask, updateTask, deleteTask, addActivity } = useData();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterProject, setFilterProject] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [formDirty, setFormDirty] = useState(false);
  const [overCol, setOverCol] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside() {
      setMenuOpen(null);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // palette jump-in: prefill search when command palette selects a task
  useEffect(() => {
    const on = (e: Event) => {
      setSearch((e as CustomEvent).detail as string);
    };
    window.addEventListener('cf-task-search', on);
    return () => window.removeEventListener('cf-task-search', on);
  }, []);

  // keyboard shortcuts: n = new task, / = focus search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
      if (showModal) return;
      if (e.key === 'n') {
        e.preventDefault();
        openCreate();
      }
      if (e.key === '/') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const [form, setForm] = useState({
    title: '',
    description: '',
    projectId: '',
    assigneeId: '',
    status: 'todo' as 'todo' | 'in-progress' | 'review' | 'done',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    dueDate: '',
  });

  const filteredTasks = data.tasks.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'all' || t.status === filterStatus;
    const matchesProject = filterProject === 'all' || t.projectId === filterProject;
    return matchesSearch && matchesStatus && matchesProject;
  });

  const logActivity = (action: string, targetName: string) => {
    addActivity({
      id: `a${Date.now()}`,
      type: 'task',
      action,
      userId: user?.id || 'u1',
      targetName,
      timestamp: new Date().toISOString(),
    });
  };

  const openCreate = () => {
    setEditingTask(null);
    setForm({ title: '', description: '', projectId: data.projects[0]?.id || '', assigneeId: data.teamMembers[0]?.id || '', status: 'todo', priority: 'medium', dueDate: '' });
    setCommentText('');
    setFormDirty(false);
    setShowModal(true);
  };

  const openEdit = (task: Task) => {
    setEditingTask(task);
    setForm({
      title: task.title,
      description: task.description,
      projectId: task.projectId,
      assigneeId: task.assigneeId,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate,
    });
    setMenuOpen(null);
    setCommentText('');
    setFormDirty(false);
    setShowModal(true);
  };

  const handleAddComment = () => {
    if (!editingTask || !commentText.trim()) return;
    const c: TaskComment = {
      id: `c${Date.now()}`,
      userId: user?.id || 'u1',
      text: commentText.trim(),
      createdAt: new Date().toISOString(),
    };
    updateTask(editingTask.id, { comments: [...(editingTask.comments || []), c] });
    setEditingTask({ ...editingTask, comments: [...(editingTask.comments || []), c] });
    addActivity({
      id: `a${Date.now()}`,
      type: 'comment',
      action: 'commented on',
      userId: user?.id || 'u1',
      targetName: editingTask.title,
      timestamp: new Date().toISOString(),
    });
    setCommentText('');
    toast('Comment added');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const taskData = {
      title: form.title,
      description: form.description,
      projectId: form.projectId,
      assigneeId: form.assigneeId,
      status: form.status,
      priority: form.priority,
      dueDate: form.dueDate,
    };

    if (editingTask) {
      updateTask(editingTask.id, taskData);
      toast(`Updated "${form.title}"`);
      if (form.status === 'done' && editingTask.status !== 'done') {
        confetti();
        logActivity('completed', form.title);
      }
    } else {
      const newTask: Task = {
        ...taskData,
        id: `t${Date.now()}`,
        createdAt: new Date().toISOString().split('T')[0],
      };
      addTask(newTask);
      toast(`Added "${form.title}" to ${statusLabels[form.status]}`);
      logActivity('created', form.title);
    }
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    const task = data.tasks.find(t => t.id === id);
    deleteTask(id);
    setMenuOpen(null);
    if (task) {
      toast(`Deleted "${task.title}"`);
      logActivity('deleted', task.title);
    }
  };

  const handleDrop = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    const task = data.tasks.find(t => t.id === id);
    setOverCol(null);
    setDragId(null);
    if (!task || task.status === status) return;
    updateTask(id, { status: status as Task['status'] });
    toast(`Moved "${task.title}" to ${statusLabels[status]}`);
    if (status === 'done') {
      confetti();
      logActivity('completed', task.title);
    } else {
      logActivity(`moved to ${statusLabels[status].toLowerCase()}`, task.title);
    }
  };

  const getProjectName = (id: string) => data.projects.find(p => p.id === id)?.name || 'Unknown';
  const getAssignee = (id: string) => data.teamMembers.find(m => m.id === id);

  const columns = statusOptions.map(status => ({
    status,
    label: statusLabels[status],
    tasks: filteredTasks
      .filter(t => t.status === status)
      .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0)),
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-ink">Tasks</h2>
          <p className="text-sm text-faint mt-0.5">
            Drag cards between columns, press <kbd className="text-[10px] border border-line-strong rounded px-1">N</kbd> for a new task, <kbd className="text-[10px] border border-line-strong rounded px-1">/</kbd> to search
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-accent hover:bg-accent-light text-ink text-sm font-medium rounded-xl transition-all shadow-lg shadow-black/25"
        >
          <Plus className="w-4 h-4" />
          New Task
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-faint" />
          <input
            ref={searchRef}
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search tasks..."
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
        <div className="flex items-center gap-2 bg-fill border border-line rounded-xl px-3 py-2.5">
          <FolderKanban className="w-4 h-4 text-faint" />
          <select
            value={filterProject}
            onChange={e => setFilterProject(e.target.value)}
            className="bg-transparent text-sm text-muted outline-none cursor-pointer"
          >
            <option value="all" className="bg-card">All Projects</option>
            {data.projects.map(p => (
              <option key={p.id} value={p.id} className="bg-card">{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {columns.map(column => (
          <div
            key={column.status}
            onDragOver={e => { e.preventDefault(); setOverCol(column.status); }}
            onDragLeave={() => setOverCol(c => (c === column.status ? null : c))}
            onDrop={e => handleDrop(e, column.status)}
            className={`bg-card/50 border rounded-2xl p-4 transition-colors ${
              overCol === column.status ? 'border-accent/50 bg-accent/[0.06]' : 'border-line-faint'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full`} style={{ backgroundColor: priorityColors[column.status === 'done' ? 'low' : column.status === 'in-progress' ? 'medium' : column.status === 'review' ? 'high' : 'low'] }} />
                <h3 className="text-sm font-semibold text-ink-dim">{column.label}</h3>
              </div>
              <span className="text-xs text-faint bg-fill px-2 py-0.5 rounded-full">{column.tasks.length}</span>
            </div>

            <div className="space-y-3 min-h-[80px]">
              <AnimatePresence mode="popLayout">
                {column.tasks.map((task, index) => (
                  <motion.div
                    key={task.id}
                    layout
                    draggable
                    onDragStart={(e: any) => {
                      e.dataTransfer?.setData('text/plain', task.id);
                      setDragId(task.id);
                    }}
                    onDragEnd={() => { setDragId(null); setOverCol(null); }}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2, delay: index * 0.03 }}
                    className={`bg-raised border rounded-xl p-4 hover:border-line-strong transition-colors group relative cursor-grab active:cursor-grabbing ${
                      task.pinned ? 'border-gold-deep/30 bg-gold-deep/[0.04]' : 'border-line'
                    } ${dragId === task.id ? 'opacity-40' : ''}`}
                  >
                    {/* Menu */}
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === task.id ? null : task.id); }}
                        className="p-1 rounded-lg hover:bg-fill-strong text-faint transition-colors"
                      >
                        <MoreHorizontal className="w-3.5 h-3.5" />
                      </button>
                      <AnimatePresence>
                        {menuOpen === task.id && (
                          <motion.div
                            initial={{ opacity: 0, y: -4, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -4, scale: 0.95 }}
                            className="absolute right-0 top-full mt-1 w-36 bg-raised border border-line rounded-xl shadow-xl shadow-black/50 overflow-hidden z-20"
                          >
                            <button
                              onClick={() => {
                                updateTask(task.id, { pinned: !task.pinned });
                                setMenuOpen(null);
                                toast(task.pinned ? `Unpinned "${task.title}"` : `Pinned "${task.title}" to the top`);
                              }}
                              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-muted hover:bg-fill transition-colors"
                            >
                              <Pin className="w-3.5 h-3.5" />
                              {task.pinned ? 'Unpin' : 'Pin to top'}
                            </button>
                            <button
                              onClick={() => openEdit(task)}
                              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-muted hover:bg-fill transition-colors"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(task.id)}
                              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-rust-light hover:bg-rust/10 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Delete
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="pr-6">
                      <h4 className="text-sm font-medium text-ink-dim mb-1 flex items-start gap-1.5">
                        {task.pinned && <Pin className="w-3 h-3 text-gold flex-shrink-0 mt-1" aria-label="Pinned" />}
                        <span>{task.title}</span>
                      </h4>
                      <p className="text-xs text-faint line-clamp-2 mb-3">{task.description}</p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium border ${statusBadgeStyles[task.status]}`}>
                          {statusLabels[task.status]}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] text-faint">
                          <Flag className="w-3 h-3" style={{ color: priorityColors[task.priority] }} />
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-[10px] text-faint">
                          <Calendar className="w-3 h-3" />
                          {format(parseISO(task.dueDate), 'MMM d')}
                        </div>
                        {getAssignee(task.assigneeId) && (
                          <UserAvatar memberId={task.assigneeId} size={5} />
                        )}
                      </div>
                    </div>

                    <div className="mt-2.5 pt-2.5 border-t border-line-faint">
                      <div className="flex items-center gap-1.5 text-[10px] text-faint">
                        <FolderKanban className="w-3 h-3" />
                        {getProjectName(task.projectId)}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {column.tasks.length === 0 && (
                <div className="border border-dashed border-line rounded-xl p-4 text-center text-xs text-ghost">
                  Drop a task here
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

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
                  {editingTask ? 'Edit Task' : 'New Task'}
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
                  <label className="block text-sm font-medium text-muted mb-1.5">Title</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={e => { setForm({ ...form, title: e.target.value }); setFormDirty(true); }}
                    required
                    className="w-full px-4 py-2.5 bg-fill border border-line rounded-xl text-sm text-ink-dim outline-none focus:border-plum/40 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted mb-1.5">Description</label>
                  <textarea
                    value={form.description}
                    onChange={e => { setForm({ ...form, description: e.target.value }); setFormDirty(true); }}
                    rows={3}
                    className="w-full px-4 py-2.5 bg-fill border border-line rounded-xl text-sm text-ink-dim outline-none focus:border-plum/40 transition-colors resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-muted mb-1.5">Project</label>
                    <select
                      value={form.projectId}
                      onChange={e => { setForm({ ...form, projectId: e.target.value }); setFormDirty(true); }}
                      required
                      className="w-full px-4 py-2.5 bg-fill border border-line rounded-xl text-sm text-ink-dim outline-none focus:border-plum/40 transition-colors"
                    >
                      {data.projects.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted mb-1.5">Assignee</label>
                    <select
                      value={form.assigneeId}
                      onChange={e => { setForm({ ...form, assigneeId: e.target.value }); setFormDirty(true); }}
                      required
                      className="w-full px-4 py-2.5 bg-fill border border-line rounded-xl text-sm text-ink-dim outline-none focus:border-plum/40 transition-colors"
                    >
                      {data.teamMembers.map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-muted mb-1.5">Status</label>
                    <select
                      value={form.status}
                      onChange={e => { setForm({ ...form, status: e.target.value as typeof form.status }); setFormDirty(true); }}
                      className="w-full px-4 py-2.5 bg-fill border border-line rounded-xl text-sm text-ink-dim outline-none focus:border-plum/40 transition-colors"
                    >
                      {statusOptions.map(s => (
                        <option key={s} value={s}>{statusLabels[s]}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted mb-1.5">Priority</label>
                    <select
                      value={form.priority}
                      onChange={e => { setForm({ ...form, priority: e.target.value as typeof form.priority }); setFormDirty(true); }}
                      className="w-full px-4 py-2.5 bg-fill border border-line rounded-xl text-sm text-ink-dim outline-none focus:border-plum/40 transition-colors"
                    >
                      {(['low', 'medium', 'high', 'urgent'] as const).map(p => (
                        <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted mb-1.5">Due date</label>
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={e => { setForm({ ...form, dueDate: e.target.value }); setFormDirty(true); }}
                    required
                    className="w-full px-4 py-2.5 bg-fill border border-line rounded-xl text-sm text-ink-dim outline-none focus:border-plum/40 transition-colors"
                  />
                </div>
                {editingTask && (
                  <div className="pt-1">
                    <div className="flex items-center gap-2 mb-3">
                      <MessageSquare className="w-3.5 h-3.5 text-faint" />
                      <p className="text-xs font-medium text-muted">
                        Comments {editingTask.comments && editingTask.comments.length > 0 ? `(${editingTask.comments.length})` : ''}
                      </p>
                    </div>
                    {(editingTask.comments && editingTask.comments.length > 0) ? (
                      <div className="space-y-2 mb-3 max-h-36 overflow-y-auto pr-1">
                        {editingTask.comments.map(c => (
                          <div key={c.id} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-fill">
                            <UserAvatar memberId={c.userId} size={6} />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-muted leading-relaxed">{c.text}</p>
                              <p className="text-[10px] text-ghost mt-1">
                                {data.teamMembers.find(m => m.id === c.userId)?.name?.split(' ')[0] || 'Someone'} - {relativeTime(c.createdAt)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-ghost mb-3">No comments yet - start the thread.</p>
                    )}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={commentText}
                        onChange={e => setCommentText(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddComment(); } }}
                        placeholder="Leave a comment..."
                        className="flex-1 px-3 py-2 bg-fill border border-line rounded-lg text-xs text-ink-dim placeholder-ghost outline-none focus:border-plum/40 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={handleAddComment}
                        disabled={!commentText.trim()}
                        className="px-3 py-2 bg-accent/20 text-plum-light text-xs font-medium rounded-lg hover:bg-accent/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Send
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-4">
                  {editingTask && formDirty && (
                    <span className="mr-auto inline-flex items-center gap-1.5 text-[11px] text-gold/90">
                      <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
                      Unsaved changes
                    </span>
                  )}
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
                    {editingTask ? 'Save Changes' : 'Create Task'}
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
