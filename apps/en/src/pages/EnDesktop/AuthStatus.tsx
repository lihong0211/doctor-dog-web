import { useState } from 'react';
import { Button, Space, Tag } from 'antd';
import Login from './Login';
import { useEnDesktopAuth, isAuthorizedUser } from './store';

export default function EnDesktopAuthStatus() {
  const [loginOpen, setLoginOpen] = useState(false);
  const { user, logout } = useEnDesktopAuth();

  return (
    <Space style={{ marginRight: 8 }}>
      {user ? (
        <>
          <Tag color={isAuthorizedUser(user) ? 'blue' : 'red'}>
            {user.nickname || user.username}
            {isAuthorizedUser(user) ? '' : '（无权限）'}
          </Tag>
          <Button size="small" onClick={logout}>
            退出登录
          </Button>
        </>
      ) : (
        <Button size="small" type="primary" onClick={() => setLoginOpen(true)}>
          登录
        </Button>
      )}
      <Login open={loginOpen} onClose={() => setLoginOpen(false)} />
    </Space>
  );
}
