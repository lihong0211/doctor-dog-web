import { useState } from 'react';
import { ProTable } from '@ant-design/pro-components';
import { Button, Popconfirm, message, Tag } from 'antd';
import request from '../../../request';
import AddEdit from './AddEdit';
import LibraryWords from './LibraryWords';
import { requireAuth } from '../authGuard';

type ItemType = {
  id: number;
  name: string;
  description: string | null;
  is_public: 0 | 1;
  word_count: number;
};

export default function EnDesktopLibraries() {
  const [activeLibrary, setActiveLibrary] = useState<{ id: number; name: string } | null>(null);

  return (
    <>
      <ProTable<ItemType>
        rowKey="id"
        scroll={{ y: 'calc(100dvh - 215px)' }}
        search={false}
        columns={[
          { dataIndex: 'name', title: '词库名称' },
          { dataIndex: 'description', title: '简介' },
          { dataIndex: 'word_count', title: '单词数', width: 90 },
          {
            dataIndex: 'is_public',
            title: '公开',
            width: 90,
            render(_dom, entity) {
              return entity.is_public === 1 ? <Tag color="green">公开</Tag> : <Tag>私有</Tag>;
            },
          },
          {
            title: '操作',
            valueType: 'option',
            fixed: 'right',
            width: 220,
            render(_dom, entity, _index, action) {
              return (
                <div className="space-x-2">
                  <Button type="link" onClick={() => setActiveLibrary({ id: entity.id, name: entity.name })}>
                    管理单词
                  </Button>
                  <AddEdit onSubmitted={action?.reload} initialValues={entity} trigger={<Button type="link">编辑</Button>} />
                  <Popconfirm
                    title="确定删除该词库吗（不会删除单词本身）"
                    onConfirm={() => {
                      if (!requireAuth()) return;
                      request
                        .post(`/en-desktop/libraries/delete`, null, { params: { library_id: entity.id } })
                        .then(() => {
                          message.success('删除成功');
                          action?.reload();
                        })
                        .catch((e) => message.error(typeof e === 'string' ? e : '操作失败'));
                    }}
                  >
                    <Button type="link">删除</Button>
                  </Popconfirm>
                </div>
              );
            },
          },
        ]}
        toolBarRender={false}
        request={async () => {
          const data: any = await request.get('/en-desktop/libraries/list');
          return { success: true, data, total: data?.length };
        }}
      />
      <LibraryWords library={activeLibrary} onClose={() => setActiveLibrary(null)} />
    </>
  );
}
