import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import RootLayout from "./routes/RootLayout";
import Principal from "./routes/Principal";
import Inicio from "./routes/Inicio";
import CrearCuenta from "./routes/CrearCuenta";
import "./index.css";

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: <Principal /> },               // http://localhost:5173/
      { path: "Principal", element: <Principal /> },          // http://localhost:5173/Principal
      { path: "Principal/Inicio", element: <Inicio /> },      // http://localhost:5173/Principal/Inicio
      { path: "Principal/CrearCuenta", element: <CrearCuenta /> }, // http://localhost:5173/Principal/CrearCuenta
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);



