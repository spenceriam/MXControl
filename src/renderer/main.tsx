import React from 'react';
import { createRoot } from 'react-dom/client';
import './tailwind.css';
import App from './app/App';

function App() {
  return <App />;
}

const root = createRoot(document.getElementById('root')!);
root.render(<App />);


