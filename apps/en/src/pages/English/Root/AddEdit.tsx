import { message } from 'antd';
import { ProFormText, DrawerForm } from '@ant-design/pro-components';
import request from '../../../request';
import { requireAuth } from '../../EnDesktop/authGuard';

function AddEdit(props: {
  initialValues?: any;
  trigger?: JSX.Element;
  onSubmitted?(): void;
}) {
  return (
    <DrawerForm
      title={props.initialValues?.id ? '编辑词根' : '新增词根'}
      trigger={props.trigger}
      initialValues={props.initialValues}
      drawerProps={{ destroyOnClose: true }}
      onFinish={async (data) => {
        if (!requireAuth()) return false;
        const id = props.initialValues?.id;
        let close = false;
        await request
          .post('/en-desktop/roots/' + (id ? 'update' : 'add'), data, id ? { params: { root_id: id } } : undefined)
          .then(() => {
            message.success('操作成功');
            props.onSubmitted?.();
            close = true;
          })
          .catch((e) => message.error(typeof e === 'string' ? e : '操作失败'));
        return close;
      }}
    >
      <ProFormText label="词根" name="name" rules={[{ required: true }]} />
      <ProFormText label="释义" name="meaning" />
    </DrawerForm>
  );
}

export default AddEdit;
