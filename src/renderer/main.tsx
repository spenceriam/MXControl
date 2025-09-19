import React from 'react';
import { createRoot } from 'react-dom/client';
import './tailwind.css';

function App() {
  return (
    <div className="w-[900px] h-[650px] bg-black text-white">
      <h1 className="text-[16px]">MX Control</h1>
      <p>Renderer bootstrapped. Dev server will be started only when all tasks complete.</p>
    </div>
  );
}

const root = createRoot(document.getElementById('root')!);
root.render(<App />);


