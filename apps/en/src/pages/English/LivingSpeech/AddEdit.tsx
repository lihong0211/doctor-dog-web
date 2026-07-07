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
        const url = id ? '/english/living-speech/update' : '/english/living-speech/add';
        let close = false;
        await request
          .post(url, { ...data, id })
          .then(() => {
            message.success('操作成功');
            props.onSubmitted?.();
            close = true;
          })
          .catch((e) => {
            message.error(e.msg);
          });
        return close;
      }}
    >
      <ProFormText name="speech" label="用语" />
      <ProFormText name="meaning" label="释义" />
    </DrawerForm>
  );
}

export default AddEdit;
