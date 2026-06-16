console.log('app.js caricato');

window.add!email || !password) {window.addEventListener('DOMContentLoaded', () => {
      if (authErrors) {
        authErrors.textContent = 'Inserisci email e password.';
        authErrors.classList.add('show');
      }
      return;
    }

    if (authErrors) {
      authErrors.textContent = '';
      authErrors.classList.remove('show');
    }

    alert(`Click OK. Email: ${email}`);
  });
});
  console.log('DOMContentLoaded partito');

  const btnLogin = document.getElementById('btnLogin');
  const loginEmail = document.getElementById('loginEmail');
  const loginPassword = document.getElementById('loginPassword');
  const authErrors = document.getElementById('authErrors');

  console.log('btnLogin trovato?', !!btnLogin);

  if (!btnLogin) {
    console.error('btnLogin NON trovato nel DOM');
    return;
  }

  btnLogin.addEventListener('click', () => {
    console.log('CLICK SU ACCEDI intercettato');

    const email = (loginEmail?.value || '').trim();
    const password = loginPassword?.value || '';

