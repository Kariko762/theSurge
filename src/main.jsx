import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/DesignSystem.css'
import './styles/TerminalFrame.css'
import './lib/debugCommands.js' // Load debug command system

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
