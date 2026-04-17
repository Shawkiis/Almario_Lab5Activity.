// =============================================
// STORAGE & DATABASE
// =============================================
const STORAGE_KEY = 'ipt_demo_v1';
let currentUser = null;

window.db = {
  accounts: [],
  departments: [],
  employees: [],
  requests: []
};

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      window.db = JSON.parse(raw);
    } else {
      // Seed default data
      window.db = {
        accounts: [
          {
            firstName: 'Admin',
            lastName: 'User',
            email: 'admin@example.com',
            password: 'Password123!',
            role: 'Admin',
            verified: true
          }
        ],
        departments: [
          { name: 'Engineering', description: 'Handles all technical development.' },
          { name: 'HR', description: 'Manages people and culture.' }
        ],
        employees: [],
        requests: []
      };
      saveToStorage();
    }
  } catch (e) {
    console.error('Storage load failed, resetting:', e);
    localStorage.removeItem(STORAGE_KEY);
    loadFromStorage();
  }
}

function saveToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(window.db));
}

// =============================================
// TOAST NOTIFICATIONS
// =============================================
function showToast(message, type = 'info') {
  const colors = {
    success: 'text-bg-success',
    danger:  'text-bg-danger',
    info:    'text-bg-primary',
    warning: 'text-bg-warning'
  };
  const colorClass = colors[type] || colors.info;

  const toastEl = document.createElement('div');
  toastEl.className = `toast align-items-center ${colorClass} border-0`;
  toastEl.setAttribute('role', 'alert');
  toastEl.innerHTML = `
    <div class="d-flex">
      <div class="toast-body fw-semibold">${message}</div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
    </div>`;
  document.getElementById('toast-container').appendChild(toastEl);
  const bsToast = new bootstrap.Toast(toastEl, { delay: 3000 });
  bsToast.show();
  toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove());
}

// =============================================
// AUTH STATE MANAGEMENT
// =============================================
function setAuthState(isAuth, user = null) {
  currentUser = user;
  const body = document.body;

  if (isAuth && user) {
    body.classList.remove('not-authenticated');
    body.classList.add('authenticated');
    if (user.role === 'Admin') {
      body.classList.add('is-admin');
    } else {
      body.classList.remove('is-admin');
    }
    document.getElementById('nav-username').textContent =
      `${user.firstName} ${user.lastName}`;
  } else {
    body.classList.remove('authenticated', 'is-admin');
    body.classList.add('not-authenticated');
    document.getElementById('nav-username').textContent = 'User';
  }
}

// =============================================
// ROUTING
// =============================================
const PROTECTED_ROUTES  = ['#/profile', '#/requests'];
const ADMIN_ROUTES      = ['#/accounts', '#/departments', '#/employees'];

function navigateTo(hash) {
  window.location.hash = hash;
}

function handleRouting() {
  const hash = window.location.hash || '#/';

  // Auth guards
  if (PROTECTED_ROUTES.includes(hash) && !currentUser) {
    showToast('Please login first.', 'warning');
    navigateTo('#/login');
    return;
  }
  if (ADMIN_ROUTES.includes(hash)) {
    if (!currentUser) {
      showToast('Please login first.', 'warning');
      navigateTo('#/login');
      return;
    }
    if (currentUser.role !== 'Admin') {
      showToast('Access denied: Admins only.', 'danger');
      navigateTo('#/');
      return;
    }
  }

  // Hide all pages
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

  // Map hash → page id
  const routeMap = {
    '#/':            'home-page',
    '#/register':    'register-page',
    '#/verify-email':'verify-email-page',
    '#/login':       'login-page',
    '#/profile':     'profile-page',
    '#/accounts':    'accounts-page',
    '#/departments': 'departments-page',
    '#/employees':   'employees-page',
    '#/requests':    'requests-page'
  };

  const pageId = routeMap[hash] || 'home-page';
  const page = document.getElementById(pageId);
  if (page) page.classList.add('active');

  // Page-specific render
  if (hash === '#/profile')     renderProfile();
  if (hash === '#/accounts')    renderAccountsList();
  if (hash === '#/departments') renderDepartmentsList();
  if (hash === '#/employees')   renderEmployeesTable();
  if (hash === '#/requests')    renderRequestsList();
}

