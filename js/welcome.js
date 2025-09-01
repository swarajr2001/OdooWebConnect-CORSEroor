document.addEventListener('DOMContentLoaded', () => {
  const username = localStorage.getItem('odoo_username');
  const welcomeContainer = document.getElementById('welcome-container');
  const appContainer = document.getElementById('app-container');
  const usernameDisplay = document.getElementById('username-display');
  const createRecordFormContainer = document.getElementById('create-record-form-container');
  const createRecordForm = document.getElementById('create-record-form');
  const successPopup = document.getElementById('success-popup');
  const closePopupButton = document.getElementById('close-popup-button');
  const createRecordsLink = document.getElementById('create-records-link');

  if (username) {
    usernameDisplay.innerText = username;
  } else {
    window.location.href = '../index.html';
    return; // Stop execution if not logged in
  }

  if (sessionStorage.getItem('showWelcome') === 'true') {
    // Show welcome message
    welcomeContainer.classList.remove('hidden');
    appContainer.classList.add('hidden');

    setTimeout(() => {
      welcomeContainer.classList.add('opacity-0');
      setTimeout(() => {
        welcomeContainer.classList.add('hidden');
        appContainer.classList.remove('hidden');
        appContainer.classList.add('opacity-100');
      }, 500); // Wait for the fade-out transition to finish
    }, 3000); // 3-second delay before starting the transition

    sessionStorage.removeItem('showWelcome');
  } else {
    // Don't show welcome message, just show the app
    welcomeContainer.classList.add('hidden');
    appContainer.classList.remove('hidden');
  }

  createRecordsLink.addEventListener('click', (e) => {
    e.preventDefault();
    createRecordFormContainer.classList.remove('hidden');
  });

  // Handle Create Record
  createRecordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('record-name').value;
    const login = document.getElementById('record-email').value;
    const password = document.getElementById('record-password').value;
    const ODOO_API_BASE = '/odoo';

    try {
      const response = await fetch(`${ODOO_API_BASE}/web/dataset/call_kw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'call',
          params: {
            model: 'x_login.user',
            method: 'create',
            args: [{
              x_name: name,
              x_login: login,
              x_password: password, // ⚠️ best practice is hashing this server-side
            }],
            kwargs: {},
          },
          id: Date.now(),
        }),
      });
      const data = await response.json();
      if (data.error) {
        alert('Failed to create record: ' + data.error.data.message);
      } else {
        createRecordForm.reset();
        showSuccessPopup();
      }
    } catch (err) {
      alert('Network error during record creation.');
    }
  });

  function showSuccessPopup() {
    successPopup.classList.remove('hidden');
    successPopup.classList.add('opacity-100');
    setTimeout(() => {
      hideSuccessPopup();
    }, 5000); // Auto-hide after 5 seconds
  }

  function hideSuccessPopup() {
    successPopup.classList.add('opacity-0');
    setTimeout(() => {
      successPopup.classList.add('hidden');
    }, 500);
  }

  closePopupButton.addEventListener('click', hideSuccessPopup);
});

document.getElementById('logout-button').addEventListener('click', () => {
  localStorage.removeItem('odoo_session_token');
  localStorage.removeItem('odoo_user_id');
  localStorage.removeItem('odoo_username');
  localStorage.removeItem('odoo_db');
  window.location.href = '../index.html';
});