import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { AuthProvider } from "./context/AuthContext";
import { ChatProvider } from "./context/ChatContext";
import { DashboardProvider } from "./context/DashboardContext";
import { ThemeProvider } from "./context/ThemeContext"; // ✅ Add this line

import "bootstrap/dist/css/bootstrap.min.css";

// Create a root container
const container = document.getElementById("root");
const root = createRoot(container);

// Render the App component
root.render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <ChatProvider>
          <DashboardProvider>
            <App />
          </DashboardProvider>
        </ChatProvider>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);

reportWebVitals();
