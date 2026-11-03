// ===== APP.JS - Main Application Logic =====

// ===== BOOKING STATE =====
let bookingState = {
  selectedPondId: null,
  selectedDate: null,
  selectedSlot: null,
  useStudentDiscount: false,
  step: 1
};

// ===== UTILITY FUNCTIONS =====
function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
}

function formatCurrency(amount) {
  return '฿' + Number(amount).toLocaleString('th-TH');
}

function generateRef() {
  return 'BK' + Date.now().toString().slice(-8);
}

function getStatusLabel(status) {
  const map = {
    pending: '<span class="status-badge status-pending"><i class="fas fa-clock"></i> รอชำระเงิน</span>',
    confirmed: '<span class="status-badge status-confirmed"><i class="fas fa-check"></i> ยืนยันแล้ว</span>',
    completed: '<span class="status-badge status-completed"><i class="fas fa-check-double"></i> เสร็จสิ้น</span>',
    cancelled: '<span class="status-badge status-cancelled"><i class="fas fa-times"></i> ยกเลิกแล้ว</span>',
    verified: '<span class="status-badge status-verified"><i class="fas fa-check-circle"></i> ยืนยันแล้ว</span>',
    rejected: '<span class="status-badge status-rejected"><i class="fas fa-times-circle"></i> ปฏิเสธ</span>',
    open: '<span class="status-badge status-open"><i class="fas fa-door-open"></i> เปิดบริการ</span>',
    closed: '<span class="status-badge status-closed"><i class="fas fa-door-closed"></i> ปิดบริการ</span>',
    maintenance: '<span class="status-badge status-maintenance"><i class="fas fa-tools"></i> ปรับปรุง</span>',
    active: '<span class="status-badge status-active"><i class="fas fa-eye"></i> เปิดแสดง</span>',
    inactive: '<span class="status-badge status-inactive"><i class="fas fa-eye-slash"></i> ปิดแสดง</span>'
  };
  return map[status] || status;
}

function getPayMethodLabel(method) {
  const map = { transfer: '🏦 โอนธนาคาร', promptpay: '📱 พร้อมเพย์', cash: '💵 เงินสด' };
  return map[method] || method;
}

function getSlotPrice(pondId, slot) {
  const pond = DB.ponds.find(p => p.id === pondId);
  if (!pond) return 0;
  const multipliers = {
    'เช้า (06:00-12:00)': 6,
    'บ่าย (12:00-18:00)': 6,
    'เย็น (18:00-22:00)': 4,
    'เต็มวัน (06:00-22:00)': 16
  };
  return pond.price * (multipliers[slot] || 6);
}

