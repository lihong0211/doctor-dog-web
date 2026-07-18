import { message } from 'antd';
import { ProFormText, ProFormTextArea, ProFormSwitch, DrawerForm } from '@ant-design/pro-components';
import request from '../../../request';
import { requireAuth } from '../authGuard';

function AddEdit(props: { initialValues?: any; trigger?: JSX.Element; onSubmitted?(): void }) {
  return (
    <DrawerForm
      title={props.initialValues?.id ? '编辑词库' : '新建词库'}
      trigger={props.trigger}
      initialValues={{ ...props.initialValues, is_public: props.initialValues?.is_public === 1 }}
      drawerProps={{ destroyOnClose: true }}
      onFinish={async (data) => {
        if (!requireAuth()) return false;
        const id = props.initialValues?.id;
        let close = false;
        await request
          .post('/en-desktop/libraries/' + (id ? 'update' : 'add'), data, id ? { params: { library_id: id } } : undefined)
          .then(() => {
            message.success('操作成功');
            props.onSubmitted?.();
            close = true;
          })
          .catch((e) => message.error(typeof e === 'string' ? e : '操作失败'));
        return close;
      }}
    >
      <ProFormText label="词库名称" name="name" rules={[{ required: true }]} />
      <ProFormTextArea label="简介" name="description" />
      <ProFormSwitch label="公开（小程序/桌面端所有用户可浏览、收藏）" name="is_public" />
    </DrawerForm>
  );
}

export default AddEdit;
