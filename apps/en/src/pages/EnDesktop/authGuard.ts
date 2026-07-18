import { message } from 'antd';
import { useEnDesktopAuth, isAuthorizedUser } from './store';

// 列表查看不限制，只在真正写数据前拦一道：不是授权账号就提示并阻止提交
export function requireAuth(): boolean {
  const { user } = useEnDesktopAuth.getState();
  if (!isAuthorizedUser(user)) {
    message.warning('请用授权账号登录后再操作');
    return false;
  }
  return true;
}
