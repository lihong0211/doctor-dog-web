import { ProTable } from '@ant-design/pro-components';
import type { ProColumns } from '@ant-design/pro-components';
import { useEffect, useState } from 'react';
import request from '../../request';
import { STORE_API } from '../../request/storeApi';

type OrderRow = Record<string, string>;

export default function AdminOrders() {
  const [dataSource, setDataSource] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    request
      .post(`${STORE_API}/store/order/list`, {})
      .then((res: any) => {
        const list = res?.data ?? [];
        setDataSource(Array.isArray(list) ? list : []);
      })
      .catch(() => setDataSource([]))
      .finally(() => setLoading(false));
  }, []);

  const columns: ProColumns<OrderRow>[] = [
    { dataIndex: 'ID', title: '订单ID', width: 100 },
    { dataIndex: 'productName', title: '商品名称' },
    { dataIndex: 'orderStatus', title: '状态', width: 100 },
  ];

  return (
    <ProTable<OrderRow>
      rowKey="ID"
      columns={columns}
      dataSource={dataSource}
      loading={loading}
      search={false}
      pagination={{ pageSize: 10 }}
    />
  );
}
