import { motion } from 'framer-motion';
import {
  Mail,
  Briefcase,
  Shield,
  Search,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useState } from 'react';
import UserAvatar from '../components/UserAvatar';

const statusColors: Record<string, string> = {
  active: '#6f9c7e',
  away: '#c9a35a',
  offline: '#514a5c',
};

const departmentColors: Record<string, string> = {
  Product: 'bg-plum/10 text-plum-light-light border-accent/20',
  Design: 'bg-plum/10 text-plum-light border-plum/20',
  Engineering: 'bg-moss/10 text-moss-light border-moss/20',
};

export default function Team() {
  const { data } = useData();
  const [search, setSearch] = useState('');

  const filteredMembers = data.teamMembers.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.email.toLowerCase().includes(search.toLowerCase()) ||
    m.role.toLowerCase().includes(search.toLowerCase())
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.06 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-ink">Team</h2>
          <p className="text-sm text-faint mt-0.5">{data.teamMembers.length} members in your workspace</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-faint" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search team members..."
            className="w-full pl-10 pr-4 py-2.5 bg-fill border border-line rounded-xl text-sm text-ink-dim placeholder-faint outline-none focus:border-plum/40 transition-colors"
          />
        </div>
      </div>

      {/* Team Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
      >
        {filteredMembers.map((member) => (
          <motion.div
            key={member.id}
            variants={itemVariants}
            className="bg-card border border-line rounded-2xl p-5 hover:border-line-strong transition-colors group"
          >
            {/* Avatar & Status */}
            <div className="relative w-16 h-16 mx-auto mb-4">
              <UserAvatar memberId={member.id} size={16} className="rounded-2xl" />
              <div
                className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-card"
                style={{ backgroundColor: statusColors[member.status] }}
              />
            </div>

            {/* Info */}
            <div className="text-center mb-4">
              <h3 className="text-sm font-semibold text-ink">{member.name}</h3>
              <p className="text-xs text-faint mt-0.5">{member.role}</p>
            </div>

            {/* Department */}
            <div className="flex justify-center mb-4">
              <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-medium border ${departmentColors[member.department] || 'bg-fill text-muted border-line'}`}>
                {member.department}
              </span>
            </div>

            {/* Meta */}
            <div className="space-y-2.5 pt-4 border-t border-line-faint">
              <div className="flex items-center gap-2 text-xs text-muted">
                <Mail className="w-3.5 h-3.5 text-faint" />
                <span className="truncate">{member.email}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted">
                <Briefcase className="w-3.5 h-3.5 text-faint" />
                <span>{member.role}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted">
                <Shield className="w-3.5 h-3.5 text-faint" />
                <span className="capitalize">{member.status}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {filteredMembers.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-fill flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-ghost" />
          </div>
          <p className="text-muted font-medium">No members found</p>
          <p className="text-sm text-ghost mt-1">Try adjusting your search</p>
        </div>
      )}
    </div>
  );
}
