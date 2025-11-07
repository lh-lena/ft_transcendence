// frontend/src/main.ts
import "./style.css";
import { App } from "./App";

// Wait for stylesheets to load before mounting the app
window.addEventListener("load", () => {
  const app = new App();
  app.mount(document.body);
});
