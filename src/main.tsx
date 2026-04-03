import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import * as ReactDOM from 'react-dom';
import App from './App.tsx';
import './index.css';

// Polyfill findDOMNode for React 19 compatibility with older libraries like react-quill
// @ts-ignore
const rd = (ReactDOM.default || ReactDOM) as any;
if (typeof rd.findDOMNode === 'undefined') {
  rd.findDOMNode = (el: any) => el;
}
// Also ensure it's on the named export if it's not the same
if (typeof (ReactDOM as any).findDOMNode === 'undefined') {
  (ReactDOM as any).findDOMNode = (el: any) => el;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
