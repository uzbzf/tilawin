import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { SoundProvider } from './hooks/useSound.jsx'
import { LocaleProvider } from './i18n/LocaleContext.jsx'
import { registerServiceWorker } from './lib/pwa.js'
import './index.css'

registerServiceWorker()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LocaleProvider>
      <SoundProvider>
        <App />
      </SoundProvider>
    </LocaleProvider>
  </StrictMode>,
)
