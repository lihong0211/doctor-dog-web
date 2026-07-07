/**
 * 表数据 API：GET/POST /ai/table-data
 * 用于 Data 页面展示 docs/data.sql 中定义的表数据
 */

import { get, post, type ApiResponse, unwrapApiResponse } from './request'

const BASE = '/ai/table-data'

export interface TableDataResponse {
  list?: Record<string, unknown>[]
  data?: Record<string, unknown>[]
  total?: number
}

/** 将接口返回的 list/data 统一转为「行数组」：支持数组、单行对象、或 {0:row0,1:row1} 形态 */
function normalizeToList(rawList: unknown): Record<string, unknown>[] {
  
  if (Array.isArray(rawList)) return rawList
  if (rawList && typeof rawList === 'object' && !Array.isArray(rawList)) {
    const vals = Object.values(rawList)
    const first = vals[0]
    const isListOfRows =
      vals.length > 0 &&
      first !== null &&
      typeof first === 'object' &&
      !Array.isArray(first) &&
      !(first instanceof Date)
    if (isListOfRows) return vals as Record<string, unknown>[]
    return [rawList as Record<string, unknown>]
  }
  return []
}

/** 获取指定表的分页数据 */
export async function getTableData(params: {
  table: string
  page?: number
  page_size?: number
}): Promise<{ list: Record<string, unknown>[]; total: number }> {
  const res = await get(BASE, {
    params: {
      table: params.table,
      page: params.page ?? 1,
      page_size: params.page_size ?? 20,
    },
  }) as unknown as ApiResponse<TableDataResponse>
  const raw = unwrapApiResponse(res)
  const rawList = raw?.list ?? raw?.data ?? raw
  const list = normalizeToList(rawList)
  const safeList = Array.isArray(list) ? list : []
  const total = raw?.total ?? safeList.length
  return { list: safeList, total }
}

/** POST 方式获取表数据（同上） */
export async function postTableData(params: {
  table: string
  page?: number
  page_size?: number
}): Promise<{ list: Record<string, unknown>[]; total: number }> {
  const res = await post(BASE, {
    table: params.table,
    page: params.page ?? 1,
    page_size: params.page_size ?? 20,
  }) as unknown as ApiResponse<TableDataResponse>
  const raw = unwrapApiResponse(res)
  const rawList = raw?.list ?? raw?.data ?? raw
  const list = normalizeToList(rawList)
  const safeList = Array.isArray(list) ? list : []
  const total = raw?.total ?? safeList.length
  return { list: safeList, total }
}

/** docs/data.sql 中定义的表名列表（仅含 CREATE TABLE 的表） */
export const TABLE_NAMES = [
  'agentinfo',
  'beneficiaryinfo',
  'claiminfo',
  'crs_orders',
  'customerinfo',
  'employeeinfo',
  'heros',
  'policyinfo',
  'productinfo',
] as const

