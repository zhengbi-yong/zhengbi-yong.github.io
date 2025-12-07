/**
 * 访客数据类型定义
 */

export interface GeolocationData {
  country: string
  city: string
  lat: number
  lon: number
  timezone: string
}

export interface VisitorData {
  ip: string
  country: string
  city: string
  lat: number
  lon: number
  timezone: string
  firstVisit: string // ISO 8601 格式
  lastVisit: string // ISO 8601 格式
  visitCount: number
}

export interface IPApiResponse {
  status: string
  country?: string
  countryCode?: string
  region?: string
  regionName?: string
  city?: string
  zip?: string
  lat?: number
  lon?: number
  timezone?: string
  isp?: string
  org?: string
  as?: string
  query?: string
  message?: string
}
