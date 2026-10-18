import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './shell.css';
import './intro.css';
import './rewards.css';
import './extras.css';
import './stim-high.css';
import { startTranslator } from './lib/translate.js';

startTranslator();

createRoot(document.getElementById('root')).render(<App />);
