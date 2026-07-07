import { Tabs } from 'antd';


import AliReport from './AliReport';
import CheckResult from './CheckResult';

export default function English() {
  const items = [
    {
      label: '阿里报告',
      key: '1',
      children: <AliReport />,
    },
    {
      label: '合理用药',
      key: '2',
      children: <CheckResult />,
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