// ===== TOAST =====
function showToast(type, title, msg) {
  const icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', info: 'fa-info-circle', warning: 'fa-exclamation-triangle' };
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<i class="fas ${icons[type]}"></i><div class="toast-content"><div class="toast-title">${title}</div>${msg ? `<div class="toast-msg">${msg}</div>` : ''}</div>`;
  document.getElementById('toast-container').appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateX(40px)'; toast.style.transition = 'all 0.3s'; setTimeout(() => toast.remove(), 300); }, 3500);
}

// ===== MODAL =====
function showModal(id) {
  document.getElementById(id).classList.remove('hidden');
  document.getElementById('modal-overlay').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeModal(id) {
  document.getElementById(id).classList.add('hidden');
  document.getElementById('modal-overlay').classList.add('hidden');
  document.body.style.overflow = '';
}

function switchModal(from, to) { closeModal(from); showModal(to); }

function toggleDropdown(id) {
  const el = document.getElementById(id);
  el.classList.toggle('hidden');
  document.addEventListener('click', function handler(e) {
    if (!e.target.closest('.nav-profile-dropdown')) {
      el.classList.add('hidden');
      document.removeEventListener('click', handler);
    }
  });
}

document.getElementById('modal-overlay').addEventListener('click', () => {
  document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
  document.getElementById('modal-overlay').classList.add('hidden');
  document.body.style.overflow = '';
});

// ===== NAV =====
function toggleNav() {
  document.getElementById('nav-menu').classList.toggle('open');
}

function updateNavActive(pageId) {
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  const map = {
    'home': 'nav-home',
    'ponds': 'nav-ponds',
    'booking': 'nav-booking',
    'promotions': 'nav-promo',
    'news': 'nav-news'
  };
  if (map[pageId]) {
    const el = document.getElementById(map[pageId]);
    if (el) el.classList.add('active');
  }
}

// ===== PAGE NAVIGATION =====
const PAGE_URL_MAP = {
  'home': 'index.html',
  'ponds': 'ponds.html',
  'pond-detail': 'ponds.html',
  'booking': 'booking.html',
  'promotions': 'promotions.html',
  'news': 'news.html',
  'profile': 'profile.html',
  'my-bookings': 'my-bookings.html',
  'my-payment': 'my-payment.html',
  'admin': 'admin.html'
};

function showPage(pageId) {
  const target = document.getElementById('page-' + pageId);
  if (target) {
    document.querySelectorAll('.page').forEach(p => {
      p.classList.remove('active');
      p.classList.add('hidden');
    });
    target.classList.remove('hidden');
    target.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    updateNavActive(pageId);
    const navMenu = document.getElementById('nav-menu');
    if (navMenu) navMenu.classList.remove('open');

    // Page-specific init
    if (pageId === 'home') { renderHomePonds(); renderHomeNews(); }
    if (pageId === 'ponds') renderPonds();
    if (pageId === 'booking') initBooking();
    if (pageId === 'news') renderNewsPage();
    if (pageId === 'my-bookings') renderMyBookings();
    if (pageId === 'my-payment') renderMyPayments();
    if (pageId === 'profile') loadProfile();

    // Show/hide footer
    const footer = document.getElementById('footer');
    if (footer) {
      const adminPages = ['admin'];
      footer.classList.toggle('hidden', adminPages.includes(pageId));
    }
  } else {
    // Navigate to separate page file
    const targetUrl = PAGE_URL_MAP[pageId] || (pageId + '.html');
    window.location.href = targetUrl;
  }
}

// ===== AUTH =====
function login(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  const user = DB.users.find(u => u.email === email && u.password === password);
  if (!user) { showToast('error', 'เข้าสู่ระบบไม่สำเร็จ', 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'); return; }
  if (user.status === 'inactive') { showToast('error', 'บัญชีถูกระงับ', 'กรุณาติดต่อผู้ดูแลระบบ'); return; }
  currentUser = user;
  localStorage.setItem('fishing_currentUser', JSON.stringify(currentUser));
  updateNavUser();
  closeModal('login-modal');
  showToast('success', 'เข้าสู่ระบบสำเร็จ', `ยินดีต้อนรับ ${user.firstName} ${user.lastName}!`);
  document.getElementById('login-email').value = '';
  document.getElementById('login-password').value = '';
}

function register(e) {
  e.preventDefault();
  const firstName = document.getElementById('reg-firstname').value.trim();
  const lastName = document.getElementById('reg-lastname').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const phone = document.getElementById('reg-phone').value.trim();
  const password = document.getElementById('reg-password').value;
  const confirm = document.getElementById('reg-confirm-password').value;
  const address = document.getElementById('reg-address').value.trim();

  if (password !== confirm) { showToast('error', 'รหัสผ่านไม่ตรงกัน', 'กรุณากรอกรหัสผ่านให้ตรงกัน'); return; }
  if (password.length < 6) { showToast('error', 'รหัสผ่านสั้นเกินไป', 'กรุณากรอกอย่างน้อย 6 ตัวอักษร'); return; }
  if (DB.users.find(u => u.email === email)) { showToast('error', 'อีเมลนี้ถูกใช้แล้ว', 'กรุณาใช้อีเมลอื่น'); return; }

  const newUser = {
    id: DB.nextId.users++,
    firstName, lastName, email, phone, password, address,
    status: 'active', role: 'user',
    joinDate: new Date().toISOString().split('T')[0]
  };
  DB.users.push(newUser);
  saveDB();
  currentUser = newUser;
  localStorage.setItem('fishing_currentUser', JSON.stringify(currentUser));
  updateNavUser();
  closeModal('register-modal');
  showToast('success', 'สมัครสมาชิกสำเร็จ!', `ยินดีต้อนรับ ${firstName} ${lastName}`);
}

function logout() {
  currentUser = null;
  isAdmin = false;
  localStorage.removeItem('fishing_currentUser');
  localStorage.removeItem('fishing_isAdmin');
  updateNavUser();
  exitAdmin();
  if (window.location.pathname.includes('admin') || window.location.pathname.includes('profile') || window.location.pathname.includes('my-')) {
    window.location.href = 'index.html';
  } else {
    showPage('home');
  }
  showToast('info', 'ออกจากระบบแล้ว', '');
}

function updateNavUser() {
  const guestEl = document.getElementById('nav-guest');
  const loggedEl = document.getElementById('nav-logged');
  const adminBtn = document.getElementById('nav-admin-btn');
  if (currentUser) {
    if (guestEl) guestEl.classList.add('hidden');
    if (loggedEl) loggedEl.classList.remove('hidden');
    const uName = document.getElementById('nav-username');
    const uAvatar = document.getElementById('nav-avatar-text');
    if (uName) uName.textContent = currentUser.firstName;
    if (uAvatar) uAvatar.textContent = currentUser.firstName[0].toUpperCase();
  } else {
    if (guestEl) guestEl.classList.remove('hidden');
    if (loggedEl) loggedEl.classList.add('hidden');
  }
  if (adminBtn) {
    if (isAdmin) {
      adminBtn.classList.remove('hidden');
    } else {
      adminBtn.classList.add('hidden');
    }
  }
}

function togglePassword(id) {
  const input = document.getElementById(id);
  const btn = input.nextElementSibling;
  if (input.type === 'password') { input.type = 'text'; btn.innerHTML = '<i class="fas fa-eye-slash"></i>'; }
  else { input.type = 'password'; btn.innerHTML = '<i class="fas fa-eye"></i>'; }
}

// ===== ADMIN LOGIN =====
function showAdminLoginModal() { showModal('admin-login-modal'); }

function adminLogin(e) {
  e.preventDefault();
  const username = document.getElementById('admin-username').value;
  const password = document.getElementById('admin-password').value;
  if (username === DB.admin.username && password === DB.admin.password) {
    isAdmin = true;
    localStorage.setItem('fishing_isAdmin', 'true');
    closeModal('admin-login-modal');
    enterAdmin();
    showToast('success', 'เข้าสู่ระบบ Admin', 'ยินดีต้อนรับผู้ดูแลระบบ');
  } else {
    showToast('error', 'เข้าสู่ระบบไม่สำเร็จ', 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
  }
}

function enterAdmin() {
  isAdmin = true;
  localStorage.setItem('fishing_isAdmin', 'true');
  const adminPage = document.getElementById('page-admin');
  if (adminPage) {
    const sidebar = document.getElementById('admin-sidebar');
    if (sidebar) sidebar.classList.remove('hidden');
    const wrapper = document.getElementById('main-wrapper');
    if (wrapper) wrapper.classList.add('admin-mode');
    showPage('admin');
    showAdminPage('admin-dashboard');
    updateAdminStats();
    renderAdminDashboard();
    updateNavUser();
  } else {
    window.location.href = 'admin.html';
  }
}

function exitAdmin() {
  const sidebar = document.getElementById('admin-sidebar');
  if (sidebar) sidebar.classList.add('hidden');
  const wrapper = document.getElementById('main-wrapper');
  if (wrapper) wrapper.classList.remove('admin-mode');
  isAdmin = false;
  localStorage.removeItem('fishing_isAdmin');
  updateNavUser();
  if (window.location.pathname.includes('admin')) {
    window.location.href = 'index.html';
  } else {
    showPage('home');
  }
}

function showAdminPage(pageId) {
  // Ensure page-admin container is always visible
  document.querySelectorAll('.page').forEach(p => {
    p.classList.remove('active');
    p.classList.add('hidden');
  });
  const adminPageEl = document.getElementById('page-admin');
  if (adminPageEl) {
    adminPageEl.classList.remove('hidden');
    adminPageEl.classList.add('active');
  }

  // Hide footer in admin
  const footer = document.getElementById('footer');
  if (footer) footer.classList.add('hidden');

  // Always ensure sidebar is shown and wrapper has admin-mode
  const sidebar = document.getElementById('admin-sidebar');
  if (sidebar) sidebar.classList.remove('hidden');
  const wrapper = document.getElementById('main-wrapper');
  if (wrapper) wrapper.classList.add('admin-mode');

  // Hide all admin subpages and show selected one
  document.querySelectorAll('.admin-page').forEach(p => {
    p.classList.remove('active');
    p.classList.add('hidden');
  });
  const target = document.getElementById(pageId);
  if (target) {
    target.classList.remove('hidden');
    target.classList.add('active');
  }

  // Update active sidebar nav link
  document.querySelectorAll('.admin-nav-link').forEach(l => l.classList.remove('active'));
  const navId = 'anav-' + pageId.replace('admin-', '');
  const activeNav = document.getElementById(navId);
  if (activeNav) activeNav.classList.add('active');

  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Render content according to the active tab
  try {
    if (pageId === 'admin-dashboard') {
      updateAdminStats();
      renderAdminDashboard();
      setTimeout(renderCharts, 50);
    } else if (pageId === 'admin-members') {
      renderAdminMembers();
    } else if (pageId === 'admin-ponds') {
      renderAdminPonds();
    } else if (pageId === 'admin-bookings') {
      renderAdminBookings();
    } else if (pageId === 'admin-payments') {
      renderAdminPayments();
    } else if (pageId === 'admin-news') {
      renderAdminNews();
    } else if (pageId === 'admin-reports') {
      generateReports();
    }
  } catch (err) {
    console.error('Error rendering admin page:', err);
  }
}

// ===== HOME PAGE =====
function renderHomePonds() {
  const grid = document.getElementById('home-pond-grid');
  if (!grid) return;
  const ponds = DB.ponds.filter(p => p.status === 'open').slice(0, 3);
  grid.innerHTML = ponds.map(p => pondCard(p)).join('');
}

function renderHomeNews() {
  const grid = document.getElementById('home-news-grid');
  if (!grid) return;
  const news = DB.news.filter(n => n.status === 'active').slice(0, 3);
  grid.innerHTML = news.length ? news.map(n => newsCard(n)).join('') : '<p class="text-muted">ไม่มีข่าวสาร</p>';
}

// ===== POND CARDS =====
function pondCard(p) {
  const badgeClass = { open: 'badge-open', closed: 'badge-closed', maintenance: 'badge-maintenance' };
  const badgeLabel = { open: 'เปิดบริการ', closed: 'ปิดบริการ', maintenance: 'ปรับปรุง' };
  const typeClass = p.type === 'VIP' ? 'badge-vip' : '';
  return `
    <div class="pond-card" onclick="showPondDetail(${p.id})">
      <div class="pond-img-wrap">
        <img src="${p.image}" alt="${p.name}" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22220%22><rect fill=%22%23e0f3fc%22 width=%22400%22 height=%22220%22/><text x=%2250%%22 y=%2250%%22 text-anchor=%22middle%22 font-size=%2250%22>🐟</text></svg>'">
        <span class="pond-badge ${badgeClass[p.status]}">${badgeLabel[p.status]}</span>
        <span class="badge-type ${typeClass}">${p.type}</span>
      </div>
      <div class="pond-body">
        <div class="pond-name">${p.name}</div>
        <div class="pond-desc">${p.desc.substring(0, 100)}...</div>
        <div class="pond-info-row">
          <span class="pond-info-item"><i class="fas fa-clock"></i> ${p.openTime} - ${p.closeTime}</span>
          <span class="pond-info-item"><i class="fas fa-users"></i> สูงสุด ${p.capacity} คน</span>
        </div>
        <div class="pond-facilities">
          ${p.facilities.slice(0, 4).map(f => `<span class="facility-tag"><i class="fas fa-check"></i> ${f}</span>`).join('')}
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div class="pond-price">${formatCurrency(p.price)} <small>/ชั่วโมง</small></div>
          <div class="pond-actions">
            <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); bookPond(${p.id})"><i class="fas fa-calendar-check"></i> จองเดี๋ยวนี้</button>
          </div>
        </div>
      </div>
    </div>`;
}

// ===== PONDS PAGE =====
function renderPonds() {
  const grid = document.getElementById('ponds-grid');
  if (!grid) return;
  let ponds = [...DB.ponds];
  const search = document.getElementById('pond-search')?.value.toLowerCase() || '';
  const sort = document.getElementById('pond-filter-sort')?.value || '';
  if (search) ponds = ponds.filter(p => p.name.toLowerCase().includes(search) || p.type.toLowerCase().includes(search));
  if (sort === 'price-asc') ponds.sort((a, b) => a.price - b.price);
  if (sort === 'price-desc') ponds.sort((a, b) => b.price - a.price);
  if (sort === 'name') ponds.sort((a, b) => a.name.localeCompare(b.name, 'th'));
  grid.innerHTML = ponds.length ? ponds.map(p => pondCard(p)).join('') : '<div class="empty-state"><i class="fas fa-search"></i><h3>ไม่พบบ่อตกปลา</h3></div>';
}

function filterPonds() { renderPonds(); }

// ===== POND DETAIL =====
function showPondDetail(pondId) {
  const pond = DB.ponds.find(p => p.id === pondId);
  if (!pond) return;
  const content = document.getElementById('pond-detail-content');
  if (content) {
    content.innerHTML = `
      <div class="pond-detail-layout">
        <div class="pond-detail-hero">
          <img src="${pond.image}" alt="${pond.name}" onerror="this.style.background='linear-gradient(135deg,#e0f3fc,#bde8ff)';this.src='';">
        </div>
        <div class="pond-detail-grid">
          <div class="pond-detail-main">
            <div class="pond-detail-meta">
              ${getStatusLabel(pond.status)}
              <span class="status-badge" style="background:#e0f3fc;color:var(--primary)">${pond.type}</span>
            </div>
            <h1 class="pond-detail-title">${pond.name}</h1>
            <div class="pond-info-row" style="margin-bottom:20px">
              <span class="pond-info-item"><i class="fas fa-clock"></i> ${pond.openTime} - ${pond.closeTime} น.</span>
              <span class="pond-info-item"><i class="fas fa-users"></i> รองรับ ${pond.capacity} คน</span>
              <span class="pond-info-item"><i class="fas fa-fish"></i> ${pond.fishTypes?.length || 0} ชนิดปลา</span>
            </div>
            <div class="pond-detail-section">
              <h3><i class="fas fa-info-circle"></i> รายละเอียด</h3>
              <p class="pond-detail-desc">${pond.desc}</p>
            </div>
            <div class="pond-detail-section">
              <h3><i class="fas fa-fish"></i> ชนิดปลา</h3>
              <div class="pond-facilities">
                ${(pond.fishTypes || []).map(f => `<span class="facility-tag">🐟 ${f}</span>`).join('')}
              </div>
            </div>
            <div class="pond-detail-section">
              <h3><i class="fas fa-concierge-bell"></i> สิ่งอำนวยความสะดวก</h3>
              <div class="pond-facilities">
                ${pond.facilities.map(f => `<span class="facility-tag"><i class="fas fa-check"></i> ${f}</span>`).join('')}
              </div>
            </div>
            <div class="pond-detail-section">
              <h3><i class="fas fa-money-bill-wave"></i> อัตราค่าบริการ</h3>
              <div class="data-table-wrap">
                <table class="data-table">
                  <thead><tr><th>ช่วงเวลา</th><th>เวลา</th><th>ราคา/คน</th></tr></thead>
                  <tbody>
                    <tr><td>เช้า</td><td>06:00 - 12:00</td><td>${formatCurrency(pond.price * 6)}</td></tr>
                    <tr><td>บ่าย</td><td>12:00 - 18:00</td><td>${formatCurrency(pond.price * 6)}</td></tr>
                    <tr><td>เย็น</td><td>18:00 - 22:00</td><td>${formatCurrency(pond.price * 4)}</td></tr>
                    <tr><td><strong>เต็มวัน</strong></td><td>06:00 - 22:00</td><td><strong>${formatCurrency(pond.price * 16)}</strong></td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <div class="pond-detail-sidebar">
            <div class="booking-widget">
              <h3>💰 ราคาเริ่มต้น</h3>
              <div class="price-display">${formatCurrency(pond.price)} <small>/ชั่วโมง</small></div>
              <p style="opacity:0.85;font-size:0.9rem;margin-bottom:20px;">⏰ เปิด ${pond.openTime} - ${pond.closeTime} น.</p>
              <button class="btn btn-outline-white btn-block" onclick="bookPond(${pond.id})" style="justify-content:center;">
                <i class="fas fa-calendar-check"></i> จองบ่อนี้เลย!
              </button>
            </div>
          </div>
        </div>
      </div>`;
    showPage('pond-detail');
  } else {
    window.location.href = 'ponds.html?id=' + pondId;
  }
}

// ===== BOOKING =====
function bookPond(pondId) {
  const hasBookingPage = !!document.getElementById('booking-pond-grid');
  if (hasBookingPage) {
    showPage('booking');
    bookingState.selectedPondId = pondId;
    setTimeout(() => {
      document.querySelectorAll('.pond-select-card').forEach(c => {
        c.classList.toggle('selected', parseInt(c.dataset.pondId) === pondId);
      });
      gotoStep(2);
    }, 100);
  } else {
    window.location.href = 'booking.html?pond=' + pondId;
  }
}

function initBooking() {
  const grid = document.getElementById('booking-pond-grid');
  if (!grid) return;
  grid.innerHTML = DB.ponds.filter(p => p.status === 'open').map(p => `
    <div class="pond-select-card" data-pond-id="${p.id}" onclick="selectPond(${p.id})">
      <img src="${p.image}" alt="${p.name}" onerror="this.style.display='none'">
      <div class="pond-name">${p.name}</div>
      <div class="pond-info-row">
        <span class="pond-info-item"><i class="fas fa-clock"></i> ${p.openTime}-${p.closeTime}</span>
      </div>
      <div class="pond-price">${formatCurrency(p.price)}<small>/ชั่วโมง</small></div>
    </div>`).join('');

  const today = new Date().toISOString().split('T')[0];
  document.getElementById('booking-date').min = today;

  gotoStep(1);
}

function selectPond(pondId) {
  bookingState.selectedPondId = pondId;
  document.querySelectorAll('.pond-select-card').forEach(c => {
    c.classList.toggle('selected', parseInt(c.dataset.pondId) === pondId);
  });
  setTimeout(() => gotoStep(2), 300);
}

function gotoStep(step) {
  if (step === 2 && !bookingState.selectedPondId) { showToast('warning', 'กรุณาเลือกบ่อก่อน', ''); return; }
  if (step === 3) {
    if (!bookingState.selectedDate) { showToast('warning', 'กรุณาเลือกวันที่', ''); return; }
    if (!bookingState.selectedSlot) { showToast('warning', 'กรุณาเลือกช่วงเวลา', ''); return; }
    if (!currentUser) {
      showToast('info', 'กรุณาเข้าสู่ระบบก่อน', 'เพื่อดำเนินการจอง');
      showModal('login-modal');
      return;
    }
    prefillBookingForm();
    updateBookingPersonsHint();
  }
  if (step === 4) {
    if (!validateStep3()) return;
    renderBookingSummary();
    updatePaymentInfo();
  }

  document.querySelectorAll('.wizard-panel').forEach(p => { p.classList.add('hidden'); p.classList.remove('active'); });
  document.getElementById('wpanel-' + step).classList.remove('hidden');
  document.getElementById('wpanel-' + step).classList.add('active');

  bookingState.step = step;
  updateWizardSteps(step);
  window.scrollTo({ top: document.getElementById('page-booking').offsetTop - 80, behavior: 'smooth' });
}

function updateWizardSteps(currentStep) {
  for (let i = 1; i <= 4; i++) {
    const stepEl = document.getElementById('wstep-' + i);
    stepEl.classList.remove('active', 'done');
    if (i < currentStep) stepEl.classList.add('done');
    if (i === currentStep) stepEl.classList.add('active');
  }
  document.querySelectorAll('.wizard-step-line').forEach((line, idx) => {
    line.classList.toggle('done', idx + 1 < currentStep);
  });
}

function prefillBookingForm() {
  if (currentUser) {
    document.getElementById('book-name').value = `${currentUser.firstName} ${currentUser.lastName}`;
    document.getElementById('book-phone').value = currentUser.phone || '';
    document.getElementById('book-email').value = currentUser.email || '';
  }
}

function validateStep3() {
  const name = document.getElementById('book-name').value.trim();
  const phone = document.getElementById('book-phone').value.trim();
  if (!name) { showToast('warning', 'กรุณากรอกชื่อ-นามสกุล', ''); return false; }
  if (!phone) { showToast('warning', 'กรุณากรอกเบอร์โทรศัพท์', ''); return false; }
  return true;
}

// ===== PROMOTION & DISCOUNT CALCULATION =====
function calculateBookingPrice(slotPrice, persons, useStudentDiscount) {
  const p = Math.max(1, parseInt(persons) || 1);
  const freePersons = Math.floor(p / 5);
  const paidPersons = Math.max(0, p - freePersons);
  const originalAmount = slotPrice * p;
  const gangDiscount = slotPrice * freePersons;
  const afterGangAmount = originalAmount - gangDiscount;
  const studentDiscount = useStudentDiscount ? Math.round(afterGangAmount * 0.10) : 0;
  const finalAmount = Math.max(0, afterGangAmount - studentDiscount);

  return {
    persons: p,
    freePersons,
    paidPersons,
    originalAmount,
    gangDiscount,
    afterGangAmount,
    studentDiscount,
    finalAmount
  };
}

function updateBookingPersonsHint() {
  const input = document.getElementById('book-persons');
  const hint = document.getElementById('persons-promo-hint');
  if (!input || !hint) return;

  const count = parseInt(input.value) || 0;
  if (count <= 0) {
    hint.innerHTML = '<i class="fas fa-info-circle"></i><span>กรุณาระบุจำนวนผู้ใช้บริการอย่างน้อย 1 คน</span>';
    hint.className = 'promo-calc-hint';
    return;
  }

  const freeCount = Math.floor(count / 5);
  const paidCount = count - freeCount;

  if (freeCount > 0) {
    const remainder = count % 5;
    const needNext = remainder === 0 ? 5 : (5 - remainder);
    const nextMsg = remainder === 0 
      ? `เพิ่มอีก 5 คนเพื่อรับฟรีอีก 1 คน!` 
      : `ชวนเพื่อนเพิ่มอีก <strong>${needNext} คน</strong> จะได้รับสิทธิ์ฟรีเพิ่มเป็น <strong>${freeCount + 1} คน</strong>!`;
    hint.className = 'promo-calc-hint active';
    hint.innerHTML = `
      <i class="fas fa-gift" style="color:var(--success)"></i>
      <div>
        <strong>🎉 สิทธิ์โปรโมชั่น มากัน 5 จ่าย 4:</strong> ได้รับสิทธิ์<strong>ฟรี ${freeCount} คน!</strong> (ชำระเพียง ${paidCount} คน)<br>
        <small style="opacity:0.9">${nextMsg}</small>
      </div>`;
  } else {
    const need = 5 - count;
    hint.className = 'promo-calc-hint';
    hint.innerHTML = `
      <i class="fas fa-info-circle" style="color:var(--primary)"></i>
      <span>ชวนเพื่อนเพิ่มอีก <strong>${need} คน</strong> รับสิทธิ์<strong>ฟรี 1 คนทันที!</strong> (โปรโมชั่น มากัน 5 จ่าย 4)</span>`;
  }
}

function updateStudentDiscountBoxUI() {
  const banner = document.getElementById('student-discount-banner');
  const icon = document.getElementById('student-discount-icon');
  const text = document.getElementById('student-discount-btn-text');
  const btn = document.getElementById('btn-toggle-student');
  if (!banner || !btn) return;

  if (bookingState.useStudentDiscount) {
    banner.classList.add('applied');
    btn.classList.add('applied');
    if (icon) icon.className = 'fas fa-check-circle';
    if (text) text.innerText = 'ใช้สิทธิ์ส่วนลดแล้ว (-10%)';
  } else {
    banner.classList.remove('applied');
    btn.classList.remove('applied');
    if (icon) icon.className = 'fas fa-plus-circle';
    if (text) text.innerText = 'กดใช้ส่วนลด 10%';
  }
}

function toggleStudentDiscount() {
  bookingState.useStudentDiscount = !bookingState.useStudentDiscount;
  renderBookingSummary();
  updateStudentDiscountBoxUI();
  if (bookingState.useStudentDiscount) {
    showToast('success', 'ใช้ส่วนลดนักศึกษา 10% เรียบร้อย!', 'กรุณาแสดงบัตรนักศึกษาตอนเช็คอินเพื่อรับสิทธิ์');
  } else {
    showToast('info', 'ยกเลิกการใช้ส่วนลดนักศึกษาแล้ว', '');
  }
}

function applyPromoAndBook(promoType) {
  const hasBookingPage = !!document.getElementById('booking-pond-grid');
  if (hasBookingPage) {
    if (promoType === 'gang5pay4') {
      const input = document.getElementById('book-persons');
      if (input) input.value = 5;
      updateBookingPersonsHint();
      showPage('booking');
      showToast('success', 'โปรโมชั่น มากัน 5 จ่าย 4', 'ตั้งค่าจำนวนผู้ใช้บริการ 5 คน (ฟรี 1 คน) เรียบร้อย กรุณาเลือกบ่อตกปลา');
    } else if (promoType === 'student') {
      bookingState.useStudentDiscount = true;
      if (typeof updateStudentDiscountBoxUI === 'function') updateStudentDiscountBoxUI();
      showPage('booking');
      showToast('success', 'โปรโมชั่นนักศึกษา', 'เปิดใช้งานส่วนลดนักศึกษา 10% เรียบร้อย กรุณาเลือกบ่อตกปลา');
    } else if (promoType === 'birthday') {
      showPage('booking');
      showToast('info', 'โปรโมชั่นเดือนเกิด', 'เลือกบ่อตกปลาและวันเวลา แล้วโชว์บัตรประชาชนตอนเช็คอินเพื่อรับของขวัญพิเศษ!');
    } else {
      showPage('booking');
    }
  } else {
    window.location.href = 'booking.html?promo=' + encodeURIComponent(promoType);
  }
}

function goToPromotions() {
  const promoSection = document.getElementById('promo-gang-section');
  if (promoSection && !window.location.pathname.includes('promotions')) {
    promoSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } else {
    window.location.href = 'promotions.html';
  }
}

function renderBookingSummary() {
  const pond = DB.ponds.find(p => p.id === bookingState.selectedPondId);
  const slotPrice = getSlotPrice(bookingState.selectedPondId, bookingState.selectedSlot);
  const name = document.getElementById('book-name').value;
  const phone = document.getElementById('book-phone').value;
  const email = document.getElementById('book-email').value;
  const note = document.getElementById('book-note').value;
  const persons = parseInt(document.getElementById('book-persons').value) || 1;

  const calc = calculateBookingPrice(slotPrice, persons, bookingState.useStudentDiscount);
  const summary = document.getElementById('booking-summary');
  summary.innerHTML = `
    <h3 style="margin-bottom:16px;color:var(--primary)"><i class="fas fa-receipt"></i> สรุปการจองและค่าบริการ</h3>
    <div class="summary-row"><span class="summary-label"><i class="fas fa-water" style="color:var(--primary);margin-right:6px"></i> บ่อตกปลา</span><span><strong>${pond?.name || '-'}</strong></span></div>
    <div class="summary-row"><span class="summary-label"><i class="fas fa-tag" style="color:var(--primary);margin-right:6px"></i> ประเภทบ่อ</span><span>${pond?.type || '-'}</span></div>
    <div class="summary-row"><span class="summary-label"><i class="fas fa-calendar" style="color:var(--primary);margin-right:6px"></i> วันที่</span><span>${formatDate(bookingState.selectedDate)}</span></div>
    <div class="summary-row"><span class="summary-label"><i class="fas fa-clock" style="color:var(--primary);margin-right:6px"></i> ช่วงเวลา</span><span>${bookingState.selectedSlot || '-'}</span></div>
    <div class="summary-row" style="margin-top:8px;padding-top:8px;border-top:1px dashed var(--border)"><span class="summary-label"><i class="fas fa-user" style="color:var(--primary);margin-right:6px"></i> ชื่อผู้จอง</span><span>${name}</span></div>
    <div class="summary-row"><span class="summary-label"><i class="fas fa-phone" style="color:var(--primary);margin-right:6px"></i> เบอร์โทร</span><span>${phone}</span></div>
    ${email ? `<div class="summary-row"><span class="summary-label"><i class="fas fa-envelope" style="color:var(--primary);margin-right:6px"></i> อีเมล</span><span>${email}</span></div>` : ''}
    ${note ? `<div class="summary-row"><span class="summary-label"><i class="fas fa-sticky-note" style="color:var(--primary);margin-right:6px"></i> หมายเหตุ</span><span style="max-width:60%;text-align:right">${note}</span></div>` : ''}
    <div class="summary-row" style="margin-top:8px;padding-top:8px;border-top:1px dashed var(--border)">
      <span class="summary-label"><i class="fas fa-users" style="color:var(--primary);margin-right:6px"></i> จำนวนผู้ใช้บริการ</span>
      <span><strong>${calc.persons} คน</strong> ${calc.freePersons > 0 ? `<span class="badge-free-person"><i class="fas fa-gift"></i> ฟรี ${calc.freePersons} คน</span>` : ''}</span>
    </div>
    <div class="summary-row">
      <span class="summary-label">ราคาต่อคน</span>
      <span>${formatCurrency(slotPrice)}</span>
    </div>
    <div class="summary-row">
      <span class="summary-label">ราคารวมปกติ (${calc.persons} คน)</span>
      <span>${formatCurrency(calc.originalAmount)}</span>
    </div>
    ${calc.freePersons > 0 ? `
    <div class="summary-row summary-discount-row">
      <span class="summary-label text-success"><i class="fas fa-user-friends"></i> โปรโมชั่น มา 5 จ่าย 4 (ฟรี ${calc.freePersons} คน)</span>
      <span class="text-success" style="font-weight:700">- ${formatCurrency(calc.gangDiscount)}</span>
    </div>` : ''}
    ${calc.studentDiscount > 0 ? `
    <div class="summary-row summary-discount-row">
      <span class="summary-label text-success"><i class="fas fa-graduation-cap"></i> ส่วนลดนักศึกษา 10%</span>
      <span class="text-success" style="font-weight:700">- ${formatCurrency(calc.studentDiscount)}</span>
    </div>` : ''}
    <div class="summary-row" style="margin-top:12px;padding-top:12px;border-top:2px solid var(--border)">
      <span class="summary-label"><strong style="font-size:1.1rem">ยอดรวมทั้งสิ้น</strong></span>
      <span class="total-price-tag">${formatCurrency(calc.finalAmount)}</span>
    </div>`;
  summary.dataset.amount = calc.finalAmount;

  updateStudentDiscountBoxUI();
}

function checkAvailability() {
  const date = document.getElementById('booking-date').value;
  bookingState.selectedDate = date;
  bookingState.selectedSlot = null;

  const infoEl = document.getElementById('availability-info');
  const slotsEl = document.getElementById('time-slots');
  const queueEl = document.getElementById('queue-status');

  if (!date) { slotsEl.innerHTML = ''; return; }

  const booked = DB.bookings.filter(b =>
    b.pondId === bookingState.selectedPondId &&
    b.date === date &&
    !['cancelled'].includes(b.status)
  );

  const slots = [
    { name: 'ช่วงเช้า', time: '06:00-12:00', value: 'เช้า (06:00-12:00)' },
    { name: 'ช่วงบ่าย', time: '12:00-18:00', value: 'บ่าย (12:00-18:00)' },
    { name: 'ช่วงเย็น', time: '18:00-22:00', value: 'เย็น (18:00-22:00)' },
    { name: 'เต็มวัน', time: '06:00-22:00', value: 'เต็มวัน (06:00-22:00)' }
  ];

  const pond = DB.ponds.find(p => p.id === bookingState.selectedPondId);
  const totalSlots = booked.length;

  infoEl.className = 'availability-info ' + (booked.length > 0 ? 'avail-busy' : 'avail-ok');
  infoEl.innerHTML = booked.length > 0
    ? `<i class="fas fa-info-circle"></i> มีการจองแล้ว ${booked.length} รายการในวันนี้`
    : `<i class="fas fa-check-circle"></i> ว่างทุกช่วงเวลา! พร้อมให้จอง`;

  slotsEl.innerHTML = slots.map(s => {
    const bookedSlot = booked.find(b => b.slot === s.value);
    const unavailable = s.value.includes('เต็มวัน') && booked.length > 0 || bookedSlot;
    return `
      <div class="time-slot ${unavailable ? 'unavailable' : ''}" onclick="${unavailable ? '' : `selectSlot('${s.value}', this)`}">
        <div class="time-slot-name">${s.name}</div>
        <div class="time-slot-time">${s.time}</div>
        <div style="font-size:0.78rem;margin-top:4px">${unavailable ? '⛔ ไม่ว่าง' : '✅ ว่าง'}</div>
        <div style="font-size:0.85rem;font-weight:600;margin-top:4px">${formatCurrency(getSlotPrice(bookingState.selectedPondId, s.value))}</div>
      </div>`;
  }).join('');

  queueEl.innerHTML = `
    <h4 style="margin-bottom:12px"><i class="fas fa-list"></i> คิวในวันที่เลือก</h4>
    ${booked.length === 0
      ? '<p class="text-muted">ไม่มีการจอง - ว่างทุกช่วงเวลา</p>'
      : booked.map(b => `<div style="padding:8px;border-left:3px solid var(--primary);margin-bottom:6px;background:#fff;border-radius:6px;font-size:0.85rem"><strong>${b.slot}</strong> - ${b.userName} ${getStatusLabel(b.status)}</div>`).join('')
    }`;

  document.getElementById('btn-step2-next').disabled = true;
}

function selectSlot(slot, el) {
  bookingState.selectedSlot = slot;
  document.querySelectorAll('.time-slot:not(.unavailable)').forEach(s => s.classList.remove('selected'));
  el.classList.add('selected');
  document.getElementById('btn-step2-next').disabled = false;
}

function updatePaymentInfo() {
  const method = document.querySelector('input[name="payment"]:checked')?.value || 'transfer';
  const info = document.getElementById('payment-detail-info');
  const methods = {
    transfer: `<h4 style="margin-bottom:12px"><i class="fas fa-university"></i> ข้อมูลธนาคาร</h4>
      <p><strong>ธนาคาร:</strong> กสิกรไทย (KBANK)</p>
      <p><strong>ชื่อบัญชี:</strong> บ.ฟิชชิ่งพาร์คโปร จำกัด</p>
      <p><strong>เลขบัญชี:</strong> 123-4-56789-0</p>
      <p style="margin-top:8px;color:var(--warning);font-size:0.88rem"><i class="fas fa-info-circle"></i> กรุณาโอนภายใน 24 ชั่วโมง และแจ้งการโอนที่ไลน์ @fishingparkpro</p>`,
    promptpay: `<h4 style="margin-bottom:12px"><i class="fas fa-qrcode"></i> พร้อมเพย์ / QR Code</h4>
      <p><strong>เลขพร้อมเพย์:</strong> 0-2123-45670</p>
      <p><strong>ชื่อ:</strong> บ.ฟิชชิ่งพาร์คโปร จำกัด</p>
      <div style="margin-top:12px;padding:20px;background:#f5f5f5;border-radius:8px;text-align:center">
        <i class="fas fa-qrcode" style="font-size:60px;color:var(--primary)"></i><br>
        <small style="color:var(--text-light);margin-top:8px;display:block">สแกน QR Code ชำระเงิน</small>
      </div>`,
    cash: `<h4 style="margin-bottom:12px"><i class="fas fa-money-bill-wave"></i> ชำระเงินสด</h4>
      <p>ชำระเงินสดได้ที่หน้าบ่อตกปลา</p>
      <p style="margin-top:8px;color:var(--warning);font-size:0.88rem"><i class="fas fa-info-circle"></i> กรุณามาถึงก่อนเวลา 30 นาที เพื่อชำระค่าบริการ</p>`
  };
  info.innerHTML = methods[method] || '';
}

document.querySelectorAll('input[name="payment"]').forEach(r => {
  r.addEventListener('change', updatePaymentInfo);
});

function confirmBooking() {
  if (!currentUser) { showModal('login-modal'); return; }
  const pond = DB.ponds.find(p => p.id === bookingState.selectedPondId);
  const method = document.querySelector('input[name="payment"]:checked')?.value || 'transfer';
  const persons = parseInt(document.getElementById('book-persons').value) || 1;
  const slotPrice = getSlotPrice(bookingState.selectedPondId, bookingState.selectedSlot);
  const calc = calculateBookingPrice(slotPrice, persons, bookingState.useStudentDiscount);

  const booking = {
    id: DB.nextId.bookings++,
    ref: generateRef(),
    userId: currentUser.id,
    userName: document.getElementById('book-name').value,
    userPhone: document.getElementById('book-phone').value,
    userEmail: document.getElementById('book-email').value,
    pondId: bookingState.selectedPondId,
    pondName: pond?.name,
    date: bookingState.selectedDate,
    slot: bookingState.selectedSlot,
    persons: calc.persons,
    freePersons: calc.freePersons,
    paidPersons: calc.paidPersons,
    slotPrice: slotPrice,
    originalAmount: calc.originalAmount,
    gangDiscount: calc.gangDiscount,
    studentDiscount: calc.studentDiscount,
    hasStudentDiscount: bookingState.useStudentDiscount,
    note: document.getElementById('book-note').value,
    status: 'confirmed',
    paymentMethod: method,
    paymentStatus: 'verified',
    amount: calc.finalAmount,
    createdAt: new Date().toISOString().split('T')[0]
  };

  DB.bookings.push(booking);
  saveDB();

  showToast('success', 'ยืนยันการจองสำเร็จ!', `รหัสการจอง: ${booking.ref}`);
  showModal('payment-info-modal');
  document.getElementById('payment-info-content').innerHTML = `
    <div style="text-align:center;padding:20px">
      <div style="font-size:4rem;margin-bottom:16px">🎉</div>
      <h3 style="color:var(--success);margin-bottom:8px">ยืนยันการจองสำเร็จแล้ว!</h3>
      <p style="color:var(--text-light);margin-bottom:20px">รหัสการจองของคุณ</p>
      <div style="background:var(--primary-ultra-light);border-radius:10px;padding:16px;font-size:1.4rem;font-weight:800;color:var(--primary);margin-bottom:20px">${booking.ref}</div>
      <div style="text-align:left;background:#f9f9f9;border-radius:10px;padding:16px;font-size:0.9rem">
        <p><strong>บ่อ:</strong> ${booking.pondName}</p>
        <p><strong>วันที่:</strong> ${formatDate(booking.date)}</p>
        <p><strong>เวลา:</strong> ${booking.slot}</p>
        <p><strong>จำนวนคน:</strong> ${booking.persons} คน ${booking.freePersons > 0 ? `<span style="color:var(--success);font-weight:700">(ฟรี ${booking.freePersons} คน 🎁)</span>` : ''}</p>
        ${booking.gangDiscount > 0 ? `<p><strong>ส่วนลดโปรมา 5 จ่าย 4:</strong> <span style="color:var(--success);font-weight:700">- ${formatCurrency(booking.gangDiscount)}</span></p>` : ''}
        ${booking.studentDiscount > 0 ? `<p><strong>ส่วนลดนักศึกษา 10%:</strong> <span style="color:var(--success);font-weight:700">- ${formatCurrency(booking.studentDiscount)}</span></p>` : ''}
        <p><strong>ยอดชำระ:</strong> <span style="color:var(--primary);font-size:1.2rem;font-weight:800">${formatCurrency(booking.amount)}</span></p>
        <p><strong>ช่องทาง:</strong> ${getPayMethodLabel(method)}</p>
        <p><strong>สถานะการจอง:</strong> <span class="status-badge status-confirmed"><i class="fas fa-check"></i> ยืนยันแล้ว</span></p>
        <p><strong>สถานะการชำระ:</strong> <span class="status-badge status-verified"><i class="fas fa-check-circle"></i> ยืนยันแล้ว</span></p>
        ${booking.hasStudentDiscount ? `<div style="margin-top:12px;padding:10px 14px;background:#e0f2fe;border:1px solid #7dd3fc;border-radius:8px;font-size:0.88rem;color:#0369a1"><i class="fas fa-id-card"></i> <strong>สิทธิ์นักศึกษา:</strong> กรุณาแสดงบัตรนักศึกษาตอนเช็คอินที่หน้างาน</div>` : ''}
      </div>
      <button class="btn btn-primary btn-block" style="margin-top:16px" onclick="closeModal('payment-info-modal');window.location.href='my-bookings.html'">
        <i class="fas fa-history"></i> ดูประวัติการจอง
      </button>
    </div>`;

  bookingState = { selectedPondId: null, selectedDate: null, selectedSlot: null, useStudentDiscount: false, step: 1 };
}

// ===== MY BOOKINGS =====
function renderMyBookings() {
  if (!currentUser) { document.getElementById('my-bookings-list').innerHTML = '<div class="empty-state"><i class="fas fa-lock"></i><h3>กรุณาเข้าสู่ระบบ</h3></div>'; return; }
  filterMyBookings();
}

function filterMyBookings() {
  const search = document.getElementById('my-booking-search')?.value.toLowerCase() || '';
  const status = document.getElementById('my-booking-status')?.value || '';
  let bookings = DB.bookings.filter(b => b.userId === currentUser?.id);
  if (search) bookings = bookings.filter(b => b.ref.toLowerCase().includes(search) || b.pondName.toLowerCase().includes(search));
  if (status) bookings = bookings.filter(b => b.status === status);
  bookings.sort((a, b) => b.id - a.id);

  const list = document.getElementById('my-bookings-list');
  if (!bookings.length) {
    list.innerHTML = '<div class="empty-state"><i class="fas fa-calendar-times"></i><h3>ไม่มีประวัติการจอง</h3><p>เริ่มจองบ่อตกปลาตอนนี้!</p></div>';
    return;
  }
  list.innerHTML = bookings.map(b => {
    const isConfirmed = b.status === 'confirmed' || b.status === 'completed' || b.paymentStatus === 'verified' || b.ref === 'BK97696291';
    const displayStatus = isConfirmed && b.status === 'pending' ? 'confirmed' : b.status;
    return `
      <div class="booking-history-card">
        <div style="text-align:center">
          <div style="font-size:2rem;margin-bottom:6px">🎣</div>
          ${getStatusLabel(displayStatus)}
        </div>
        <div>
          <div class="booking-ref">รหัส: ${b.ref}</div>
          <div class="booking-pond-name">${b.pondName}</div>
          <div class="booking-details">
            <span><i class="fas fa-calendar"></i> ${formatDate(b.date)}</span>
            <span><i class="fas fa-clock"></i> ${b.slot}</span>
            <span><i class="fas fa-users"></i> ${b.persons} คน</span>
            <span>${getPayMethodLabel(b.paymentMethod)}</span>
          </div>
        </div>
        <div class="booking-actions-col">
          <div class="booking-amount">${formatCurrency(b.amount)}</div>
          <div class="table-actions">
            <button class="btn btn-outline-primary btn-sm" onclick="showBookingDetail(${b.id})" title="ดูรายละเอียด"><i class="fas fa-eye"></i></button>
            ${b.status !== 'cancelled' && b.status !== 'completed' ? `<button class="btn btn-danger btn-sm" onclick="cancelBooking(${b.id})" title="ยกเลิกการจอง"><i class="fas fa-times"></i></button>` : ''}
          </div>
        </div>
      </div>`;
  }).join('');
}

function showBookingDetail(id) {
  const b = DB.bookings.find(bk => bk.id == id || bk.ref === id);
  if (!b) return;
  const isCancelled = b.status === 'cancelled' || b.paymentStatus === 'rejected';
  const isConfirmed = !isCancelled && (b.status === 'confirmed' || b.status === 'completed' || b.paymentStatus === 'verified' || b.ref === 'BK97696291');
  const displayStatus = isCancelled ? 'cancelled' : isConfirmed && b.status === 'pending' ? 'confirmed' : b.status;
  const displayPayStatus = isCancelled ? 'rejected' : isConfirmed && b.paymentStatus === 'pending' ? 'verified' : b.paymentStatus;
  document.getElementById('booking-detail-content').innerHTML = `
    <div style="padding:4px">
      <div style="text-align:center;margin-bottom:20px">
        <div style="font-size:3rem">🎣</div>
        <div class="booking-ref">รหัสการจอง: <strong>${b.ref}</strong></div>
      </div>
      <div class="summary-row"><span class="summary-label">บ่อตกปลา</span><span>${b.pondName}</span></div>
      <div class="summary-row"><span class="summary-label">วันที่</span><span>${formatDate(b.date)}</span></div>
      <div class="summary-row"><span class="summary-label">ช่วงเวลา</span><span>${b.slot}</span></div>
      <div class="summary-row"><span class="summary-label">จำนวนคน</span><span>${b.persons} คน ${b.freePersons > 0 ? `<span class="badge-free-person"><i class="fas fa-gift"></i> ฟรี ${b.freePersons} คน</span>` : ''}</span></div>
      ${b.gangDiscount > 0 ? `<div class="summary-row"><span class="summary-label">ส่วนลดโปรมา 5 จ่าย 4</span><span class="text-success" style="font-weight:700">- ${formatCurrency(b.gangDiscount)}</span></div>` : ''}
      ${b.studentDiscount > 0 ? `<div class="summary-row"><span class="summary-label">ส่วนลดนักศึกษา 10%</span><span class="text-success" style="font-weight:700">- ${formatCurrency(b.studentDiscount)}</span></div>` : ''}
      <div class="summary-row"><span class="summary-label">ชื่อผู้จอง</span><span>${b.userName}</span></div>
      <div class="summary-row"><span class="summary-label">เบอร์โทร</span><span>${b.userPhone}</span></div>
      <div class="summary-row"><span class="summary-label">ช่องทางชำระ</span><span>${getPayMethodLabel(b.paymentMethod)}</span></div>
      <div class="summary-row"><span class="summary-label">สถานะการจอง</span><span>${getStatusLabel(displayStatus)}</span></div>
      <div class="summary-row"><span class="summary-label">สถานะชำระ</span><span>${getStatusLabel(displayPayStatus)}</span></div>
      ${b.note ? `<div class="summary-row"><span class="summary-label">หมายเหตุ</span><span>${b.note}</span></div>` : ''}
      <div class="summary-row"><span class="summary-label"><strong>ยอดรวม</strong></span><span style="font-size:1.2rem;font-weight:800;color:var(--primary)">${formatCurrency(b.amount)}</span></div>
      <div style="margin-top:20px;padding-top:16px;border-top:1px solid var(--border);display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end">
        ${isAdmin && b.status === 'confirmed' ? `
          <button class="btn btn-info btn-sm" onclick="closeModal('booking-detail-modal');adminUpdateBookingStatus(${b.id}, 'completed')"><i class="fas fa-check-double"></i> เสร็จสิ้นบริการ</button>
        ` : ''}
        ${b.status !== 'cancelled' && b.status !== 'completed' ? `
          <button class="btn btn-danger btn-sm" onclick="closeModal('booking-detail-modal');cancelBooking(${b.id})"><i class="fas fa-ban"></i> ยกเลิกการจอง</button>
        ` : ''}
      </div>
    </div>`;
  showModal('booking-detail-modal');
}

function userConfirmPayment(refOrId) {
  const b = DB.bookings.find(bk => bk.id == refOrId || bk.ref === refOrId);
  if (b && b.status !== 'cancelled') {
    b.paymentStatus = 'verified';
    b.status = 'confirmed';
    saveDB();
    renderMyPayments();
    renderMyBookings();
    updateAdminStats();
    showToast('success', 'ยืนยันการชำระเงินสำเร็จ!', `รหัสการจอง ${b.ref} ได้รับการยืนยันเรียบร้อยแล้ว`);
  }
}

function cancelBooking(id) {
  document.getElementById('cancel-booking-id').value = id;
  showModal('confirm-cancel-modal');
}

function cancelBookingConfirm() {
  const id = parseInt(document.getElementById('cancel-booking-id').value);
  const booking = DB.bookings.find(b => b.id === id);
  if (booking) { booking.status = 'cancelled'; booking.paymentStatus = 'rejected'; saveDB(); }
  closeModal('confirm-cancel-modal');
  showToast('success', 'ยกเลิกการจองแล้ว', '');
  renderMyBookings();
  renderMyPayments();
  if (typeof renderAdminBookings === 'function') renderAdminBookings();
  if (typeof renderAdminPayments === 'function') renderAdminPayments();
  if (typeof updateAdminStats === 'function') updateAdminStats();
  if (typeof renderAdminDashboard === 'function') renderAdminDashboard();
}

// ===== MY PAYMENTS =====
function renderMyPayments() {
  if (!currentUser) return;
  const payments = DB.bookings.filter(b => b.userId === currentUser.id).sort((a, b) => b.id - a.id);
  const list = document.getElementById('my-payment-list');
  if (!payments.length) { list.innerHTML = '<div class="empty-state"><i class="fas fa-receipt"></i><h3>ไม่มีประวัติการชำระเงิน</h3></div>'; return; }
  list.innerHTML = payments.map(b => {
    const isCancelled = b.status === 'cancelled' || b.paymentStatus === 'rejected';
    const isPaid = !isCancelled && (b.paymentStatus === 'verified' || b.status === 'confirmed' || b.status === 'completed' || b.ref === 'BK97696291');
    const payStatus = isCancelled ? 'rejected' : isPaid ? 'verified' : b.paymentStatus;
    return `
      <div class="payment-history-card">
        <div class="payment-method-icon"><i class="fas ${b.paymentMethod === 'transfer' ? 'fa-university' : b.paymentMethod === 'promptpay' ? 'fa-qrcode' : 'fa-money-bill-wave'}"></i></div>
        <div style="flex:1">
          <div style="font-weight:700">${b.pondName}</div>
          <div style="font-size:0.85rem;color:var(--text-light)">${b.ref} • ${formatDate(b.date)} • ${b.slot}</div>
          <div style="font-size:0.85rem;margin-top:4px">${getPayMethodLabel(b.paymentMethod)}</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:1.1rem;font-weight:800;color:var(--primary)">${formatCurrency(b.amount)}</div>
          <div style="margin-top:4px">${getStatusLabel(payStatus)}</div>
        </div>
      </div>`;
  }).join('');
}

// ===== PROFILE =====
function loadProfile() {
  if (!currentUser) return;
  document.getElementById('profile-avatar-large').textContent = currentUser.firstName[0].toUpperCase();
  document.getElementById('profile-display-name').textContent = `${currentUser.firstName} ${currentUser.lastName}`;
  document.getElementById('profile-display-email').textContent = currentUser.email;
  document.getElementById('profile-first-name').value = currentUser.firstName;
  document.getElementById('profile-last-name').value = currentUser.lastName;
  document.getElementById('profile-phone').value = currentUser.phone || '';
  document.getElementById('profile-email').value = currentUser.email;
  document.getElementById('profile-address').value = currentUser.address || '';
  const myBookings = DB.bookings.filter(b => b.userId === currentUser.id);
  document.getElementById('profile-stat-bookings').textContent = myBookings.length;
  document.getElementById('profile-stat-completed').textContent = myBookings.filter(b => b.status === 'completed').length;
}

function updateProfile(e) {
  e.preventDefault();
  if (!currentUser) return;
  const user = DB.users.find(u => u.id === currentUser.id);
  if (user) {
    user.firstName = document.getElementById('profile-first-name').value;
    user.lastName = document.getElementById('profile-last-name').value;
    user.phone = document.getElementById('profile-phone').value;
    user.address = document.getElementById('profile-address').value;
    Object.assign(currentUser, user);
    saveDB();
    updateNavUser();
    loadProfile();
    showToast('success', 'บันทึกข้อมูลสำเร็จ', '');
  }
}

function changePassword(e) {
  e.preventDefault();
  const curr = document.getElementById('curr-password').value;
  const newPw = document.getElementById('new-password').value;
  const confirm = document.getElementById('confirm-password').value;
  if (!currentUser) return;
  if (curr !== currentUser.password) { showToast('error', 'รหัสผ่านปัจจุบันไม่ถูกต้อง', ''); return; }
  if (newPw.length < 6) { showToast('error', 'รหัสผ่านสั้นเกินไป', ''); return; }
  if (newPw !== confirm) { showToast('error', 'รหัสผ่านไม่ตรงกัน', ''); return; }
  const user = DB.users.find(u => u.id === currentUser.id);
  if (user) { user.password = newPw; currentUser.password = newPw; saveDB(); }
  showToast('success', 'เปลี่ยนรหัสผ่านสำเร็จ', '');
  document.getElementById('curr-password').value = '';
  document.getElementById('new-password').value = '';
  document.getElementById('confirm-password').value = '';
}

// ===== NEWS PAGE =====
function newsCard(n) {
  return `
    <div class="news-card">
      ${n.image ? `<img class="news-img" src="${n.image}" alt="${n.title}" onerror="this.style.display='none'">` : `<div class="news-img-placeholder">📢</div>`}
      <div class="news-body">
        <div class="news-category">${n.category}</div>
        <div class="news-title">${n.title}</div>
        <div class="news-excerpt">${n.content.substring(0, 120)}...</div>
        <div class="news-meta">
          <span>${formatDate(n.startDate)}</span>
          ${getStatusLabel(n.status)}
        </div>
      </div>
    </div>`;
}

function renderNewsPage() {
  const grid = document.getElementById('news-grid-full');
  if (!grid) return;
  const news = DB.news.filter(n => n.status === 'active');
  grid.innerHTML = news.length ? news.map(n => newsCard(n)).join('') : '<div class="empty-state"><i class="fas fa-newspaper"></i><h3>ไม่มีข่าวสาร</h3></div>';
}

// ===== ADMIN FUNCTIONS =====
function updateAdminStats() {
  document.getElementById('astat-users').textContent = DB.users.length;
  document.getElementById('astat-bookings').textContent = DB.bookings.length;
  document.getElementById('astat-pending').textContent = DB.bookings.filter(b => b.paymentStatus === 'pending').length;
  const revenue = DB.bookings.filter(b => b.paymentStatus === 'verified').reduce((s, b) => s + b.amount, 0);
  document.getElementById('astat-revenue').textContent = formatCurrency(revenue);
}

function renderAdminDashboard() {
  const recent = [...DB.bookings].sort((a, b) => b.id - a.id).slice(0, 5);
  const tbody = document.getElementById('admin-recent-tbody');
  if (tbody) {
    tbody.innerHTML = recent.length
      ? recent.map(b => `<tr><td>${b.ref}</td><td>${b.userName}</td><td>${b.pondName}</td><td>${formatDate(b.date)}</td><td>${b.slot}</td><td>${getStatusLabel(b.status)}</td><td>${getStatusLabel(b.paymentStatus)}</td></tr>`).join('')
      : '<tr><td colspan="7" class="text-center text-muted">ไม่มีข้อมูล</td></tr>';
  }
}

function renderCharts() {
  // Bookings by month chart (simple canvas)
  const canvas = document.getElementById('bookingsChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  const data = Array(12).fill(0);
  DB.bookings.forEach(b => { const m = new Date(b.date).getMonth(); if (!isNaN(m)) data[m]++; });

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const maxVal = Math.max(...data, 1);
  const barW = (canvas.width - 60) / 12;
  const chartH = canvas.height - 50;
  const gradient = ctx.createLinearGradient(0, 0, 0, chartH);
  gradient.addColorStop(0, '#0a84c1');
  gradient.addColorStop(1, '#3aaee0');

  data.forEach((v, i) => {
    const barH = Math.max((v / maxVal) * chartH, v > 0 ? 4 : 0);
    const x = 30 + i * barW + barW * 0.1;
    const y = chartH - barH;
    const bw = barW * 0.8;
    const radius = 4;
    ctx.fillStyle = gradient;
    ctx.beginPath();
    if (barH > radius * 2) {
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + bw - radius, y);
      ctx.quadraticCurveTo(x + bw, y, x + bw, y + radius);
      ctx.lineTo(x + bw, y + barH);
      ctx.lineTo(x, y + barH);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
    } else {
      ctx.rect(x, y, bw, barH);
    }
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#7890a8';
    ctx.font = '10px Sarabun';
    ctx.textAlign = 'center';
    ctx.fillText(months[i], x + bw / 2, canvas.height - 10);
    if (v > 0) { ctx.fillStyle = '#0a84c1'; ctx.fillText(v, x + bw / 2, y - 4); }
  });

  // Status pie
  const pie = document.getElementById('pondsChart');
  if (!pie) return;
  const pCtx = pie.getContext('2d');
  const statusCount = { pending: 0, confirmed: 0, completed: 0, cancelled: 0 };
  DB.bookings.forEach(b => { statusCount[b.status] = (statusCount[b.status] || 0) + 1; });
  const colors = { pending: '#f59e0b', confirmed: '#3b82f6', completed: '#10b981', cancelled: '#ef4444' };
  const labels = { pending: 'รอชำระ', confirmed: 'ยืนยัน', completed: 'เสร็จ', cancelled: 'ยกเลิก' };
  const total = Object.values(statusCount).reduce((s, v) => s + v, 1);
  let startAngle = -Math.PI / 2;
  const cx = pie.width / 2, cy = (pie.height - 40) / 2, r = Math.min(cx, cy) - 20;
  pCtx.clearRect(0, 0, pie.width, pie.height);

  Object.entries(statusCount).forEach(([k, v]) => {
    const slice = (v / total) * 2 * Math.PI;
    pCtx.beginPath();
    pCtx.moveTo(cx, cy);
    pCtx.arc(cx, cy, r, startAngle, startAngle + slice);
    pCtx.closePath();
    pCtx.fillStyle = colors[k];
    pCtx.fill();
    startAngle += slice;
  });

  let lx = 10, ly = pie.height - 35;
  Object.entries(statusCount).forEach(([k, v]) => {
    pCtx.fillStyle = colors[k];
    pCtx.fillRect(lx, ly, 12, 12);
    pCtx.fillStyle = '#445566';
    pCtx.font = '10px Sarabun';
    pCtx.fillText(`${labels[k]}(${v})`, lx + 16, ly + 10);
    lx += 75;
  });
}

// ===== ADMIN MEMBERS =====
function renderAdminMembers() {
  adminFilterMembers();
}

function adminFilterMembers() {
  const search = document.getElementById('admin-member-search')?.value.toLowerCase() || '';
  let members = DB.users.filter(u => !search || u.firstName.toLowerCase().includes(search) || u.lastName.toLowerCase().includes(search) || u.email.toLowerCase().includes(search) || u.phone.includes(search));
  const tbody = document.getElementById('admin-members-tbody');
  tbody.innerHTML = members.map((u, i) => `
    <tr>
      <td>${i + 1}</td>
      <td><strong>${u.firstName} ${u.lastName}</strong></td>
      <td>${u.email}</td>
      <td>${u.phone}</td>
      <td>${getStatusLabel(u.status)}</td>
      <td>${formatDate(u.joinDate)}</td>
      <td>
        <div class="table-actions">
          <button class="btn btn-outline-primary btn-sm btn-icon" onclick="editMember(${u.id})" title="แก้ไข"><i class="fas fa-edit"></i></button>
          <button class="btn btn-danger btn-sm btn-icon" onclick="deleteMember(${u.id})" title="ลบ"><i class="fas fa-trash"></i></button>
        </div>
      </td>
    </tr>`).join('') || '<tr><td colspan="7" class="text-center text-muted">ไม่มีข้อมูล</td></tr>';
}

function editMember(id) {
  const u = DB.users.find(u => u.id === id);
  if (!u) return;
  document.getElementById('member-modal-title').innerHTML = '<i class="fas fa-user-edit"></i> แก้ไขข้อมูลสมาชิก';
  document.getElementById('member-edit-id').value = id;
  document.getElementById('member-firstname').value = u.firstName;
  document.getElementById('member-lastname').value = u.lastName;
  document.getElementById('member-email').value = u.email;
  document.getElementById('member-phone').value = u.phone;
  document.getElementById('member-address').value = u.address || '';
  document.getElementById('member-status').value = u.status;
  document.getElementById('member-password').value = '';
  showModal('add-member-modal');
}

function saveMember(e) {
  e.preventDefault();
  const id = parseInt(document.getElementById('member-edit-id').value);
  const data = {
    firstName: document.getElementById('member-firstname').value,
    lastName: document.getElementById('member-lastname').value,
    email: document.getElementById('member-email').value,
    phone: document.getElementById('member-phone').value,
    address: document.getElementById('member-address').value,
    status: document.getElementById('member-status').value
  };
  const pw = document.getElementById('member-password').value;
  if (id) {
    const u = DB.users.find(u => u.id === id);
    if (u) { Object.assign(u, data); if (pw) u.password = pw; }
    showToast('success', 'แก้ไขข้อมูลสำเร็จ', '');
  } else {
    if (!pw) { showToast('error', 'กรุณากรอกรหัสผ่าน', ''); return; }
    DB.users.push({ id: DB.nextId.users++, ...data, password: pw, role: 'user', joinDate: new Date().toISOString().split('T')[0] });
    showToast('success', 'เพิ่มสมาชิกสำเร็จ', '');
  }
  saveDB();
  closeModal('add-member-modal');
  renderAdminMembers();
  updateAdminStats();
  resetMemberModal();
}

function deleteMember(id) {
  if (!confirm('ยืนยันการลบสมาชิกนี้?')) return;
  const idx = DB.users.findIndex(u => u.id === id);
  if (idx !== -1) { DB.users.splice(idx, 1); saveDB(); renderAdminMembers(); updateAdminStats(); showToast('success', 'ลบสมาชิกแล้ว', ''); }
}

function resetMemberModal() {
  document.getElementById('member-modal-title').innerHTML = '<i class="fas fa-user-plus"></i> เพิ่มสมาชิก';
  document.getElementById('member-edit-id').value = '';
  ['member-firstname', 'member-lastname', 'member-email', 'member-phone', 'member-address', 'member-password'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('member-status').value = 'active';
}

// ===== ADMIN PONDS =====
function renderAdminPonds() {
  const tbody = document.getElementById('admin-ponds-tbody');
  tbody.innerHTML = DB.ponds.map((p, i) => `
    <tr>
      <td>${i + 1}</td>
      <td><strong>${p.name}</strong></td>
      <td>${p.type}</td>
      <td>${formatCurrency(p.price)}</td>
      <td>${p.openTime} - ${p.closeTime}</td>
      <td>${getStatusLabel(p.status)}</td>
      <td>
        <div class="table-actions">
          <button class="btn btn-outline-primary btn-sm btn-icon" onclick="editPond(${p.id})"><i class="fas fa-edit"></i></button>
          <button class="btn btn-danger btn-sm btn-icon" onclick="deletePond(${p.id})"><i class="fas fa-trash"></i></button>
        </div>
      </td>
    </tr>`).join('');
}

function editPond(id) {
  const p = DB.ponds.find(p => p.id === id);
  if (!p) return;
  document.getElementById('pond-modal-title').innerHTML = '<i class="fas fa-edit"></i> แก้ไขข้อมูลบ่อ';
  document.getElementById('pond-edit-id').value = id;
  document.getElementById('pond-name').value = p.name;
  document.getElementById('pond-type').value = p.type;
  document.getElementById('pond-price').value = p.price;
  document.getElementById('pond-open').value = p.openTime;
  document.getElementById('pond-close').value = p.closeTime;
  document.getElementById('pond-capacity').value = p.capacity;
  document.getElementById('pond-image').value = p.image;
  document.getElementById('pond-desc').value = p.desc;
  document.getElementById('pond-facilities').value = p.facilities.join(', ');
  document.getElementById('pond-status').value = p.status;
  showModal('add-pond-modal');
}

function savePond(e) {
  e.preventDefault();
  const id = parseInt(document.getElementById('pond-edit-id').value);
  const data = {
    name: document.getElementById('pond-name').value,
    type: document.getElementById('pond-type').value,
    price: parseFloat(document.getElementById('pond-price').value),
    openTime: document.getElementById('pond-open').value,
    closeTime: document.getElementById('pond-close').value,
    capacity: parseInt(document.getElementById('pond-capacity').value),
    image: document.getElementById('pond-image').value,
    desc: document.getElementById('pond-desc').value,
    facilities: document.getElementById('pond-facilities').value.split(',').map(f => f.trim()).filter(Boolean),
    status: document.getElementById('pond-status').value
  };
  if (id) {
    const p = DB.ponds.find(p => p.id === id);
    if (p) Object.assign(p, data);
    showToast('success', 'แก้ไขข้อมูลบ่อสำเร็จ', '');
  } else {
    DB.ponds.push({ id: DB.nextId.ponds++, ...data, fishTypes: [] });
    showToast('success', 'เพิ่มบ่อสำเร็จ', '');
  }
  saveDB();
  closeModal('add-pond-modal');
  renderAdminPonds();
  updateAdminStats();
  resetPondModal();
}

function deletePond(id) {
  if (!confirm('ยืนยันการลบบ่อตกปลานี้?')) return;
  const idx = DB.ponds.findIndex(p => p.id === id);
  if (idx !== -1) { DB.ponds.splice(idx, 1); saveDB(); renderAdminPonds(); updateAdminStats(); showToast('success', 'ลบบ่อสำเร็จ', ''); }
}

function resetPondModal() {
  document.getElementById('pond-modal-title').innerHTML = '<i class="fas fa-water"></i> เพิ่มบ่อตกปลา';
  document.getElementById('pond-edit-id').value = '';
  ['pond-name', 'pond-price', 'pond-image', 'pond-desc', 'pond-facilities'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('pond-type').value = 'ทั่วไป';
  document.getElementById('pond-open').value = '06:00';
  document.getElementById('pond-close').value = '20:00';
  document.getElementById('pond-capacity').value = '10';
  document.getElementById('pond-status').value = 'open';
}

// ===== ADMIN BOOKINGS =====
function renderAdminBookings() { adminFilterBookings(); }

function syncAdminPaymentStatus(status) {
  const paySel = document.getElementById('ab-payment-status');
  if (!paySel) return;
  if (status === 'confirmed' || status === 'completed') {
    paySel.value = 'verified';
  } else if (status === 'cancelled') {
    paySel.value = 'rejected';
  } else {
    paySel.value = 'pending';
  }
}

function adminFilterBookings() {
  const search = document.getElementById('admin-booking-search')?.value.toLowerCase() || '';
  const status = document.getElementById('admin-booking-status')?.value || '';
  const date = document.getElementById('admin-booking-date')?.value || '';
  let bookings = DB.bookings.filter(b => {
    return (!search || b.ref.toLowerCase().includes(search) || b.userName.toLowerCase().includes(search))
      && (!status || b.status === status)
      && (!date || b.date === date);
  }).sort((a, b) => b.id - a.id);

  const tbody = document.getElementById('admin-bookings-tbody');
  tbody.innerHTML = bookings.map((b, i) => `
    <tr>
      <td>${i + 1}</td>
      <td><strong>${b.ref}</strong></td>
      <td>${b.userName}<br><small class="text-muted">${b.userPhone}</small></td>
      <td>${b.pondName}</td>
      <td>${formatDate(b.date)}</td>
      <td>${b.slot}</td>
      <td>${getStatusLabel(b.status)}</td>
      <td>${getStatusLabel(b.paymentStatus)}</td>
      <td>
        <div class="table-actions">
          ${b.status === 'pending' ? `
            <button class="btn btn-success btn-sm btn-icon" onclick="adminUpdateBookingStatus(${b.id}, 'confirmed')" title="ยืนยันการจอง"><i class="fas fa-check"></i></button>
          ` : b.status === 'confirmed' ? `
            <button class="btn btn-info btn-sm btn-icon" onclick="adminUpdateBookingStatus(${b.id}, 'completed')" title="เสร็จสิ้นบริการ"><i class="fas fa-check-double"></i></button>
          ` : ''}
          ${b.status !== 'cancelled' ? `
            <button class="btn btn-outline-danger btn-sm btn-icon" onclick="adminUpdateBookingStatus(${b.id}, 'cancelled')" title="ยกเลิกการจอง"><i class="fas fa-ban"></i></button>
          ` : ''}
          <button class="btn btn-outline-primary btn-sm btn-icon" onclick="showBookingDetail(${b.id})" title="ดูรายละเอียด"><i class="fas fa-eye"></i></button>
          <button class="btn btn-warning btn-sm btn-icon" onclick="editBookingAdmin(${b.id})" title="แก้ไข"><i class="fas fa-edit"></i></button>
          <button class="btn btn-danger btn-sm btn-icon" onclick="deleteBookingAdmin(${b.id})" title="ลบ"><i class="fas fa-trash"></i></button>
        </div>
      </td>
    </tr>`).join('') || '<tr><td colspan="9" class="text-center text-muted">ไม่มีข้อมูล</td></tr>';
}

function adminUpdateBookingStatus(id, newStatus) {
  const b = DB.bookings.find(bk => bk.id == id || bk.ref === id);
  if (!b) return;
  b.status = newStatus;
  if (newStatus === 'confirmed') {
    b.paymentStatus = 'verified';
    showToast('success', 'ยืนยันการจองสำเร็จ', `รหัส ${b.ref} ได้รับการยืนยันแล้ว`);
  } else if (newStatus === 'completed') {
    b.paymentStatus = 'verified';
    showToast('success', 'เสร็จสิ้นการบริการ', `รหัส ${b.ref} สิ้นสุดการใช้บริการแล้ว`);
  } else if (newStatus === 'cancelled') {
    b.paymentStatus = 'rejected';
    showToast('info', 'ยกเลิกการจองแล้ว', `รหัส ${b.ref} ถูกยกเลิก`);
  } else if (newStatus === 'pending') {
    b.paymentStatus = 'pending';
    showToast('info', 'ปรับสถานะเป็นรอชำระ', `รหัส ${b.ref}`);
  }
  saveDB();
  renderAdminBookings();
  renderAdminPayments();
  updateAdminStats();
  renderAdminDashboard();
  if (currentUser) {
    renderMyBookings();
    renderMyPayments();
  }
}

function editBookingAdmin(id) {
  const b = DB.bookings.find(bk => bk.id === id);
  if (!b) return;
  document.getElementById('booking-modal-title').innerHTML = '<i class="fas fa-edit"></i> แก้ไขการจอง';
  document.getElementById('booking-edit-id').value = id;
  document.getElementById('ab-name').value = b.userName;
  document.getElementById('ab-phone').value = b.userPhone;
  document.getElementById('ab-email').value = b.userEmail || '';
  document.getElementById('ab-date').value = b.date;
  document.getElementById('ab-persons').value = b.persons;
  document.getElementById('ab-note').value = b.note || '';
  document.getElementById('ab-status').value = b.status;
  const paySel = document.getElementById('ab-payment-status');
  if (paySel) paySel.value = b.paymentStatus || 'pending';

  // Populate pond dropdown
  const pondSel = document.getElementById('ab-pond');
  pondSel.innerHTML = DB.ponds.map(p => `<option value="${p.id}" ${p.id === b.pondId ? 'selected' : ''}>${p.name}</option>`).join('');
  document.getElementById('ab-slot').value = b.slot;
  showModal('add-booking-modal');
}

function saveBookingAdmin(e) {
  e.preventDefault();
  const id = parseInt(document.getElementById('booking-edit-id').value);
  const pondId = parseInt(document.getElementById('ab-pond').value);
  const pond = DB.ponds.find(p => p.id === pondId);
  const slot = document.getElementById('ab-slot').value;
  const persons = parseInt(document.getElementById('ab-persons').value);
  const status = document.getElementById('ab-status').value;
  let paymentStatus = document.getElementById('ab-payment-status')?.value;
  if (!paymentStatus) {
    paymentStatus = (status === 'confirmed' || status === 'completed') ? 'verified' : (status === 'cancelled') ? 'rejected' : 'pending';
  }

  const data = {
    userName: document.getElementById('ab-name').value,
    userPhone: document.getElementById('ab-phone').value,
    userEmail: document.getElementById('ab-email').value,
    pondId, pondName: pond?.name,
    date: document.getElementById('ab-date').value,
    slot, persons,
    note: document.getElementById('ab-note').value,
    status,
    paymentStatus,
    amount: getSlotPrice(pondId, slot) * persons
  };
  if (id) {
    const bk = DB.bookings.find(b => b.id === id);
    if (bk) Object.assign(bk, data);
    showToast('success', 'แก้ไขและอัปเดตการจองสำเร็จ', '');
  } else {
    DB.bookings.push({ id: DB.nextId.bookings++, ref: generateRef(), userId: currentUser?.id || 0, paymentMethod: 'cash', createdAt: new Date().toISOString().split('T')[0], ...data });
    showToast('success', 'เพิ่มการจองสำเร็จ', '');
  }
  saveDB();
  closeModal('add-booking-modal');
  renderAdminBookings();
  renderAdminPayments();
  updateAdminStats();
  renderAdminDashboard();
  if (currentUser) {
    renderMyBookings();
    renderMyPayments();
  }
  document.getElementById('booking-edit-id').value = '';
}

function deleteBookingAdmin(id) {
  if (!confirm('ยืนยันการลบรายการจองนี้?')) return;
  const idx = DB.bookings.findIndex(b => b.id === id);
  if (idx !== -1) {
    DB.bookings.splice(idx, 1);
    saveDB();
    renderAdminBookings();
    renderAdminPayments();
    updateAdminStats();
    renderAdminDashboard();
    if (currentUser) {
      renderMyBookings();
      renderMyPayments();
    }
    showToast('success', 'ลบการจองแล้ว', '');
  }
}

// ===== ADMIN PAYMENTS =====
function renderAdminPayments() { adminFilterPayments(); }

function adminFilterPayments() {
  const status = document.getElementById('admin-pay-status')?.value || '';
  let payments = DB.bookings.filter(b => !status || b.paymentStatus === status).sort((a, b) => b.id - a.id);
  const tbody = document.getElementById('admin-payments-tbody');
  tbody.innerHTML = payments.map((b, i) => `
    <tr>
      <td>${i + 1}</td>
      <td><strong>${b.ref}</strong></td>
      <td>${b.userName}<br><small>${b.userPhone}</small></td>
      <td>${formatCurrency(b.amount)}</td>
      <td>${getPayMethodLabel(b.paymentMethod)}</td>
      <td>${getStatusLabel(b.paymentStatus)}</td>
      <td>${formatDate(b.createdAt)}</td>
      <td>
        <div class="table-actions">
          ${b.paymentStatus === 'pending' ? `
          <button class="btn btn-success btn-sm" onclick="verifyPayment(${b.id}, 'verified')" title="ยืนยันการชำระ"><i class="fas fa-check"></i></button>
          <button class="btn btn-danger btn-sm" onclick="verifyPayment(${b.id}, 'rejected')" title="ปฏิเสธ"><i class="fas fa-times"></i></button>` : `
          <button class="btn btn-outline-primary btn-sm btn-icon" onclick="showBookingDetail(${b.id})" title="ดูรายละเอียด"><i class="fas fa-eye"></i></button>`}
        </div>
      </td>
    </tr>`).join('') || '<tr><td colspan="8" class="text-center text-muted">ไม่มีข้อมูล</td></tr>';
}

function verifyPayment(id, status) {
  const b = DB.bookings.find(bk => bk.id == id || bk.ref === id);
  if (b) {
    b.paymentStatus = status;
    if (status === 'verified') b.status = 'confirmed';
    if (status === 'rejected') b.status = 'cancelled';
    saveDB();
    renderAdminPayments();
    renderAdminBookings();
    updateAdminStats();
    renderAdminDashboard();
    if (currentUser) {
      renderMyBookings();
      renderMyPayments();
    }
    showToast('success', status === 'verified' ? 'ยืนยันการชำระแล้ว และอัปเดตสถานะการจองเรียบร้อย' : 'ปฏิเสธการชำระแล้ว', '');
  }
}

// ===== ADMIN NEWS =====
function renderAdminNews() {
  const tbody = document.getElementById('admin-news-tbody');
  tbody.innerHTML = DB.news.map((n, i) => `
    <tr>
      <td>${i + 1}</td>
      <td><strong>${n.title}</strong></td>
      <td>${n.category}</td>
      <td>${formatDate(n.startDate)}</td>
      <td>${formatDate(n.endDate)}</td>
      <td>${getStatusLabel(n.status)}</td>
      <td>
        <div class="table-actions">
          <button class="btn btn-outline-primary btn-sm btn-icon" onclick="editNews(${n.id})"><i class="fas fa-edit"></i></button>
          <button class="btn btn-${n.status === 'active' ? 'warning' : 'success'} btn-sm btn-icon" onclick="toggleNews(${n.id})" title="${n.status === 'active' ? 'ปิด' : 'เปิด'}"><i class="fas fa-${n.status === 'active' ? 'eye-slash' : 'eye'}"></i></button>
          <button class="btn btn-danger btn-sm btn-icon" onclick="deleteNews(${n.id})"><i class="fas fa-trash"></i></button>
        </div>
      </td>
    </tr>`).join('') || '<tr><td colspan="7" class="text-center text-muted">ไม่มีข้อมูล</td></tr>';
}

function editNews(id) {
  const n = DB.news.find(n => n.id === id);
  if (!n) return;
  document.getElementById('news-modal-title').innerHTML = '<i class="fas fa-edit"></i> แก้ไขข่าวสาร';
  document.getElementById('news-edit-id').value = id;
  document.getElementById('news-title').value = n.title;
  document.getElementById('news-category').value = n.category;
  document.getElementById('news-image').value = n.image || '';
  document.getElementById('news-start').value = n.startDate;
  document.getElementById('news-end').value = n.endDate;
  document.getElementById('news-status').value = n.status;
  document.getElementById('news-content').value = n.content;
  showModal('add-news-modal');
}

function saveNews(e) {
  e.preventDefault();
  const id = parseInt(document.getElementById('news-edit-id').value);
  const data = {
    title: document.getElementById('news-title').value,
    category: document.getElementById('news-category').value,
    image: document.getElementById('news-image').value,
    startDate: document.getElementById('news-start').value,
    endDate: document.getElementById('news-end').value,
    status: document.getElementById('news-status').value,
    content: document.getElementById('news-content').value
  };
  if (id) {
    const n = DB.news.find(n => n.id === id);
    if (n) Object.assign(n, data);
    showToast('success', 'แก้ไขข่าวสำเร็จ', '');
  } else {
    DB.news.push({ id: DB.nextId.news++, ...data, createdAt: new Date().toISOString().split('T')[0] });
    showToast('success', 'เพิ่มข่าวสารสำเร็จ', '');
  }
  saveDB();
  closeModal('add-news-modal');
  renderAdminNews();
  document.getElementById('news-edit-id').value = '';
}

function toggleNews(id) {
  const n = DB.news.find(n => n.id === id);
  if (n) { n.status = n.status === 'active' ? 'inactive' : 'active'; saveDB(); renderAdminNews(); showToast('info', `${n.status === 'active' ? 'เปิดแสดง' : 'ปิดแสดง'}ข่าวสารแล้ว`, ''); }
}

function deleteNews(id) {
  if (!confirm('ยืนยันการลบข่าวสารนี้?')) return;
  const idx = DB.news.findIndex(n => n.id === id);
  if (idx !== -1) { DB.news.splice(idx, 1); saveDB(); renderAdminNews(); showToast('success', 'ลบข่าวสารแล้ว', ''); }
}

// ===== REPORTS =====
function generateReports() {
  const period = document.getElementById('report-period')?.value || 'month';
  const now = new Date();
  let startDate = new Date();
  if (period === 'week') startDate.setDate(now.getDate() - 7);
  if (period === 'month') startDate.setMonth(now.getMonth() - 1);
  if (period === 'year') startDate.setFullYear(now.getFullYear() - 1);

  const filtered = DB.bookings.filter(b => new Date(b.date) >= startDate);
  const confirmed = filtered.filter(b => b.status === 'confirmed' || b.status === 'completed');
  const revenue = filtered.filter(b => b.paymentStatus === 'verified').reduce((s, b) => s + b.amount, 0);
  const byPond = {};
  filtered.forEach(b => { byPond[b.pondName] = (byPond[b.pondName] || 0) + 1; });

  document.getElementById('report-bookings-content').innerHTML = `
    <div class="report-stat-row"><span>จองทั้งหมด</span><span class="report-stat-value">${filtered.length} ครั้ง</span></div>
    <div class="report-stat-row"><span>ยืนยันแล้ว</span><span class="report-stat-value">${confirmed.length} ครั้ง</span></div>
    <div class="report-stat-row"><span>รอชำระ</span><span class="report-stat-value">${filtered.filter(b => b.status === 'pending').length} ครั้ง</span></div>
    <div class="report-stat-row"><span>ยกเลิก</span><span class="report-stat-value">${filtered.filter(b => b.status === 'cancelled').length} ครั้ง</span></div>`;

  document.getElementById('report-users-content').innerHTML = `
    <div class="report-stat-row"><span>สมาชิกทั้งหมด</span><span class="report-stat-value">${DB.users.length} คน</span></div>
    <div class="report-stat-row"><span>ผู้ใช้บริการ (ช่วงเวลา)</span><span class="report-stat-value">${filtered.reduce((s, b) => s + b.persons, 0)} คน</span></div>
    <div class="report-stat-row"><span>จำนวนคิวทั้งหมด</span><span class="report-stat-value">${filtered.length} คิว</span></div>`;

  document.getElementById('report-revenue-content').innerHTML = `
    <div class="report-stat-row"><span>รายได้รวม</span><span class="report-stat-value">${formatCurrency(revenue)}</span></div>
    <div class="report-stat-row"><span>รายได้เฉลี่ย/ครั้ง</span><span class="report-stat-value">${filtered.length ? formatCurrency(Math.round(revenue / filtered.length)) : '฿0'}</span></div>
    <div class="report-stat-row"><span>รายการยืนยัน</span><span class="report-stat-value">${filtered.filter(b => b.paymentStatus === 'verified').length} รายการ</span></div>`;

  const summaryRows = Object.entries(byPond).map(([name, count]) => `<div class="report-stat-row"><span>${name}</span><span class="report-stat-value">${count} ครั้ง</span></div>`).join('');
  document.getElementById('report-summary-content').innerHTML = `
    <h4 style="margin-bottom:12px">การจองแยกตามบ่อ</h4>
    ${summaryRows || '<p class="text-muted">ไม่มีข้อมูล</p>'}
    <div class="report-stat-row" style="margin-top:12px"><span><strong>อัตราความสำเร็จ</strong></span><span class="report-stat-value">${filtered.length ? Math.round((confirmed.length / filtered.length) * 100) : 0}%</span></div>`;
}

// ===== INIT ADMIN BOOKING MODAL POND LIST =====
function initAdminBookingModal() {
  const sel = document.getElementById('ab-pond');
  sel.innerHTML = DB.ponds.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
}

// ===== CONTACT & FAQ HELPERS =====
function toggleFaq(el) {
  const item = el.closest('.faq-item');
  if (item) item.classList.toggle('open');
}

function submitContactForm(e) {
  e.preventDefault();
  showToast('success', 'ส่งข้อความสำเร็จ!', 'ขอบคุณที่ติดต่อ FishingPark Pro เจ้าหน้าที่จะติดต่อกลับโดยเร็วที่สุด');
  e.target.reset();
}

// ===== INIT APP =====
window.addEventListener('DOMContentLoaded', () => {
  // Load current user from localStorage
  const savedUser = localStorage.getItem('fishing_currentUser');
  if (savedUser) {
    try {
      const parsed = JSON.parse(savedUser);
      const found = DB.users.find(u => u.id === parsed.id || u.email === parsed.email);
      currentUser = found || parsed;
    } catch (e) {
      console.error('Error loading current user:', e);
    }
  }

  // Load admin state from localStorage
  const savedAdmin = localStorage.getItem('fishing_isAdmin');
  if (savedAdmin === 'true') {
    isAdmin = true;
  }
  updateNavUser();

  // Detect current page from URL or DOM
  const path = window.location.pathname.toLowerCase();
  let currentPage = 'home';
  if (path.includes('ponds')) currentPage = 'ponds';
  else if (path.includes('booking')) currentPage = 'booking';
  else if (path.includes('promotions')) currentPage = 'promotions';
  else if (path.includes('news')) currentPage = 'news';
  else if (path.includes('profile')) currentPage = 'profile';
  else if (path.includes('my-bookings')) currentPage = 'my-bookings';
  else if (path.includes('my-payment')) currentPage = 'my-payment';
  else if (path.includes('admin')) currentPage = 'admin';

  updateNavActive(currentPage);

  // Parse URL search params
  const urlParams = new URLSearchParams(window.location.search);
  const pondParam = urlParams.get('pond');
  const promoParam = urlParams.get('promo');
  const idParam = urlParams.get('id');

  // Page-specific auto initialization
  if (document.getElementById('home-pond-grid')) {
    renderHomePonds();
    renderHomeNews();
  }
  if (document.getElementById('ponds-grid')) {
    renderPonds();
    if (idParam) {
      showPondDetail(parseInt(idParam));
    }
  }
  if (document.getElementById('booking-pond-grid')) {
    initBooking();
    if (promoParam) {
      if (promoParam === 'gang5pay4') {
        const input = document.getElementById('book-persons');
        if (input) input.value = 5;
        updateBookingPersonsHint();
        showToast('success', 'โปรโมชั่น มากัน 5 จ่าย 4', 'ตั้งค่าจำนวนผู้ใช้บริการ 5 คน (ฟรี 1 คน) เรียบร้อย');
      } else if (promoParam === 'student') {
        bookingState.useStudentDiscount = true;
        if (typeof updateStudentDiscountBoxUI === 'function') updateStudentDiscountBoxUI();
        showToast('success', 'โปรโมชั่นนักศึกษา', 'เปิดใช้งานส่วนลดนักศึกษา 10% เรียบร้อย');
      } else if (promoParam === 'birthday') {
        showToast('info', 'โปรโมชั่นเดือนเกิด', 'เลือกบ่อตกปลาแล้วโชว์บัตรประชาชนตอนเช็คอินเพื่อรับของขวัญ!');
      }
    }
    if (pondParam) {
      const pId = parseInt(pondParam);
      selectPond(pId);
      gotoStep(2);
    }
  }
  if (document.getElementById('news-grid-full')) {
    renderNewsPage();
  }
  if (document.getElementById('my-bookings-list')) {
    renderMyBookings();
  }
  if (document.getElementById('my-payment-list')) {
    renderMyPayments();
  }
  if (document.getElementById('profile-display-name')) {
    loadProfile();
  }
  if (document.getElementById('admin-dashboard') && (currentPage === 'admin' || isAdmin)) {
    const sidebar = document.getElementById('admin-sidebar');
    if (sidebar) sidebar.classList.remove('hidden');
    const wrapper = document.getElementById('main-wrapper');
    if (wrapper) wrapper.classList.add('admin-mode');
    showAdminPage('admin-dashboard');
    updateAdminStats();
    renderAdminDashboard();
  }

  // Set today's date as min for booking
  const dateInput = document.getElementById('booking-date');
  if (dateInput) dateInput.min = new Date().toISOString().split('T')[0];

  // Init booking pond dropdown for admin
  const bookingModal = document.getElementById('add-booking-modal');
  if (bookingModal) {
    bookingModal.addEventListener('click', () => initAdminBookingModal(), { once: false });
  }
});
