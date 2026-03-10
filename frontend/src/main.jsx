import React from "react";
import ReactDOM from "react-dom/client";
import AppRouter from "./components/AppRouter";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import ErrorBoundary from "./components/ErrorBoundary";
import "./App.css";

// #region agent log
(function debugAdSenseVerification() {
  const hasAdSenseScript = !!document.querySelector('script[src*="adsbygoogle"]');
  fetch("/ads.txt")
    .then((r) => ({ status: r.status, ok: r.ok, url: r.url }))
    .catch((e) => ({ error: e.message, status: "network_error" }))
    .then((adsTxtResult) => {
      fetch("http://127.0.0.1:7793/ingest/20707ad9-2a86-4e9f-9f4a-62c3b184f820", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "38872d" },
        body: JSON.stringify({
          sessionId: "38872d",
          location: "main.jsx:AdSense verification check",
          message: "AdSense/ads.txt diagnostic",
          data: { hasAdSenseScript, adsTxtResult, origin: window.location.origin, pathname: window.location.pathname },
          timestamp: Date.now(),
          hypothesisId: "H1-H2",
        }),
      }).catch(() => {});
    });
})();
// #endregion

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <AppRouter />
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
