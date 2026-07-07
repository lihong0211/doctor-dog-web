import { Form, Input, Button, Card } from 'antd';
import { CloseCircleOutlined } from '@ant-design/icons';
import { css } from '@emotion/react';

export default function AddDialogue(props: { form: any }) {
  return (
    <div
      css={css`
        .ant-form-item: {
          margin-bottom: 5px;
        }
      `}
    >
      <Form.Item label="对白">
        <Form.List name="dialogue">
          {(fields, { add, remove }) => (
            <>
              <div className="">
                {fields.map((item, i) => (
                  <Card
                    className="m-2"
                    hoverable
                    headStyle={{
                      padding: 0,
                      minHeight: 1,
                      border: 'none',
                    }}
                    bodyStyle={{
                      padding: 10,
                    }}
                    title={
                      <CloseCircleOutlined
                        className="text-gray-500 cursor-pointer absolute right-[-8px] top-[-3px]"
                        onClick={() => remove(i)}
                      />
                    }
                  >
                    <Form.Item
                      label="对白"
                      name={[item.name, 'dialogue']}
                      style={{ marginBottom: 5 }}
                    >
                      <Input.TextArea autoSize placeholder="请输入" />
                    </Form.Item>
                    <Form.Item
                      label="释义"
                      name={[item.name, 'meaning']}
                      style={{ marginBottom: 5 }}
                    >
                      <Input.TextArea autoSize placeholder="请输入" />
                    </Form.Item>
                  </Card>
                ))}
              </div>
              <Button
                onClick={() => add({ dialogue: '', meaning: '' })}
                size="small"
                type="primary"
              >
                添加对白
              </Button>
            </>
          )}
        </Form.List>
      </Form.Item>
    </div>
  );
}
