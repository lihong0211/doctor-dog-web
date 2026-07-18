import { message } from 'antd';
import { ProFormText, DrawerForm } from '@ant-design/pro-components';
import request from '../../../request';

function AddEdit(props: {
  initialValues?: any;
  trigger?: JSX.Element;
  onSubmitted?(): void;
}) {
  return (
    <DrawerForm
      title={props.initialValues?.id ? '编辑用语' : '新增用语'}
      trigger={props.trigger}
      initialValues={props.initialValues}
      drawerProps={{
        destroyOnClose: true,
      }}
      onFinish={async (data) => {
        const id = props.initialValues?.id;
        const url = '/en-desktop/daily-expressions/' + (id ? 'update' : 'add');
        let close = false;
        await request
          .post(url, data, id ? { params: { expression_id: id } } : undefined)
          .then(() => {
            message.success('操作成功');
            props.onSubmitted?.();
            close = true;
          })
          .catch((e) => {
            message.error(typeof e === 'string' ? e : '操作失败');
          });
        return close;
      }}
    >
      <ProFormText name="phrase" label="用语" rules={[{ required: true }]} />
      <ProFormText name="meaning" label="释义" rules={[{ required: true }]} />
    </DrawerForm>
  );
}

export default AddEdit;
