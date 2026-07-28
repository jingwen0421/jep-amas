import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { router } from "./app/routes";

import "./styles/index.css";
import { LanguageProvider } from './app/context/LanguageContext';


ReactDOM.createRoot(
  document.getElementById('root')!
)
.render(
  <React.StrictMode>

    <LanguageProvider>

      <RouterProvider router={router}/>

    </LanguageProvider>

  </React.StrictMode>
);