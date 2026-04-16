import { useCallback, useEffect, useMemo, useState } from 'react'
import { MapContainer, Marker, TileLayer, Tooltip, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet.markercluster'
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
import CityNavigator from './CityNavigator.jsx'
import { createPulsingEmblemDivIcon } from '../map/PulsingEmblemMarker.js'
import { createDocumentDivIcon } from '../map/DocumentMarkerIcon.js'
import { useStoryAnalytics } from '../context/StoryAnalyticsContext.jsx'
import { useCollectibles } from '../context/CollectiblesContext.jsx'
import { useMediaQuery } from '../hooks/useMediaQuery.js'

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

function MapResize() {
  const map = useMap()
  useEffect(() => {
    const fix = () => {
      map.invalidateSize({ animate: false })
    }
    const t = window.setTimeout(fix, 0)
    window.addEventListener('resize', fix)
    return () => {
      window.clearTimeout(t)
      window.removeEventListener('resize', fix)
    }
  }, [map])
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
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const { recordCityClick } = useStoryAnalytics()
  const { collect, isCollected } = useCollectibles()
  const [year, setYear] = useState(1917)
  const [selectedId, setSelectedId] = useState(null)

  const onSelect = useCallback(
    (id) => {
      recordCityClick(id)
      setSelectedId(id)
      try {
        const u = new URL(window.location.href)
        if (id) u.searchParams.set('city', id)
        window.history.replaceState({}, '', u.toString())
      } catch {
        /* ignore */
      }
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

  useEffect(() => {
    try {
      const u = new URL(window.location.href)
      const id = u.searchParams.get('city')
      if (!id) return
      const loc = locations.find((l) => l.id === id)
      if (!loc) return
      setSelectedId(id)
      if (loc.startYear) setYear(Math.max(YEAR_MIN, Math.min(YEAR_MAX, loc.startYear)))
    } catch {
      /* ignore */
    }
    // only on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const chapters = useMemo(() => {
    return [...locations]
      .sort((a, b) => a.startYear - b.startYear)
      .map((l) => ({
        id: l.id,
        city: l.city,
        chapterTitle: l.chapterTitle,
        yearRangeLabel: l.yearRangeLabel,
        startYear: l.startYear,
        coords: l.coords,
      }))
  }, [])

  const initialCenter = [48.2, 66.9]
  const canCluster = typeof L.markerClusterGroup === 'function'

  return (
    <div className="alash-map-touch relative flex h-full min-h-0 flex-1 flex-col touch-manipulation">
      <MapContainer
        center={initialCenter}
        zoom={4}
        minZoom={3}
        className="leaflet-map-root z-0 h-full min-h-[280px] w-full flex-1"
        zoomControl={true}
      >
        <MapResize />
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

      <div className="pointer-events-none absolute top-0 left-0 right-0 z-[1100] p-2 pt-[max(0.5rem,env(safe-area-inset-top,0px))] md:p-3 md:pt-3">
        <div className="pointer-events-auto mx-auto flex max-w-6xl items-center justify-end gap-2 md:ml-3 md:mr-auto md:w-[min(980px,calc(100%-1.5rem))]">
          {isDesktop ? (
            <GlassPanel className="shadow-lg flex-1 min-w-0">
              <ChapterRail
                chapters={chapters}
                selectedId={selectedId}
                onSelect={(id) => {
                  const loc = locations.find((l) => l.id === id)
                  onSelect(id)
                  if (loc?.startYear) {
                    setYear(
                      Math.max(YEAR_MIN, Math.min(YEAR_MAX, loc.startYear)),
                    )
                  }
                }}
              />
            </GlassPanel>
          ) : null}

          <div className="shrink-0">
            <CityNavigator
              allCities={chapters}
              selectedId={selectedId}
              onSelect={(id) => {
                const loc = locations.find((l) => l.id === id)
                onSelect(id)
                if (loc?.startYear) {
                  setYear(Math.max(YEAR_MIN, Math.min(YEAR_MAX, loc.startYear)))
                }
              }}
              buildShareUrl={(id) => {
                try {
                  const u = new URL(window.location.href)
                  u.searchParams.set('city', id)
                  return u.toString()
                } catch {
                  return ''
                }
              }}
            />
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-[1100] p-2 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))] md:p-3 md:pb-3">
        <div className="pointer-events-auto mx-auto max-w-6xl">
          <GlassPanel className="shadow-lg">
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
            <div className="-mt-1 px-3 pb-3 md:px-4 md:pb-4">
              <div className="font-[Merriweather] text-[11px] text-slate-700 md:text-xs">
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
