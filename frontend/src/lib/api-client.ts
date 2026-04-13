import axios, { AxiosInstance } from 'axios'
import { resolveBackendApiBaseUrl } from './api/resolveBackendApiBaseUrl'

// Configure OpenAPI base URL
const API_URL = resolveBackendApiBaseUrl()

// Create axios instance
// GOLDEN_RULES 1.1: 使用 withCredentials 发送 HttpOnly Cookie，不再从 localStorage 读取 token
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - add request ID for distributed tracing
apiClient.interceptors.request.use(
  (config) => {
    // Add request ID for distributed tracing
    if (!config.headers['x-request-id']) {
      config.headers['x-request-id'] = generateRequestId()
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Generate unique request ID
function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
}

// Response interceptor - handle errors
// GOLDEN_RULES 1.1: 不再处理 token 刷新，认证状态由后端通过 HttpOnly Cookie 管理
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // 401 errors indicate invalid/expired session - redirect to login
    if (error.response?.status === 401) {
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Export configured axios instance for use with generated API
export default apiClient
