import axios from 'axios';

export const apiClientBackend = axios.create({
  baseURL: 'http://backend:8080/api',
  timeout: 5000,
});
