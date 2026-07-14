import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App.jsx';
import './index.css';

const debugText = document.getElementById('debug-text');
if (debugText) debugText.remove();

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '765017417232-fp5ui38tgrjkvsnvv9mpl8ga9pneliq3.apps.googleusercontent.com';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={clientId}>
      <App />
    </GoogleOAuthProvider>
  </StrictMode>,
);
