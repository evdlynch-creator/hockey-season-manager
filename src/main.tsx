import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BlinkUIProvider, Toaster } from '@blinkdotnew/ui'
import { BlinkProvider, BlinkAuthProvider } from '@blinkdotnew/react'
import App from './App'
import './index.css'

import { initParticlesEngine } from "@tsparticles/react"
import { loadSlim } from "@tsparticles/slim"

// Security: Enforce HTTPS for HSTS prerequisite (except on localhost)
if (typeof window !== 'undefined' && window.location.protocol === 'http:' && !window.location.hostname.includes('localhost')) {
  window.location.href = window.location.href.replace('http:', 'https:');
}

const queryClient = new QueryClient()

// Initialize particles engine once
initParticlesEngine(async (engine) => {
  await loadSlim(engine)
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BlinkProvider
        projectId={import.meta.env.VITE_BLINK_PROJECT_ID || 'blue-line-iq-qpy3h1ap'}
        publishableKey={import.meta.env.VITE_BLINK_PUBLISHABLE_KEY || 'blnk_pk_cJpfpBNGg6PlOjdD6tzwKIJbjL0eh6CN'}
        auth={{ mode: 'managed' }}
      >
        <BlinkAuthProvider>
          <BlinkUIProvider theme="glass" darkMode="dark">
            <Toaster />
            <div className="flex w-full flex-1 flex-col min-h-0">
              <App />
            </div>
          </BlinkUIProvider>
        </BlinkAuthProvider>
      </BlinkProvider>
    </QueryClientProvider>
  </React.StrictMode>,
)