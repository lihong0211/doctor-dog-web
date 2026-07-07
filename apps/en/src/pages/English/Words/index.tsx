import { ProTable } from '@ant-design/pro-components';
import { useEffect, useState } from 'react';
import { Button, Tag, Popconfirm, message, Checkbox } from 'antd';
import request from '../../../request';
import AddEdit from './AddEdit';

type ItemType = {
  id: number;
  word: string;
  type: string[];
  meaning: string;
  collocation: string;
  collocation_meaning: string;
  affix: string;
  affix_case: string;
  root: string;
  root_case: string;
  sentence: string;
  mastered: 1 | 2;
};

export default function WordList() {
  const [roots, setRoots] = useState<any[]>([]);
  const [affixes, setAffixes] = useState<any[]>([]);
  useEffect(() => {
    request.post(`/english/root/list`).then((res: any) => {
      setRoots(() =>
        res?.data.map((item: any) => ({
          label: item.name,
          value: item.name,
          key: item.id,
        }))
      );
    });
    request.get(`/english/affix/list`).then((res: any) => {
      setAffixes(() =>
        res?.data.map((item: any) => ({
          label: item.name,
          value: item.name,
          key: item.id,
        }))
      );
    });
  }, []);
  return (
    <ProTable<ItemType>
      rowKey="id"
      scroll={{  y: 450 }}
      search={{ defaultCollapsed: false, span: 4 }}
      columns={[
       
        {
          dataIndex: 'word',
          title: '单词',
        },
        {
          dataIndex: 'meaning',
          title: '释义',
          hideInSearch: true,
        },
        {
          dataIndex: 'type',
          title: '类型',
          render(_dom, entity) {
            return <Tag color="blue">{entity?.type?.join(',')}</Tag>;
          },
        },
        {
          dataIndex: 'mastered',
          title: '是否掌握',
          hideInSearch: true,
          render(_dom, entity, _, action) {
            return (
              <Checkbox
                checked={entity?.mastered === 1}
                onChange={(e: any) => {
                  request
                    .post('/english/words/update', {
                      ...entity,
                      mastered: e.target.checked ? 1 : 2,
                    })
                    .then(() => {
                      message.success('操作成功');
                      action?.reload();
                    });
                }}
              >
                已掌握
              </Checkbox>
            );
          },
        },

        {
          dataIndex: 'collocation',
          title: '搭配',
          hideInSearch: true,
        },
        {
          dataIndex: 'collocation_meaning',
          title: '搭配释义',
          hideInSearch: true,
        },

        {
          dataIndex: 'root',
          title: '词根',
          hideInSearch: true,
        },
        {
          dataIndex: 'root_case',
          title: '词根例子',
          hideInSearch: true,
        },
        {
          dataIndex: 'affix',
          title: '词缀',
          hideInSearch: true,
        },
        {
          dataIndex: 'affix_case',
          title: '词缀例子',
          hideInSearch: true,
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
                    word: entity.word,
                    type: entity.type,
                    meaning: entity.meaning,
                    collocation: entity.collocation,
                    collocation_meaning: entity.collocation_meaning,
                    affix: entity.affix,
                    affix_case: entity.affix_case,
                    root: entity.root,
                    root_case: entity.root_case,
                    sentence: entity.sentence,
                    mastered: entity.mastered === 1,
                  }}
                  trigger={<Button type="link">编辑</Button>}
                  roots={roots}
                  affixes={affixes}
                />
                <Popconfirm
                  title="确定删除该单词吗"
                  onConfirm={() => {
                    request
                      .post(`/english/words/delete`, { id: entity.id })
                      .then(() => {
                        message.success('删除成功');
                        action?.reload();
                      })
                      .catch(() => {
                        message.error('操作失败');
                      });
                  }}
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
            roots={roots}
            affixes={affixes}
          />,
        ];
      }}
      request={async ({ current, pageSize, ...rest }) => {
        const data = await request.post(`/english/words/list`, {
          page: current,
          size: pageSize,
          query: {
            ...rest,
          },
        });
        return {
          success: true,
          ...data,
        };
      }}
    />
  );
}
