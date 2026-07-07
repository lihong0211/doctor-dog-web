import { css } from '@emotion/react';
import { useEffect, useState } from 'react';
import { Card, Checkbox, Input, Tabs, message, Button } from 'antd';
import request from '../../../request';
import doneImg from './images/done.png';
import loadingImg from './images/loading2.png';

export default function WordList() {
  const [data, setData] = useState<any[]>([]);
  const [tabIndex, setTabIndex] = useState('1');
  const getList = (tabIndex: string) => {
    request
      .post(`/english/words/list`, {
        page: 1,
        size: 10000,
        query: {
          mastered: tabIndex === '1' ? 1 : 2,
        },
      })
      .then((res: any) => {
        const ret = [];
        for (let i = 0; i < Math.min(20, res?.data?.length); i++) {
          let idx = Math.floor(Math.random() * res?.data?.length);
          ret.push(res?.data[idx]);
          res?.data?.splice(idx, 1);
        }
        setData(ret);
      });
  };
  useEffect(() => {
    getList('1');
  }, []);
  const style = css`
    @keyframes movingMask {
      from {
        left: 0;
      }
      to {
        left: 100%;
      }
    }
    @keyframes loading {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }
    .ps-status {
      width: 17px;
      height: 17px;
      transform: translateY(16px);
      vertical-align: middle;
      display: inline-block;
      animation: loading 1.5s ease-in-out 10000;
      background: url(${loadingImg}) center/cover no-repeat;
    }
    .ps-status-done {
      animation: none;
      transform: translateY(-3px);
      background: url(${doneImg}) center/cover no-repeat;
      overflow: hidden;
    }
    .ps-status-done:after {
      position: absolute;
      width: 100%;
      height: 100%;
      background-color: rgb(243, 244, 246);
      content: '';
      left: 0;
      animation: movingMask 0.6s ease-in-out 1;
      animation-fill-mode: forwards;
    }
  `;
  const Content = (
    <>
      <div className="relative">
        <div
          className="flex flex-wrap overflow-y-scroll justify-center"
          style={{
            height: 'calc(100vh - 280px)',
          }}
        >
          {data.map((item, index) => {
            return (
              item && (
                <Card
                  className="w-[350px] m-3 animate__animated animate__fadeIn h-[90px]"
                  bodyStyle={{ padding: 10 }}
                  key={index}
                >
                  <div className="flex items-center justify-between mb-[10px]">
                    <div className="overflow-hidden nowrap ellipsis">
                      {item.meaning}
                    </div>
                    <Checkbox
                      className="cursor-pointer"
                      checked={item.mastered === 1}
                      onClick={() => {
                        request
                          .post('/english/words/update', {
                            ...item,
                            mastered: item.mastered === 1 ? 2 : 1,
                          })
                          .then(() => {
                            message.success('操作成功');
                            setData((prev) => {
                              const temp = [...prev];
                              temp.splice(index, 1);
                              return temp;
                            });
                          });
                      }}
                    >
                      已掌握
                    </Checkbox>
                  </div>

                  <Input
                    allowClear
                    value={item.test}
                    placeholder="请输入..."
                    onChange={(e) =>
                      setData((prev) => {
                        const temp = [...prev];
                        temp[index].test = e.target.value;
                        return temp;
                      })
                    }
                    addonBefore={
                      <div
                        className="flex h-[25px] items-center text-xs text-gray-500 md:text-sm"
                        css={style}
                      >
                        {item.test ? (
                          <span>
                            {item.test === item.word ? (
                              <div
                                className="ps-status ps-status-done"
                                style={{ backgroundImage: `url(${doneImg}` }}
                              />
                            ) : (
                              <div
                                className="ps-status"
                                style={{ backgroundImage: `url(${loadingImg}` }}
                              />
                            )}
                          </span>
                        ) : (
                          <></>
                        )}
                      </div>
                    }
                    addonAfter={
                      item.test !== item.word && (
                        <span
                          className="text-blue-500 cursor-pointer"
                          onClick={() => {
                            setData((prev) => {
                              const temp = [...prev];
                              temp[index].test = temp[index].word;
                              return temp;
                            });
                          }}
                        >
                          提示
                        </span>
                      )
                    }
                  />
                </Card>
              )
            );
          })}
        </div>
        <div className="absolute top-[5px] right-0">
          <Button
            className="mt-2 ml-2"
            type="primary"
            onClick={() => {
              getList(tabIndex);
            }}
          >
            换一批
          </Button>
        </div>
      </div>
    </>
  );
  return (
    <Tabs
      tabPosition="left"
      type="card"
      centered
      animated
      items={[
        {
          label: '已掌握',
          key: '1',
          children: Content,
        },
        {
          label: '未掌握',
          key: '2',
          children: Content,
        },
      ]}
      defaultActiveKey="1"
      onChange={(tabIndex) => {
        getList(tabIndex);
        setTabIndex(tabIndex);
      }}
    />
  );
}
