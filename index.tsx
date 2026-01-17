
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error("Critical Error: Could not find root element to mount the application.");
} else {
  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (error) {
    console.error("React Mounting Error:", error);
    rootElement.innerHTML = `
      <div style="height: 100vh; display: flex; align-items: center; justify-content: center; background: #2563eb; color: white; font-family: sans-serif; padding: 20px; text-align: center;">
        <div>
          <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 10px;">Oops! Something went wrong.</h1>
          <p style="opacity: 0.9;">The application failed to start. Please refresh the page.</p>
          <pre style="margin-top: 20px; font-size: 10px; background: rgba(0,0,0,0.1); padding: 10px; border-radius: 8px; text-align: left; overflow: auto; max-width: 90vw;">${error instanceof Error ? error.message : String(error)}</pre>
        </div>
      </div>
    `;
  }
}
