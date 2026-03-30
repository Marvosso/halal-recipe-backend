import React from "react";
import ReactDOM from "react-dom/client";
import AppRouter from "./components/AppRouter";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import ErrorBoundary from "./components/ErrorBoundary";
import "./App.css";

const IMPACT_VERIFICATION_RE = /Impact-Site-Verification:/i;

/** Remove Impact.com (or similar) injected site-verification text from the page. */
function removeImpactVerificationFromDOM() {
  const removeIfVerification = (node) => {
    const text = (node.textContent || "").trim();
    if (!text || !IMPACT_VERIFICATION_RE.test(text)) return false;
    node.remove();
    return true;
  };

  const walk = (node) => {
    if (!node) return;
    // Text node: remove parent if it only holds this line, else strip the text
    if (node.nodeType === 3) {
      const v = node.nodeValue || "";
      if (IMPACT_VERIFICATION_RE.test(v)) {
        const parent = node.parentNode;
        if (parent) {
          if (parent.childNodes.length === 1) parent.remove();
          else node.remove();
        }
      }
      return;
    }
    if (node.nodeType !== 1) return;

    if (removeIfVerification(node)) return;

    let child = node.lastChild;
    while (child) {
      const next = child.previousSibling;
      walk(child);
      child = next;
    }
  };

  if (document.body) walk(document.body);
  if (document.head) walk(document.head);
}
function initImpactVerificationRemoval() {
  removeImpactVerificationFromDOM();
  if (typeof MutationObserver !== "undefined" && document.documentElement) {
    const observer = new MutationObserver(() => removeImpactVerificationFromDOM());
    observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
  }
}
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initImpactVerificationRemoval);
} else {
  initImpactVerificationRemoval();
}
setTimeout(removeImpactVerificationFromDOM, 1500);
setTimeout(removeImpactVerificationFromDOM, 5000);

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
