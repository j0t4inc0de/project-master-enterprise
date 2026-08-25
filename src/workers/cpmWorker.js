import { computeProjectCPM } from '../lib/cpmEngine.js';

self.onmessage = (e) => {
  const { id, payload } = e.data;
  try {
    const result = computeProjectCPM(payload);
    self.postMessage({ id, status: 'success', result });
  } catch (error) {
    self.postMessage({ id, status: 'error', error: error.message });
  }
};
