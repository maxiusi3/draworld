import axios from 'axios';
import { sessionManager } from './auth';

const instance = axios.create();

instance.interceptors.request.use(
  async (config) => {
    const session = await sessionManager.getSession();
    if (session?.tokens?.access_token) {
      config.headers.Authorization = `Bearer ${session.tokens.access_token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default instance;