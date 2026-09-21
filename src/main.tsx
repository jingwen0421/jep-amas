import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { router } from "./app/routes";

import "./styles/index.css";
import { LanguageProvider } from './app/context/LanguageContext';
import { ConfirmDialogProvider } from './app/context/ConfirmDialogContext';


ReactDOM.createRoot(
  document.getElementById('root')!
)
.render(
  <React.StrictMode>

    <LanguageProvider>

      <ConfirmDialogProvider>

        <RouterProvider router={router}/>

      </ConfirmDialogProvider>

    </LanguageProvider>

  </React.StrictMode>
);