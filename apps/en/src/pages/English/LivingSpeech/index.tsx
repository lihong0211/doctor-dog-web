import { ProTable } from '@ant-design/pro-components';
import { Button, Popconfirm, message } from 'antd';
import request from '../../../request';
import AddEdit from './AddEdit';

type ItemType = {
  id: number;
  phrase: string;
  meaning: string;
};

export default function DialogueList() {
  const handleDelete = async (id: number, cb: any) => {
    request
      .post(`/en-desktop/daily-expressions/delete`, null, { params: { expression_id: id } })
      .then(() => {
        message.success('删除成功');
        cb();
      })
      .catch(() => {
        message.error('操作失败');
      });
  };
  return (
    <ProTable<ItemType>
      rowKey="id"
      scroll={{ y: 'calc(100dvh - 311px)' }}
      search={{ defaultCollapsed: false, span: 4 }}
      columns={[
        {
          dataIndex: 'phrase',
          title: '用语',
        },
        {
          dataIndex: 'meaning',
          title: '释义',
          hideInSearch: true,
        },

        {
          title: '操作',
          valueType: 'option',
          width: 150,
          align: 'center',
          render(_dom, entity, _index, action) {
            return (
              <div className="space-x-2">
                <AddEdit
                  onSubmitted={action?.reload}
                  initialValues={{
                    id: entity.id,
                    phrase: entity.phrase,
                    meaning: entity.meaning,
                  }}
                  trigger={<Button type="link">编辑</Button>}
                />
                <Popconfirm
                  title="确定删除该用语吗"
                  onConfirm={() => handleDelete(entity.id, action?.reload)}
                >
                  <Button type="link">删除</Button>
                </Popconfirm>
              </div>
            );
          },
        },
      ]}
      toolBarRender={false}
      request={async ({ current, pageSize, phrase }) => {
        const data: any = await request.get(`/en-desktop/daily-expressions/list`, {
          params: { page: current, page_size: pageSize, search: phrase },
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
