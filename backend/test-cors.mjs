// test-cors.mjs
const url = 'http://localhost:8080/health'; // Your Fastify endpoint

const response = await fetch(url, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include', // Needed if CORS requires cookies/auth headers
  mode: 'cors',
});

const data = await response.json();

console.log('✅ Success: ', data);

