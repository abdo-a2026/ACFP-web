// ============================================================
// ClinicFlow Pro — Data Store & Logic Engine
// ============================================================

const Store = (function() {
    const KEYS = {
      bookings: 'cfp_bookings',
      patients: 'cfp_patients',
      settings: 'cfp_settings',
      session: 'cfp_session'
    };
  
    // ---------- DEFAULT SETTINGS ----------
    const DEFAULT_SETTINGS = {
      clinicName: 'ClinicFlow Pro',
      doctorPercent: 40,
      clinicPercent: 40,
      platformPercent: 20,
      darkMode: true,
      sessionTimeout: 60,
      idleTimeout: 30,
      doctors: ['د. أحمد السالم', 'د. سارة المطيري', 'د. محمد العمري', 'د. فاطمة الحربي'],
      services: ['استشارة عامة', 'أشعة سينية', 'تحليل مخبري', 'علاج طبيعي', 'جراحة بسيطة', 'متابعة دورية']
    };
  
    // ---------- DEMO DATA ----------
    const DEMO_BOOKINGS = [
      { id: 'bk001', patientName: 'خالد محمد العنزي', phone: '0501234567', doctorName: 'د. أحمد السالم', appointmentDate: today(), appointmentTime: '09:00', status: 'completed', source: 'phone', linkedPatientId: 'pt001', createdAt: Date.now() - 7200000 },
      { id: 'bk002', patientName: 'نورة عبدالله السبيعي', phone: '0507654321', doctorName: 'د. سارة المطيري', appointmentDate: today(), appointmentTime: '10:00', status: 'scheduled', source: 'whatsapp', linkedPatientId: null, createdAt: Date.now() - 5400000 },
      { id: 'bk003', patientName: 'فيصل سلمان الدوسري', phone: '0509876543', doctorName: 'د. محمد العمري', appointmentDate: today(), appointmentTime: '11:30', status: 'no-show', source: 'online', linkedPatientId: null, createdAt: Date.now() - 3600000 },
      { id: 'bk004', patientName: 'منال يوسف القحطاني', phone: '0503456789', doctorName: 'د. فاطمة الحربي', appointmentDate: yesterday(), appointmentTime: '09:30', status: 'completed', source: 'walk-in', linkedPatientId: 'pt002', createdAt: Date.now() - 90000000 },
      { id: 'bk005', patientName: 'طارق ناصر الشمري', phone: '0506789012', doctorName: 'د. أحمد السالم', appointmentDate: yesterday(), appointmentTime: '14:00', status: 'canceled', source: 'phone', linkedPatientId: null, createdAt: Date.now() - 86400000 },
      { id: 'bk006', patientName: 'ريم فارس العتيبي', phone: '0508901234', doctorName: 'د. سارة المطيري', appointmentDate: daysAgo(2), appointmentTime: '10:30', status: 'completed', source: 'whatsapp', linkedPatientId: 'pt003', createdAt: Date.now() - 172800000 },
      { id: 'bk007', patientName: 'عبدالرحمن بدر الحربي', phone: '0502345678', doctorName: 'د. محمد العمري', appointmentDate: daysAgo(3), appointmentTime: '11:00', status: 'completed', source: 'online', linkedPatientId: 'pt004', createdAt: Date.now() - 259200000 },
      { id: 'bk008', patientName: 'لمياء علي المنصور', phone: '0504567890', doctorName: 'د. فاطمة الحربي', appointmentDate: tomorrow(), appointmentTime: '09:00', status: 'scheduled', source: 'phone', linkedPatientId: null, createdAt: Date.now() - 1800000 },
      { id: 'bk009', patientName: 'سعود محمد البقمي', phone: '0505678901', doctorName: 'د. أحمد السالم', appointmentDate: tomorrow(), appointmentTime: '10:30', status: 'scheduled', source: 'whatsapp', linkedPatientId: null, createdAt: Date.now() - 900000 },
      { id: 'bk010', patientName: 'هنادي خالد الزهراني', phone: '0506543210', doctorName: 'د. سارة المطيري', appointmentDate: daysAgo(4), appointmentTime: '15:00', status: 'no-show', source: 'online', linkedPatientId: null, createdAt: Date.now() - 345600000 },
    ];
  
    const DEMO_PATIENTS = [
      { id: 'pt001', fullName: 'خالد محمد العنزي', phone: '0501234567', gender: 'male', birthDate: '1988-05-15', address: 'الرياض، حي الملقا', medicalNotes: 'حساسية من البنسلين', serviceType: 'استشارة عامة', doctorName: 'د. أحمد السالم', totalPrice: 500, expenses: 80, netProfit: 420, doctorShare: 168, clinicShare: 168, platformShare: 84, bookingId: 'bk001', createdAt: Date.now() - 7000000 },
      { id: 'pt002', fullName: 'منال يوسف القحطاني', phone: '0503456789', gender: 'female', birthDate: '1992-08-22', address: 'جدة، حي الروضة', medicalNotes: '', serviceType: 'تحليل مخبري', doctorName: 'د. فاطمة الحربي', totalPrice: 350, expenses: 120, netProfit: 230, doctorShare: 92, clinicShare: 92, platformShare: 46, bookingId: 'bk004', createdAt: Date.now() - 89000000 },
      { id: 'pt003', fullName: 'ريم فارس العتيبي', phone: '0508901234', gender: 'female', birthDate: '1995-11-03', address: 'الرياض، حي النزهة', medicalNotes: 'مريضة سكري - جرعة أنسولين يومية', serviceType: 'علاج طبيعي', doctorName: 'د. سارة المطيري', totalPrice: 800, expenses: 200, netProfit: 600, doctorShare: 240, clinicShare: 240, platformShare: 120, bookingId: 'bk006', createdAt: Date.now() - 171000000 },
      { id: 'pt004', fullName: 'عبدالرحمن بدر الحربي', phone: '0502345678', gender: 'male', birthDate: '1980-02-14', address: 'الدمام، حي الشاطئ', medicalNotes: 'ضغط دم مرتفع', serviceType: 'جراحة بسيطة', doctorName: 'د. محمد العمري', totalPrice: 2500, expenses: 600, netProfit: 1900, doctorShare: 760, clinicShare: 760, platformShare: 380, bookingId: 'bk007', createdAt: Date.now() - 258000000 },
      { id: 'pt005', fullName: 'أحمد سلطان الغامدي', phone: '0509011234', gender: 'male', birthDate: '1975-07-30', address: 'مكة، حي العزيزية', medicalNotes: '', serviceType: 'أشعة سينية', doctorName: 'د. أحمد السالم', totalPrice: 300, expenses: 50, netProfit: 250, doctorShare: 100, clinicShare: 100, platformShare: 50, bookingId: null, createdAt: Date.now() - 432000000 },
      { id: 'pt006', fullName: 'سمية عبدالعزيز الرشيد', phone: '0501122334', gender: 'female', birthDate: '2000-01-20', address: 'الرياض، حي الورود', medicalNotes: 'أول زيارة', serviceType: 'متابعة دورية', doctorName: 'د. فاطمة الحربي', totalPrice: 200, expenses: 30, netProfit: 170, doctorShare: 68, clinicShare: 68, platformShare: 34, bookingId: null, createdAt: Date.now() - 518400000 },
    ];
  
    // ---------- HELPERS ----------
    function today() { return new Date().toISOString().split('T')[0]; }
    function yesterday() { const d = new Date(); d.setDate(d.getDate()-1); return d.toISOString().split('T')[0]; }
    function tomorrow() { const d = new Date(); d.setDate(d.getDate()+1); return d.toISOString().split('T')[0]; }
    function daysAgo(n) { const d = new Date(); d.setDate(d.getDate()-n); return d.toISOString().split('T')[0]; }
    function genId(prefix) { return prefix + Date.now() + Math.random().toString(36).slice(2,6); }
  
    // ---------- STORAGE ----------
    function save(key, data) { localStorage.setItem(key, JSON.stringify(data)); }
    function load(key, def) { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : def; } catch { return def; } }
  
    // ---------- INIT ----------
    function init(demoMode) {
      if (demoMode || !localStorage.getItem(KEYS.settings)) {
        save(KEYS.settings, DEFAULT_SETTINGS);
      }
      if (demoMode) {
        save(KEYS.bookings, DEMO_BOOKINGS);
        save(KEYS.patients, DEMO_PATIENTS);
      } else {
        if (!localStorage.getItem(KEYS.bookings)) save(KEYS.bookings, []);
        if (!localStorage.getItem(KEYS.patients)) save(KEYS.patients, []);
      }
    }
  
    // ---------- GETTERS ----------
    function getSettings() { return load(KEYS.settings, DEFAULT_SETTINGS); }
    function getBookings() { return load(KEYS.bookings, []); }
    function getPatients() { return load(KEYS.patients, []); }
  
    // ---------- BOOKING CRUD ----------
    function addBooking(data) {
      const bookings = getBookings();
      const booking = { id: genId('bk'), ...data, status: 'scheduled', linkedPatientId: null, createdAt: Date.now() };
      bookings.unshift(booking);
      save(KEYS.bookings, bookings);
      return booking;
    }
  
    function updateBooking(id, updates) {
      const bookings = getBookings().map(b => b.id === id ? { ...b, ...updates } : b);
      save(KEYS.bookings, bookings);
    }
  
    function deleteBooking(id) {
      save(KEYS.bookings, getBookings().filter(b => b.id !== id));
    }
  
    // ---------- PATIENT CRUD ----------
    function addPatient(data) {
      const patients = getPatients();
      const settings = getSettings();
  
      const netProfit = data.totalPrice - data.expenses;
      const doctorShare = Math.round(netProfit * settings.doctorPercent / 100);
      const clinicShare = Math.round(netProfit * settings.clinicPercent / 100);
      const platformShare = Math.round(netProfit * settings.platformPercent / 100);
  
      const patient = {
        id: genId('pt'),
        ...data,
        netProfit,
        doctorShare,
        clinicShare,
        platformShare,
        bookingId: null,
        createdAt: Date.now()
      };
  
      // Auto-link booking
      const bookings = getBookings();
      const match = bookings.find(b =>
        b.phone === data.phone &&
        b.appointmentDate === today() &&
        b.status === 'scheduled'
      );
  
      if (match) {
        patient.bookingId = match.id;
        updateBooking(match.id, { status: 'completed', linkedPatientId: patient.id });
      }
  
      patients.unshift(patient);
      save(KEYS.patients, patients);
      return patient;
    }
  
    function updatePatient(id, data) {
      const settings = getSettings();
      const netProfit = data.totalPrice - data.expenses;
      const doctorShare = Math.round(netProfit * settings.doctorPercent / 100);
      const clinicShare = Math.round(netProfit * settings.clinicPercent / 100);
      const platformShare = Math.round(netProfit * settings.platformPercent / 100);
  
      const patients = getPatients().map(p =>
        p.id === id ? { ...p, ...data, netProfit, doctorShare, clinicShare, platformShare } : p
      );
      save(KEYS.patients, patients);
    }
  
    function deletePatient(id) {
      save(KEYS.patients, getPatients().filter(p => p.id !== id));
    }
  
    function convertBookingToPatient(bookingId) {
      const booking = getBookings().find(b => b.id === bookingId);
      if (!booking) return null;
      return {
        fullName: booking.patientName,
        phone: booking.phone,
        doctorName: booking.doctorName,
        prefillBookingId: bookingId
      };
    }
  
    function saveSettings(s) { save(KEYS.settings, s); }
  
    // ---------- ANALYTICS ----------
    function getStats(filters) {
      const bookings = applyBookingFilters(getBookings(), filters);
      const patients = applyPatientFilters(getPatients(), filters);
  
      const totalBookings = bookings.length;
      const completedBookings = bookings.filter(b => b.status === 'completed').length;
      const noShowBookings = bookings.filter(b => b.status === 'no-show').length;
      const canceledBookings = bookings.filter(b => b.status === 'canceled').length;
      const scheduledBookings = bookings.filter(b => b.status === 'scheduled').length;
  
      const totalPatients = patients.length;
      const walkInPatients = patients.filter(p => !p.bookingId).length;
      const convertedPatients = patients.filter(p => p.bookingId).length;
  
      const totalRevenue = patients.reduce((s, p) => s + p.totalPrice, 0);
      const totalExpenses = patients.reduce((s, p) => s + p.expenses, 0);
      const totalNetProfit = patients.reduce((s, p) => s + p.netProfit, 0);
      const avgProfit = totalPatients ? Math.round(totalNetProfit / totalPatients) : 0;
  
      const attendanceRate = totalBookings ? Math.round(completedBookings / totalBookings * 100) : 0;
      const noShowRate = totalBookings ? Math.round(noShowBookings / totalBookings * 100) : 0;
      const conversionRate = totalBookings ? Math.round(convertedPatients / totalBookings * 100) : 0;
  
      // Top doctor by profit
      const doctorProfits = {};
      patients.forEach(p => { doctorProfits[p.doctorName] = (doctorProfits[p.doctorName] || 0) + p.netProfit; });
      const topDoctor = Object.entries(doctorProfits).sort((a,b) => b[1]-a[1])[0];
  
      // Top booking source
      const sources = {};
      bookings.forEach(b => { sources[b.source] = (sources[b.source] || 0) + 1; });
      const topSource = Object.entries(sources).sort((a,b) => b[1]-a[1])[0];
  
      // Daily data for charts (last 7 days)
      const dailyData = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const dayBookings = bookings.filter(b => b.appointmentDate === dateStr).length;
        const dayPatients = patients.filter(p => {
          const pd = new Date(p.createdAt).toISOString().split('T')[0];
          return pd === dateStr;
        }).length;
        const dayRevenue = patients.filter(p => new Date(p.createdAt).toISOString().split('T')[0] === dateStr).reduce((s,p) => s+p.netProfit, 0);
        dailyData.push({ date: dateStr, label: ['أح','إث','ثل','أر','خم','جم','سب'][d.getDay()], bookings: dayBookings, patients: dayPatients, revenue: dayRevenue });
      }
  
      // Doctor data for bar chart
      const doctorData = {};
      patients.forEach(p => {
        if (!doctorData[p.doctorName]) doctorData[p.doctorName] = { revenue: 0, count: 0, bookings: 0 };
        doctorData[p.doctorName].revenue += p.netProfit;
        doctorData[p.doctorName].count++;
      });
      bookings.forEach(b => {
        if (!doctorData[b.doctorName]) doctorData[b.doctorName] = { revenue: 0, count: 0, bookings: 0 };
        doctorData[b.doctorName].bookings++;
      });
  
      // Service distribution
      const serviceData = {};
      patients.forEach(p => { serviceData[p.serviceType] = (serviceData[p.serviceType] || 0) + 1; });
  
      // Gender distribution
      const genderData = { male: 0, female: 0 };
      patients.forEach(p => { if (p.gender === 'male') genderData.male++; else genderData.female++; });
  
      return {
        totalBookings, completedBookings, noShowBookings, canceledBookings, scheduledBookings,
        totalPatients, walkInPatients, convertedPatients,
        totalRevenue, totalExpenses, totalNetProfit, avgProfit,
        attendanceRate, noShowRate, conversionRate,
        topDoctor: topDoctor ? { name: topDoctor[0], profit: topDoctor[1] } : null,
        topSource: topSource ? { name: topSource[0], count: topSource[1] } : null,
        dailyData, doctorData, serviceData, genderData, sources
      };
    }
  
    // ---------- FILTERS ----------
    function applyBookingFilters(bookings, f) {
      if (!f) return bookings;
      return bookings.filter(b => {
        if (f.doctor && b.doctorName !== f.doctor) return false;
        if (f.source && b.source !== f.source) return false;
        if (f.status && b.status !== f.status) return false;
        if (f.dateFrom && b.appointmentDate < f.dateFrom) return false;
        if (f.dateTo && b.appointmentDate > f.dateTo) return false;
        if (f.period) {
          const now = new Date(); const d = new Date(b.appointmentDate);
          if (f.period === 'today' && b.appointmentDate !== today()) return false;
          if (f.period === 'week') { const w = new Date(); w.setDate(w.getDate()-7); if (d < w) return false; }
          if (f.period === 'month') { const m = new Date(); m.setMonth(m.getMonth()-1); if (d < m) return false; }
        }
        return true;
      });
    }
  
    function applyPatientFilters(patients, f) {
      if (!f) return patients;
      return patients.filter(p => {
        if (f.doctor && p.doctorName !== f.doctor) return false;
        if (f.service && p.serviceType !== f.service) return false;
        if (f.gender && p.gender !== f.gender) return false;
        if (f.period) {
          const d = new Date(p.createdAt);
          if (f.period === 'today' && new Date(p.createdAt).toISOString().split('T')[0] !== today()) return false;
          if (f.period === 'week') { const w = new Date(); w.setDate(w.getDate()-7); if (d < w) return false; }
          if (f.period === 'month') { const m = new Date(); m.setMonth(m.getMonth()-1); if (d < m) return false; }
        }
        return true;
      });
    }
  
    return {
      init, getSettings, saveSettings,
      getBookings, addBooking, updateBooking, deleteBooking,
      getPatients, addPatient, updatePatient, deletePatient,
      convertBookingToPatient, getStats,
      applyBookingFilters, applyPatientFilters,
      today, yesterday, tomorrow
    };
  })();