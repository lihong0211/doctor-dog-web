import { message, Form } from 'antd';
import AddDialogue from '@/components/AddDialogue';

import { DrawerForm, ProFormDigit } from '@ant-design/pro-components';
import request from '../../../request';
import AddWords from '@/components/AddWords';

function AddEdit(props: {
  initialValues?: any;
  trigger?: JSX.Element;
  onSubmitted?(): void;
}) {
  const [form] = Form.useForm();
  return (
    <DrawerForm
      title={props.initialValues?.id ? '编辑单词' : '新增单词'}
      trigger={props.trigger}
      initialValues={props.initialValues}
      drawerProps={{
        destroyOnClose: true,
      }}
      form={form}
      onFinish={async (data) => {
        const id = props.initialValues?.id;
        const url = id ? '/english/dialogue/update' : '/english/dialogue/add';
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
      <AddDialogue form={form} />
      <AddWords form={form} />
      <ProFormDigit label="章节" name="section" />
    </DrawerForm>
  );
}

export default AddEdit;
