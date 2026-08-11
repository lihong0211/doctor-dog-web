import { useRef, useState } from 'react';
import { ProTable, type ActionType } from '@ant-design/pro-components';
import { Button, Tag, message } from 'antd';
import { SoundOutlined, LoadingOutlined } from '@ant-design/icons';
import request from '../../../request';
import { requireAuth } from '../authGuard';
import EditDrawer from './EditDrawer';
import { MASTERY_COLORS, type QuestionItem } from './types';

export default function InterviewList() {
  const actionRef = useRef<ActionType>();
  const [generatingId, setGeneratingId] = useState<number | null>(null);

  const generateTts = async (question: QuestionItem) => {
    if (!requireAuth()) return;
    setGeneratingId(question.id);
    await request
      .post('/english/interview/tts/generate', { question_id: question.id })
      .then(() => {
        message.success('语音生成成功');
        actionRef.current?.reload();
      })
      .catch((e) => message.error(typeof e === 'string' ? e : '语音生成失败'))
      .finally(() => setGeneratingId(null));
  };

  return (
    <ProTable<QuestionItem>
      actionRef={actionRef}
      rowKey="id"
      scroll={{ y: 'calc(100dvh - 311px)' }}
      search={false}
      toolBarRender={false}
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
            entity.key_points.split(',').map((point, i) => (
              <Tag key={i} style={{ marginBottom: 4 }}>
                {point.trim()}
              </Tag>
            )),
        },
        {
          title: 'TTS 音频',
          width: 220,
          render: (_dom, entity) => (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {entity.tts_audio && <audio controls src={entity.tts_audio.url} style={{ height: 28, width: 140 }} />}
              <Button
                size="small"
                icon={generatingId === entity.id ? <LoadingOutlined /> : <SoundOutlined />}
                disabled={generatingId === entity.id}
                onClick={() => generateTts(entity)}
              >
                {entity.tts_audio ? '重新生成' : '生成'}
              </Button>
            </div>
          ),
        },
        {
          title: '操作',
          valueType: 'option',
          fixed: 'right',
          width: 80,
          render: (_dom, entity, _index, action) => (
            <EditDrawer
              initialValues={entity}
              trigger={<Button type="link">编辑</Button>}
              onSubmitted={() => action?.reload()}
            />
          ),
        },
      ]}
      request={async () => {
        const data: any = await request.post('/english/interview/list');
        return { success: true, data: data as QuestionItem[] };
      }}
    />
  );
}
