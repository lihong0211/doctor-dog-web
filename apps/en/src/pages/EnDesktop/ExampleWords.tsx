import { useEffect, useState } from 'react';
import { Drawer, Select, Tag, message } from 'antd';
import request from '../../request';
import { requireAuth } from './authGuard';

type WordOption = { id: number; word: string };
type Entity = { id: number; name: string; words: WordOption[] } | null;

export default function ExampleWords(props: {
  entityType: 'roots' | 'affixes';
  entity: Entity;
  onClose(): void;
  onChanged?(): void;
}) {
  const [words, setWords] = useState<WordOption[]>([]);
  const [searching, setSearching] = useState(false);
  const [options, setOptions] = useState<{ label: string; value: number }[]>([]);
  const idKey = props.entityType === 'roots' ? 'root_id' : 'affix_id';

  useEffect(() => {
    setWords(props.entity?.words || []);
  }, [props.entity]);

  const searchWords = (keyword: string) => {
    if (!keyword) {
      setOptions([]);
      return;
    }
    setSearching(true);
    request
      .get('/en-desktop/words/list', { params: { page: 1, page_size: 20, search: keyword } })
      .then((data: any) => {
        setOptions((data.list || []).map((w: WordOption) => ({ label: w.word, value: w.id })));
      })
      .finally(() => setSearching(false));
  };

  const addWord = (wordId: number, wordText: string) => {
    if (!props.entity) return;
    if (!requireAuth()) return;
    request
      .post(`/en-desktop/${props.entityType}/add-word`, { [idKey]: props.entity.id, word_id: wordId })
      .then(() => {
        message.success('已添加');
        setWords((prev) => (prev.some((w) => w.id === wordId) ? prev : [...prev, { id: wordId, word: wordText }]));
        props.onChanged?.();
      })
      .catch((e) => message.error(typeof e === 'string' ? e : '添加失败'));
  };

  const removeWord = (wordId: number) => {
    if (!props.entity) return;
    if (!requireAuth()) return;
    request
      .post(`/en-desktop/${props.entityType}/remove-word`, { [idKey]: props.entity.id, word_id: wordId })
      .then(() => {
        message.success('已移除');
        setWords((prev) => prev.filter((w) => w.id !== wordId));
        props.onChanged?.();
      })
      .catch((e) => message.error(typeof e === 'string' ? e : '操作失败'));
  };

  return (
    <Drawer title={props.entity ? `「${props.entity.name}」的例词` : ''} open={!!props.entity} onClose={props.onClose} width={480}>
      <Select
        showSearch
        placeholder="搜索单词并添加为例词"
        style={{ width: '100%', marginBottom: 16 }}
        filterOption={false}
        loading={searching}
        options={options}
        onSearch={searchWords}
        onSelect={(value, option) => value != null && addWord(value, option.label as string)}
        value={null}
      />
      <div>
        {words.length ? (
          words.map((w) => (
            <Tag key={w.id} closable onClose={() => removeWord(w.id)} style={{ marginBottom: 8 }}>
              {w.word}
            </Tag>
          ))
        ) : (
          <span style={{ color: '#999' }}>还没有例词</span>
        )}
      </div>
    </Drawer>
  );
}
