import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { enableApiMocks } from "./mocks/browser";

// Enable API mocks only when explicitly requested via env flag
const enableMocks =
  typeof process !== "undefined" &&
  process.env &&
  String(process.env.REACT_APP_ENABLE_MOCKS || "").toLowerCase() === "true";

if (enableMocks) {
  enableApiMocks();
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
