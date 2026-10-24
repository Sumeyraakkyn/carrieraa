import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

type Role = 'USER' | 'ADMIN' | 'ANY';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export function useAuthGuard(requiredRole: Role = 'ANY') {
  const router = useRouter();
  const logout = useAuthStore(s => s.logout);
  const updateRole = useAuthStore(s => s.updateRole);

  useEffect(() => {
    // Zustand persist gecikmesi yüzünden oluşan sorunu çözmek için doğrudan oku:
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');

    if (!token) {
      router.replace('/login');
      return;
    }

    fetch(`${API_URL}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) {
          localStorage.removeItem('token');
          localStorage.removeItem('currentUser');
          localStorage.removeItem('userRole');
          logout();
          router.replace('/login');
          return;
        }

        const data = await res.json();
        const serverRole: string = data.role;
        localStorage.setItem('userRole', serverRole);
        updateRole(serverRole);

        if (requiredRole === 'ADMIN' && serverRole !== 'ADMIN') {
          router.replace('/dashboard');
          return;
        }

        if (requiredRole === 'USER' && serverRole !== 'USER') {
          router.replace('/admin');
          return;
        }
      })
      .catch(() => {
        // Offline durumunda localStorage rolu ile yetin
        if (requiredRole === 'ADMIN' && role !== 'ADMIN') {
          router.replace('/dashboard');
        }
        if (requiredRole === 'USER' && role !== 'USER') {
          router.replace('/admin');
        }
      });
  }, [router, requiredRole, logout, updateRole]);
}
