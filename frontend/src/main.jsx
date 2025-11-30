import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { GoogleOAuthProvider } from '@react-oauth/google'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { CompanyProvider } from './context/CompanyContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { CallProvider } from './context/CallContext.jsx'
import { ChatContextProvider } from './context/ChatContext.jsx'
import { IncomingCallModal, ActiveCallUI, FloatingCallButton } from './components/calling'
import './index.css'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <CompanyProvider>
              <CallProvider>
                <ChatContextProvider>
                  <App />
                  {/* Global Call UI Components */}
                  <IncomingCallModal />
                  <ActiveCallUI />
                  <FloatingCallButton />
                  <Toaster 
                    position="top-right"
                    toastOptions={{
                      duration: 4000,
                      style: {
                        background: 'var(--toast-bg)',
                        color: 'var(--toast-color)',
                        border: '1px solid var(--toast-border)',
                      },
                    }}
                  />
                </ChatContextProvider>
              </CallProvider>
            </CompanyProvider>
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  </React.StrictMode>,
)
