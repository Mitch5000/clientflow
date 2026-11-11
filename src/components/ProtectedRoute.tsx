import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from './Layout';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, initializing } = useAuth();

  // Live mode: wait for the Supabase session to resolve before deciding.
  // Demo mode: initializing is always false, so behaviour is unchanged.
  if (initializing) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
}
