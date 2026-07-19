import { ConfigProvider } from 'antd';
import { useSearchParams } from 'react-router-dom';
import Root from './Root';
import Affix from './Affix';
import LivingSpeech from './LivingSpeech';
import EnDesktopWords from '../EnDesktop/Words';
import EnDesktopLibraries from '../EnDesktop/Libraries';
import EnDesktopUsers from '../EnDesktop/Users';
import './English.css';
import { enTheme } from '../../theme/antdTheme';

const modules = {
  users: { label: '用户', content: <EnDesktopUsers /> },
  words: { label: '单词', content: <EnDesktopWords /> },
  libraries: {
    label: '词库',
    content: <EnDesktopLibraries />,
  },
  roots: { label: '词根', content: <Root /> },
  affixes: { label: '词缀', content: <Affix /> },
  speech: {
    label: '日常用语',
    content: <LivingSpeech />,
  },
} as const;

type ModuleKey = keyof typeof modules;

export default function English() {
  const [searchParams] = useSearchParams();
  const requestedModule = searchParams.get('module');
  const activeKey: ModuleKey =
    requestedModule && requestedModule in modules
      ? (requestedModule as ModuleKey)
      : 'users';
  const activeModule = modules[activeKey];

  return (
    <ConfigProvider theme={enTheme}>
      <section className="en-workbench">
        <main className="en-workbench-panel">
          <div className="en-workbench-panel-heading">
            <h2>{activeModule.label}</h2>
          </div>
          <div className="en-workbench-module">{activeModule.content}</div>
        </main>
      </section>
    </ConfigProvider>
  );
}
