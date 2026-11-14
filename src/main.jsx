import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import axios from "axios";
import App from "./App.jsx";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";
import { PeriodProvider } from "./context/PeriodContext.jsx";

// attach the signed-in user's token to every API request, so the server can
// identify the caller and enforce what each role may do. The token is stored
// JSON-encoded by AuthContext, so it is parsed back to the raw string here.
axios.interceptors.request.use((config) => {
  try {
    const raw = localStorage.getItem("token");
    if (raw) {
      let token = raw;
      try {
        token = JSON.parse(raw);
      } catch (e) {
        // already a bare token
      }
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    // localStorage unavailable - proceed without a token
  }
  return config;
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <PeriodProvider>
        <App />
      </PeriodProvider>
    </AuthProvider>
  </StrictMode>
);
