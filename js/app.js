// ============================================================
// ClinicFlow Pro — App Controller
// ============================================================

const App = (function() {
  let currentPage = 'dashboard';
  let currentFilters = {};
  let isDemo = false;
  let sessionTimer, idleTimer;
  let editingBookingId = null;
  let editingPatientId = null;
  let prefillBookingId = null;

  // ===== LOADER =====
  function showLoader(message = 'جاري التحميل...') {
    const loader = document.getElementById('app-loader');
    const loaderText = document.getElementById('loader-text');
    if (loader) {
      if (loaderText) loaderText.textContent = message;
      loader.classList.add('active');
    }
  }

  function hideLoader() {
    const loader = document.getElementById('app-loader');
    if (loader) {
      setTimeout(() => loader.classList.remove('active'), 500);
    }
  }

  // ===== INIT =====
  function init() {
    // Close modals on overlay click
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) UI.closeAllModals();
      });
    });

    // Close modal buttons
    document.querySelectorAll('[data-close-modal]').forEach(btn => {
      btn.addEventListener('click', () => UI.closeAllModals());
    });

    // Nav items
    document.querySelectorAll('.nav-item[data-page]').forEach(item => {
      item.addEventListener('click', () => navigateTo(item.dataset.page));
    });

    // Filter chip shortcuts
    document.querySelectorAll('[data-period]').forEach(chip => {
      chip.addEventListener('click', function() {
        document.querySelectorAll('[data-period]').forEach(c => c.classList.remove('active'));
        this.classList.add('active');
        currentFilters.period = this.dataset.period || null;
        refreshAll();
      });
    });

    // Idle detection
    ['mousemove', 'keydown', 'click', 'touchstart'].forEach(e =>
      document.addEventListener(e, resetIdleTimer)
    );

    setupFormEvents();
  }

  // ===== SESSION =====
  function startSession(demo) {
    showLoader('جاري تحميل البيانات...');
    
    setTimeout(() => {
      isDemo = demo;
      Store.init(demo);
      refreshSelectOptions();

      const settings = Store.getSettings();
      UI.setText('clinic-name-display', settings.clinicName);

      // Apply dark/light mode
      if (settings.darkMode) {
        document.body.classList.remove('light-mode');
      } else {
        document.body.classList.add('light-mode');
      }

      // Update status
      const statusDot = document.getElementById('status-dot');
      if (demo) {
        statusDot.className = 'status-dot demo';
        statusDot.innerHTML = '<i class="fas fa-flask"></i> وضع تجريبي';
      } else {
        statusDot.className = 'status-dot';
        statusDot.innerHTML = '<i class="fas fa-circle"></i> متصل';
      }

      document.getElementById('login-page').style.display = 'none';
      document.getElementById('app').className = 'active';

      navigateTo('dashboard');
      startIdleTimer();

      // Update settings display
      loadSettingsPage();
      
      hideLoader();
    }, 1200);
  }

  function logout() {
    document.getElementById('app').className = '';
    document.getElementById('login-page').style.display = 'flex';
    document.getElementById('login-email').value = '';
    document.getElementById('login-password').value = '';
    currentFilters = {};
  }

  function startIdleTimer() {
    const settings = Store.getSettings();
    clearTimeout(idleTimer);
    idleTimer = setTimeout(lockScreen, settings.idleTimeout * 60000);
  }

  function resetIdleTimer() {
    const settings = Store.getSettings();
    clearTimeout(idleTimer);
    idleTimer = setTimeout(lockScreen, settings.idleTimeout * 60000);
  }

  function lockScreen() {
    document.getElementById('lock-screen').classList.add('active');
  }

  function unlockScreen() {
    const pwd = document.getElementById('lock-password').value;
    if (pwd === '1234' || pwd === 'demo' || pwd.length >= 3) {
      document.getElementById('lock-screen').classList.remove('active');
      document.getElementById('lock-password').value = '';
      resetIdleTimer();
    } else {
      UI.toast('كلمة المرور غير صحيحة', 'error');
    }
  }

  // ===== NAVIGATION =====
  function navigateTo(page) {
    currentPage = page;

    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    const pageEl = document.getElementById(`page-${page}`);
    const navEl = document.querySelector(`.nav-item[data-page="${page}"]`);

    if (pageEl) pageEl.classList.add('active');
    if (navEl) navEl.classList.add('active');

    const titles = {
      dashboard: ['لوحة التحكم', 'نظرة عامة على الأداء التشغيلي'],
      bookings: ['الحجوزات', 'إدارة وتتبع المواعيد'],
      patients: ['المرضى', 'سجلات المراجعين والأرباح'],
      analytics: ['التحليلات', 'تقارير وإحصاءات متقدمة'],
      settings: ['الإعدادات', 'تخصيص النظام والتفضيلات']
    };

    if (titles[page]) {
      UI.setText('topbar-title', titles[page][0]);
      UI.setText('topbar-subtitle', titles[page][1]);
    }

    refreshPage(page);
  }

  // ===== REFRESH =====
  function refreshAll() { refreshPage(currentPage); }

  function refreshPage(page) {
    switch(page) {
      case 'dashboard': renderDashboard(); break;
      case 'bookings': renderBookings(); break;
      case 'patients': renderPatients(); break;
      case 'analytics': renderAnalytics(); break;
      case 'settings': loadSettingsPage(); break;
    }
  }

  // ===== DASHBOARD =====
  function renderDashboard() {
    const stats = Store.getStats(currentFilters);

    // Stat cards
    const cards = [
      { id: 'stat-total-bookings', val: stats.totalBookings },
      { id: 'stat-total-patients', val: stats.totalPatients },
      { id: 'stat-attendance', val: stats.attendanceRate + '%' },
      { id: 'stat-noshow', val: stats.noShowRate + '%' },
      { id: 'stat-revenue', val: UI.currency(stats.totalRevenue) },
      { id: 'stat-profit', val: UI.currency(stats.totalNetProfit) },
      { id: 'stat-avg-profit', val: UI.currency(stats.avgProfit) },
      { id: 'stat-walkin', val: stats.walkInPatients },
      { id: 'stat-converted', val: stats.convertedPatients },
      { id: 'stat-top-doctor', val: stats.topDoctor ? stats.topDoctor.name.replace('د. ', '') : '—' }
    ];
    cards.forEach(c => UI.setText(c.id, c.val));

    // Charts
    setTimeout(() => {
      const labels = stats.dailyData.map(d => d.label);
      UI.drawLineChart('chart-bookings', [stats.dailyData.map(d => d.bookings), stats.dailyData.map(d => d.patients)], labels, ['rgb(59,130,246)', 'rgb(16,185,129)']);
      UI.drawLineChart('chart-revenue', [stats.dailyData.map(d => d.revenue)], labels, ['rgb(245,158,11)']);

      const doctors = Object.keys(stats.doctorData);
      const profits = doctors.map(d => stats.doctorData[d].revenue);
      UI.drawBarChart('chart-doctors', doctors, profits, ['rgb(59,130,246)', 'rgb(16,185,129)', 'rgb(139,92,246)', 'rgb(245,158,11)']);

      // Donut - booking sources
      const srcData = Object.entries(stats.sources).map(([k,v]) => ({ label: k, value: v }));
      UI.drawDonutChart('chart-sources', srcData, ['rgb(59,130,246)', 'rgb(16,185,129)', 'rgb(139,92,246)', 'rgb(245,158,11)']);
    }, 100);
  }

  // ===== BOOKINGS TABLE =====
  function renderBookings(searchQuery, dateFilter) {
    let data = Store.applyBookingFilters(Store.getBookings(), currentFilters);
    
    // Apply search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      data = data.filter(b => b.patientName.toLowerCase().includes(q) || b.phone.includes(q) || b.doctorName.includes(q));
    }
    
    // Apply appointment date filter
    if (dateFilter) {
      data = data.filter(b => b.appointmentDate === dateFilter);
    }

    UI.setText('bookings-count', `${data.length} حجز`);
    const tbody = document.getElementById('bookings-tbody');

    if (!data.length) {
      tbody.innerHTML = `<tr><td colspan="11"><div class="table-empty"><div class="empty-icon"><i class="fas fa-calendar-times"></i></div><p>لا توجد حجوزات</p></div></td></tr>`;
      return;
    }

    tbody.innerHTML = data.map(b => `
      <tr>
        <td><span class="badge badge-gray">${b.id.slice(-6)}</span></td>
        <td><strong>${b.patientName}</strong></td>
        <td dir="ltr">${b.phone}</td>
        <td>${b.doctorName}</td>
        <td>${UI.formatDate(b.appointmentDate)}</td>
        <td>${UI.formatTime(b.appointmentTime)}</td>
        <td>${UI.sourceBadge(b.source)}</td>
        <td>${UI.statusBadge(b.status)}</td>
        <td>${b.linkedPatientId ? '<span class="badge badge-green"><i class="fas fa-check-circle"></i> راجع</span>' : '<span class="badge badge-gray"><i class="fas fa-minus-circle"></i> لم يراجع</span>'}</td>
        <td style="font-size:11px;color:var(--text-muted)">${UI.formatDateTime(b.createdAt)}</td>
        <td>
          <div class="td-actions">
            <button class="btn-icon primary" onclick="App.openEditBooking('${b.id}')" title="تعديل"><i class="fas fa-edit"></i></button>
            <button class="btn-icon success" onclick="App.openConvertBooking('${b.id}')" title="تحويل إلى مريض" ${b.linkedPatientId ? 'disabled' : ''}><i class="fas fa-user-plus"></i></button>
            <button class="btn-icon danger" onclick="App.deleteBookingConfirm('${b.id}')" title="حذف"><i class="fas fa-trash"></i></button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  // ===== PATIENTS TABLE =====
  function renderPatients(searchQuery) {
    let data = Store.applyPatientFilters(Store.getPatients(), currentFilters);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      data = data.filter(p => p.fullName.toLowerCase().includes(q) || p.phone.includes(q) || p.doctorName.includes(q));
    }

    UI.setText('patients-count', `${data.length} مريض`);

    // Summary
    const totalRev = data.reduce((s,p) => s+p.totalPrice, 0);
    const totalExp = data.reduce((s,p) => s+p.expenses, 0);
    const totalNet = data.reduce((s,p) => s+p.netProfit, 0);
    UI.setText('patients-total-rev', UI.currency(totalRev));
    UI.setText('patients-total-exp', UI.currency(totalExp));
    UI.setText('patients-total-net', UI.currency(totalNet));

    const tbody = document.getElementById('patients-tbody');
    if (!data.length) {
      tbody.innerHTML = `<tr><td colspan="13"><div class="table-empty"><div class="empty-icon"><i class="fas fa-user-times"></i></div><p>لا توجد سجلات مرضى</p></div></td></tr>`;
      return;
    }

    tbody.innerHTML = data.map(p => `
      <tr>
        <td><span class="badge badge-gray">${p.id.slice(-6)}</span></td>
        <td><strong>${p.fullName}</strong></td>
        <td dir="ltr">${p.phone}</td>
        <td>${UI.genderBadge(p.gender)}</td>
        <td>${UI.calcAge(p.birthDate)}</td>
        <td style="font-size:12px">${p.address || '—'}</td>
        <td>${p.doctorName}</td>
        <td>${p.serviceType}</td>
        <td style="color:var(--text-primary);font-weight:600">${UI.currency(p.totalPrice)}</td>
        <td style="color:var(--accent-rose)">${UI.currency(p.expenses)}</td>
        <td style="color:var(--accent-emerald);font-weight:700">${UI.currency(p.netProfit)}</td>
        <td>${p.bookingId ? '<span class="badge badge-green"><i class="fas fa-link"></i> من حجز</span>' : '<span class="badge badge-violet"><i class="fas fa-walking"></i> مباشر</span>'}</td>
        <td>
          <div class="td-actions">
            <button class="btn-icon primary" onclick="App.openEditPatient('${p.id}')" title="تعديل"><i class="fas fa-edit"></i></button>
            <button class="btn-icon danger" onclick="App.deletePatientConfirm('${p.id}')" title="حذف"><i class="fas fa-trash"></i></button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  // ===== ANALYTICS PAGE =====
  function renderAnalytics() {
    const stats = Store.getStats(currentFilters);

    UI.setText('an-total-bookings', stats.totalBookings);
    UI.setText('an-attendance', stats.attendanceRate + '%');
    UI.setText('an-noshow', stats.noShowRate + '%');
    UI.setText('an-cancel', stats.canceledBookings);
    UI.setText('an-total-patients', stats.totalPatients);
    UI.setText('an-walkin', stats.walkInPatients);
    UI.setText('an-converted', stats.convertedPatients);
    UI.setText('an-conversion-rate', stats.conversionRate + '%');
    UI.setText('an-total-revenue', UI.currency(stats.totalRevenue));
    UI.setText('an-total-expenses', UI.currency(stats.totalExpenses));
    UI.setText('an-net-profit', UI.currency(stats.totalNetProfit));
    UI.setText('an-avg-profit', UI.currency(stats.avgProfit));
    UI.setText('an-male', stats.genderData.male);
    UI.setText('an-female', stats.genderData.female);

    // Doctor list
    const doctorList = document.getElementById('an-doctor-list');
    const doctors = Object.entries(stats.doctorData).sort((a,b) => b[1].revenue - a[1].revenue);
    const maxProfit = doctors[0]?.[1]?.revenue || 1;
    doctorList.innerHTML = doctors.map(([name, data]) => `
      <div class="analytics-item">
        <span class="analytics-item-label">${name}</span>
        <div class="analytics-bar-wrap"><div class="analytics-bar" style="width:${Math.round(data.revenue/maxProfit*100)}%"></div></div>
        <span class="analytics-item-value">${UI.currency(data.revenue)}</span>
      </div>
    `).join('') || '<p style="color:var(--text-muted);font-size:12px">لا توجد بيانات</p>';

    // Service list
    const serviceList = document.getElementById('an-service-list');
    const services = Object.entries(stats.serviceData).sort((a,b) => b[1]-a[1]);
    const maxSvc = services[0]?.[1] || 1;
    serviceList.innerHTML = services.map(([name, count]) => `
      <div class="analytics-item">
        <span class="analytics-item-label">${name}</span>
        <div class="analytics-bar-wrap"><div class="analytics-bar" style="width:${Math.round(count/maxSvc*100)}%;background:var(--gradient-success)"></div></div>
        <span class="analytics-item-value">${count}</span>
      </div>
    `).join('') || '<p style="color:var(--text-muted);font-size:12px">لا توجد بيانات</p>';

    // Source list
    const sourceList = document.getElementById('an-source-list');
    const sources = Object.entries(stats.sources).sort((a,b) => b[1]-a[1]);
    const maxSrc = sources[0]?.[1] || 1;
    const srcNames = { phone: 'هاتف', whatsapp: 'واتساب', 'walk-in': 'مباشر', online: 'إنترنت' };
    sourceList.innerHTML = sources.map(([src, count]) => `
      <div class="analytics-item">
        <span class="analytics-item-label">${srcNames[src] || src}</span>
        <div class="analytics-bar-wrap"><div class="analytics-bar" style="width:${Math.round(count/maxSrc*100)}%;background:var(--gradient-violet)"></div></div>
        <span class="analytics-item-value">${count}</span>
      </div>
    `).join('') || '<p style="color:var(--text-muted);font-size:12px">لا توجد بيانات</p>';

    // Charts
    setTimeout(() => {
      const labels = stats.dailyData.map(d => d.label);
      UI.drawLineChart('chart-an-patients', [stats.dailyData.map(d => d.patients)], labels, ['rgb(16,185,129)']);
      UI.drawLineChart('chart-an-revenue', [stats.dailyData.map(d => d.revenue)], labels, ['rgb(245,158,11)']);

      const dl = Object.keys(stats.doctorData);
      const dp = dl.map(d => stats.doctorData[d].revenue);
      UI.drawBarChart('chart-an-doctors', dl, dp, ['rgb(59,130,246)', 'rgb(16,185,129)', 'rgb(139,92,246)', 'rgb(245,158,11)']);

      const srcData = Object.entries(stats.sources).map(([k,v]) => ({ label: k, value: v }));
      UI.drawDonutChart('chart-an-sources', srcData, ['rgb(59,130,246)', 'rgb(16,185,129)', 'rgb(139,92,246)', 'rgb(245,158,11)']);
    }, 100);
  }

  // ===== FORM EVENTS =====
  function setupFormEvents() {
    // Login
    document.getElementById('btn-login')?.addEventListener('click', handleLogin);
    document.getElementById('btn-demo')?.addEventListener('click', () => startSession(true));
    document.getElementById('login-password')?.addEventListener('keydown', e => { if (e.key === 'Enter') handleLogin(); });

    // Lock screen unlock
    document.getElementById('btn-unlock')?.addEventListener('click', unlockScreen);
    document.getElementById('lock-password')?.addEventListener('keydown', e => { if (e.key === 'Enter') unlockScreen(); });

    // Logout
    document.getElementById('btn-logout')?.addEventListener('click', logout);

    // Open add booking modal
    document.getElementById('btn-add-booking')?.addEventListener('click', openAddBooking);
    document.getElementById('btn-add-booking-2')?.addEventListener('click', openAddBooking);
    document.getElementById('btn-sidebar-booking')?.addEventListener('click', openAddBooking);

    // Open add patient modal
    document.getElementById('btn-add-patient')?.addEventListener('click', openAddPatient);
    document.getElementById('btn-add-patient-2')?.addEventListener('click', openAddPatient);
    document.getElementById('btn-sidebar-patient')?.addEventListener('click', openAddPatient);

    // Save booking
    document.getElementById('btn-save-booking')?.addEventListener('click', saveBooking);

    // Save patient
    document.getElementById('btn-save-patient')?.addEventListener('click', savePatient);

    // Patient profit calc
    ['patient-price', 'patient-expenses'].forEach(id => {
      document.getElementById(id)?.addEventListener('input', calcPatientProfit);
    });

    // Search
    document.getElementById('search-bookings')?.addEventListener('input', e => {
      const dateFilter = document.getElementById('filter-booking-date')?.value || '';
      renderBookings(e.target.value, dateFilter);
    });
    
    // Booking date filter
    document.getElementById('filter-booking-date')?.addEventListener('change', e => {
      const searchQuery = document.getElementById('search-bookings')?.value || '';
      renderBookings(searchQuery, e.target.value);
    });
    
    document.getElementById('search-patients')?.addEventListener('input', e => renderPatients(e.target.value));

    // Settings
    document.getElementById('btn-save-settings')?.addEventListener('click', saveSettings);
    document.getElementById('btn-save-profit-settings')?.addEventListener('click', saveProfitSettings);

    // Filter modal
    document.getElementById('btn-filter')?.addEventListener('click', () => UI.openModal('filter-modal'));
    document.getElementById('btn-apply-filter')?.addEventListener('click', applyFilters);
    document.getElementById('btn-clear-filter')?.addEventListener('click', clearFilters);

    // Export
    document.getElementById('btn-export-bookings')?.addEventListener('click', exportBookings);
    document.getElementById('btn-export-patients')?.addEventListener('click', exportPatients);
    document.getElementById('btn-export-report')?.addEventListener('click', exportReport);
    document.getElementById('btn-export-btn')?.addEventListener('click', () => UI.openModal('export-modal'));

    // Ranges
    ['range-doctor', 'range-clinic', 'range-platform'].forEach(id => {
      const el = document.getElementById(id);
      const display = document.getElementById(id + '-display');
      if (el && display) {
        el.addEventListener('input', () => {
          display.textContent = el.value + '%';
          balanceRanges(id);
        });
      }
    });

    // Toggles
    document.querySelectorAll('.toggle').forEach(toggle => {
      if (toggle.id === 'toggle-dark-mode') {
        toggle.addEventListener('click', toggleDarkMode);
      } else if (toggle.id === 'toggle-firebase') {
        toggle.addEventListener('click', toggleFirebase);
      } else {
        toggle.addEventListener('click', function() { this.classList.toggle('on'); });
      }
    });

    // Firebase connection
    document.getElementById('btn-connect-firebase')?.addEventListener('click', connectFirebase);
  }

  // ===== LOGIN =====
  function handleLogin() {
    const email = UI.getVal('login-email');
    const pwd = UI.getVal('login-password');
    if (!email || !pwd) { UI.toast('يرجى إدخال البريد وكلمة المرور', 'warning'); return; }
    // Demo auth
    UI.toast('جاري تسجيل الدخول...', 'info', 1500);
    setTimeout(() => startSession(false), 1000);
  }

  // ===== BOOKING MODAL =====
  function openAddBooking() {
    editingBookingId = null;
    document.getElementById('booking-modal-title').textContent = 'إضافة حجز جديد';
    document.getElementById('booking-form').reset();
    refreshSelectOptions();
    UI.openModal('booking-modal');
  }

  function openEditBooking(id) {
    const booking = Store.getBookings().find(b => b.id === id);
    if (!booking) return;
    editingBookingId = id;
    document.getElementById('booking-modal-title').textContent = 'تعديل الحجز';
    refreshSelectOptions();
    UI.setVal('booking-name', booking.patientName);
    UI.setVal('booking-phone', booking.phone);
    UI.setVal('booking-doctor', booking.doctorName);
    UI.setVal('booking-date', booking.appointmentDate);
    UI.setVal('booking-time', booking.appointmentTime);
    UI.setVal('booking-source', booking.source);
    UI.setVal('booking-status', booking.status);
    UI.setVal('booking-notes', booking.notes || '');
    UI.openModal('booking-modal');
  }

  function openConvertBooking(bookingId) {
    const data = Store.convertBookingToPatient(bookingId);
    if (!data) return;
    prefillBookingId = bookingId;
    openAddPatient();
    setTimeout(() => {
      UI.setVal('patient-name', data.fullName);
      UI.setVal('patient-phone', data.phone);
      UI.setVal('patient-doctor', data.doctorName);
    }, 100);
  }

  function saveBooking() {
    const data = {
      patientName: UI.getVal('booking-name'),
      phone: UI.getVal('booking-phone'),
      doctorName: UI.getVal('booking-doctor'),
      appointmentDate: UI.getVal('booking-date'),
      appointmentTime: UI.getVal('booking-time'),
      source: UI.getVal('booking-source'),
      status: UI.getVal('booking-status') || 'scheduled',
      notes: UI.getVal('booking-notes')
    };

    if (!data.patientName || !data.phone || !data.doctorName || !data.appointmentDate) {
      UI.toast('يرجى تعبئة الحقول الإلزامية', 'warning'); return;
    }

    if (editingBookingId) {
      Store.updateBooking(editingBookingId, data);
      UI.toast('تم تحديث الحجز بنجاح ✅', 'success');
    } else {
      Store.addBooking(data);
      UI.toast('تم إضافة الحجز بنجاح ✅', 'success');
    }

    UI.closeAllModals();
    renderBookings();
    if (currentPage === 'dashboard') renderDashboard();
  }

  function deleteBookingConfirm(id) {
    UI.confirm('هل أنت متأكد من حذف هذا الحجز؟', () => {
      Store.deleteBooking(id);
      UI.toast('تم حذف الحجز', 'info');
      renderBookings();
      if (currentPage === 'dashboard') renderDashboard();
    });
  }

  // ===== PATIENT MODAL =====
  function openAddPatient() {
    editingPatientId = null;
    if (!prefillBookingId) prefillBookingId = null;
    document.getElementById('patient-modal-title').textContent = 'تسجيل مريض جديد';
    document.getElementById('patient-form').reset();
    document.getElementById('patient-date').value = Store.today();
    refreshSelectOptions();
    calcPatientProfit();
    UI.openModal('patient-modal');
  }

  function openEditPatient(id) {
    const patient = Store.getPatients().find(p => p.id === id);
    if (!patient) return;
    editingPatientId = id;
    document.getElementById('patient-modal-title').textContent = 'تعديل بيانات المريض';
    refreshSelectOptions();
    UI.setVal('patient-name', patient.fullName);
    UI.setVal('patient-phone', patient.phone);
    UI.setVal('patient-gender', patient.gender);
    UI.setVal('patient-birthdate', patient.birthDate);
    UI.setVal('patient-address', patient.address);
    UI.setVal('patient-doctor', patient.doctorName);
    UI.setVal('patient-service', patient.serviceType);
    UI.setVal('patient-price', patient.totalPrice);
    UI.setVal('patient-expenses', patient.expenses);
    UI.setVal('patient-notes', patient.medicalNotes);
    UI.setVal('patient-date', patient.visitDate || Store.today());
    calcPatientProfit();
    UI.openModal('patient-modal');
  }

  function calcPatientProfit() {
    const settings = Store.getSettings();
    const price = parseFloat(UI.getVal('patient-price')) || 0;
    const expenses = parseFloat(UI.getVal('patient-expenses')) || 0;
    const net = price - expenses;
    const doctor = Math.round(net * settings.doctorPercent / 100);
    const clinic = Math.round(net * settings.clinicPercent / 100);
    const platform = Math.round(net * settings.platformPercent / 100);

    UI.setText('preview-net', UI.currency(net));
    UI.setText('preview-doctor', UI.currency(doctor));
    UI.setText('preview-clinic', UI.currency(clinic));
    UI.setText('preview-platform', UI.currency(platform));
  }

  function savePatient() {
    const data = {
      fullName: UI.getVal('patient-name'),
      phone: UI.getVal('patient-phone'),
      gender: UI.getVal('patient-gender'),
      birthDate: UI.getVal('patient-birthdate'),
      address: UI.getVal('patient-address'),
      doctorName: UI.getVal('patient-doctor'),
      serviceType: UI.getVal('patient-service'),
      totalPrice: parseFloat(UI.getVal('patient-price')) || 0,
      expenses: parseFloat(UI.getVal('patient-expenses')) || 0,
      medicalNotes: UI.getVal('patient-notes'),
      visitDate: UI.getVal('patient-date') || Store.today()
    };

    if (!data.fullName || !data.phone || !data.doctorName || !data.serviceType) {
      UI.toast('يرجى تعبئة الحقول الإلزامية', 'warning'); return;
    }

    if (editingPatientId) {
      Store.updatePatient(editingPatientId, data);
      UI.toast('تم تحديث بيانات المريض ✅', 'success');
    } else {
      const patient = Store.addPatient(data);
      if (patient.bookingId) {
        UI.toast('✅ تم التسجيل وربط الحجز تلقائياً!', 'success', 5000);
      } else {
        UI.toast('✅ تم تسجيل المريض بنجاح', 'success');
      }
    }

    prefillBookingId = null;
    UI.closeAllModals();
    renderPatients();
    if (currentPage === 'dashboard') renderDashboard();
  }

  function deletePatientConfirm(id) {
    UI.confirm('هل أنت متأكد من حذف هذا المريض؟', () => {
      Store.deletePatient(id);
      UI.toast('تم حذف المريض', 'info');
      renderPatients();
      if (currentPage === 'dashboard') renderDashboard();
    });
  }

  // ===== SETTINGS =====
  function loadSettingsPage() {
    const s = Store.getSettings();
    UI.setVal('setting-clinic-name', s.clinicName);
    document.getElementById('range-doctor').value = s.doctorPercent;
    document.getElementById('range-clinic').value = s.clinicPercent;
    document.getElementById('range-platform').value = s.platformPercent;
    UI.setText('range-doctor-display', s.doctorPercent + '%');
    UI.setText('range-clinic-display', s.clinicPercent + '%');
    UI.setText('range-platform-display', s.platformPercent + '%');

    // Dark mode toggle
    const darkModeToggle = document.getElementById('toggle-dark-mode');
    if (darkModeToggle) {
      darkModeToggle.className = s.darkMode ? 'toggle on' : 'toggle';
    }

    // Firebase status
    const firebaseToggle = document.getElementById('toggle-firebase');
    if (firebaseToggle) {
      firebaseToggle.className = s.firebaseConnected ? 'toggle on' : 'toggle';
    }

    // Doctors list
    const doctorsList = document.getElementById('doctors-list');
    if (doctorsList) {
      doctorsList.innerHTML = s.doctors.map(d => `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)">
          <span style="font-size:13px">${d}</span>
          <button class="btn-icon danger" onclick="App.removeDoctor('${d}')"><i class="fas fa-trash"></i></button>
        </div>
      `).join('');
    }

    // Services list
    const servicesList = document.getElementById('services-list');
    if (servicesList) {
      servicesList.innerHTML = s.services.map(svc => `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)">
          <span style="font-size:13px">${svc}</span>
          <button class="btn-icon danger" onclick="App.removeService('${svc}')"><i class="fas fa-trash"></i></button>
        </div>
      `).join('');
    }
  }

  function saveSettings() {
    const s = Store.getSettings();
    s.clinicName = UI.getVal('setting-clinic-name') || s.clinicName;
    Store.saveSettings(s);
    UI.setText('clinic-name-display', s.clinicName);
    UI.toast('تم حفظ الإعدادات ✅', 'success');
  }

  function toggleDarkMode() {
    const s = Store.getSettings();
    s.darkMode = !s.darkMode;
    Store.saveSettings(s);
    
    showLoader('جاري تطبيق الإعدادات...');
    
    setTimeout(() => {
      if (s.darkMode) {
        document.body.classList.remove('light-mode');
      } else {
        document.body.classList.add('light-mode');
      }
      
      const toggle = document.getElementById('toggle-dark-mode');
      if (toggle) toggle.className = s.darkMode ? 'toggle on' : 'toggle';
      
      hideLoader();
      UI.toast(s.darkMode ? 'تم تفعيل الوضع الداكن 🌙' : 'تم تفعيل الوضع الفاتح ☀️', 'success');
    }, 800);
  }

  function toggleFirebase() {
    const s = Store.getSettings();
    
    if (s.firebaseConnected) {
      // Disconnect
      UI.confirm('هل تريد قطع الاتصال بـ Firebase وتسجيل الخروج؟', () => {
        if (typeof Firebase !== 'undefined') {
          Firebase.disconnect();
        }
        logout();
      });
    } else {
      // Connect - redirect to login
      UI.confirm('سيتم تحويلك لشاشة تسجيل الدخول لإعداد Firebase. هل تريد المتابعة؟', () => {
        logout();
        setTimeout(() => {
          UI.openModal('firebase-modal');
        }, 500);
      });
    }
  }

  function openFirebaseSetup() {
    UI.openModal('firebase-modal');
  }

  function connectFirebase() {
    const apiKey = UI.getVal('firebase-api-key');
    const authDomain = UI.getVal('firebase-auth-domain');
    const projectId = UI.getVal('firebase-project-id');

    if (!apiKey || !authDomain || !projectId) {
      UI.toast('يرجى إدخال جميع بيانات Firebase', 'warning');
      return;
    }

    const config = {
      apiKey,
      authDomain,
      projectId,
      storageBucket: projectId + '.appspot.com',
      messagingSenderId: '123456789',
      appId: '1:123456789:web:abcdef'
    };

    if (typeof Firebase !== 'undefined' && Firebase.initFirebase(config)) {
      UI.closeAllModals();
      loadSettingsPage();
    }
  }

  function saveProfitSettings() {
    const s = Store.getSettings();
    const d = parseInt(document.getElementById('range-doctor').value);
    const c = parseInt(document.getElementById('range-clinic').value);
    const p = parseInt(document.getElementById('range-platform').value);
    if (d + c + p !== 100) { UI.toast('مجموع النسب يجب أن يكون 100%', 'warning'); return; }
    s.doctorPercent = d; s.clinicPercent = c; s.platformPercent = p;
    Store.saveSettings(s);
    UI.toast('تم حفظ نسب الأرباح ✅', 'success');
  }

  function balanceRanges(changedId) {
    const d = parseInt(document.getElementById('range-doctor').value);
    const c = parseInt(document.getElementById('range-clinic').value);
    const p = parseInt(document.getElementById('range-platform').value);
    const total = d + c + p;
    const diff = total - 100;
    const el = document.getElementById('ranges-total');
    if (el) {
      el.textContent = `المجموع: ${total}%`;
      el.style.color = total === 100 ? 'var(--accent-emerald)' : 'var(--accent-rose)';
    }
  }

  function removeDoctor(name) {
    const s = Store.getSettings();
    s.doctors = s.doctors.filter(d => d !== name);
    Store.saveSettings(s);
    loadSettingsPage();
    refreshSelectOptions();
    UI.toast('تم حذف الطبيب', 'info');
  }

  function removeService(name) {
    const s = Store.getSettings();
    s.services = s.services.filter(sv => sv !== name);
    Store.saveSettings(s);
    loadSettingsPage();
    refreshSelectOptions();
    UI.toast('تم حذف الخدمة', 'info');
  }

  function addDoctor() {
    const name = UI.getVal('new-doctor');
    if (!name) return;
    const s = Store.getSettings();
    if (!s.doctors.includes(name)) { s.doctors.push(name); Store.saveSettings(s); }
    UI.setVal('new-doctor', '');
    loadSettingsPage();
    refreshSelectOptions();
    UI.toast('تم إضافة الطبيب ✅', 'success');
  }

  function addService() {
    const name = UI.getVal('new-service');
    if (!name) return;
    const s = Store.getSettings();
    if (!s.services.includes(name)) { s.services.push(name); Store.saveSettings(s); }
    UI.setVal('new-service', '');
    loadSettingsPage();
    refreshSelectOptions();
    UI.toast('تم إضافة الخدمة ✅', 'success');
  }

  function refreshSelectOptions() {
    const s = Store.getSettings();
    UI.populateSelect('booking-doctor', s.doctors, 'اختر الطبيب');
    UI.populateSelect('patient-doctor', s.doctors, 'اختر الطبيب');
    UI.populateSelect('patient-service', s.services, 'اختر الخدمة');
    UI.populateSelect('filter-doctor', s.doctors, 'جميع الأطباء');
    UI.populateSelect('filter-service', s.services, 'جميع الخدمات');
  }

  // ===== FILTERS =====
  function applyFilters() {
    currentFilters = {
      doctor: UI.getVal('filter-doctor'),
      service: UI.getVal('filter-service'),
      source: UI.getVal('filter-source'),
      gender: UI.getVal('filter-gender'),
      status: UI.getVal('filter-status'),
      period: UI.getVal('filter-period'),
      dateFrom: UI.getVal('filter-date-from'),
      dateTo: UI.getVal('filter-date-to')
    };
    // Remove empty
    Object.keys(currentFilters).forEach(k => { if (!currentFilters[k]) delete currentFilters[k]; });
    UI.closeAllModals();
    refreshAll();
    updateFilterBadge();
    UI.toast('تم تطبيق الفلتر ✅', 'success');
  }

  function clearFilters() {
    currentFilters = {};
    document.getElementById('filter-form').reset();
    UI.closeAllModals();
    document.querySelectorAll('[data-period]').forEach(c => c.classList.remove('active'));
    refreshAll();
    updateFilterBadge();
    UI.toast('تم مسح الفلتر', 'info');
  }

  function updateFilterBadge() {
    const count = Object.keys(currentFilters).length;
    const badge = document.getElementById('filter-badge');
    if (badge) {
      badge.textContent = count || '';
      badge.style.display = count ? 'flex' : 'none';
    }
  }

  // ===== EXPORT =====
  function exportTSV(data, filename) {
    if (!data.length) { UI.toast('لا توجد بيانات للتصدير', 'warning'); return; }
    
    const headers = Object.keys(data[0]);
    const rows = data.map(row => headers.map(h => {
      const val = row[h] || '';
      // Escape tabs and newlines
      return String(val).replace(/\t/g, ' ').replace(/\n/g, ' ');
    }).join('\t'));
    
    const tsv = '\uFEFF' + [headers.join('\t'), ...rows].join('\n');
    const blob = new Blob([tsv], { type: 'text/tab-separated-values;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    
    UI.toast('تم التصدير ✅', 'success');
    
    // Show instructions
    setTimeout(() => {
      UI.openModal('tsv-help-modal');
    }, 500);
  }

  function exportBookings() {
    const data = Store.applyBookingFilters(Store.getBookings(), currentFilters).map(b => ({
      'رقم_الحجز': b.id, 
      'الاسم': b.patientName, 
      'الهاتف': b.phone,
      'الطبيب': b.doctorName, 
      'التاريخ': b.appointmentDate, 
      'الوقت': b.appointmentTime,
      'المصدر': b.source, 
      'الحالة': b.status, 
      'مرتبط_بمريض': b.linkedPatientId ? 'نعم' : 'لا'
    }));
    exportTSV(data, 'bookings.tsv');
  }

  function exportPatients() {
    const data = Store.applyPatientFilters(Store.getPatients(), currentFilters).map(p => ({
      'رقم_المريض': p.id, 
      'الاسم': p.fullName, 
      'الهاتف': p.phone,
      'الجنس': p.gender === 'male' ? 'ذكر' : 'أنثى', 
      'الطبيب': p.doctorName, 
      'الخدمة': p.serviceType,
      'السعر': p.totalPrice, 
      'المصاريف': p.expenses, 
      'صافي_الربح': p.netProfit,
      'حصة_الطبيب': p.doctorShare, 
      'حصة_العيادة': p.clinicShare, 
      'حصة_المنصة': p.platformShare,
      'من_حجز': p.bookingId ? 'نعم' : 'لا'
    }));
    exportTSV(data, 'patients.tsv');
  }

  function exportReport() {
    const stats = Store.getStats(currentFilters);
    const data = [
      { 'المؤشر': 'إجمالي الحجوزات', 'القيمة': stats.totalBookings },
      { 'المؤشر': 'إجمالي المراجعين', 'القيمة': stats.totalPatients },
      { 'المؤشر': 'معدل الحضور', 'القيمة': stats.attendanceRate + '%' },
      { 'المؤشر': 'إجمالي الإيرادات', 'القيمة': stats.totalRevenue + ' د.ع' },
      { 'المؤشر': 'صافي الربح', 'القيمة': stats.totalNetProfit + ' د.ع' },
      { 'المؤشر': 'متوسط الربح لكل مريض', 'القيمة': stats.avgProfit + ' د.ع' },
    ];
    exportTSV(data, 'report.tsv');
  }

  return {
    init, startSession, logout, lockScreen, unlockScreen,
    navigateTo, refreshAll,
    renderDashboard, renderBookings, renderPatients, renderAnalytics,
    openAddBooking, openAddPatient, openEditBooking, openEditPatient,
    openConvertBooking, deleteBookingConfirm, deletePatientConfirm,
    saveBooking, savePatient,
    addDoctor, addService, removeDoctor, removeService,
    toggleDarkMode, toggleFirebase, openFirebaseSetup, connectFirebase,
    applyFilters, clearFilters,
    exportBookings, exportPatients, exportReport,
    showLoader, hideLoader
  };
})();

// Init
document.addEventListener('DOMContentLoaded', () => App.init());