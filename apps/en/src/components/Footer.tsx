import { Button } from 'antd';

export default function AddDialogue() {
  const record = 'https://beian.miit.gov.cn/#/Integrated/index';
  const safe = 'https://beian.mps.gov.cn/#/query/webSearch';
  return (
    <div
      className="absolute bottom-0 h-[50px] flex items-center justify-center w-full"
      style={{ borderTop: '1px dashed #ddd' }}
    >
      <Button type="link" href={record}>
        备案号：蜀ICP备2024044574号
      </Button>
      <Button type="link" href={safe}>
        <img
          src="https://beian.mps.gov.cn//img/logo01.dd7ff50e.png"
          className="w-[15px] h-[16px] mr-1"
          style={{ transform: 'translateY(-2px)' }}
        />
        XX网安备：xxxxx
      </Button>
    </div>
  );
}
