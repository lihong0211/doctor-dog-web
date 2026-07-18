import { create } from 'zustand';

const TOKEN_KEY = 'en_desktop_token';
const USER_KEY = 'en_desktop_user';

// 后台管理只允许这一个账号操作，其他账号即使登录成功也视为无权限
export const AUTHORIZED_USERNAME = 'lihong';

export function isAuthorizedUser(user: EnDesktopUser | null): boolean {
  return user?.username === AUTHORIZED_USERNAME;
}

export type EnDesktopUser = {
  id: number;
  username: string | null;
  nickname: string | null;
};

type AuthState = {
  token: string | null;
  user: EnDesktopUser | null;
  login(token: string, user: EnDesktopUser): void;
  logout(): void;
};

export const useEnDesktopAuth = create<AuthState>((set) => ({
  token: localStorage.getItem(TOKEN_KEY),
  user: JSON.parse(localStorage.getItem(USER_KEY) || 'null'),
  login(token, user) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    set({ token, user });
  },
  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    set({ token: null, user: null });
  },
}));