window.addEventListener('hashchange', handleRouting);

// =============================================
// REGISTRATION
// =============================================
document.getElementById('register-form').addEventListener('submit', function (e) {
  e.preventDefault();
  const firstName = document.getElementById('reg-first').value.trim();
  const lastName  = document.getElementById('reg-last').value.trim();
  const email     = document.getElementById('reg-email').value.trim().toLowerCase();
  const password  = document.getElementById('reg-password').value;
  const errEl     = document.getElementById('reg-error');

  errEl.classList.add('d-none');

  if (!firstName || !lastName || !email || !password) {
    errEl.textContent = 'All fields are required.';
    errEl.classList.remove('d-none');
    return;
  }
  if (password.length < 6) {
    errEl.textContent = 'Password must be at least 6 characters.';
    errEl.classList.remove('d-none');
    return;
  }

  const exists = window.db.accounts.find(a => a.email === email);
  if (exists) {
    errEl.textContent = 'Email already registered.';
    errEl.classList.remove('d-none');
    return;
  }

  window.db.accounts.push({ firstName, lastName, email, password, role: 'User', verified: false });
  saveToStorage();
  localStorage.setItem('unverified_email', email);
  this.reset();

  const unverifiedEmail = localStorage.getItem('unverified_email');
  document.getElementById('verify-msg').textContent =
    `Verification sent to ${unverifiedEmail}`;

  showToast('Registration successful! Please verify your email.', 'success');
  navigateTo('#/verify-email');
});

// =============================================
// EMAIL VERIFICATION (Simulated)
// =============================================
document.getElementById('simulate-verify-btn').addEventListener('click', function () {
  const email = localStorage.getItem('unverified_email');
  if (!email) {
    showToast('No pending verification found.', 'danger');
    return;
  }
  const account = window.db.accounts.find(a => a.email === email);
  if (!account) {
    showToast('Account not found.', 'danger');
    return;
  }
  account.verified = true;
  saveToStorage();
  localStorage.removeItem('unverified_email');
  showToast('Email verified! You can now login.', 'success');
  navigateTo('#/login');
});

// =============================================
// LOGIN
// =============================================
document.getElementById('login-form').addEventListener('submit', function (e) {
  e.preventDefault();
  const email    = document.getElementById('login-email').value.trim().toLowerCase();
  const password = document.getElementById('login-password').value;
  const errEl    = document.getElementById('login-error');

  errEl.classList.add('d-none');

  const user = window.db.accounts.find(
    a => a.email === email && a.password === password && a.verified === true
  );

  if (!user) {
    errEl.textContent = 'Invalid credentials or account not verified.';
    errEl.classList.remove('d-none');
    return;
  }

  localStorage.setItem('auth_token', email);
  setAuthState(true, user);
  this.reset();
  showToast(`Welcome back, ${user.firstName}!`, 'success');
  navigateTo('#/profile');
});

// =============================================
// LOGOUT
// =============================================
document.getElementById('logout-btn').addEventListener('click', function (e) {
  e.preventDefault();
  localStorage.removeItem('auth_token');
  setAuthState(false);
  showToast('Logged out successfully.', 'info');
  navigateTo('#/');
});

// =============================================
// PROFILE
// =============================================
function renderProfile() {
  if (!currentUser) return;
  document.getElementById('profile-info').innerHTML = `
    <p><strong>Name:</strong> ${currentUser.firstName} ${currentUser.lastName}</p>
    <p><strong>Email:</strong> ${currentUser.email}</p>
    <p><strong>Role:</strong>
      <span class="badge ${currentUser.role === 'Admin' ? 'bg-danger' : 'bg-secondary'}">
        ${currentUser.role}
      </span>
    </p>
    <p><strong>Verified:</strong> ${currentUser.verified ? '✅ Yes' : '❌ No'}</p>
  `;
}

