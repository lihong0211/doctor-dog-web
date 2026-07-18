import { useState } from 'react';
import { Drawer, Button, Select, Popconfirm, message } from 'antd';
import { ProTable } from '@ant-design/pro-components';
import request from '../../../request';
import { requireAuth } from '../authGuard';

type WordItem = { id: number; word: string; en_pronunciation: string; us_pronunciation: string };

export default function LibraryWords(props: { library: { id: number; name: string } | null; onClose(): void }) {
  const [reloadKey, setReloadKey] = useState(0);
  const [searching, setSearching] = useState(false);
  const [options, setOptions] = useState<{ label: string; value: number }[]>([]);

  const searchWords = (keyword: string) => {
    if (!keyword) {
      setOptions([]);
      return;
    }
    setSearching(true);
    request
      .get('/en-desktop/words/list', { params: { page: 1, page_size: 20, search: keyword } })
      .then((data: any) => {
        setOptions((data.list || []).map((w: WordItem) => ({ label: w.word, value: w.id })));
      })
      .finally(() => setSearching(false));
  };

  const addWord = (wordId: number) => {
    if (!props.library) return;
    if (!requireAuth()) return;
    request
      .post('/en-desktop/libraries/add-word', { library_id: props.library.id, word_id: wordId })
      .then(() => {
        message.success('已添加');
        setReloadKey((k) => k + 1);
      })
      .catch((e) => message.error(typeof e === 'string' ? e : '添加失败'));
  };

  return (
    <Drawer
      title={props.library ? `词库「${props.library.name}」的单词` : ''}
      open={!!props.library}
      onClose={props.onClose}
      width={640}
      destroyOnClose
    >
      <Select
        showSearch
        placeholder="搜索单词并添加到词库"
        style={{ width: '100%', marginBottom: 16 }}
        filterOption={false}
        loading={searching}
        options={options}
        onSearch={searchWords}
        onSelect={(value) => value != null && addWord(value)}
        value={null}
      />
      <ProTable<WordItem>
        key={reloadKey}
        rowKey="id"
        search={false}
        toolBarRender={false}
        columns={[
          { dataIndex: 'word', title: '单词' },
          { dataIndex: 'en_pronunciation', title: '英式音标' },
          { dataIndex: 'us_pronunciation', title: '美式音标' },
          {
            title: '操作',
            valueType: 'option',
            render(_dom, entity, _index, action) {
              return (
                <Popconfirm
                  title="从词库中移除该单词？"
                  onConfirm={() => {
                    if (!requireAuth()) return;
                    request
                      .post('/en-desktop/libraries/remove-word', {
                        library_id: props.library!.id,
                        word_id: entity.id,
                      })
                      .then(() => {
                        message.success('已移除');
                        action?.reload();
                      })
                      .catch((e) => message.error(typeof e === 'string' ? e : '操作失败'));
                  }}
                >
                  <Button type="link">移除</Button>
                </Popconfirm>
              );
            },
          },
        ]}
        request={async ({ current, pageSize }) => {
          if (!props.library) return { success: true, data: [], total: 0 };
          const data: any = await request.get(`/en-desktop/libraries/${props.library.id}/words`, {
            params: { page: current, page_size: pageSize },
          });
          return { success: true, data: data.list, total: data.total };
        }}
      />
    </Drawer>
  );
}
