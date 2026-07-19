import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import EnDesktopAuthStatus from './AuthStatus';

const authState = {
  user: null,
  logout: vi.fn(),
};

vi.mock('./store', () => ({
  useEnDesktopAuth: () => authState,
  isAuthorizedUser: () => true,
}));

vi.mock('./Login', () => ({
  default: ({ open }: { open: boolean }) =>
    open ? <div>登录弹窗已打开</div> : null,
}));

describe('English header account control', () => {
  beforeEach(() => {
    authState.user = null;
  });

  it('uses an avatar icon without login copy and opens the existing login flow', () => {
    render(<EnDesktopAuthStatus />);

    const accountButton = screen.getByRole('button', { name: '用户账户' });
    expect(accountButton).toBeVisible();
    expect(screen.queryByText('登录')).not.toBeInTheDocument();

    fireEvent.click(accountButton);
    expect(screen.getByText('登录弹窗已打开')).toBeVisible();
  });
});
