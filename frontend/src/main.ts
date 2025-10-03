// frontend/src/main.ts
import "./style.css";
import { App } from "./App";

// Wait for stylesheets to load before mounting the app
window.addEventListener("load", () => {
  const app = new App();
  app.mount(document.body);
});

// Or use DOMContentLoaded if you don't need images/resources
// document.addEventListener('DOMContentLoaded', () => {
//   const app = new App();
//   app.mount(document.body);
// });

// Simple connectivity test for CI/CD (runs in background, does not impact app)
(async function connectivityTest() {
  try {
    await fetch("http://localhost:8080/api/health");
  } catch (e) {
    console.log(e);
  }
})();