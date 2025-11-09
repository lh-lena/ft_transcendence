// frontend/src/main.ts
import "./style.css";
import { App } from "./App";

const app = new App();
app.mount(document.body);

// Simple connectivity test for CI/CD (runs in background, does not impact app)
(async function connectivityTest() {
  try {
    await fetch("http://localhost:8080/api/health");
  } catch (e) {
    console.log(e);
  }
})();
