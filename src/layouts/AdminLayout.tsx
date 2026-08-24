import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuthStore } from '@/core/stores/auth.store';
import { useSidebarStore } from '@/core/stores/sidebar.store';
import { cn } from '@/lib/utils';

export default function AdminLayout() {
  const navigate = useNavigate();
  const { isAuthenticated, user, fetchProfile } = useAuthStore();
  const collapsed = useSidebarStore((s) => s.collapsed);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
      return;
    }
    if (!user) {
      fetchProfile();
    }
  }, [isAuthenticated, user, fetchProfile, navigate]);

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div
        className={cn(
          'transition-all duration-300',
          collapsed ? 'ml-[72px]' : 'ml-[260px]',
        )}
      >
        <Header />
        <main className="pt-16 min-h-screen">
          <div className="p-6">
            <Outlet />
          </div>
        </main>
        {/* Footer */}
        <footer className="border-t border-gray-200 bg-white px-6 py-3 text-xs text-gray-400 flex items-center justify-between">
          <span>BRIQUES.STORE Administration v1.0</span>
          <span>Support : support@briques.store</span>
        </footer>
      </div>
    </div>
  );
}
