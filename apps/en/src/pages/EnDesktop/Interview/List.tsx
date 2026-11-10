import { useEffect, useMemo, useState } from 'react';
import { ProTable } from '@ant-design/pro-components';
import { Button, Input, Popconfirm, Select, Space, Tag, message } from 'antd';
import request from '../../../request';
import { requireAuth } from '../authGuard';
import EditDrawer from './EditDrawer';
import { MASTERY_COLORS, MASTERY_LEVELS, mainCategory, type QuestionItem } from './types';

export default function InterviewList() {
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [category, setCategory] = useState<string | undefined>();
  const [mastery, setMastery] = useState<string | undefined>();
  const [keyword, setKeyword] = useState('');

  const load = () => {
    setLoading(true);
    request
      .post('/english/interview/list')
      .then((data: any) => setQuestions(data as QuestionItem[]))
      .catch((e) => message.error(typeof e === 'string' ? e : '加载失败'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleDelete = (id: number) => {
    if (!requireAuth()) return;
    request
      .post('/english/interview/delete', { id })
      .then(() => {
        message.success('删除成功');
        load();
      })
      .catch((e) => message.error(typeof e === 'string' ? e : '删除失败'));
  };

  const categoryOptions = useMemo(
    () => Array.from(new Set(questions.map((q) => mainCategory(q.category)).filter(Boolean))),
    [questions],
  );

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return questions.filter(
      (q) =>
        (!category || mainCategory(q.category) === category) &&
        (!mastery || q.mastery === mastery) &&
        (!kw || q.question.toLowerCase().includes(kw) || q.key_points.toLowerCase().includes(kw)),
    );
  }, [questions, category, mastery, keyword]);

  return (
    <ProTable<QuestionItem>
      rowKey="id"
      loading={loading}
      dataSource={filtered}
      scroll={{ x: 900, y: 'calc(100dvh - 311px)' }}
      search={false}
      toolBarRender={() => [
        <Input.Search
          key="keyword"
          allowClear
          placeholder="按题目/关键记忆点搜索"
          style={{ width: 220 }}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onSearch={setKeyword}
        />,
        <Select
          key="category"
          allowClear
          placeholder="按分类筛选"
          style={{ width: 180 }}
          value={category}
          onChange={setCategory}
          options={categoryOptions.map((c) => ({ label: c, value: c }))}
        />,
        <Select
          key="mastery"
          allowClear
          placeholder="按掌握程度筛选"
          style={{ width: 160 }}
          value={mastery}
          onChange={setMastery}
          options={MASTERY_LEVELS.map((m) => ({ label: m, value: m }))}
        />,
      ]}
      pagination={{ pageSize: 20 }}
      columns={[
        { dataIndex: 'question', title: '题目', ellipsis: true },
        {
          dataIndex: 'category',
          title: '分类',
          width: 160,
          render: (_dom, entity) => (entity.category ? <Tag color="geekblue">{entity.category}</Tag> : '-'),
        },
        {
          dataIndex: 'mastery',
          title: '掌握程度',
          width: 100,
          render: (_dom, entity) => <Tag color={MASTERY_COLORS[entity.mastery]}>{entity.mastery}</Tag>,
        },
        {
          dataIndex: 'key_points',
          title: '关键记忆点',
          ellipsis: true,
          render: (_dom, entity) =>
            entity.key_points.split('\n').map((point, i) => (
              <Tag key={i} style={{ marginBottom: 4 }}>
                {point.trim()}
              </Tag>
            )),
        },
        {
          dataIndex: 'audios',
          title: '录音条数',
          width: 90,
          align: 'center',
          render: (_dom, entity) => entity.audios.length,
        },
        {
          title: '操作',
          valueType: 'option',
          fixed: 'right',
          width: 130,
          render: (_dom, entity) => (
            <Space size="small">
              <EditDrawer
                initialValues={entity}
                trigger={<Button type="link">编辑</Button>}
                onSubmitted={load}
              />
              <Popconfirm title="确定删除该题目吗" onConfirm={() => handleDelete(entity.id)}>
                <Button type="link" danger>
                  删除
                </Button>
              </Popconfirm>
            </Space>
          ),
        },
      ]}
    />
  );
}