// =============================================
// ACCOUNTS CRUD (Admin)
// =============================================
function renderAccountsList() {
  const tbody = document.getElementById('accounts-tbody');
  tbody.innerHTML = '';
  window.db.accounts.forEach((acc, i) => {
    const isSelf = currentUser && acc.email === currentUser.email;
    tbody.innerHTML += `
      <tr>
        <td>${acc.firstName} ${acc.lastName}</td>
        <td>${acc.email}</td>
        <td><span class="badge ${acc.role === 'Admin' ? 'bg-danger' : 'bg-secondary'}">${acc.role}</span></td>
        <td>${acc.verified ? '✅' : '❌'}</td>
        <td>
          <button class="btn btn-sm btn-outline-primary me-1" onclick="editAccount(${i})">Edit</button>
          <button class="btn btn-sm btn-outline-warning me-1" onclick="resetPassword(${i})">Reset PW</button>
          <button class="btn btn-sm btn-outline-danger" onclick="deleteAccount(${i})" ${isSelf ? 'disabled title="Cannot delete yourself"' : ''}>Delete</button>
        </td>
      </tr>`;
  });
}

function openAccountForm(index = null) {
  document.getElementById('account-form-card').classList.remove('d-none');
  if (index !== null) {
    const acc = window.db.accounts[index];
    document.getElementById('acc-first').value    = acc.firstName;
    document.getElementById('acc-last').value     = acc.lastName;
    document.getElementById('acc-email').value    = acc.email;
    document.getElementById('acc-password').value = '';
    document.getElementById('acc-role').value     = acc.role;
    document.getElementById('acc-verified').checked = acc.verified;
    document.getElementById('acc-edit-index').value  = index;
    document.getElementById('account-form-title').textContent = 'Edit Account';
  } else {
    document.getElementById('account-form').reset();
    document.getElementById('acc-edit-index').value = '';
    document.getElementById('account-form-title').textContent = 'Add Account';
  }
}

function closeAccountForm() {
  document.getElementById('account-form-card').classList.add('d-none');
  document.getElementById('account-form').reset();
}

document.getElementById('account-form').addEventListener('submit', function (e) {
  e.preventDefault();
  const editIndex = document.getElementById('acc-edit-index').value;
  const firstName = document.getElementById('acc-first').value.trim();
  const lastName  = document.getElementById('acc-last').value.trim();
  const email     = document.getElementById('acc-email').value.trim().toLowerCase();
  const password  = document.getElementById('acc-password').value;
  const role      = document.getElementById('acc-role').value;
  const verified  = document.getElementById('acc-verified').checked;

  if (!firstName || !lastName || !email) {
    showToast('Name and email are required.', 'danger');
    return;
  }

  if (editIndex !== '') {
    const idx = parseInt(editIndex);
    const acc = window.db.accounts[idx];
    acc.firstName = firstName;
    acc.lastName  = lastName;
    acc.email     = email;
    acc.role      = role;
    acc.verified  = verified;
    if (password.length >= 6) acc.password = password;
    showToast('Account updated.', 'success');
  } else {
    if (password.length < 6) {
      showToast('Password must be at least 6 characters.', 'danger');
      return;
    }
    const exists = window.db.accounts.find(a => a.email === email);
    if (exists) {
      showToast('Email already exists.', 'danger');
      return;
    }
    window.db.accounts.push({ firstName, lastName, email, password, role, verified });
    showToast('Account created.', 'success');
  }

  saveToStorage();
  closeAccountForm();
  renderAccountsList();
});

function editAccount(index) {
  openAccountForm(index);
}

function resetPassword(index) {
  const newPw = prompt('Enter new password (min 6 characters):');
  if (!newPw) return;
  if (newPw.length < 6) {
    showToast('Password must be at least 6 characters.', 'danger');
    return;
  }
  window.db.accounts[index].password = newPw;
  saveToStorage();
  showToast('Password reset successfully.', 'success');
}

