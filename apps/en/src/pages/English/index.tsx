import { useState } from 'react';
import { Button, ConfigProvider, Drawer } from 'antd';
import { MenuOutlined } from '@ant-design/icons';
import Root from './Root';
import Affix from './Affix';
import LivingSpeech from './LivingSpeech';
import EnDesktopWords from '../EnDesktop/Words';
import EnDesktopLibraries from '../EnDesktop/Libraries';
import EnDesktopUsers from '../EnDesktop/Users';
import './English.css';
import { enTheme } from '../../theme/antdTheme';

const modules = [
  { key: 'users', label: '用户', eyebrow: 'MEMBERS', content: <EnDesktopUsers /> },
  { key: 'words', label: '单词', eyebrow: 'VOCABULARY', content: <EnDesktopWords /> },
  { key: 'libraries', label: '词库', eyebrow: 'COLLECTIONS', content: <EnDesktopLibraries /> },
  { key: 'roots', label: '词根', eyebrow: 'WORD ROOTS', content: <Root /> },
  { key: 'affixes', label: '词缀', eyebrow: 'AFFIXES', content: <Affix /> },
  { key: 'speech', label: '日常用语', eyebrow: 'DAILY SPEECH', content: <LivingSpeech /> },
];

export default function English() {
  const [activeKey, setActiveKey] = useState('users');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const activeModule = modules.find(({ key }) => key === activeKey) ?? modules[0];

  const navigation = modules.map(({ key, label, eyebrow }, index) => (
    <button
      type="button"
      className="en-workbench-nav-item"
      aria-label={label}
      aria-current={activeKey === key ? 'page' : undefined}
      onClick={() => {
        setActiveKey(key);
        setDrawerOpen(false);
      }}
      key={key}
    >
      <span className="en-workbench-nav-index">{String(index + 1).padStart(2, '0')}</span>
      <span>
        <strong>{label}</strong>
        <small>{eyebrow}</small>
      </span>
    </button>
  ));

  return (
    <ConfigProvider theme={enTheme}>
      <section className="en-workbench">
      <header className="en-workbench-header">
        <div>
          <div className="en-workbench-eyebrow">ENGLISH WORKBENCH</div>
          <h1>英语学习中心</h1>
          <p>管理单词、词库、词根词缀和生活口语内容</p>
        </div>
        <div className="en-workbench-header-actions">
          <span className="en-workbench-status">CONTENT LAB</span>
          <Button
            className="en-workbench-menu-trigger"
            icon={<MenuOutlined />}
            onClick={() => setDrawerOpen(true)}
          >
            {activeModule.label}
          </Button>
        </div>
      </header>

      <div className="en-workbench-body">
        <nav className="en-workbench-sidebar" aria-label="英语学习模块">
          <div className="en-workbench-sidebar-label">MODULES / 06</div>
          {navigation}
        </nav>
        <main className="en-workbench-panel">
          <div className="en-workbench-panel-heading">
            <span>{activeModule.eyebrow}</span>
            <h2>{activeModule.label}</h2>
          </div>
          <div className="en-workbench-module">{activeModule.content}</div>
        </main>
      </div>

      <Drawer
        title="英语学习模块"
        placement="left"
        width={286}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        rootClassName="en-workbench-drawer"
      >
        <nav aria-label="英语学习模块">{navigation}</nav>
      </Drawer>
      </section>
    </ConfigProvider>
  );
}
