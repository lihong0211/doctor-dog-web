import { message } from 'antd';
import { ProFormText, ProFormTextArea, DrawerForm } from '@ant-design/pro-components';
import request from '../../../request';
import { requireAuth } from '../authGuard';
import type { QuestionItem } from './types';

function EditDrawer(props: { initialValues: QuestionItem; trigger: JSX.Element; onSubmitted?(): void }) {
  return (
    <DrawerForm
      title="编辑面试题"
      trigger={props.trigger}
      width={560}
      initialValues={props.initialValues}
      drawerProps={{ destroyOnClose: true }}
      onFinish={async (data) => {
        if (!requireAuth()) return false;
        let close = false;
        await request
          .post('/english/interview/update', { id: props.initialValues.id, ...data })
          .then(() => {
            message.success('保存成功');
            props.onSubmitted?.();
            close = true;
          })
          .catch((e) => message.error(typeof e === 'string' ? e : '保存失败'));
        return close;
      }}
    >
      <ProFormText label="题目" name="question" rules={[{ required: true }]} />
      <ProFormText label="分类" name="category" placeholder="如：前端/Vue" />
      <ProFormTextArea
        label="关键记忆点"
        name="key_points"
        rules={[{ required: true }]}
        fieldProps={{ autoSize: { minRows: 2, maxRows: 4 } }}
        extra="逗号分隔的短语，格式：名词短语——关键词"
      />
      <ProFormTextArea
        label="口语回答"
        name="spoken_desc"
        rules={[{ required: true }]}
        fieldProps={{ autoSize: { minRows: 10, maxRows: 24 } }}
      />
    </DrawerForm>
  );
}

export default EditDrawer;
