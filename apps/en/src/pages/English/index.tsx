import { Tabs } from 'antd';

import Root from './Root';
import Affix from './Affix';
import LivingSpeech from './LivingSpeech';
import EnDesktopWords from '../EnDesktop/Words';
import EnDesktopLibraries from '../EnDesktop/Libraries';
import EnDesktopUsers from '../EnDesktop/Users';

export default function English() {
  const items = [
    {
      label: '单词',
      key: '1',
      children: <EnDesktopWords />,
    },
    {
      label: '词库',
      key: '2',
      children: <EnDesktopLibraries />,
    },
    {
      label: '用户',
      key: '3',
      children: <EnDesktopUsers />,
    },
    {
      label: '词根',
      key: '4',
      children: <Root />,
    },
    {
      label: '词缀',
      key: '5',
      children: <Affix />,
    },
    {
      label: '日常用语',
      key: '6',
      children: <LivingSpeech />,
    },
  ];

  return (
    <Tabs
      items={items}
      defaultActiveKey={'1'}
      style={{
        height: 'calc(100vh - 180px)',
      }}
    />
  );
}
