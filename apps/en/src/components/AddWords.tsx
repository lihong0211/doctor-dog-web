import { Form, Input, Button, Card, message, Popconfirm, Select } from 'antd';
import { css } from '@emotion/react';
import { useState, useEffect } from 'react';
import request from '../../src/request';

export default function AddWords(props: { form: any }) {
  const [words, setWords] = useState<{ word: string; meaning: string }[]>([]);
  const getWords = () => {
    request.post('/english/words/list', { page: 1, size: 10000 }).then((res) => {
      setWords(() =>
        res?.data.map((item: { [x: string]: any }) => {
          return {
            label: item.word,
            value: item.word,
            key: `${item.id}/${item.meaning}`,
          };
        })
      );
    });
  };
  useEffect(() => {
    getWords();
  }, []);

  const { setFieldValue } = props.form;

  return (
    <div
      css={css`
        .ant-form-item: {
          margin-bottom: 5px;
        }
      `}
    >
      <Form.Item label="单词">
        <Form.List name="words">
          {(fields, { add, remove }) => (
            <>
              <div className="flex flex-wrap">
                {fields.map((item, i) => (
                  <Card
                    className="m-2"
                    hoverable
                    style={{ width: '31%' }}
                    headStyle={{
                      padding: 0,
                      minHeight: 1,
                      border: 'none',
                    }}
                    bodyStyle={{
                      padding: 10,
                    }}
                  >
                    <Form.Item
                      label="单词"
                      name={[item.name, 'word']}
                      style={{ marginBottom: 5 }}
                    >
                      <Select
                        placeholder="请选择"
                        options={words}
                        showSearch
                        allowClear
                        labelInValue
                        onChange={(row) => {
                          setFieldValue(
                            ['words', item.name, 'meaning'],
                            row.key.split('/')[1]
                          );
                          setFieldValue(
                            ['words', item.name, 'word'],
                            row.value
                          );
                        }}
                        onKeyDown={(e) => {
                          if (e.code.toLocaleLowerCase() === 'enter') {
                            e.stopPropagation();
                            e.preventDefault();
                            setFieldValue(
                              ['words', item.name, 'word'],
                              // @ts-ignore
                              e.target.value
                            );
                            setFieldValue(
                              ['words', item.name, 'meaning'],
                              // @ts-ignore
                              ''
                            );
                          }
                        }}
                        onBlur={(e) => {
                          // @ts-ignore
                          e.target.value &&
                            setFieldValue(
                              ['words', item.name, 'word'],
                              // @ts-ignore
                              e.target.value
                            );
                        }}
                      />
                    </Form.Item>
                    <Form.Item
                      label="释义"
                      name={[item.name, 'meaning']}
                      style={{ marginBottom: 5 }}
                    >
                      <Input placeholder="请输入" />
                    </Form.Item>
                    <Form.Item style={{ marginBottom: 0, marginTop: 10 }}>
                      <Button
                        type="primary"
                        size="small"
                        style={{ float: 'right' }}
                        onClick={async () => {
                          const url = '/english/words/add';
                          const words = props.form.getFieldValue('words');
                          const data = words[item.name];
                          request
                            .post(url, {
                              ...data,
                              word: data.word?.value
                                ? data.word?.value
                                : data.word,
                            })
                            .then(() => {
                              message.success('添加单词成功');
                              getWords();
                            })
                            .catch((e) => {
                              message.error(e.message);
                            });
                        }}
                      >
                        保存
                      </Button>
                      <Popconfirm
                        onConfirm={() => remove(i)}
                        title={'删除单词'}
                      >
                        <Button
                          type="primary"
                          size="small"
                          style={{ float: 'right', marginRight: 15 }}
                        >
                          删除
                        </Button>
                      </Popconfirm>
                    </Form.Item>
                  </Card>
                ))}
              </div>
              <Button
                onClick={() => add({ word: '', meaning: '' })}
                size="small"
                type="primary"
              >
                添加单词
              </Button>
            </>
          )}
        </Form.List>
      </Form.Item>
    </div>
  );
}
