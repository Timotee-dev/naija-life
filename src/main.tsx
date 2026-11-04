import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { runtime } from "./game/runtime";
import { useGame } from "./game/store";

// Handy while developing: open the browser console and type __naija.
if (import.meta.env.DEV) Object.assign(window, { __naija: { runtime, useGame } });

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
