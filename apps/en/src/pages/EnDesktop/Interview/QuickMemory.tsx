import { useEffect, useMemo, useState } from 'react';
import { Button, Select, Tag, Spin, Empty, message } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import request from '../../../request';
import { requireAuth } from '../authGuard';
import { MASTERY_COLORS, MASTERY_LEVELS, mainCategory, type QuestionItem } from './types';

export default function QuickMemory() {
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [category, setCategory] = useState<string | undefined>();
  const [mastery, setMastery] = useState<string | undefined>();
  const [index, setIndex] = useState(0);
  const [showPoints, setShowPoints] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);

  const load = () => {
    setLoading(true);
    request
      .post('/english/interview/list')
      .then((data: any) => setQuestions(data as QuestionItem[]))
      .catch((e) => message.error(typeof e === 'string' ? e : '加载失败'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const categoryOptions = useMemo(
    () => Array.from(new Set(questions.map((q) => mainCategory(q.category)).filter(Boolean))),
    [questions],
  );

  const filtered = useMemo(
    () =>
      questions.filter(
        (q) => (!category || mainCategory(q.category) === category) && (!mastery || q.mastery === mastery),
      ),
    [questions, category, mastery],
  );

  useEffect(() => {
    setIndex(0);
    setShowPoints(false);
    setShowAnswer(false);
  }, [category, mastery]);

  const current = filtered[index];

  const goto = (delta: number) => {
    if (!filtered.length) return;
    setIndex((i) => (i + delta + filtered.length) % filtered.length);
    setShowPoints(false);
    setShowAnswer(false);
  };

  const updateMastery = async (level: string) => {
    if (!current || !requireAuth()) return;
    await request
      .post('/english/interview/mastery/update', { id: current.id, mastery: level })
      .then(() => {
        setQuestions((prev) => prev.map((q) => (q.id === current.id ? { ...q, mastery: level } : q)));
      })
      .catch((e) => message.error(typeof e === 'string' ? e : '更新失败'));
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
        <Spin />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '16px 0' }}>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <Select
          allowClear
          placeholder="按分类筛选"
          style={{ width: 220 }}
          value={category}
          onChange={setCategory}
          options={categoryOptions.map((c) => ({ label: c, value: c }))}
        />
        <Select
          allowClear
          placeholder="按掌握程度筛选"
          style={{ width: 160 }}
          value={mastery}
          onChange={setMastery}
          options={MASTERY_LEVELS.map((m) => ({ label: m, value: m }))}
        />
      </div>

      {!current ? (
        <Empty description="没有符合条件的题目" />
      ) : (
        <div
          style={{
            border: '1px solid var(--en-border)',
            borderRadius: 12,
            background: 'var(--en-surface-1)',
            padding: 24,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              {current.category && <Tag color="geekblue">{current.category}</Tag>}
              <Tag color={MASTERY_COLORS[current.mastery]}>{current.mastery}</Tag>
            </div>
            <span style={{ color: 'var(--en-text-secondary)' }}>
              {index + 1} / {filtered.length}
            </span>
          </div>

          <h3 style={{ fontSize: 20, color: 'var(--en-text-primary)', marginBottom: 20 }}>{current.question}</h3>

          {!showPoints ? (
            <Button block onClick={() => setShowPoints(true)}>
              显示记忆点
            </Button>
          ) : (
            <div style={{ marginBottom: 16 }}>
              {current.key_points.split('\n').map((point, i) => (
                <Tag key={i} style={{ marginBottom: 6 }}>
                  {point.trim()}
                </Tag>
              ))}
            </div>
          )}

          {showPoints && !showAnswer && (
            <Button block onClick={() => setShowAnswer(true)}>
              显示口语稿
            </Button>
          )}

          {showAnswer && (
            <div
              style={{
                whiteSpace: 'pre-wrap',
                lineHeight: 1.8,
                color: 'var(--en-text-primary)',
                marginTop: 8,
              }}
            >
              {current.spoken_desc}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}>
            {MASTERY_LEVELS.map((level) => (
              <Button
                key={level}
                type={current.mastery === level ? 'primary' : 'default'}
                size="small"
                onClick={() => updateMastery(level)}
              >
                {level}
              </Button>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
            <Button icon={<LeftOutlined />} onClick={() => goto(-1)}>
              上一题
            </Button>
            <Button icon={<RightOutlined />} iconPosition="end" onClick={() => goto(1)}>
              下一题
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
