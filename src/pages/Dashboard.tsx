import { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FolderKanban,
  CheckSquare,
  Users,
  TrendingUp,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Calendar,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { relativeTime } from '../utils/relativetime';
import UserAvatar from '../components/UserAvatar';

const taskStatusColors: Record<string, string> = {
  todo: '#514a5c',
  'in-progress': '#7d6f9c',
  review: '#c9a35a',
  done: '#6f9c7e',
};

const priorityColors: Record<string, string> = {
  low: '#665f70',
  medium: '#c9a35a',
  high: '#c08a6e',
  urgent: '#c0705c',
};

function useCountUp(target: number, duration = 900) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let start: number | null = null;
    let raf = 0;
    const step = (ts: number) => {
      if (start === null) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      setValue(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

function CountUp({ value }: { value: string | number }) {
  const num = typeof value === 'string' ? parseInt(value, 10) : value;
  const suffix = typeof value === 'string' ? value.replace(/[0-9]/g, '') : '';
  const v = useCountUp(num);
  return <>{v}{suffix}</>;
}

export default function Dashboard() {
  const { data } = useData();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 550);
    return () => clearTimeout(t);
  }, []);

  const stats = useMemo(() => {
    const activeProjects = data.projects.filter(p => p.status === 'active').length;
    const completedProjects = data.projects.filter(p => p.status === 'completed').length;
    const totalTasks = data.tasks.length;
    const completedTasks = data.tasks.filter(t => t.status === 'done').length;
    const teamSize = data.teamMembers.length;
    const totalBudget = data.projects.reduce((sum, p) => sum + p.budget, 0);

    return {
      activeProjects,
      completedProjects,
      totalTasks,
      completedTasks,
      teamSize,
      totalBudget,
      taskCompletionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    };
  }, [data]);

  // Honest deltas - derived from real dates in the data, not invented percentages.
  const statFacts = useMemo(() => {
    const now = Date.now();
    const day = 86400000;
    const doneAt = (t: { status: string; dueDate: string }) =>
      t.status === 'done' ? new Date(t.dueDate).getTime() : NaN;

    const launched = data.projects.filter(p => now - new Date(p.createdAt).getTime() < 30 * day).length;
    const doneThisWeek = data.tasks.filter(t => !isNaN(doneAt(t)) && now - doneAt(t) < 7 * day).length;
    const donePrevWeek = data.tasks.filter(t => !isNaN(doneAt(t)) && now - doneAt(t) >= 7 * day && now - doneAt(t) < 14 * day).length;
    const lastJoined = data.teamMembers.reduce((m, x) => {
      const t = new Date(x.joinedAt).getTime();
      return t > m ? t : m;
    }, 0);
    const joinIsRecent = lastJoined > 0 && now - lastJoined < 30 * day;
    const rateDelta = doneThisWeek - donePrevWeek;

    return { launched, doneThisWeek, joinIsRecent, rateDelta };
  }, [data]);

  const statCards = [
    { label: 'Active Projects', value: stats.activeProjects, icon: FolderKanban, change: `${statFacts.launched} started this month`, up: true, tint: '#4f4665' },
    { label: 'Total Tasks', value: stats.totalTasks, icon: CheckSquare, change: `${statFacts.doneThisWeek} done this week`, up: true, tint: '#6f9c7e' },
    { label: 'Team Members', value: stats.teamSize, icon: Users, change: statFacts.joinIsRecent ? '+1 this month' : 'no new joins', up: statFacts.joinIsRecent, tint: '#8a6a3b' },
    { label: 'Completion Rate', value: `${stats.taskCompletionRate}%`, icon: TrendingUp, change: `${statFacts.rateDelta >= 0 ? '+' : ''}${statFacts.rateDelta} vs last week`, up: statFacts.rateDelta >= 0, tint: '#c0705c' },
  ];

  const taskStatusData = useMemo(() => {
    const counts: Record<string, number> = {};
    data.tasks.forEach(t => {
      counts[t.status] = (counts[t.status] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({
      name: name === 'todo' ? 'To Do' : name === 'in-progress' ? 'In Progress' : name === 'review' ? 'Review' : 'Done',
      value,
      color: taskStatusColors[name] || '#837c8e',
    }));
  }, [data.tasks]);

  const weeklyProgress = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const dayIndex = (iso: string) => (new Date(iso).getDay() + 6) % 7;
    return days.map((name, i) => ({
      name,
      completed: data.tasks.filter(t => t.status === 'done' && dayIndex(t.dueDate) === i).length,
      created: data.tasks.filter(t => dayIndex(t.createdAt) === i).length,
    }));
  }, [data.tasks]);

  const upcomingTasks = useMemo(() => {
    return data.tasks
      .filter(t => t.status !== 'done')
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 5);
  }, [data.tasks]);

  const recentActivity = useMemo(() => {
    return [...data.activities]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 6);
  }, [data.activities]);

  const getMemberName = (id: string) => {
    return data.teamMembers.find(m => m.id === id)?.name || 'Unknown';
  };

  const getProjectName = (id: string) => {
    return data.projects.find(p => p.id === id)?.name || 'Unknown';
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
  };

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-ink">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user?.name.split(' ')[0]}
          </h2>
          <p className="text-muted text-sm mt-1">Here's what's happening with your projects today.</p>
        </div>
        <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-fill border border-line rounded-xl text-sm text-muted">
          <Calendar className="w-4 h-4" />
          {format(new Date(), 'EEEE, MMMM d, yyyy')}
        </div>
      </div>

      {/* Stats Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {statCards.map((stat) => (
          <motion.div
            key={stat.label}
            variants={itemVariants}
            className="bg-card border border-line rounded-2xl p-5 hover:border-line-strong transition-colors group"
          >
            {loading ? (
              <div className="animate-pulse">
                <div className="w-10 h-10 rounded-xl bg-fill-strong mb-4" />
                <div className="h-7 w-16 rounded-lg bg-fill-strong mb-2" />
                <div className="h-3.5 w-24 rounded bg-fill" />
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center border border-line" style={{ backgroundColor: `${stat.tint}1f` }}>
                    <stat.icon className="w-5 h-5" style={{ color: stat.tint }} />
                  </div>
                  <div className={`flex items-center gap-1 text-xs font-medium ${stat.up ? 'text-moss-light' : 'text-faint'}`}>
                    {stat.up ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                    {stat.change}
                  </div>
                </div>
                <p className="text-2xl font-bold text-ink"><CountUp value={stat.value} /></p>
                <p className="text-sm text-faint mt-0.5">{stat.label}</p>
              </>
            )}
          </motion.div>
        ))}
      </motion.div>

      {/* Charts Row */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-card border border-line rounded-2xl p-6">
            <div className="h-4 w-40 rounded bg-fill-strong mb-2 animate-pulse" />
            <div className="h-3 w-56 rounded bg-fill mb-6 animate-pulse" />
            <div className="h-[260px] rounded-xl bg-fill/60 animate-pulse" />
          </div>
          <div className="bg-card border border-line rounded-2xl p-6">
            <div className="h-4 w-28 rounded bg-fill-strong mb-2 animate-pulse" />
            <div className="h-3 w-44 rounded bg-fill mb-6 animate-pulse" />
            <div className="h-[200px] rounded-xl bg-fill/60 animate-pulse" />
          </div>
        </div>
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Progress */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 bg-card border border-line rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-semibold text-ink">Weekly Activity</h3>
              <p className="text-sm text-faint mt-0.5">Tasks completed vs created this week</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-accent" />
                <span className="text-xs text-muted">Completed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-fill-strong" />
                <span className="text-xs text-muted">Created</span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={weeklyProgress} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(237,233,227,0.05)" vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#837c8e', fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#837c8e', fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#221e2c',
                  border: '1px solid #3d3749',
                  borderRadius: '12px',
                  color: '#ede9e3',
                  fontSize: '12px',
                }}
                cursor={{ fill: 'rgba(237,233,227,0.03)' }}
              />
              <Bar dataKey="completed" fill="#6a6186" radius={[6, 6, 0, 0]} maxBarSize={32} />
              <Bar dataKey="created" fill="rgba(255,255,255,0.1)" radius={[6, 6, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Task Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card border border-line rounded-2xl p-6"
        >
          <h3 className="text-base font-semibold text-ink mb-1">Task Status</h3>
          <p className="text-sm text-faint mb-6">Distribution by current status</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={taskStatusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={85}
                paddingAngle={4}
                dataKey="value"
                stroke="none"
              >
                {taskStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#221e2c',
                  border: '1px solid #3d3749',
                  borderRadius: '12px',
                  color: '#ede9e3',
                  fontSize: '12px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-3 mt-4">
            {taskStatusData.map(item => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-xs text-muted">{item.name}</span>
                <span className="text-xs text-muted ml-auto font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
      )}

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Tasks */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-card border border-line rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-semibold text-ink">Upcoming Tasks</h3>
              <p className="text-sm text-faint mt-0.5">Tasks due soon</p>
            </div>
            <div className="p-2 rounded-xl bg-fill">
              <Clock className="w-4 h-4 text-muted" />
            </div>
          </div>
          <div className="space-y-3">
            {upcomingTasks.length === 0 && (
              <div className="py-10 text-center">
                <p className="text-sm text-faint">All clear - nothing due soon.</p>
                <p className="text-xs text-ghost mt-1">Enjoy it while it lasts.</p>
              </div>
            )}
            {upcomingTasks.map((task, i) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.05 }}
                className="flex items-center gap-4 p-3 rounded-xl bg-fill/60 hover:bg-fill transition-colors group"
              >
                <div className={`w-2 h-2 rounded-full flex-shrink-0`} style={{ backgroundColor: priorityColors[task.priority] }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink-dim truncate group-hover:text-ink transition-colors">{task.title}</p>
                  <p className="text-xs text-faint truncate">{getProjectName(task.projectId)}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-muted">{format(parseISO(task.dueDate), 'MMM d')}</p>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium mt-1 ${
                    task.priority === 'urgent' ? 'bg-rust/10 text-rust-light' :
                    task.priority === 'high' ? 'bg-clay/10 text-clay-light' :
                    task.priority === 'medium' ? 'bg-gold/10 text-gold' :
                    'bg-fill text-muted'
                  }`}>
                    {task.priority}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-card border border-line rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-semibold text-ink">Recent Activity</h3>
              <p className="text-sm text-faint mt-0.5">Latest updates across your workspace</p>
            </div>
            <div className="p-2 rounded-xl bg-fill">
              <Activity className="w-4 h-4 text-muted" />
            </div>
          </div>
          <div className="space-y-3">
            {recentActivity.length === 0 && (
              <div className="py-10 text-center">
                <p className="text-sm text-faint">Nothing here. Suspiciously quiet...</p>
                <p className="text-xs text-ghost mt-1">Move a task and it will show up.</p>
              </div>
            )}
            {recentActivity.map((activity, i) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + i * 0.05 }}
                className="flex items-start gap-3 p-3 rounded-xl bg-fill/60 hover:bg-fill transition-colors"
              >
                <UserAvatar memberId={activity.userId} size={8} className="mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-muted">
                    <span className="font-medium text-ink-dim">{getMemberName(activity.userId)}</span>{' '}
                    {activity.action}{' '}
                    <span className="font-medium text-plum-light">{activity.targetName}</span>
                  </p>
                  <p className="text-xs text-faint mt-0.5">
                    {relativeTime(activity.timestamp)}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
