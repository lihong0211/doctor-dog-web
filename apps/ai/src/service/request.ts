import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios'

const request: AxiosInstance = axios.create({
  baseURL: import.meta.env.DEV ? '' : 'https://home.doctor-dog.com',
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    // 可在此添加 token 等
    // const token = localStorage.getItem('token')
    // if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error)
)

// 响应拦截器
request.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.msg ?? error.response?.data?.message ?? error.message ?? '请求失败'
    console.error('[Request Error]', message)
    return Promise.reject(error)
  }
)

export default request

/** 后端统一响应格式：成功 code: 0，data 为业务数据 */
export interface ApiResponse<T> {
  code?: number
  msg?: string
  data?: T
}

/** 解包 code/msg/data 格式：校验 code 并返回 data，失败抛错 */
export function unwrapApiResponse<T>(res: ApiResponse<T>): T {
  if (res?.code !== undefined && res.code !== 0) {
    throw new Error(res.msg || '请求失败')
  }
  if (res?.data === undefined) {
    throw new Error('响应无 data')
  }
  return res.data as T
}

// 便捷方法
export const get = <T = unknown>(url: string, config?: AxiosRequestConfig) =>
  request.get<T>(url, config)

export const post = <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
  request.post<T>(url, data, config)

export const put = <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
  request.put<T>(url, data, config)

export const del = <T = unknown>(url: string, config?: AxiosRequestConfig) =>
  request.delete<T>(url, config)
