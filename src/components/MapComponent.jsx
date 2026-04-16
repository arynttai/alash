import { useCallback, useEffect, useMemo, useState } from 'react'
import { MapContainer, Marker, TileLayer, Tooltip, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet.markercluster'
import { Feather } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'

import locations from '../data/locations.json'
import collectibles from '../data/collectibles.json'

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

import ChapterRail from './ChapterRail.jsx'
import InfoPanel from './InfoPanel.jsx'
import Timeline from './Timeline.jsx'
import GlassPanel from './ui/GlassPanel.jsx'
import MapHud from './MapHud.jsx'
import { createPulsingEmblemDivIcon } from '../map/PulsingEmblemMarker.js'
import { createDocumentDivIcon } from '../map/DocumentMarkerIcon.js'
import { useStoryAnalytics } from '../context/StoryAnalyticsContext.jsx'
import { useCollectibles } from '../context/CollectiblesContext.jsx'

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

function FlyTo({ coords }) {
  const map = useMap()
  useEffect(() => {
    if (!coords) return
    map.flyTo(coords, Math.max(map.getZoom(), 5), { duration: 0.85 })
  }, [map, coords])
  return null
}

function ClusteredMarkers({ items, onSelect }) {
  const map = useMap()

  useEffect(() => {
    if (typeof L.markerClusterGroup !== 'function') return
    const cluster = L.markerClusterGroup()

    for (const loc of items) {
      const marker = L.marker(loc.coords, {
        icon: createPulsingEmblemDivIcon({ city: loc.city }),
      })
      marker.on('click', () => onSelect(loc.id))
      marker.bindTooltip(loc.city, {
        direction: 'top',
        offset: [0, -10],
        opacity: 1,
      })
      cluster.addLayer(marker)
    }

    map.addLayer(cluster)
    return () => {
      map.removeLayer(cluster)
      cluster.clearLayers()
    }
  }, [items, map, onSelect])

  return null
}

const YEAR_MIN = 1905
const YEAR_MAX = 1930

export default function MapComponent() {
  const { t } = useTranslation()
  const { recordCityClick } = useStoryAnalytics()
  const { collect, isCollected } = useCollectibles()
  const [year, setYear] = useState(1917)
  const [selectedId, setSelectedId] = useState(null)
  const [pen, setPen] = useState({ x: 0, y: 0, show: false })

  const onSelect = useCallback(
    (id) => {
      recordCityClick(id)
      setSelectedId(id)
    },
    [recordCityClick],
  )

  const eras = useMemo(() => {
    return [
      { id: 'awakening', range: '1905–1917', startYear: 1905, endYear: 1917 },
      { id: 'autonomy', range: '1917–1920', startYear: 1917, endYear: 1920 },
      { id: 'reconfiguration', range: '1920–1930', startYear: 1920, endYear: 1930 },
    ]
  }, [])

  const visibleLocations = useMemo(() => {
    return locations.filter((l) => year >= l.startYear && year <= l.endYear)
  }, [year])

  const selected = useMemo(() => {
    return locations.find((l) => l.id === selectedId) ?? null
  }, [selectedId])

  const chapters = useMemo(() => {
    return [...locations]
      .sort((a, b) => a.startYear - b.startYear)
      .map((l) => ({
        id: l.id,
        city: l.city,
        chapterTitle: l.chapterTitle,
        yearRangeLabel: l.yearRangeLabel,
        startYear: l.startYear,
      }))
  }, [])

  const initialCenter = [48.2, 66.9]
  const canCluster = typeof L.markerClusterGroup === 'function'

  return (
    <div
      className="relative h-full max-md:cursor-auto md:cursor-none"
      onMouseMove={(e) => {
        if (typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches) {
          setPen({ x: e.clientX, y: e.clientY, show: true })
        }
      }}
      onMouseLeave={() => setPen((p) => ({ ...p, show: false }))}
    >
      {pen.show ? (
        <div
          className="pointer-events-none fixed z-[5000] hidden text-[#005F73] drop-shadow md:block"
          style={{
            left: pen.x,
            top: pen.y,
            transform: 'translate(-50%, -50%)',
          }}
          aria-hidden
        >
          <Feather className="h-7 w-7 opacity-90" strokeWidth={1.25} />
        </div>
      ) : null}

      <MapContainer
        center={initialCenter}
        zoom={4}
        minZoom={3}
        className="h-full w-full"
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://opentopomap.org/">OpenTopoMap</a>'
          url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
        />

        {canCluster ? (
          <ClusteredMarkers items={visibleLocations} onSelect={onSelect} />
        ) : (
          visibleLocations.map((loc) => (
            <Marker
              key={loc.id}
              position={loc.coords}
              icon={createPulsingEmblemDivIcon({ city: loc.city })}
              eventHandlers={{ click: () => onSelect(loc.id) }}
            >
              <Tooltip direction="top" offset={[0, -10]} opacity={1}>
                <span className="font-[Merriweather] text-sm">{loc.city}</span>
              </Tooltip>
            </Marker>
          ))
        )}

        {collectibles.map((doc) => (
          <Marker
            key={doc.id}
            position={doc.coords}
            icon={createDocumentDivIcon({
              label: doc.title,
              done: isCollected(doc.id),
            })}
            eventHandlers={{
              click: () => collect(doc.id),
            }}
          >
            <Tooltip direction="top" offset={[0, -10]} opacity={1}>
              <span className="max-w-[200px] font-[Merriweather] text-xs">
                {doc.title}
              </span>
            </Tooltip>
          </Marker>
        ))}

        <FlyTo coords={selected?.coords} />
      </MapContainer>

      <MapHud />

      <InfoPanel selected={selected} onClose={() => setSelectedId(null)} />

      <div className="absolute top-3 left-3 right-3 z-[1100] md:right-auto md:w-[520px]">
        <GlassPanel>
          <ChapterRail
            chapters={chapters}
            selectedId={selectedId}
            onSelect={(id) => {
              const loc = locations.find((l) => l.id === id)
              onSelect(id)
              if (loc?.startYear) {
                setYear(Math.max(YEAR_MIN, Math.min(YEAR_MAX, loc.startYear)))
              }
            }}
          />
        </GlassPanel>
      </div>

      <div className="absolute bottom-3 left-3 right-3 z-[1100]">
        <div className="mx-auto max-w-6xl">
          <GlassPanel>
            <Timeline
              year={year}
              onYearChange={(y) => {
                setYear(y)
                if (selectedId) setSelectedId(null)
              }}
              minYear={YEAR_MIN}
              maxYear={YEAR_MAX}
              eras={eras}
            />
            <div className="-mt-2 px-4 pb-4">
              <div className="font-[Merriweather] text-xs text-slate-700">
                {t('common.activeLocations')}:{' '}
                <span className="font-bold">{visibleLocations.length}</span>
              </div>
            </div>
          </GlassPanel>
        </div>
      </div>
    </div>
  )
}
