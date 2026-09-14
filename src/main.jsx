import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";
import { PeriodProvider } from "./context/PeriodContext.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <PeriodProvider>
        <App />
      </PeriodProvider>
    </AuthProvider>
  </StrictMode>
);
