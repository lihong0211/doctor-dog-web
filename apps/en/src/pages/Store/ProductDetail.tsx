import { useEffect, useState } from 'react';
import { Button, Card, Image, message, Spin } from 'antd';
import { useParams } from 'react-router-dom';
import request from '../../request';
import { STORE_API } from '../../request/storeApi';

type Product = {
  id: number;
  ProductName: string;
  ProductNum: number;
  ProductImage: string;
  ProductUrl: string;
};

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    request
      .get(`${STORE_API}/store/product/${id}`)
      .then((res: any) => setProduct(res ?? null))
      .catch(() => message.error('商品不存在'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleBuy = () => {
    if (!id) return;
    setSubmitting(true);
    request
      .post(
        `${STORE_API}/api/order/submit`,
        { productID: Number(id) },
        { withCredentials: true }
      )
      .then(() => {
        message.success('抢购请求已提交');
      })
      .catch((msg: string) => {
        message.error(msg || '抢购失败');
      })
      .finally(() => setSubmitting(false));
  };

  if (loading) return <Spin />;
  if (!product) return <div>商品不存在</div>;

  return (
    <Card title={product.ProductName}>
      {product.ProductImage && (
        <Image src={product.ProductImage} width={200} style={{ marginBottom: 16 }} />
      )}
      <p>库存：{product.ProductNum}</p>
      {product.ProductUrl && (
        <p>
          <a href={product.ProductUrl} target="_blank" rel="noopener noreferrer">查看链接</a>
        </p>
      )}
      <Button type="primary" onClick={handleBuy} loading={submitting} disabled={product.ProductNum <= 0}>
        抢购
      </Button>
    </Card>
  );
}
