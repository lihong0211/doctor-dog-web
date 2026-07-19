import { useState } from 'react';
import { ProTable } from '@ant-design/pro-components';
import { Button, Popconfirm, message, Tag } from 'antd';
import request from '../../../request';
import AddEdit from './AddEdit';
import ExampleWords from '../../EnDesktop/ExampleWords';
import { requireAuth } from '../../EnDesktop/authGuard';

type WordItem = { id: number; word: string };

type ItemType = {
  id: number;
  name: string;
  meaning: string;
  words: WordItem[];
};

export default function Root() {
  const [activeRoot, setActiveRoot] = useState<ItemType | null>(null);

  const handleDelete = (id: number, cb: any) => {
    if (!requireAuth()) return;
    request
      .post(`/en-desktop/roots/delete`, null, { params: { root_id: id } })
      .then(() => {
        message.success('删除成功');
        cb();
      })
      .catch((e) => message.error(typeof e === 'string' ? e : '操作失败'));
  };

  return (
    <>
      <ProTable<ItemType>
        rowKey="id"
        scroll={{ y: 'calc(100dvh - 245px)' }}
        search={false}
        columns={[
          {
            dataIndex: 'name',
            title: '词根',
            render: (_dom, entity) => <Tag>{entity.name}</Tag>,
          },
          { dataIndex: 'meaning', title: '释义' },
          {
            dataIndex: 'words',
            title: '例词',
            width: 300,
            render: (_dom, entity) => (entity.words || []).map((item) => <Tag key={item.id}>{item.word}</Tag>),
          },
          {
            title: '操作',
            valueType: 'option',
            fixed: 'right',
            width: 220,
            render(_dom, entity, _index, action) {
              return (
                <div className="space-x-2">
                  <Button type="link" onClick={() => setActiveRoot(entity)}>
                    管理例词
                  </Button>
                  <AddEdit onSubmitted={action?.reload} initialValues={entity} trigger={<Button type="link">编辑</Button>} />
                  <Popconfirm title="确定删除该词根吗" onConfirm={() => handleDelete(entity.id, action?.reload)}>
                    <Button type="link">删除</Button>
                  </Popconfirm>
                </div>
              );
            },
          },
        ]}
        toolBarRender={false}
        request={async () => {
          const data: any = await request.get('/en-desktop/roots/list');
          return { success: true, data, total: data?.length };
        }}
      />
      <ExampleWords entityType="roots" entity={activeRoot} onClose={() => setActiveRoot(null)} />
    </>
  );
}
