import { useState, useEffect, useMemo } from 'react'
import { Layout, Typography, Select, Table, Card, Spin, message } from 'antd'
import { getTableData, TABLE_NAMES, TABLE_SCHEMAS } from '../service/table-data'

const { Content } = Layout
const { Title, Text } = Typography

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

export default function Data() {
  const [table, setTable] = useState<string>(TABLE_NAMES[0])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [loading, setLoading] = useState(false)
  const [list, setList] = useState<Record<string, unknown>[]>([])
  const [total, setTotal] = useState(0)

  useEffect(() => {
    if (!table) return
    setLoading(true)
    getTableData({ table, page, page_size: pageSize })
      .then((res) => {
        
        setList(res.list)
        setTotal(res.total)
      })
      .catch((e) => {
        message.error(e instanceof Error ? e.message : '加载失败')
        setList([])
        setTotal(0)
      })
      .finally(() => setLoading(false))
  }, [table, page, pageSize])

  const columns = useMemo(() => {
    const schema = TABLE_SCHEMAS[table]
    if (schema?.length) {
      return schema.map(({ key, title }) => ({
        title,
        dataIndex: key,
        key,
        ellipsis: true,
        render: (v: unknown) => (v != null ? String(v) : ''),
      }))
    }
    if (list.length > 0) {
      return Object.keys(list[0]).map((k) => ({
        title: k,
        dataIndex: k,
        key: k,
        ellipsis: true,
        render: (v: unknown) => (v != null ? String(v) : ''),
      }))
    }
    return []
  }, [table, list])

  return (
    <Layout style={{ height: '100%', minHeight: 400, background: 'transparent', overflow: 'hidden' }}>
      <Content style={{ overflow: 'auto', padding: 24, background: 'transparent', width: '100%' }}>
        <div style={{ marginBottom: 24 }}>
          <Title level={5} style={{ margin: 0, color: 'var(--ds-text)', fontWeight: 600 }}>
            Data
          </Title>
          <Text type="secondary" style={{ fontSize: 12 }}>
            展示 ai 库表数据（表结构见 docs/data.sql）
          </Text>
        </div>

        <Card size="small" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <Text type="secondary" style={{ fontSize: 12, marginRight: 8 }}>表名</Text>
              <Select
                value={table}
                onChange={(v) => {
                  setTable(v)
                  setPage(1)
                }}
                style={{ width: 220 }}
                options={TABLE_NAMES.map((t) => ({ label: t, value: t }))}
              />
            </div>
          </div>
        </Card>

        <Card size="small" title={`${table}`} extra={total > 0 && <Text type="secondary">共 {total} 条</Text>}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 48 }}>
              <Spin tip="加载中…" />
            </div>
          ) : list.length === 0 ? (
            <Text type="secondary">暂无数据</Text>
          ) : (
            <Table
              size="small"
              rowKey={(_, i) => String(i)}
              dataSource={list}
              columns={columns}
              pagination={{
                current: page,
                pageSize: pageSize,
                total,
                showSizeChanger: true,
                pageSizeOptions: PAGE_SIZE_OPTIONS.map(String),
                showTotal: (t) => `共 ${t} 条`,
                onChange: (p, size) => {
                  setPage(p)
                  setPageSize(size ?? pageSize)
                },
              }}
              scroll={{ x: 'max-content'}}
            />
          )}
        </Card>
      </Content>
    </Layout>
  )
}
