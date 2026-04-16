import L from 'leaflet'

function cityInitial(city) {
  const trimmed = String(city ?? '').trim()
  return trimmed ? trimmed[0].toUpperCase() : '?'
}

function escapeAttr(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

export function createPulsingEmblemDivIcon({ city }) {
  const initial = escapeAttr(cityInitial(city))
  const label = escapeAttr(city)

  return L.divIcon({
    className: 'alash-divicon',
    iconSize: [44, 44],
    iconAnchor: [22, 44],
    popupAnchor: [0, -40],
    html: `
      <div class="alash-marker" role="button" tabindex="0" aria-label="${label}">
        <span class="alash-marker__ping"></span>
        <span class="alash-marker__core">
          <span class="alash-marker__ornament"></span>
          <span class="alash-marker__letter">${initial}</span>
        </span>
      </div>
    `,
  })
}

