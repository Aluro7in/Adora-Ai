import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { testConnection } from './services/firebase.ts';

// Test connection to Firestore on boot
testConnection().catch(console.error);

createRoot(document.getElementById('root')!).render(<App />);

