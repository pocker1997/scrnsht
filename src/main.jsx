import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import SharedApp from './components/SharedApp.jsx'

const shareMatch = window.location.pathname.match(/^\/s\/([^/]+)\/?$/)

createRoot(document.getElementById('root')).render(
  <StrictMode>{shareMatch ? <SharedApp id={shareMatch[1]} /> : <App />}</StrictMode>,
)