function deleteAccount(index) {
  const acc = window.db.accounts[index];
  if (currentUser && acc.email === currentUser.email) {
    showToast('You cannot delete your own account.', 'danger');
    return;
  }
  if (!confirm(`Delete account "${acc.email}"?`)) return;
  window.db.accounts.splice(index, 1);
  saveToStorage();
  renderAccountsList();
  showToast('Account deleted.', 'success');
}

// =============================================
// DEPARTMENTS (Admin)
// =============================================
function renderDepartmentsList() {
  const tbody = document.getElementById('departments-tbody');
  tbody.innerHTML = '';
  window.db.departments.forEach((dept, i) => {
    tbody.innerHTML += `
      <tr>
        <td>${dept.name}</td>
        <td>${dept.description}</td>
        <td><button class="btn btn-sm btn-outline-secondary" onclick="showToast('Edit Departments - not implemented', 'info')">Edit</button></td>
      </tr>`;
  });
}

// =============================================
// EMPLOYEES CRUD (Admin)
// =============================================
function renderEmployeesTable() {
  const tbody = document.getElementById('employees-tbody');
  tbody.innerHTML = '';
  window.db.employees.forEach((emp, i) => {
    const dept = window.db.departments[emp.deptIndex];
    tbody.innerHTML += `
      <tr>
        <td>${emp.employeeId}</td>
        <td>${emp.userEmail}</td>
        <td>${emp.position}</td>
        <td>${dept ? dept.name : 'N/A'}</td>
        <td>${emp.hireDate}</td>
        <td>
          <button class="btn btn-sm btn-outline-primary me-1" onclick="editEmployee(${i})">Edit</button>
          <button class="btn btn-sm btn-outline-danger" onclick="deleteEmployee(${i})">Delete</button>
        </td>
      </tr>`;
  });
}

function openEmployeeForm(index = null) {
  // Populate department dropdown
  const deptSelect = document.getElementById('emp-dept');
  deptSelect.innerHTML = '';
  window.db.departments.forEach((d, i) => {
    deptSelect.innerHTML += `<option value="${i}">${d.name}</option>`;
  });

  document.getElementById('employee-form-card').classList.remove('d-none');

  if (index !== null) {
    const emp = window.db.employees[index];
    document.getElementById('emp-id').value        = emp.employeeId;
    document.getElementById('emp-email').value     = emp.userEmail;
    document.getElementById('emp-position').value  = emp.position;
    document.getElementById('emp-dept').value      = emp.deptIndex;
    document.getElementById('emp-hire').value      = emp.hireDate;
    document.getElementById('emp-edit-index').value = index;
  } else {
    document.getElementById('employee-form').reset();
    document.getElementById('emp-edit-index').value = '';
  }
}

function closeEmployeeForm() {
  document.getElementById('employee-form-card').classList.add('d-none');
  document.getElementById('employee-form').reset();
}

document.getElementById('employee-form').addEventListener('submit', function (e) {
  e.preventDefault();
  const employeeId = document.getElementById('emp-id').value.trim();
  const userEmail  = document.getElementById('emp-email').value.trim().toLowerCase();
  const position   = document.getElementById('emp-position').value.trim();
  const deptIndex  = parseInt(document.getElementById('emp-dept').value);
  const hireDate   = document.getElementById('emp-hire').value;
  const editIndex  = document.getElementById('emp-edit-index').value;

  const accountExists = window.db.accounts.find(a => a.email === userEmail);
  if (!accountExists) {
    showToast('No account found with that email.', 'danger');
    return;
  }

  const empData = { employeeId, userEmail, position, deptIndex, hireDate };

  if (editIndex !== '') {
    window.db.employees[parseInt(editIndex)] = empData;
    showToast('Employee updated.', 'success');
  } else {
    window.db.employees.push(empData);
    showToast('Employee added.', 'success');
  }

  saveToStorage();
  closeEmployeeForm();
  renderEmployeesTable();
});

function editEmployee(index) {
  openEmployeeForm(index);
}

