import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'

// 根据环境变量设置 API 地址
// 开发环境使用相对路径（通过 Vite proxy），生产环境使用完整 URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  (import.meta.env.PROD ? 'http://38.165.34.34:8080/api' : '/api')

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000
})

// 请求拦截器
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('admin_token')
    if (token) {
      config.headers['token'] = token
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  response => {
    const res = response.data
    if (res.code === 200) {
      return res.data
    } else if (res.code === 403) {
      ElMessage.error('权限不足')
      router.push('/login')
      return Promise.reject(new Error(res.message || '权限不足'))
    } else {
      ElMessage.error(res.message || '请求失败')
      return Promise.reject(new Error(res.message || '请求失败'))
    }
  },
  error => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      router.push('/login')
    }
    ElMessage.error(error.message || '网络错误')
    return Promise.reject(error)
  }
)

export default api
