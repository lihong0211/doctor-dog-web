import { ProTable } from '@ant-design/pro-components';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { Button, Image, message, Modal, Form, Input, InputNumber, Popconfirm } from 'antd';
import { useRef, useState } from 'react';
import request from '../../request';
import { STORE_API } from '../../request/storeApi';

type ProductItem = {
  id: number;
  ProductName: string;
  ProductNum: number;
  ProductImage: string;
  ProductUrl: string;
};

export default function AdminProducts() {
  const actionRef = useRef<ActionType>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ProductItem | null>(null);
  const [form] = Form.useForm();

  const reload = () => actionRef.current?.reload();

  const handleAdd = () => {
    setEditing(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleEdit = (row: ProductItem) => {
    setEditing(row);
    form.setFieldsValue({
      ProductName: row.ProductName,
      ProductNum: row.ProductNum,
      ProductImage: row.ProductImage,
      ProductUrl: row.ProductUrl,
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    try {
      if (editing?.id) {
        await request.put(`${STORE_API}/store/product`, { ...editing, ...values });
        message.success('更新成功');
      } else {
        await request.post(`${STORE_API}/store/product`, values);
        message.success('新增成功');
      }
      setModalOpen(false);
      reload();
    } catch (e: any) {
      message.error(e?.message || '操作失败');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await request.delete(`${STORE_API}/store/product/${id}`);
      message.success('删除成功');
      reload();
    } catch {
      message.error('删除失败');
    }
  };

  const columns: ProColumns<ProductItem>[] = [
    { dataIndex: 'id', title: 'ID', width: 80, hideInSearch: true },
    { dataIndex: 'ProductName', title: '商品名称' },
    { dataIndex: 'ProductNum', title: '库存', width: 100, hideInSearch: true },
    {
      dataIndex: 'ProductImage',
      title: '图片',
      width: 80,
      hideInSearch: true,
      render: (_, r) => r.ProductImage ? <Image src={r.ProductImage} width={40} height={40} style={{ objectFit: 'cover' }} /> : '-',
    },
    { dataIndex: 'ProductUrl', title: '链接', ellipsis: true, hideInSearch: true },
    {
      title: '操作',
      valueType: 'option',
      width: 160,
      render: (_, row) => [
        <Button type="link" key="edit" onClick={() => handleEdit(row)}>编辑</Button>,
        <Popconfirm key="del" title="确定删除？" onConfirm={() => handleDelete(row.id)}>
          <Button type="link" danger>删除</Button>
        </Popconfirm>,
      ],
    },
  ];

  return (
    <>
      <ProTable<ProductItem>
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        search={false}
        toolBarRender={() => [
          <Button type="primary" key="add" onClick={handleAdd}>新增商品</Button>,
        ]}
        request={async () => {
          const res: any = await request.post(`${STORE_API}/store/product/list`, {});
          const list = Array.isArray(res?.data) ? res.data : [];
          return { data: list, success: true, total: res?.total ?? list.length };
        }}
      />
      <Modal
        title={editing ? '编辑商品' : '新增商品'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="ProductName" label="商品名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="ProductNum" label="库存" rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="ProductImage" label="图片URL">
            <Input />
          </Form.Item>
          <Form.Item name="ProductUrl" label="商品链接">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
