    const ODOO_API_BASE = '/odoo'; // proxied in Netlify
    const MESSAGE_TIMEOUT = 5000;

    const messageBox = document.getElementById('message-box');
    const messageText = document.getElementById('message-text');

    function showMessage(message, type) {
      messageBox.classList.remove('hidden', 'bg-red-100', 'text-red-800', 'bg-green-100', 'text-green-800');
      if (type === 'error') {
        messageBox.classList.add('bg-red-100', 'text-red-800');
      } else if (type === 'success') {
        messageBox.classList.add('bg-green-100', 'text-green-800');
      }
      messageText.innerText = message;
      setTimeout(() => {
        messageBox.classList.add('hidden');
      }, MESSAGE_TIMEOUT);
    }

    // Handle Login
    document.getElementById('login-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const db = document.getElementById('db').value;
      const login = document.getElementById('username').value;
      const password = document.getElementById('password').value;

      try {
        const response = await fetch(`${ODOO_API_BASE}/web/session/authenticate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'call',
            params: { db, login, password },
            id: Date.now()
          }),
        });
        const data = await response.json();
        if (data.error) {
          showMessage('Login failed: ' + data.error.data.message, 'error');
        } else {
          localStorage.setItem('odoo_session_token', data.result.session_id);
          localStorage.setItem('odoo_user_id', data.result.uid);
          localStorage.setItem('odoo_username', data.result.name);
          localStorage.setItem('odoo_db', db);
          sessionStorage.setItem('showWelcome', 'true');
          window.location.href = 'pages/welcome.html';
        }
      } catch (err) {
        showMessage('Network error during login.', 'error');
      }
    });

    
