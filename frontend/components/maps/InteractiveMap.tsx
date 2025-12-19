'use client'

import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'

interface MapMarker {
  id: string
  position: [number, number]
  title?: string
  description?: string
}

interface InteractiveMapProps {
  center: [number, number]
  zoom: number
  markers?: MapMarker[]
  className?: string
}

// Fix for default marker icon in Leaflet with webpack
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

export function InteractiveMap({
  center,
  zoom,
  markers = [],
  className = '',
}: InteractiveMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<L.Map | null>(null)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient || !mapRef.current) return

    // Initialize map
    const leafletMap = L.map(mapRef.current).setView(center, zoom)

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(leafletMap)

    setMap(leafletMap)

    // Cleanup
    return () => {
      leafletMap.remove()
    }
  }, [isClient, center, zoom])

  // Add markers
  useEffect(() => {
    if (!map || !markers.length) return

    // Clear existing markers
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer)
      }
    })

    // Add new markers
    markers.forEach((marker) => {
      const leafletMarker = L.marker(marker.position).addTo(map)

      if (marker.title || marker.description) {
        leafletMarker.bindPopup(`
          ${marker.title ? `<h3>${marker.title}</h3>` : ''}
          ${marker.description ? `<p>${marker.description}</p>` : ''}
        `)
      }
    })
  }, [map, markers])

  if (!isClient) {
    return (
      <div
        className={`flex h-96 items-center justify-center rounded-lg bg-gray-200 dark:bg-gray-700 ${className}`}
      >
        <div className="text-gray-500 dark:text-gray-400">加载地图中...</div>
      </div>
    )
  }

  return <div ref={mapRef} className={`h-96 rounded-lg ${className}`} />
}
