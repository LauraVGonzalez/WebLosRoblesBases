import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import RootLayout from "./routes/RootLayout";
import Principal from "./routes/PrincipalAdmin";
import Inicio from "./routes/Inicio";
import InicioSesion from "./routes/InicioSesion";
import CrearCuenta from "./routes/CrearCuenta";
import CrearCancha from "./routes/CrearCancha";
import EditarCancha from "./routes/EditarCancha";
import VerInfoCancha from "./routes/VerInfoCancha";
import Reservas from "./routes/Reservas";
import ReservaYa from "./routes/ReservaYa";
import Canchas from "./routes/Canchas";
import PrincipalAdmin from "./routes/PrincipalAdmin";
import "./index.css";


const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
  { index: true, element: <Inicio /> },               // http://localhost:5173/
  { path: "Inicio/IniciarSesion", element: <InicioSesion /> }, // http://localhost:5173/Inicio/IniciarSesion
    { path: "Inicio/CrearCuenta", element: <CrearCuenta /> },    // http://localhost:5173/Inicio/CrearCuenta
    { path: "PrincipalAdmin", element: <PrincipalAdmin /> },     // http://localhost:5173/PrincipalAdmin
  { path: "Principal", element: <PrincipalAdmin /> },     // http://localhost:5173/Principal (admin home)
    { path: "Principal/Canchas", element: <Canchas /> },         // http://localhost:5173/Principal/Canchas
    { path: "Principal/Canchas/Crear", element: <CrearCancha /> },  // http://localhost:5173/Principal/Canchas/Crear
    { path: "Principal/Canchas/Editar/:id", element: <EditarCancha /> },  // http://localhost:5173/Principal/Canchas/Editar/123
    { path: "Principal/Canchas/Ver/:id", element: <VerInfoCancha /> },  // http://localhost:5173/Principal/Canchas/Ver/123
    { path: "Principal/Reservas", element: <Reservas /> },
    { path: "Principal/ReservaYA", element: <ReservaYa /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);



