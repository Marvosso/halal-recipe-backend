import React from "react";
import App from "../App";

/**
 * Wrapper component to preserve existing App behavior
 * This ensures the app works exactly as before when accessed at /app
 */
function AppWrapper() {
  return <App />;
}

export default AppWrapper;
