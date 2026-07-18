import { message } from 'antd';
import { ProFormText, ProFormSwitch, DrawerForm } from '@ant-design/pro-components';
import request from '../../../request';
import { requireAuth } from '../authGuard';

function AddEdit(props: { initialValues?: any; trigger?: JSX.Element; onSubmitted?(): void }) {
  return (
    <DrawerForm
      title={props.initialValues?.id ? '编辑用户' : '新增用户'}
      trigger={props.trigger}
      initialValues={{ ...props.initialValues, active: props.initialValues?.active !== 0 }}
      drawerProps={{ destroyOnClose: true }}
      onFinish={async (data) => {
        if (!requireAuth()) return false;
        const id = props.initialValues?.id;
        const payload = { ...data, active: data.active ? 1 : 0 };
        let close = false;
        await request
          .post('/en-desktop/users/' + (id ? 'update' : 'add'), payload, id ? { params: { user_id: id } } : undefined)
          .then(() => {
            message.success('操作成功');
            props.onSubmitted?.();
            close = true;
          })
          .catch((e) => message.error(typeof e === 'string' ? e : '操作失败'));
        return close;
      }}
    >
      <ProFormText label="用户名" name="username" rules={[{ required: true }]} />
      <ProFormText.Password label="密码" name="password" placeholder="留空则不修改" />
      <ProFormText label="备注" name="description" />
      <ProFormSwitch label="激活" name="active" />
    </DrawerForm>
  );
}

export default AddEdit;
