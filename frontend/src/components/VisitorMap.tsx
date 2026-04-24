'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import type { VisitorData } from '@/lib/types/visitor'
import 'leaflet/dist/leaflet.css'

// 修复Leaflet默认图标在Next.js中的问题
if (typeof window !== 'undefined') {
   
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  })
}

interface VisitorMapProps {
  visitors: VisitorData[]
}

/**
 * 地图自动适应边界
 */
function MapBounds({ visitors }: { visitors: VisitorData[] }) {
  const map = useMap()

  useEffect(() => {
    if (visitors.length === 0) return

    const bounds = L.latLngBounds(visitors.map((v) => [v.lat, v.lon] as [number, number]))

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50] })
    }
  }, [map, visitors])

  return null
}

export default function VisitorMap({ visitors }: VisitorMapProps) {
  const [isMounted, setIsMounted] = useState(false)

  // 确保只在客户端渲染
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // 过滤掉无效的坐标
  const validVisitors = visitors.filter((v) => v.lat && v.lon && !isNaN(v.lat) && !isNaN(v.lon))

  if (!isMounted) {
    return (
      <div className="flex h-96 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
        <p className="text-gray-500 dark:text-gray-400">加载地图中...</p>
      </div>
    )
  }

  if (validVisitors.length === 0) {
    return (
      <div className="flex h-96 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
        <div className="text-center">
          <p className="mb-2 text-gray-500 dark:text-gray-400">暂无访客数据</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            当有访客访问网站时，他们的位置会显示在这里
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-96 w-full overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
      <style jsx global>{`
        .leaflet-container {
          height: 100%;
          width: 100%;
          z-index: 0;
        }
      `}</style>
      <MapContainer
        center={[20, 0]}
        zoom={2}
        style={{ height: '100%', width: '100%', zIndex: 0 }}
        scrollWheelZoom={true}
        className="leaflet-container"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapBounds visitors={validVisitors} />
        {validVisitors.map((visitor, index) => (
          <Marker key={`${visitor.ip}-${index}`} position={[visitor.lat, visitor.lon]}>
            <Popup>
              <div className="text-sm">
                <p className="mb-1 font-semibold">
                  {visitor.city}, {visitor.country}
                </p>
                <p className="mb-1 text-xs text-gray-600 dark:text-gray-400">IP: {visitor.ip}</p>
                <p className="mb-1 text-xs text-gray-600 dark:text-gray-400">
                  时区: {visitor.timezone}
                </p>
                <p className="mb-1 text-xs text-gray-600 dark:text-gray-400">
                  首次访问: {new Date(visitor.firstVisit).toLocaleString('zh-CN')}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  访问次数: {visitor.visitCount}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
