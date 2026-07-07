import { Tabs } from 'antd';

import Words from './Words';
import Root from './Root';
import Affix from './Affix';
import Dialogue from './Dialogue';
import LivingSpeech from './LivingSpeech';
import Test from './Test';

export default function English() {
  const items = [
    {
      label: '单词',
      key: '1',
      children: <Words />,
    },
    {
      label: '词根',
      key: '2',
      children: <Root />,
    },

    {
      label: '词缀',
      key: '3',
      children: <Affix />,
    },
    {
      label: '电影对白',
      key: '4',
      children: <Dialogue />,
    },
    {
      label: '日常用语',
      key: '5',
      children: <LivingSpeech />,
    },
    {
      label: '单词听写',
      key: '6',
      children: <Test />,
    },
  ];

  return (
    <>
      <Tabs
        items={items}
        defaultActiveKey={'1'}
        // className="pt-[5px] px-[20px]"
        style={{
          height: 'calc(100vh - 180px)',
        }}
      />
    </>
  );
}
