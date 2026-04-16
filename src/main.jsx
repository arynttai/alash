import React from 'react'
import ReactDOM from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import App from './App.jsx'
import './index.css'
import './i18n.js'
import { StoryAnalyticsProvider } from './context/StoryAnalyticsContext.jsx'
import { CollectiblesProvider } from './context/CollectiblesContext.jsx'
import collectibles from './data/collectibles.json'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider>
      <StoryAnalyticsProvider>
        <CollectiblesProvider totalCount={collectibles.length}>
          <App />
        </CollectiblesProvider>
      </StoryAnalyticsProvider>
    </HelmetProvider>
  </React.StrictMode>,
)
