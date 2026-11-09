import SignIn from "./Pages/SignIn";
import SignUp from "./Pages/SignUp";
import { createBrowserRouter, Navigate } from "react-router-dom";
import App from "./App.js";
import Appbar from "./components/Appbar";

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function PublicRoute({ children }) {
  const token = localStorage.getItem("token");
  if (token) {
    return <Navigate to="/home" replace />;
  }
  return children;
}

export default createBrowserRouter([
  {
    children: [
      {
        path: "/home",
        element: (
          <ProtectedRoute>
            <App />
          </ProtectedRoute>
        ),
      },
      {
        path: "/",
        element: (
          <PublicRoute>
            <Appbar />
            <SignIn />
          </PublicRoute>
        ),
      },
      {
        path: "/login",
        element: (
          <PublicRoute>
            <Appbar />
            <SignIn />
          </PublicRoute>
        ),
      },
      {
        path: "/register",
        element: (
          <PublicRoute>
            <Appbar />
            <SignUp />
          </PublicRoute>
        ),
      },
      {
        path: "*",
        element: <Navigate to="/home" replace />,
      },
    ],
  },
]);
