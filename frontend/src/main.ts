// frontend/src/main.ts
import './style.css';
import { Loading } from './components/loading'
import { App } from './App'

const loading = new Loading();
loading.mount(document.body);

setTimeout(() => {
    loading.hide();
    const app = new App();
    app.mount(document.body);
}, 1000);