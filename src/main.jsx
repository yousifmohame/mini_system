import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { BrowserRouter } from 'react-router-dom' 
// 1. استيراد PrivacyProvider (تأكد من مسار الملف الصحيح لديك)
import { PrivacyProvider } from '../src/context/PrivacyContext' 

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      {/* 2. تغليف التطبيق بالـ PrivacyProvider هنا */}
      <PrivacyProvider>
        <App />
      </PrivacyProvider>
    </BrowserRouter>
  </React.StrictMode>,
)