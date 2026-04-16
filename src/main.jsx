import React, { Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import App from './App.jsx'
import './index.css'
import i18n from './i18n.js'
import { StoryAnalyticsProvider } from './context/StoryAnalyticsContext.jsx'
import { CollectiblesProvider } from './context/CollectiblesContext.jsx'
import collectibles from './data/collectibles.json'

function AppLoadingFallback() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#F4EBD0] px-4 font-[Merriweather] text-sm text-slate-700">
      {i18n.t('common.loading')}
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider>
      <StoryAnalyticsProvider>
        <CollectiblesProvider totalCount={collectibles.length}>
          <Suspense fallback={<AppLoadingFallback />}>
            <App />
          </Suspense>
        </CollectiblesProvider>
      </StoryAnalyticsProvider>
    </HelmetProvider>
  </React.StrictMode>,
)
