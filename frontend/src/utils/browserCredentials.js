export function offerPasswordSave(form, credentialManager = navigator.credentials, PasswordCredentialType = window.PasswordCredential) {
  if (!form || typeof credentialManager?.store !== 'function' || typeof PasswordCredentialType !== 'function') {
    return false;
  }

  try {
    const saveRequest = credentialManager.store(new PasswordCredentialType(form));
    Promise.resolve(saveRequest).catch((error) => {
      console.warn('The browser could not save this login.', error?.name || 'Unknown error');
    });
    return true;
  } catch (error) {
    console.warn('The browser could not save this login.', error?.name || 'Unknown error');
    return false;
  }
}
