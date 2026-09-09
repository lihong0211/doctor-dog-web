// AI 股票分析页面的接口调用层，对应后端 service/ai/stock_analysis.py 的 5 个路由。
// 独立模块，不跟 text2sql 相关代码有任何依赖关系。
import request, { unwrapApiResponse, type ApiResponse } from './request'

/** 一支股票的搜索结果条目：Tushare 代码 + 中文名称 */
export interface StockHit {
  ts_code: string
  name: string
}

/**
 * 常用股票快捷入口：渲染在搜索框下方的"常用股票"标签，点击即可直接选中并进入分析，
 * 不需要发搜索请求。
 * 内容跟后端 stock_analysis.py 里的 _FALLBACK_STOCKS 保持一致（选了其中一部分最常见的），
 * 这样即使后端搜索接口因为 Tushare stock_basic 限频而暂时不可用，用户也能用这些常用股票
 * 走完整个分析流程。
 */
export const POPULAR_STOCKS: StockHit[] = [
  { ts_code: '600519.SH', name: '贵州茅台' },
  { ts_code: '000858.SZ', name: '五粮液' },
  { ts_code: '600036.SH', name: '招商银行' },
  { ts_code: '601318.SH', name: '中国平安' },
  { ts_code: '300750.SZ', name: '宁德时代' },
  { ts_code: '002594.SZ', name: '比亚迪' },
  { ts_code: '688981.SH', name: '中芯国际' },
  { ts_code: '000651.SZ', name: '格力电器' },
  { ts_code: '000333.SZ', name: '美的集团' },
  { ts_code: '300059.SZ', name: '东方财富' },
]

/** “行情查询 / 自动配图” 接口的返回：表格数据 + 一张 base64 内嵌的 PNG 图表 */
export interface PriceQueryResult {
  columns: string[]
  rows: (string | number)[][]
  image_base64: string
}

/** ARIMA 预测结果里单个预测日的数据点 */
export interface ArimaForecastPoint {
  date: string
  predicted_close: number
}

/** ARIMA 预测接口的返回：逐日预测值 + 一句趋势总结文字 + 图表 */
export interface ArimaResult {
  forecast: ArimaForecastPoint[]
  trend_summary: string
  image_base64: string
}

/** 布林带检测接口的返回：超买/超卖各是 [日期, 收盘价] 的元组数组 + 图表 */
export interface BollResult {
  overbought: [string, number][]
  oversold: [string, number][]
  image_base64: string
}

/** Prophet 周期分解接口的返回：只有一张分解图（trend/weekly/yearly 三个子图拼在一起） */
export interface ProphetResult {
  image_base64: string
}

/** 可选的日期区间参数，留空时后端会用默认区间（近一年到今天） */
export interface DateRange {
  start_date?: string
  end_date?: string
}

/** 按股票名称或代码模糊搜索，返回可供其余接口使用的 ts_code 列表 */
export async function searchStock(keyword: string): Promise<StockHit[]> {
  const res = await request.get('/ai/stock-analysis/search', {
    params: { keyword },
  }) as unknown as ApiResponse<{ list: StockHit[] }>
  return unwrapApiResponse(res).list
}

/** 行情查询 + 自动配图：查一段区间的历史行情，后端会按数据点多少自动选折线/柱状图 */
export async function queryStockPrices(tsCode: string, range: DateRange = {}): Promise<PriceQueryResult> {
  const res = await request.post('/ai/stock-analysis/query', {
    ts_code: tsCode,
    ...range,
  }) as unknown as ApiResponse<PriceQueryResult>
  return unwrapApiResponse(res)
}

/** ARIMA(5,1,5) 预测未来 n 天收盘价。建模+预测比较耗时，超时时间放宽到 60s */
export async function arimaForecast(tsCode: string, n: number): Promise<ArimaResult> {
  const res = await request.post('/ai/stock-analysis/arima', {
    ts_code: tsCode,
    n,
  }, { timeout: 60000 }) as unknown as ApiResponse<ArimaResult>
  return unwrapApiResponse(res)
}

/** 布林带（20 日 + 2σ）超买超卖异常点检测 */
export async function bollDetection(tsCode: string, range: DateRange = {}): Promise<BollResult> {
  const res = await request.post('/ai/stock-analysis/boll', {
    ts_code: tsCode,
    ...range,
  }) as unknown as ApiResponse<BollResult>
  return unwrapApiResponse(res)
}

/** Prophet trend/weekly/yearly 周期性分解。跟 ARIMA 一样是耗时操作，超时放宽到 60s */
export async function prophetAnalysis(tsCode: string, range: DateRange = {}): Promise<ProphetResult> {
  const res = await request.post('/ai/stock-analysis/prophet', {
    ts_code: tsCode,
    ...range,
  }, { timeout: 60000 }) as unknown as ApiResponse<ProphetResult>
  return unwrapApiResponse(res)
}
