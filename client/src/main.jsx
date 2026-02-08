import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/global.css';

console.log('=== MAIN.JSX LOADING ===');

try {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  console.log('=== REACT MOUNTED SUCCESSFULLY ===');
} catch (error) {
  console.error('=== REACT MOUNT FAILED ===', error);
  document.body.innerHTML = `<div style="color: white; padding: 20px;">Error: ${error.message}</div>`;
}
