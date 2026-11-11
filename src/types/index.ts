export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'completed' | 'on-hold' | 'cancelled';
  progress: number;
  startDate: string;
  endDate: string;
  budget: number;
  client: string;
  color: string;
  members: string[];
  createdAt: string;
}

export interface TaskComment {
  id: string;
  userId: string;
  text: string;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  projectId: string;
  assigneeId: string;
  dueDate: string;
  createdAt: string;
  pinned?: boolean;
  comments?: TaskComment[];
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string;
  emoji?: string;
  department: string;
  status: 'active' | 'away' | 'offline';
  joinedAt: string;
}

export interface Activity {
  id: string;
  type: 'task' | 'project' | 'comment' | 'member';
  action: string;
  userId: string;
  targetName: string;
  timestamp: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

export interface AppData {
  users: User[];
  projects: Project[];
  tasks: Task[];
  teamMembers: TeamMember[];
  activities: Activity[];
}