/** 每张表的列定义（按建表顺序），用于 Table 展示，title 为中文表头 */
export const TABLE_SCHEMAS: Record<string, { key: string; title: string }[]> = {
  agentinfo: [
    { key: 'AgentID', title: '代理人ID' },
    { key: 'Name', title: '姓名' },
    { key: 'Gender', title: '性别' },
    { key: 'DateOfBirth', title: '出生日期' },
    { key: 'Address', title: '地址' },
    { key: 'PhoneNumber', title: '电话' },
    { key: 'EmailAddress', title: '邮箱' },
    { key: 'CertificateNumber', title: '证书编号' },
    { key: 'LicenseIssueDate', title: '执照签发日期' },
    { key: 'LicenseExpirationDate', title: '执照到期日期' },
    { key: 'CommissionStructure', title: '佣金结构' },
  ],
  beneficiaryinfo: [
    { key: 'BeneficiaryID', title: '受益人ID' },
    { key: 'Name', title: '姓名' },
    { key: 'Gender', title: '性别' },
    { key: 'DateOfBirth', title: '出生日期' },
    { key: 'Nationality', title: '国籍' },
    { key: 'Address', title: '地址' },
    { key: 'PhoneNumber', title: '电话' },
    { key: 'EmailAddress', title: '邮箱' },
  ],
  claiminfo: [
    { key: 'ClaimNumber', title: '理赔编号' },
    { key: 'PolicyNumber', title: '保单号' },
    { key: 'ClaimDate', title: '理赔日期' },
    { key: 'ClaimType', title: '理赔类型' },
    { key: 'ClaimAmount', title: '理赔金额' },
    { key: 'ClaimStatus', title: '理赔状态' },
    { key: 'ClaimDescription', title: '理赔描述' },
    { key: 'BeneficiaryID', title: '受益人ID' },
    { key: 'MedicalRecords', title: '医疗记录' },
    { key: 'AccidentReport', title: '事故报告' },
    { key: 'ClaimHandler', title: '理赔经办人' },
    { key: 'ReviewDate', title: '审核日期' },
    { key: 'PaymentMethod', title: '支付方式' },
    { key: 'PaymentDate', title: '支付日期' },
    { key: 'DenialReason', title: '拒赔原因' },
  ],
  crs_orders: [
    { key: 'order_time', title: '下单时间' },
    { key: 'crs_user_id', title: '用户ID' },
    { key: 'eco_main_order_id', title: '主订单ID' },
    { key: 'channel', title: '渠道' },
    { key: 'status_code', title: '状态码' },
    { key: 'hotel_code', title: '酒店代码' },
    { key: 'reserved_roomtype_code', title: '预订房型代码' },
    { key: 'actual_roomtype_code', title: '实际房型代码' },
    { key: 'rate_code', title: '房价代码' },
    { key: 'rooms', title: '房间数' },
    { key: 'RNs', title: '预订夜数' },
    { key: 'adults', title: '成人数' },
    { key: 'children', title: '儿童数' },
    { key: 'no_guests', title: '客人数' },
    { key: 'total_revenue', title: '总营收' },
    { key: 'city', title: '城市' },
    { key: 'province', title: '省份' },
    { key: 'age', title: '年龄' },
    { key: 'gender', title: '性别' },
    { key: 'arrival', title: '入住日期' },
    { key: 'departure', title: '离店日期' },
    { key: 'event_timestamp', title: '事件时间' },
    { key: 'eventid', title: '事件ID' },
    { key: 'offset', title: '偏移' },
    { key: 'productid', title: '产品ID' },
  ],
  customerinfo: [
    { key: 'CustomerID', title: '客户ID' },
    { key: 'Name', title: '姓名' },
    { key: 'Gender', title: '性别' },
    { key: 'DateOfBirth', title: '出生日期' },
    { key: 'IDNumber', title: '证件号' },
    { key: 'Address', title: '地址' },
    { key: 'PhoneNumber', title: '电话' },
    { key: 'EmailAddress', title: '邮箱' },
    { key: 'MaritalStatus', title: '婚姻状况' },
    { key: 'Occupation', title: '职业' },
    { key: 'HealthStatus', title: '健康状况' },
    { key: 'RegistrationDate', title: '注册日期' },
    { key: 'CustomerType', title: '客户类型' },
    { key: 'SourceOfCustomer', title: '客户来源' },
    { key: 'CustomerStatus', title: '客户状态' },
  ],
  employeeinfo: [
    { key: 'EmployeeID', title: '员工ID' },
    { key: 'Name', title: '姓名' },
    { key: 'Gender', title: '性别' },
    { key: 'DateOfBirth', title: '出生日期' },
    { key: 'Address', title: '地址' },
    { key: 'PhoneNumber', title: '电话' },
    { key: 'EmailAddress', title: '邮箱' },
    { key: 'HireDate', title: '入职日期' },
    { key: 'Position', title: '岗位' },
    { key: 'Department', title: '部门' },
    { key: 'Salary', title: '薪资' },
    { key: 'Location', title: '工作地点' },
    { key: 'Supervisor', title: '上级' },
    { key: 'EmployeeType', title: '员工类型' },
    { key: 'EmployeeStatus', title: '员工状态' },
  ],
  heros: [
    { key: 'id', title: 'ID' },
    { key: 'name', title: '英雄名' },
    { key: 'hp_max', title: '生命上限' },
    { key: 'hp_growth', title: '生命成长' },
    { key: 'hp_start', title: '生命初始' },
    { key: 'mp_max', title: '法力上限' },
    { key: 'mp_growth', title: '法力成长' },
    { key: 'mp_start', title: '法力初始' },
    { key: 'attack_max', title: '攻击上限' },
    { key: 'attack_growth', title: '攻击成长' },
    { key: 'attack_start', title: '攻击初始' },
    { key: 'defense_max', title: '防御上限' },
    { key: 'defense_growth', title: '防御成长' },
    { key: 'defense_start', title: '防御初始' },
    { key: 'hp_5s_max', title: '5秒回血上限' },
    { key: 'hp_5s_growth', title: '5秒回血成长' },
    { key: 'hp_5s_start', title: '5秒回血初始' },
    { key: 'mp_5s_max', title: '5秒回蓝上限' },
    { key: 'mp_5s_growth', title: '5秒回蓝成长' },
    { key: 'mp_5s_start', title: '5秒回蓝初始' },
    { key: 'attack_speed_max', title: '攻速上限' },
    { key: 'attack_range', title: '攻击范围' },
    { key: 'role_main', title: '主定位' },
    { key: 'role_assist', title: '辅定位' },
    { key: 'birthdate', title: '上线日期' },
  ],
  policyinfo: [
    { key: 'PolicyNumber', title: '保单号' },
    { key: 'CustomerID', title: '客户ID' },
    { key: 'ProductID', title: '产品ID' },
    { key: 'PolicyStatus', title: '保单状态' },
    { key: 'Beneficiary', title: '受益人' },
    { key: 'Relationship', title: '与投保人关系' },
    { key: 'PolicyStartDate', title: '保单生效日' },
    { key: 'PolicyEndDate', title: '保单到期日' },
    { key: 'PremiumPaymentStatus', title: '保费缴纳状态' },
    { key: 'PaymentDate', title: '支付日期' },
    { key: 'PaymentMethod', title: '支付方式' },
    { key: 'AgentID', title: '代理人ID' },
  ],
  productinfo: [
    { key: 'ProductID', title: '产品ID' },
    { key: 'ProductName', title: '产品名称' },
    { key: 'ProductType', title: '产品类型' },
    { key: 'CoverageRange', title: '保障范围' },
    { key: 'CoverageTerm', title: '保障期限' },
    { key: 'Premium', title: '保费' },
    { key: 'PaymentFrequency', title: '缴费频率' },
    { key: 'ProductFeatures', title: '产品特点' },
    { key: 'AgeLimit', title: '年龄限制' },
    { key: 'PremiumCalculation', title: '保费计算' },
    { key: 'ClaimsProcess', title: '理赔流程' },
    { key: 'UnderwritingRequirements', title: '承保要求' },
    { key: 'SalesRegion', title: '销售区域' },
    { key: 'ProductStatus', title: '产品状态' },
  ],
}
