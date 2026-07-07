import { ProTable } from '@ant-design/pro-components';
import { Button, Tag, Popconfirm, message, Card } from 'antd';
import request from '../../../request';
import AddEdit from './AddEdit';

type ItemType = {
  id: number;
  dialogue: any[];
  meaning: string;
  words: any[];
  section: number;
};

export default function DialogueList() {
  const handleDelete = async (id: number, cb: any) => {
    request
      .post(`/english/dialogue/delete`, { id })
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
      scroll={{  y: 450 }}
      search={{ defaultCollapsed: false, span: 4 }}
      columns={[
       
        {
          dataIndex: '单词',
          title: '单词',
          hideInTable: true,
        },
        {
          dataIndex: 'dialogue',
          title: '对白',
          hideInSearch: true,
          render: (_dom, entity) => {
            return (
              <>
                {entity?.dialogue?.map((item) => {
                  return (
                    <>
                      <Card
                        className="m-2"
                        bodyStyle={{
                          padding: 10,
                        }}
                      >
                        <div className=" break-words mb-2">{item.dialogue}</div>
                        <div className=" break-words mb-2">{item.meaning}</div>
                      </Card>
                    </>
                  );
                })}
              </>
            );
          },
        },
        {
          dataIndex: 'words',
          title: '单词',
          hideInSearch: true,
          width: 300,
          render: (_dom, entity) => {
            return (
              <>
                {entity?.words?.map((item) => {
                  return (
                    <Tag className="m-1" color="blue">
                      {item.word}: {item.meaning}
                    </Tag>
                  );
                })}
              </>
            );
          },
        },
        {
          dataIndex: 'section',
          title: '章节',
          width: 80,
        },

        {
          title: '操作',
          valueType: 'option',
          fixed: 'right',
          width: 150,
          render(_dom, entity, _index, action) {
            return (
              <div className="space-x-2">
                <AddEdit
                  onSubmitted={action?.reload}
                  initialValues={{
                    id: entity.id,
                    dialogue: entity.dialogue,
                    meaning: entity.meaning,
                    words: entity.words,
                    section: entity.section,
                  }}
                  trigger={<Button type="link">编辑</Button>}
                />
                <Popconfirm
                  title="确定删除该单词吗"
                  onConfirm={() => handleDelete(entity.id, action?.reload)}
                >
                  <Button type="link">删除</Button>
                </Popconfirm>
              </div>
            );
          },
        },
      ]}
      toolBarRender={(action) => {
        return [
          <AddEdit
            trigger={<Button type="primary">新增</Button>}
            key="add"
            onSubmitted={action?.reload}
          />,
        ];
      }}
      request={async ({ inviteCode, ...rest }) => {
        const data = await request.get(`/english/dialogue/list`);
        return {
          success: true,
          ...data,
        };
      }}
    />
  );
}
