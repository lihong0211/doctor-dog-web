import { useState } from 'react';
import { Modal, Form, Input, Button, message } from 'antd';
import request from '../../request';
import { useEnDesktopAuth } from './store';

export default function EnDesktopLogin(props: { open: boolean; onClose(): void }) {
  const [loading, setLoading] = useState(false);
  const login = useEnDesktopAuth((s) => s.login);

  const onFinish = (values: { username: string; password: string }) => {
    setLoading(true);
    request
      .post('/en-desktop/auth/login', values)
      .then((res: any) => {
        login(res.token, res.user);
        message.success('登录成功');
        props.onClose();
      })
      .catch((e) => message.error(typeof e === 'string' ? e : '操作失败'))
      .finally(() => setLoading(false));
  };

  return (
    <Modal title="管理员登录" open={props.open} onCancel={props.onClose} footer={null}>
      <Form onFinish={onFinish} layout="vertical">
        <Form.Item name="username" label="用户名" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="password" label="密码" rules={[{ required: true }]}>
          <Input.Password />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            登录
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
}
