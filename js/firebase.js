// ============================================================
// ClinicFlow Pro — Firebase Integration
// ============================================================

const Firebase = (function() {
    let firebaseApp = null;
    let db = null;
    let auth = null;
    let isConnected = false;
  
    // ===== INIT FIREBASE =====
    function initFirebase(config) {
      try {
        // Import Firebase scripts dynamically
        if (typeof firebase === 'undefined') {
          console.error('Firebase SDK not loaded. Please include Firebase scripts.');
          return false;
        }
  
        firebaseApp = firebase.initializeApp(config);
        db = firebase.firestore();
        auth = firebase.auth();
        isConnected = true;
  
        // Update settings
        const settings = Store.getSettings();
        settings.firebaseConnected = true;
        settings.firebaseConfig = config;
        Store.saveSettings(settings);
  
        UI.toast('تم الاتصال بـ Firebase بنجاح ✅', 'success');
        return true;
      } catch (error) {
        console.error('Firebase initialization error:', error);
        UI.toast('فشل الاتصال بـ Firebase: ' + error.message, 'error');
        return false;
      }
    }
  
    // ===== CHECK CONNECTION =====
    function isFirebaseConnected() {
      return isConnected && firebaseApp !== null;
    }
  
    // ===== SYNC BOOKINGS TO FIREBASE =====
    async function syncBookings() {
      if (!isFirebaseConnected()) {
        UI.toast('Firebase غير متصل', 'warning');
        return false;
      }
  
      try {
        const bookings = Store.getBookings();
        const batch = db.batch();
  
        bookings.forEach(booking => {
          const docRef = db.collection('bookings').doc(booking.id);
          batch.set(docRef, booking, { merge: true });
        });
  
        await batch.commit();
        UI.toast('تم مزامنة الحجوزات ✅', 'success');
        return true;
      } catch (error) {
        console.error('Sync bookings error:', error);
        UI.toast('فشلت المزامنة: ' + error.message, 'error');
        return false;
      }
    }
  
    // ===== SYNC PATIENTS TO FIREBASE =====
    async function syncPatients() {
      if (!isFirebaseConnected()) {
        UI.toast('Firebase غير متصل', 'warning');
        return false;
      }
  
      try {
        const patients = Store.getPatients();
        const batch = db.batch();
  
        patients.forEach(patient => {
          const docRef = db.collection('patients').doc(patient.id);
          batch.set(docRef, patient, { merge: true });
        });
  
        await batch.commit();
        UI.toast('تم مزامنة المرضى ✅', 'success');
        return true;
      } catch (error) {
        console.error('Sync patients error:', error);
        UI.toast('فشلت المزامنة: ' + error.message, 'error');
        return false;
      }
    }
  
    // ===== LOAD FROM FIREBASE =====
    async function loadFromFirebase() {
      if (!isFirebaseConnected()) {
        UI.toast('Firebase غير متصل', 'warning');
        return false;
      }
  
      try {
        // Load bookings
        const bookingsSnapshot = await db.collection('bookings').get();
        const bookings = bookingsSnapshot.docs.map(doc => doc.data());
        localStorage.setItem('cfp_bookings', JSON.stringify(bookings));
  
        // Load patients
        const patientsSnapshot = await db.collection('patients').get();
        const patients = patientsSnapshot.docs.map(doc => doc.data());
        localStorage.setItem('cfp_patients', JSON.stringify(patients));
  
        // Load settings
        const settingsDoc = await db.collection('settings').doc('main').get();
        if (settingsDoc.exists) {
          const settings = settingsDoc.data();
          localStorage.setItem('cfp_settings', JSON.stringify(settings));
        }
  
        UI.toast('تم تحميل البيانات من Firebase ✅', 'success');
        return true;
      } catch (error) {
        console.error('Load from Firebase error:', error);
        UI.toast('فشل التحميل: ' + error.message, 'error');
        return false;
      }
    }
  
    // ===== DISCONNECT =====
    function disconnect() {
      if (firebaseApp) {
        firebaseApp.delete();
        firebaseApp = null;
        db = null;
        auth = null;
        isConnected = false;
  
        const settings = Store.getSettings();
        settings.firebaseConnected = false;
        delete settings.firebaseConfig;
        Store.saveSettings(settings);
  
        UI.toast('تم قطع الاتصال بـ Firebase', 'info');
      }
    }
  
    // ===== AUTO SYNC (Real-time listeners) =====
    function enableAutoSync() {
      if (!isFirebaseConnected()) return;
  
      // Listen to bookings changes
      db.collection('bookings').onSnapshot(snapshot => {
        snapshot.docChanges().forEach(change => {
          const booking = change.doc.data();
          if (change.type === 'added' || change.type === 'modified') {
            // Update local storage
            const bookings = Store.getBookings();
            const index = bookings.findIndex(b => b.id === booking.id);
            if (index >= 0) {
              bookings[index] = booking;
            } else {
              bookings.unshift(booking);
            }
            localStorage.setItem('cfp_bookings', JSON.stringify(bookings));
          } else if (change.type === 'removed') {
            const bookings = Store.getBookings().filter(b => b.id !== booking.id);
            localStorage.setItem('cfp_bookings', JSON.stringify(bookings));
          }
        });
        // Refresh current page
        if (typeof App !== 'undefined') App.refreshAll();
      });
  
      // Listen to patients changes
      db.collection('patients').onSnapshot(snapshot => {
        snapshot.docChanges().forEach(change => {
          const patient = change.doc.data();
          if (change.type === 'added' || change.type === 'modified') {
            const patients = Store.getPatients();
            const index = patients.findIndex(p => p.id === patient.id);
            if (index >= 0) {
              patients[index] = patient;
            } else {
              patients.unshift(patient);
            }
            localStorage.setItem('cfp_patients', JSON.stringify(patients));
          } else if (change.type === 'removed') {
            const patients = Store.getPatients().filter(p => p.id !== patient.id);
            localStorage.setItem('cfp_patients', JSON.stringify(patients));
          }
        });
        if (typeof App !== 'undefined') App.refreshAll();
      });
  
      UI.toast('تم تفعيل المزامنة التلقائية ✅', 'success');
    }
  
    return {
      initFirebase,
      isFirebaseConnected,
      syncBookings,
      syncPatients,
      loadFromFirebase,
      disconnect,
      enableAutoSync
    };
  })();