import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { enableApiMocks } from "./mocks/browser";

// IMPORTANT: Test-only mocking layer. Do NOT enable in production builds.
enableApiMocks();

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
