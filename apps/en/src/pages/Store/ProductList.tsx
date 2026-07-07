import { useEffect, useState } from 'react';
import { Card, Image, List, message, Spin } from 'antd';
import { Link } from 'react-router-dom';
import request from '../../request';
import { STORE_API } from '../../request/storeApi';

export type ProductItem = {
  id: number;
  ProductName: string;
  ProductNum: number;
  ProductImage: string;
  ProductUrl: string;
};

export default function ProductList() {
  const [list, setList] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    request
      .post(`${STORE_API}/store/product/list`, {})
      .then((res: any) => {
        const data = res?.data ?? [];
        setList(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        message.error('加载商品列表失败');
        setList([]);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spin />;

  return (
    <List
      grid={{ gutter: 16, column: 4 }}
      dataSource={list}
      renderItem={(item) => (
        <List.Item>
          <Link to={`/store/product/${item.id}`}>
            <Card hoverable cover={item.ProductImage ? <Image src={item.ProductImage} alt="" height={160} style={{ objectFit: 'cover' }} /> : null}>
              <Card.Meta title={item.ProductName} description={`库存 ${item.ProductNum}`} />
            </Card>
          </Link>
        </List.Item>
      )}
    />
  );
}
