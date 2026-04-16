import L from 'leaflet'

export function createDocumentDivIcon({ label, done }) {
  const safe = String(label ?? '').slice(0, 24)
  const scroll = '\u{1F4DC}'
  const mark = done ? ' \u2713' : ''
  return L.divIcon({
    className: 'alash-doc-divicon',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    html: `
      <div class="alash-doc-marker ${done ? 'alash-doc-marker--done' : ''}" title="${safe.replace(/"/g, '&quot;')}">
        <span class="alash-doc-marker__glow"></span>
        <span class="alash-doc-marker__body">${scroll}${mark}</span>
      </div>
    `,
  })
}
