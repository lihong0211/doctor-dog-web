import { ProTable } from '@ant-design/pro-components';
import { Tag } from 'antd';
import request from '../../../request';

type ItemType = {
  pass_flag: any;
  id: number;
  pharmacist: string;
  patientSex: number;
  patientAge: number;
  primaryDiagnosis: string;
  reason: string;
  rpID: string;
  refuse: number;
  costTime: number;
};

export default function AliReport() {
  return (
    <ProTable<ItemType>
      rowKey="id"
      scroll={{ y: 460, x: 1500 }}
      columns={[
        {
          dataIndex: 'pharmacist',
          title: '药师',
          width: 100,
        },
        {
          dataIndex: 'patientSex',
          title: '性别',
          width: 80,
          hideInSearch: true,
          render: (_, entity) => {
            const sex = entity.patientSex;
            if (sex === 1) return '男';
            if (sex === 2) return '女';
            return sex ? String(sex) : '-';
          },
        },
        {
          dataIndex: 'patientAge',
          title: '年龄',
          width: 80,
          hideInSearch: true,
        },
        {
          dataIndex: 'primaryDiagnosis',
          title: '主要诊断',
          width: 150,
          ellipsis: true,
        },
        {
            dataIndex: 'medicines',
            title: '药品信息',
            width: 200,
            ellipsis: true,
          },
        {
          dataIndex: 'pass_flag',
          title: '通过',
          width: 80,
          hideInSearch: true,
          render: (_, entity) => (
            <Tag color={entity.pass_flag ? 'green' : 'red'}>
              {entity.pass_flag ? '是' : '否'}
            </Tag>
          ),
        },
        {
          dataIndex: 'refuse',
          title: '拒绝次数',
          width: 100,
          hideInSearch: true,
        },
        {
          dataIndex: 'costTime',
          title: '耗时(ms)',
          width: 100,
          hideInSearch: true,
        },
        {
          dataIndex: 'reason',
          title: '原因',
          width: 150,
          ellipsis: true,
          hideInSearch: true,
        },
      ]}
      request={async ({ current, pageSize, ...rest }) => {
        const data = await request.post(`/peach/ali-report/list`, {
          page: current,
          size: pageSize,
          query: {
            ...rest,
          },
        });
        return {
          success: true,
          ...data,
        };
      }}
    />
  );
}
