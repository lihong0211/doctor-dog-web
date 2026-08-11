import { useState } from 'react';
import { Segmented } from 'antd';
import List from './List';
import QuickMemory from './QuickMemory';

export default function EnDesktopInterview() {
  const [mode, setMode] = useState<'list' | 'memory'>('list');

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: 12 }}>
        <Segmented
          value={mode}
          onChange={(v) => setMode(v as 'list' | 'memory')}
          options={[
            { label: '列表', value: 'list' },
            { label: '快速记忆', value: 'memory' },
          ]}
        />
      </div>
      <div style={{ flex: 1, minHeight: 0, overflow: mode === 'memory' ? 'auto' : 'visible' }}>
        {mode === 'list' ? <List /> : <QuickMemory />}
      </div>
    </div>
  );
}
