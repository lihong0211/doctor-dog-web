import { Form, message } from 'antd';
import { css } from '@emotion/react';
import {
  ProFormSelect,
  ProFormText,
  DrawerForm,
} from '@ant-design/pro-components';
import request from '../../../request';
import AddWords from '@/components/AddWords';

function AddEdit(props: {
  initialValues?: any;
  trigger?: JSX.Element;
  onSubmitted?(): void;
  list: any[];
}) {
  const [form] = Form.useForm();
  return (
    <DrawerForm
      title={props.initialValues?.id ? '编辑词根' : '新增词根'}
      trigger={props.trigger}
      initialValues={props.initialValues}
      drawerProps={{
        destroyOnClose: true,
      }}
      form={form}
      onFinish={async (data) => {
        const id = props.initialValues?.id;
        const url = id ? '/english/root/update' : '/english/root/add';
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
      css={css`
        .ant-card-body {
          padding: 10px;
          padding-bottom: 0;
        }
      `}
    >
      <ProFormText label="词根" name="name" />
      <ProFormText label="释义" name="meaning" />
      <ProFormSelect
        label="相似词根"
        mode="multiple"
        options={props.list}
        name="similar"
      />
      <AddWords form={form} />
    </DrawerForm>
  );
}

export default AddEdit;
