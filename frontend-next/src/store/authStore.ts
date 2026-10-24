'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Role = 'USER' | 'ADMIN' | null;

interface AuthState {
  token: string | null;
  currentUser: string | null;
  userRole: Role;
  userId: string | null;
  adminMode: boolean;

  // Actions
  setAuth: (data: { token: string; username: string; role: string; userId: string }) => void;
  setAdminMode: (admin: string) => void;
  logout: () => void;
  updateRole: (role: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      currentUser: null,
      userRole: null,
      userId: null,
      adminMode: false,

      setAuth: ({ token, username, role, userId }) =>
        set({
          token,
          currentUser: username,
          userRole: role as Role,
          userId,
          adminMode: role === 'ADMIN',
        }),

      setAdminMode: (admin) =>
        set({ adminMode: true, currentUser: admin }),

      logout: () =>
        set({
          token: null,
          currentUser: null,
          userRole: null,
          userId: null,
          adminMode: false,
        }),

      updateRole: (role) =>
        set({ userRole: role as Role }),
    }),
    {
      name: 'carriera-auth', // localStorage key
      // Sadece bu alanları persist et
      partialize: (state) => ({
        token: state.token,
        currentUser: state.currentUser,
        userRole: state.userRole,
        userId: state.userId,
        adminMode: state.adminMode,
      }),
    }
  )
);
