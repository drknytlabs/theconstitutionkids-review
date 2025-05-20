import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import ReviewApp from './components/ReviewApp.jsx';
import '../styles/global.css';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <>
      <Toaster position="top-right" />
      {/* your routes or components here */}
    </>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ReviewApp />
  </StrictMode>,
)
