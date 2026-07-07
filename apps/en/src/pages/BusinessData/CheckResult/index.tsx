import { ProTable } from '@ant-design/pro-components';
import {  Tag } from 'antd';
import request from '../../../request';

type ItemType = {
  platform: string;
  patientSex: number;
  patientAge: number;
  primaryDiagnosis: string;
  medicineName: string;
  specification: string;
  takeDirection: string;
  takeFrequence: number;
  takeDose: number;
  formType: string;
  pass_flag: boolean;
  error: string;
};

export default function CheckResult() {
  return (
    <ProTable<ItemType>
      rowKey="id"
      scroll={{ y: 460, x: 1500 }}
      columns={[
        {
          dataIndex: 'platform',
          title: '平台',
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
          dataIndex: 'medicineName',
          title: '药品名称',
          width: 150,
          ellipsis: true,
        },
        {
          dataIndex: 'specification',
          title: '规格',
          width: 120,
          hideInSearch: true,
        },
        {
          dataIndex: 'formType',
          title: '剂型',
          width: 100,
          hideInSearch: true,
        },
        {
          dataIndex: 'takeDose',
          title: '用量',
          width: 100,
          hideInSearch: true,
        },
        {
          dataIndex: 'takeDirection',
          title: '用法',
          width: 120,
          hideInSearch: true,
        },
        {
          dataIndex: 'takeFrequence',
          title: '频次',
          width: 100,
          hideInSearch: true,
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
          dataIndex: 'error',
          title: '错误信息',
          width: 200,
          hideInSearch: true,
          render: (_, entity) => {
            if (!entity.error) {
              return <span>-</span>;
            }
            try {
              const errors = typeof entity.error === 'string' 
                ? JSON.parse(entity.error) 
                : entity.error;
              
              if (!Array.isArray(errors) || errors.length === 0) {
                return <span>-</span>;
              }

              // 根据 level 设置不同的颜色
              const getColor = (level: number) => {
                if (level >= 4) return 'red';
                if (level >= 3) return 'orange';
                if (level >= 2) return 'gold';
                return 'default';
              };

              return (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {errors.map((item: any, index: number) => (
                    <Tag key={index} color={getColor(item.level)}>
                      {item.name || item}
                    </Tag>
                  ))}
                </div>
              );
            } catch {
              return <span>{entity.error}</span>;
            }
          },
        },
      ]}
      request={async ({ current, pageSize, ...rest }) => {
        const data = await request.post(`/peach/check-result/list`, {
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
