import { ProTable } from '@ant-design/pro-components';
import { Button, Image, Space, Tag, message } from 'antd';
import type { ProColumns } from '@ant-design/pro-components';
import request from '../../request';

export type ProductItem = {
  id: number;
  ProductName: string;
  ProductNum: number;
  ProductImage: string;
  ProductUrl: string;
};

export default function Store() {
  const columns: ProColumns<ProductItem>[] = [
    {
      dataIndex: 'id',
      title: 'ID',
      width: 80,
      hideInSearch: true,
    },
    {
      dataIndex: 'ProductName',
      title: '商品名称',
      ellipsis: true,
    },
    {
      dataIndex: 'ProductNum',
      title: '库存',
      width: 100,
      hideInSearch: true,
      render: (_, entity) => (
        <Tag color={entity.ProductNum > 0 ? 'green' : 'red'}>
          {entity.ProductNum}
        </Tag>
      ),
    },
    {
      dataIndex: 'ProductImage',
      title: '商品图',
      width: 100,
      hideInSearch: true,
      render: (_, entity) =>
        entity.ProductImage ? (
          <Image
            width={48}
            height={48}
            src={entity.ProductImage}
            style={{ objectFit: 'cover', borderRadius: 4 }}
          />
        ) : (
          <span className="text-gray-400">暂无图片</span>
        ),
    },
    {
      dataIndex: 'ProductUrl',
      title: '链接',
      hideInSearch: true,
      ellipsis: true,
      render: (_, entity) =>
        entity.ProductUrl ? (
          <a href={entity.ProductUrl} target="_blank" rel="noopener noreferrer">
            查看
          </a>
        ) : (
          '-'
        ),
    },
    {
      title: '操作',
      valueType: 'option',
      width: 120,
      fixed: 'right',
      render: (_, entity) => (
        <Space>
          {entity.ProductUrl && (
            <Button
              type="link"
              size="small"
              onClick={() => window.open(entity.ProductUrl, '_blank')}
            >
              打开链接
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <ProTable<ProductItem>
      rowKey="id"
      scroll={{ x: 800, y: 500 }}
      search={{ defaultCollapsed: false, span: 6 }}
      columns={columns}
      toolBarRender={() => []}
      request={async ({ current, pageSize, ProductName }) => {
        try {
          const data: any = await request.post('/store/product/list', {
            page: current,
            size: pageSize,
            query: { ProductName },
          });
          return {
            success: true,
            data: data?.data ?? data?.list ?? [],
            total: data?.total ?? 0,
          };
        } catch (e) {
          message.error('加载商品列表失败');
          return { success: false, data: [], total: 0 };
        }
      }}
    />
  );
}
