import { ProTable } from '@ant-design/pro-components';
import { Button, Popconfirm, message, Switch } from 'antd';
import request from '../../../request';
import AddEdit from './AddEdit';
import { requireAuth } from '../authGuard';

type ItemType = {
  id: number;
  username: string | null;
  wx: string | null;
  wx_mini?: string | null;
  nickname: string | null;
  description: string | null;
  active: 0 | 1;
};

export default function EnDesktopUsers() {
  return (
    <ProTable<ItemType>
      rowKey="id"
      scroll={{ y: 'calc(100dvh - 245px)' }}
      search={false}
      columns={[
        { dataIndex: 'id', title: 'ID', width: 70 },
        { dataIndex: 'username', title: '用户名' },
        { dataIndex: 'nickname', title: '昵称' },
        { dataIndex: 'wx', title: '网页扫码 openid', ellipsis: true },
        { dataIndex: 'wx_mini', title: '小程序 openid', ellipsis: true },
        { dataIndex: 'description', title: '备注' },
        {
          dataIndex: 'active',
          title: '激活',
          render(_dom, entity, _, action) {
            return (
              <Switch
                checked={entity.active === 1}
                onChange={(checked) => {
                  if (!requireAuth()) return;
                  request
                    .post('/en-desktop/users/activate', null, {
                      params: { user_id: entity.id, active: checked },
                    })
                    .then(() => {
                      message.success('操作成功');
                      action?.reload();
                    })
                    .catch((e) => message.error(typeof e === 'string' ? e : '操作失败'));
                }}
              />
            );
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
                  title="确定删除该用户吗"
                  onConfirm={() => {
                    if (!requireAuth()) return;
                    request
                      .post(`/en-desktop/users/delete`, null, { params: { user_id: entity.id } })
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
      request={async ({ current, pageSize }) => {
        const data: any = await request.get('/en-desktop/users/list', {
          params: { page: current, page_size: pageSize },
        });
        return { success: true, data: data.list, total: data.total };
      }}
    />
  );
}
