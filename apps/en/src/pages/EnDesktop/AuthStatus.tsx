import { useState } from 'react';
import { Avatar, Button, Dropdown, Tooltip } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import Login from './Login';
import { useEnDesktopAuth, isAuthorizedUser } from './store';

export default function EnDesktopAuthStatus() {
  const [loginOpen, setLoginOpen] = useState(false);
  const { user, logout } = useEnDesktopAuth();
  const accountLabel = user?.nickname || user?.username || '用户账户';
  const avatar = (
    <Button
      type="text"
      shape="circle"
      className="en-header-account"
      aria-label="用户账户"
      onClick={user ? undefined : () => setLoginOpen(true)}
    >
      <Avatar size={30} icon={<UserOutlined />} />
    </Button>
  );

  return (
    <>
      {user ? (
        <Dropdown
          trigger={['click']}
          menu={{
            items: [
              {
                key: 'account',
                label: `${accountLabel}${isAuthorizedUser(user) ? '' : '（无权限）'}`,
                disabled: true,
              },
              { type: 'divider' },
              { key: 'logout', label: '退出登录', onClick: logout },
            ],
          }}
        >
          <Tooltip title={accountLabel}>{avatar}</Tooltip>
        </Dropdown>
      ) : (
        <Tooltip title="用户账户">{avatar}</Tooltip>
      )}
      <Login open={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  );
}
