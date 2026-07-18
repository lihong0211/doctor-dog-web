import { message } from 'antd';
import { ProFormText, ProFormSelect, DrawerForm } from '@ant-design/pro-components';
import request from '../../../request';
import { requireAuth } from '../../EnDesktop/authGuard';

function AddEdit(props: {
  initialValues?: any;
  trigger?: JSX.Element;
  onSubmitted?(): void;
  list: { label: string; value: string }[];
}) {
  return (
    <DrawerForm
      title={props.initialValues?.id ? '编辑词缀' : '新增词缀'}
      trigger={props.trigger}
      initialValues={props.initialValues}
      drawerProps={{ destroyOnClose: true }}
      onFinish={async (data) => {
        if (!requireAuth()) return false;
        const id = props.initialValues?.id;
        let close = false;
        await request
          .post('/en-desktop/affixes/' + (id ? 'update' : 'add'), data, id ? { params: { affix_id: id } } : undefined)
          .then(() => {
            message.success('操作成功');
            props.onSubmitted?.();
            close = true;
          })
          .catch((e) => message.error(typeof e === 'string' ? e : '操作失败'));
        return close;
      }}
    >
      <ProFormText label="词缀" name="name" rules={[{ required: true }]} />
      <ProFormText label="释义" name="meaning" />
      <ProFormSelect label="相似词缀" mode="multiple" options={props.list} name="similar" />
    </DrawerForm>
  );
}

export default AddEdit;
