import { message } from 'antd';
import { ProFormText, ProFormList, DrawerForm } from '@ant-design/pro-components';
import request from '../../../request';
import { requireAuth } from '../authGuard';

function AddEdit(props: { initialValues?: any; trigger?: JSX.Element; onSubmitted?(): void }) {
  return (
    <DrawerForm
      title={props.initialValues?.id ? '编辑单词' : '新增单词'}
      trigger={props.trigger}
      initialValues={props.initialValues}
      drawerProps={{ destroyOnClose: true }}
      onFinish={async (data) => {
        if (!requireAuth()) return false;
        const id = props.initialValues?.id;
        let close = false;
        await request
          .post('/en-desktop/words/' + (id ? 'update' : 'add'), data, id ? { params: { word_id: id } } : undefined)
          .then(() => {
            message.success('操作成功');
            props.onSubmitted?.();
            close = true;
          })
          .catch((e) => message.error(typeof e === 'string' ? e : '操作失败'));
        return close;
      }}
    >
      <ProFormText label="单词" name="word" rules={[{ required: true }]} />
      <ProFormText label="英式音标" name="en_pronunciation" rules={[{ required: true }]} />
      <ProFormText label="美式音标" name="us_pronunciation" rules={[{ required: true }]} />
      <ProFormList name="meaning" label="释义" creatorButtonProps={{ creatorButtonText: '添加释义' }}>
        <ProFormText label="词性" name="type" rules={[{ required: true }]} />
        <ProFormText label="释义内容" name="content" rules={[{ required: true }]} />
      </ProFormList>
    </DrawerForm>
  );
}

export default AddEdit;
