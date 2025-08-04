// frontend/src/main.ts
import './style.css';
import { Loading } from './components/loading'
import { App } from './App'

const loading = new Loading('pong');
loading.mount(document.body);

setTimeout(() => {
    loading.hide();
    const app = new App();
    app.mount(document.body);
}, 1000);

// Simple connectivity test for CI/CD (runs in background, does not impact app)
(async function connectivityTest() {
  try {
    await fetch('http://localhost:8080/api/health');
  } catch (e) {
    console.log(e);
  }
})();