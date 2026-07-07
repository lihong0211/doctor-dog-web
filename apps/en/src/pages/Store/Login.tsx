import { useState } from 'react';
import { Button, Form, Input, Card, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import request from '../../request';
import { STORE_API } from '../../request/storeApi';

export default function StoreLogin() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = (values: { userName: string; password: string }) => {
    setLoading(true);
    request
      .post(
        `${STORE_API}/api/user/login`,
        { userName: values.userName, password: values.password },
        { withCredentials: true }
      )
      .then(() => {
        message.success('登录成功');
        navigate('/store');
      })
      .catch((msg: string) => {
        message.error(msg || '登录失败');
      })
      .finally(() => setLoading(false));
  };

  return (
    <Card title="登录" style={{ maxWidth: 400, margin: '0 auto' }}>
      <Form onFinish={onFinish} layout="vertical">
        <Form.Item name="userName" label="用户名" rules={[{ required: true }]}>
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
    </Card>
  );
}
