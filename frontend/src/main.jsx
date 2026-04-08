import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <GoogleOAuthProvider clientId="662526669131-gbsg1g71iceo9q6qsqs9bkodg8guo7up.apps.googleusercontent.com">
    <App />
  </GoogleOAuthProvider>,
)
