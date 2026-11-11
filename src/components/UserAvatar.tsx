import { TeamMember } from '../types';
import { useData } from '../context/DataContext';

// Muted tints that sit inside the brand palette - not Tailwind defaults.
const TINTS = ['#4f4665', '#565068', '#8a6a3b', '#3f6b58', '#7a4a68', '#8a4a52', '#4a5568'];
// People set their own avatar shapes in real apps - keep it slightly uneven.
const SHAPES = ['rounded-full', 'rounded-[35%]', 'rounded-xl', 'rounded-lg', 'rounded-full'];

function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

// Tailwind only compiles complete literal class names - map sizes explicitly.
const DIMS: Record<number, string> = {
  5: 'w-5 h-5',
  6: 'w-6 h-6',
  8: 'w-8 h-8',
  9: 'w-9 h-9',
  10: 'w-10 h-10',
  16: 'w-16 h-16',
};
const TEXT: Record<number, string> = {
  5: 'text-[9px]',
  6: 'text-[10px]',
  8: 'text-xs',
  9: 'text-sm',
  10: 'text-sm',
  16: 'text-xl',
};
const EMOJI_TEXT: Record<number, string> = {
  5: 'text-xs',
  6: 'text-sm',
  8: 'text-sm',
  9: 'text-base',
  10: 'text-lg',
  16: 'text-3xl',
};

interface Props {
  memberId?: string;
  name?: string;
  email?: string;
  size?: 5 | 6 | 8 | 9 | 10 | 16;
  className?: string;
  rounded?: string; // override shape
}

export default function UserAvatar({ memberId, name, email, size = 8, className = '', rounded }: Props) {
  const { data } = useData();
  const member: TeamMember | undefined =
    data.teamMembers.find(m => m.id === memberId) ||
    (email ? data.teamMembers.find(m => m.email.toLowerCase() === email.toLowerCase()) : undefined);

  const label = name || member?.name || '?';
  const id = member?.id || email || label;
  const tint = TINTS[hash(id) % TINTS.length];
  const shape = rounded || SHAPES[hash(id + 's') % SHAPES.length];
  const base = `${shape} flex items-center justify-center flex-shrink-0 select-none ${className}`;
  const dims = DIMS[size];

  if (member?.emoji) {
    return (
      <div
        className={`${base} ${dims} border border-line ${EMOJI_TEXT[size]}`}
        style={{ backgroundColor: `${tint}33` }}
        title={label}
      >
        <span aria-hidden>{member.emoji}</span>
      </div>
    );
  }

  return (
    <div
      className={`${base} ${dims} font-semibold text-ink ${TEXT[size]}`}
      style={{ backgroundColor: tint }}
      title={label}
    >
      {label.charAt(0)}
    </div>
  );
}
