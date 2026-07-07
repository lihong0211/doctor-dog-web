import { message } from 'antd';
import {
  ProFormSelect,
  ProFormText,
  ProFormSwitch,
  DrawerForm,
} from '@ant-design/pro-components';
import request from '../../../request';

function AddEdit(props: {
  initialValues?: any;
  trigger?: JSX.Element;
  onSubmitted?(): void;
  roots: any[];
  affixes: any[];
}) {
  return (
    <DrawerForm
      title={props.initialValues?.id ? '编辑单词' : '新增单词'}
      trigger={props.trigger}
      initialValues={props.initialValues}
      drawerProps={{
        destroyOnClose: true,
      }}
      onFinish={async (data) => {
        const id = props.initialValues?.id;
        const url = id ? '/english/words/update' : '/english/words/add';
        let close = false;
        data.mastered = data.mastered ? 1 : 2;
        await request
          .post(url, { ...data, id })
          .then(() => {
            message.success('操作成功');
            props.onSubmitted?.();
            close = true;
          })
          .catch((e) => {
            message.error(e);
          });
        return close;
      }}
    >
      <ProFormText label="单词" name="word" />

      <ProFormSelect
        label="类型"
        name="type"
        mode="multiple"
        options={[
          { label: 'adj', value: 'adj' },
          { label: 'adv', value: 'adv' },
          { label: 'n', value: 'n' },
          { label: 'v', value: 'v' },
          { label: 'vt', value: 'vt' },
          { label: 'vi', value: 'vi' },
          { label: 'prep', value: 'prep' },
        ]}
      />
      <ProFormText label="释义" name="meaning" />
      <ProFormSwitch label="已掌握" name="mastered" />
      <ProFormSelect
        label="词根"
        name="root"
        options={props.roots}
        showSearch
      />
      <ProFormSelect
        label="词缀"
        name="affix"
        options={props.affixes}
        showSearch
      />
      <ProFormText label="搭配" name="collocation" />
      <ProFormText label="搭配释义" name="collocation_meaning" />
    </DrawerForm>
  );
}

export default AddEdit;
