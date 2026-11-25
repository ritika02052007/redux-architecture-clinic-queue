export const config = { min: 800, max: 1500, failRate: 0.15 };

// Fake network call: random latency, random failure, fails when offline.
export const request = () =>
  new Promise((resolve, reject) => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) return reject(new Error('You are offline'));
    const delay = config.min + Math.random() * (config.max - config.min);
    setTimeout(() => (Math.random() < config.failRate ? reject(new Error('Network error')) : resolve()), delay);
  });