function deleteEmployee(index) {
  if (!confirm('Delete this employee record?')) return;
  window.db.employees.splice(index, 1);
  saveToStorage();
  renderEmployeesTable();
  showToast('Employee deleted.', 'success');
}

// =============================================
// REQUESTS
// =============================================
document.getElementById('add-item-btn').addEventListener('click', function () {
  const container = document.getElementById('req-items-container');
  const div = document.createElement('div');
  div.className = 'req-item row g-2 mb-2';
  div.innerHTML = `
    <div class="col-6">
      <input type="text" class="form-control item-name" placeholder="Item name" required />
    </div>
    <div class="col-4">
      <input type="number" class="form-control item-qty" placeholder="Qty" min="1" value="1" required />
    </div>
    <div class="col-2">
      <button type="button" class="btn btn-danger btn-sm w-100 remove-item-btn">×</button>
    </div>`;
  container.appendChild(div);
});

document.getElementById('req-items-container').addEventListener('click', function (e) {
  if (e.target.classList.contains('remove-item-btn')) {
    const items = document.querySelectorAll('.req-item');
    if (items.length > 1) {
      e.target.closest('.req-item').remove();
    } else {
      showToast('At least one item is required.', 'warning');
    }
  }
});

document.getElementById('submit-request-btn').addEventListener('click', function () {
  if (!currentUser) return;

  const type = document.getElementById('req-type').value;
  const itemEls = document.querySelectorAll('.req-item');
  const items = [];

  itemEls.forEach(row => {
    const name = row.querySelector('.item-name').value.trim();
    const qty  = parseInt(row.querySelector('.item-qty').value) || 1;
    if (name) items.push({ name, qty });
  });

  if (items.length === 0) {
    showToast('Please add at least one item.', 'danger');
    return;
  }

  const request = {
    type,
    items,
    status: 'Pending',
    date: new Date().toLocaleDateString(),
    employeeEmail: currentUser.email
  };

  window.db.requests.push(request);
  saveToStorage();

  // Reset modal form
  document.getElementById('req-type').value = 'Equipment';
  document.getElementById('req-items-container').innerHTML = `
    <div class="req-item row g-2 mb-2">
      <div class="col-6">
        <input type="text" class="form-control item-name" placeholder="Item name" required />
      </div>
      <div class="col-4">
        <input type="number" class="form-control item-qty" placeholder="Qty" min="1" value="1" required />
      </div>
      <div class="col-2">
        <button type="button" class="btn btn-danger btn-sm w-100 remove-item-btn">×</button>
      </div>
    </div>`;

  bootstrap.Modal.getInstance(document.getElementById('requestModal')).hide();
  renderRequestsList();
  showToast('Request submitted!', 'success');
});

function renderRequestsList() {
  if (!currentUser) return;
  const tbody = document.getElementById('requests-tbody');
  const myRequests = window.db.requests.filter(r => r.employeeEmail === currentUser.email);
  tbody.innerHTML = '';

  if (myRequests.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted">No requests yet.</td></tr>`;
    return;
  }

  myRequests.forEach(req => {
    const itemSummary = req.items.map(it => `${it.name} (x${it.qty})`).join(', ');
    const badgeClass = {
      Pending:  'bg-warning text-dark',
      Approved: 'bg-success',
      Rejected: 'bg-danger'
    }[req.status] || 'bg-secondary';

    tbody.innerHTML += `
      <tr>
        <td>${req.type}</td>
        <td>${itemSummary}</td>
        <td>${req.date}</td>
        <td><span class="badge ${badgeClass}">${req.status}</span></td>
      </tr>`;
  });
}

// =============================================
// INIT
// =============================================
function init() {
  loadFromStorage();

  // Restore session if token exists
  const token = localStorage.getItem('auth_token');
  if (token) {
    const user = window.db.accounts.find(a => a.email === token);
    if (user) {
      setAuthState(true, user);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  // Set default hash
  if (!window.location.hash) {
    window.location.hash = '#/';
  }

  handleRouting();
}

init();
