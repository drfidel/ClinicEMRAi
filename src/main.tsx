import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import * as ReactDOM from 'react-dom';
import App from './App.tsx';
import './index.css';

// Polyfill findDOMNode for React 19 compatibility with older libraries like react-quill
// We use a dynamic approach to avoid esbuild's static analysis of import assignments
try {
  const rd = (ReactDOM as any);
  const polyfill = (el: any) => el;
  
  // Polyfill the namespace
  if (typeof rd.findDOMNode === 'undefined') {
    Object.defineProperty(rd, 'findDOMNode', {
      value: polyfill,
      configurable: true,
      writable: true
    });
  }
  
  // Polyfill the default export if it exists on the namespace
  if (rd.default && typeof rd.default.findDOMNode === 'undefined') {
    try {
      Object.defineProperty(rd.default, 'findDOMNode', {
        value: polyfill,
        configurable: true,
        writable: true
      });
    } catch (e) {
      // Some environments might have a non-configurable default
      rd.default.findDOMNode = polyfill;
    }
  }
} catch (e) {
  console.warn('Could not polyfill findDOMNode:', e);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
