import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import RootLayout from "./routes/RootLayout";
import EditarPerfil from "./routes/EditarPerfil";
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
import PrincipalCliente from "./routes/PrincipalCliente";
import InfoPerfil from "./routes/InfoPerfil";
import "./index.css";


const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
  { index: true, element: <Inicio /> },               // http://localhost:5173/
  { path: "Inicio/IniciarSesion", element: <InicioSesion /> }, // http://localhost:5173/Inicio/IniciarSesion
    { path: "Inicio/CrearCuenta", element: <CrearCuenta /> },    // http://localhost:5173/Inicio/CrearCuenta
  { path: "Principal", element: <PrincipalCliente /> },     // http://localhost:5173/Principal (cliente home)
  { path: "Principal/InfoPerfil", element: <InfoPerfil /> },     // http://localhost:5173/Principal/InfoPerfil
  { path: "Principal/InfoPerfil/EditarPerfil", element: <EditarPerfil /> }, // http://localhost:5173/Principal/InfoPerfil/EditarPerfil
  { path: "Principal/Reservas", element: <Reservas /> },
  { path: "Principal/ReservaYA", element: <ReservaYa /> },
  // Rutas solo para admin
  { path: "PrincipalAdmin", element: <PrincipalAdmin /> },     // http://localhost:5173/PrincipalAdmin
  { path: "PrincipalAdmin/Canchas", element: <Canchas /> },         // http://localhost:5173/PrincipalAdmin/Canchas
  { path: "PrincipalAdmin/Canchas/Crear", element: <CrearCancha /> },  // http://localhost:5173/PrincipalAdmin/Canchas/Crear
  { path: "PrincipalAdmin/Canchas/Editar", element: <EditarCancha /> },      // http://localhost:5173/PrincipalAdmin/Canchas/Editar
  { path: "PrincipalAdmin/Canchas/Editar/:id", element: <EditarCancha /> },  // http://localhost:5173/PrincipalAdmin/Canchas/Editar/123
  { path: "PrincipalAdmin/Canchas/Ver/:id", element: <VerInfoCancha /> },  // http://localhost:5173/PrincipalAdmin/Canchas/Ver/123
  { path: "PrincipalAdmin/Reservas", element: <Reservas /> },
  { path: "PrincipalAdmin/InfoPerfil", element: <InfoPerfil /> },     // http://localhost:5173/PrincipalAdmin/InfoPerfil
  { path: "PrincipalAdmin/InfoPerfil/EditarPerfil", element: <EditarPerfil /> }, // http://localhost:5173/PrincipalAdmin/InfoPerfil/EditarPerfil
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);



