import { useRef } from 'react';
import { ProTable, type ActionType } from '@ant-design/pro-components';
import { Button, Popconfirm, message, Tag } from 'antd';
import request from '../../../request';
import AddEdit from './AddEdit';
import { requireAuth } from '../authGuard';

type MeaningItem = { type: string; content: string };

type ItemType = {
  id: number;
  word: string;
  en_pronunciation: string;
  us_pronunciation: string;
  meaning: MeaningItem[];
};

export default function EnDesktopWords() {
  const actionRef = useRef<ActionType>();

  return (
    <ProTable<ItemType>
      actionRef={actionRef}
      rowKey="id"
      scroll={{ y: 'calc(100dvh - 311px)' }}
      search={{
        defaultCollapsed: false,
        span: 4,
        optionRender: (_searchConfig, _formProps, dom) => [
          ...dom,
          <AddEdit
            trigger={<Button type="primary">新增</Button>}
            key="add"
            onSubmitted={() => actionRef.current?.reload()}
          />,
        ],
      }}
      columns={[
        { dataIndex: 'word', title: '单词' },
        { dataIndex: 'en_pronunciation', title: '英式音标', hideInSearch: true },
        { dataIndex: 'us_pronunciation', title: '美式音标', hideInSearch: true },
        {
          dataIndex: 'meaning',
          title: '释义',
          hideInSearch: true,
          render(_dom, entity) {
            return (entity.meaning || []).map((m, i) => (
              <div key={i}>
                <Tag color="blue">{m.type}</Tag>
                {m.content}
              </div>
            ));
          },
        },
        {
          title: '操作',
          valueType: 'option',
          fixed: 'right',
          width: 150,
          render(_dom, entity, _index, action) {
            return (
              <div className="space-x-2">
                <AddEdit onSubmitted={action?.reload} initialValues={entity} trigger={<Button type="link">编辑</Button>} />
                <Popconfirm
                  title="确定删除该单词吗"
                  onConfirm={() => {
                    if (!requireAuth()) return;
                    request
                      .post(`/en-desktop/words/delete`, null, { params: { word_id: entity.id } })
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
      request={async ({ current, pageSize, word }) => {
        const data: any = await request.get('/en-desktop/words/list', {
          params: { page: current, page_size: pageSize, search: word },
        });
        return {
          success: true,
          data: data.list,
          total: data.total,
        };
      }}
    />
  );
}
