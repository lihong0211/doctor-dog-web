import { useState } from 'react';
import { Button, Form, Input, Card, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import request from '../../request';
import { STORE_API } from '../../request/storeApi';

export default function StoreRegister() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = (values: { nickName: string; userName: string; password: string }) => {
    setLoading(true);
    request
      .post(
        `${STORE_API}/api/user/register`,
        {
          nickName: values.nickName,
          userName: values.userName,
          password: values.password,
        },
        { withCredentials: true }
      )
      .then(() => {
        message.success('注册成功，请登录');
        navigate('/store/login');
      })
      .catch((msg: string) => {
        message.error(msg || '注册失败');
      })
      .finally(() => setLoading(false));
  };

  return (
    <Card title="注册" style={{ maxWidth: 400, margin: '0 auto' }}>
      <Form onFinish={onFinish} layout="vertical">
        <Form.Item name="nickName" label="昵称" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="userName" label="用户名" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="password" label="密码" rules={[{ required: true }]}>
          <Input.Password />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            注册
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}
