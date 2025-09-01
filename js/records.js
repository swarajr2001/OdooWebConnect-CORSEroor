document.addEventListener('DOMContentLoaded', () => {
  const ODOO_API_BASE = '/odoo';
  const recordsTableBody = document.getElementById('records-table-body');
  const reloadButton = document.getElementById('reload-button');
  const notificationContainer = document.getElementById('notification-container');
  const deleteConfirmModal = document.getElementById('delete-confirm-modal');
  const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
  const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
  let recordIdToDelete = null;

  function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification p-4 rounded-lg shadow-lg text-white ${type === 'success' ? 'bg-green-500' : 'bg-red-500'}`;
    notification.innerHTML = `<p>${message}</p>`;
    notificationContainer.appendChild(notification);
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateY(-20px)';
      setTimeout(() => notification.remove(), 500);
    }, 5000);
  }

  function showLoadingState() {
    recordsTableBody.innerHTML = '<tr><td colspan="4" class="text-center py-4"><div class="loader mx-auto"></div><p class="mt-2">Retrieving data...</p></td></tr>';
  }

  function showErrorState(message) {
    recordsTableBody.innerHTML = `<tr><td colspan="4" class="text-center py-4 text-red-500">${message}</td></tr>`;
  }

  async function fetchRecords() {
    showLoadingState();
    try {
      const response = await fetch(`${ODOO_API_BASE}/web/dataset/call_kw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'call',
          params: { model: 'x_login.user', method: 'search_read', args: [[]], kwargs: { fields: ['id', 'x_name', 'x_login'], limit: 10 } },
          id: Date.now(),
        }),
      });
      const data = await response.json();
      if (data.error) {
        showErrorState('Failed to fetch records: ' + data.error.data.message);
      } else {
        populateTable(data.result);
      }
    } catch (err) {
      showErrorState('Network error. Please check your connection and try again.');
    }
  }

  function populateTable(records) {
    recordsTableBody.innerHTML = '';
    if (records.length === 0) {
      recordsTableBody.innerHTML = '<tr><td colspan="4" class="text-center py-4">No records found.</td></tr>';
      return;
    }
    records.forEach(record => {
      const row = document.createElement('tr');
      row.setAttribute('data-id', record.id);
      row.innerHTML = `
        <td class="px-6 py-4 whitespace-nowrap">${record.id}</td>
        <td class="px-6 py-4 whitespace-nowrap" data-field="x_name">${record.x_name}</td>
        <td class="px-6 py-4 whitespace-nowrap" data-field="x_login">${record.x_login}</td>
        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
          <button class="text-indigo-600 hover:text-indigo-900 update-btn">Update</button>
          <button class="text-red-600 hover:text-red-900 ml-4 delete-btn">Delete</button>
        </td>
      `;
      recordsTableBody.appendChild(row);
    });
  }

  async function deleteRecord(recordId) {
    hideDeleteModal();
    try {
      const response = await fetch(`${ODOO_API_BASE}/web/dataset/call_kw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'call',
          params: { model: 'x_login.user', method: 'unlink', args: [[recordId]], kwargs: {} },
          id: Date.now(),
        }),
      });
      const data = await response.json();
      if (data.error) {
        showNotification('Failed to delete record: ' + data.error.data.message, 'error');
      } else {
        showNotification('Record deleted successfully!');
        fetchRecords();
      }
    } catch (err) {
      showNotification('Network error during record deletion.', 'error');
    }
  }

  async function updateRecord(recordId, newData) {
    try {
      const response = await fetch(`${ODOO_API_BASE}/web/dataset/call_kw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'call',
          params: { model: 'x_login.user', method: 'write', args: [[recordId], newData], kwargs: {} },
          id: Date.now(),
        }),
      });
      const data = await response.json();
      if (data.error) {
        showNotification('Failed to update record: ' + data.error.data.message, 'error');
        return false;
      } else {
        showNotification('Record updated successfully!');
        return true;
      }
    } catch (err) {
      showNotification('Network error during record update.', 'error');
      return false;
    }
  }

  function showDeleteModal(recordId) {
    recordIdToDelete = recordId;
    deleteConfirmModal.classList.remove('hidden');
  }

  function hideDeleteModal() {
    recordIdToDelete = null;
    deleteConfirmModal.classList.add('hidden');
  }

  recordsTableBody.addEventListener('click', async (e) => {
    const target = e.target;
    if (!target.closest('tr')) return;
    const row = target.closest('tr');
    const recordId = parseInt(row.getAttribute('data-id'));

    if (target.classList.contains('delete-btn')) {
      showDeleteModal(recordId);
    } else if (target.classList.contains('update-btn')) {
      const nameCell = row.querySelector('[data-field="x_name"]');
      const loginCell = row.querySelector('[data-field="x_login"]');
      nameCell.setAttribute('contenteditable', true);
      loginCell.setAttribute('contenteditable', true);
      nameCell.focus();
      target.innerHTML = 'Save';
      target.classList.remove('update-btn', 'text-indigo-600');
      target.classList.add('save-btn', 'text-green-600');
      const deleteBtn = row.querySelector('.delete-btn');
      deleteBtn.innerHTML = 'Discard';
      deleteBtn.classList.remove('delete-btn', 'text-red-600');
      deleteBtn.classList.add('discard-btn', 'text-gray-600');
    } else if (target.classList.contains('save-btn')) {
      const nameCell = row.querySelector('[data-field="x_name"]');
      const loginCell = row.querySelector('[data-field="x_login"]');
      const newData = { x_name: nameCell.innerText, x_login: loginCell.innerText };
      const success = await updateRecord(recordId, newData);
      if (success) {
        nameCell.setAttribute('contenteditable', false);
        loginCell.setAttribute('contenteditable', false);
        target.innerHTML = 'Update';
        target.classList.remove('save-btn', 'text-green-600');
        target.classList.add('update-btn', 'text-indigo-600');
        const discardBtn = row.querySelector('.discard-btn');
        discardBtn.innerHTML = 'Delete';
        discardBtn.classList.remove('discard-btn', 'text-gray-600');
        discardBtn.classList.add('delete-btn', 'text-red-600');
      }
    } else if (target.classList.contains('discard-btn')) {
      fetchRecords();
    }
  });

  confirmDeleteBtn.addEventListener('click', () => {
    if (recordIdToDelete) {
      deleteRecord(recordIdToDelete);
    }
  });

  cancelDeleteBtn.addEventListener('click', hideDeleteModal);
  reloadButton.addEventListener('click', fetchRecords);
  fetchRecords();
});

document.getElementById('logout-button').addEventListener('click', () => {
  localStorage.removeItem('odoo_session_token');
  localStorage.removeItem('odoo_user_id');
  localStorage.removeItem('odoo_username');
  localStorage.removeItem('odoo_db');
  window.location.href = '../index.html';
});