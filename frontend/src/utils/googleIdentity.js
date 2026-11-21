let scriptPromise;

export function loadGoogleIdentity() {
  if (window.google?.accounts?.id) {
    return Promise.resolve(window.google);
  }

  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (window.google?.accounts?.id) {
          resolve(window.google);
        } else {
          scriptPromise = null;
          reject(new Error('Google sign-in could not be initialized.'));
        }
      };
      script.onerror = () => {
        scriptPromise = null;
        reject(new Error('Google sign-in could not be loaded.'));
      };
      document.head.appendChild(script);
    });
  }

  return scriptPromise;
}
