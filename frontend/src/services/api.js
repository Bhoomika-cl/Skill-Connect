import axios from "axios";


const apiHost = window.location.hostname || "localhost";
const apiBaseUrl = import.meta.env.VITE_API_URL || `${window.location.protocol}//${apiHost}:8000`;

const API = axios.create({

  baseURL: apiBaseUrl,
  withCredentials: true,

  headers: {
    "Content-Type": "application/json"
  }

});

API.interceptors.request.use((config) => {
  if (typeof FormData !== "undefined" && config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }
  return config;
});


export default API;
