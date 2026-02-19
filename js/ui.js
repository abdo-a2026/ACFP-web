// ============================================================
// ClinicFlow Pro — UI Utilities
// ============================================================

const UI = (function() {
  // ===== TOAST =====
  function toast(msg, type = 'info', duration = 3500) {
    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    const container = document.getElementById('toast-container');
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `<span class="toast-icon">${icons[type]}</span><span class="toast-msg">${msg}</span>`;
    container.appendChild(el);
    setTimeout(() => { el.classList.add('fadeout'); setTimeout(() => el.remove(), 300); }, duration);
  }

  // ===== MODAL =====
  function openModal(id) {
    const m = document.getElementById(id);
    if (m) { m.classList.add('active'); document.body.style.overflow = 'hidden'; }
  }

  function closeModal(id) {
    const m = document.getElementById(id);
    if (m) { m.classList.remove('active'); document.body.style.overflow = ''; }
  }

  function closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
    document.body.style.overflow = '';
  }

  // ===== FORMAT =====
  function currency(n) { 
    const formatted = (n || 0).toLocaleString('ar-IQ', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
    return formatted + ' د.ع';
  }
  function percent(n) { return (n || 0) + '%'; }

  function formatDate(d) {
    if (!d) return '—';
    try {
      const date = new Date(d);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${year}/${month}/${day}`;
    } catch { return d; }
  }

  function formatDateTime(timestamp) {
    if (!timestamp) return '—';
    try {
      const date = new Date(timestamp);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}/${month}/${day} ${hours}:${minutes}`;
    } catch { return '—'; }
  }

  function formatTime(t) {
    if (!t) return '—';
    try {
      const [h, m] = t.split(':');
      const hour = parseInt(h);
      return `${hour > 12 ? hour - 12 : hour}:${m} ${hour >= 12 ? 'م' : 'ص'}`;
    } catch { return t; }
  }

  function calcAge(birthDate) {
    if (!birthDate) return '—';
    const diff = Date.now() - new Date(birthDate).getTime();
    return Math.floor(diff / 31536000000) + ' سنة';
  }

  function statusBadge(status) {
    const map = {
      scheduled: ['status-scheduled', 'مجدول', '📅'],
      completed: ['status-completed', 'مكتمل', '✅'],
      canceled: ['status-canceled', 'ملغي', '❌'],
      'no-show': ['status-noshow', 'لم يحضر', '⚠️'],
      'walk-in': ['status-walkin', 'بدون حجز', '🚶'],
      converted: ['status-converted', 'محوّل من حجز', '🔗']
    };
    const [cls, label, icon] = map[status] || ['badge-gray', status, '•'];
    return `<span class="status-badge ${cls}">${icon} ${label}</span>`;
  }

  function sourceBadge(source) {
    const map = {
      phone: ['badge-blue', '📞 هاتف'],
      whatsapp: ['badge-green', '💬 واتساب'],
      'walk-in': ['badge-violet', '🚶 مباشر'],
      online: ['badge-amber', '🌐 إنترنت']
    };
    const [cls, label] = map[source] || ['badge-gray', source];
    return `<span class="badge ${cls}">${label}</span>`;
  }

  function genderBadge(g) {
    return g === 'male'
      ? '<span class="badge badge-blue">👨 ذكر</span>'
      : '<span class="badge badge-violet">👩 أنثى</span>';
  }

  // ===== CONFIRM DIALOG =====
  function confirm(msg, onYes) {
    const overlay = document.getElementById('confirm-overlay');
    document.getElementById('confirm-msg').textContent = msg;
    overlay.classList.add('active');
    document.getElementById('confirm-yes').onclick = () => {
      overlay.classList.remove('active');
      onYes();
    };
    document.getElementById('confirm-no').onclick = () => overlay.classList.remove('active');
  }

  // ===== CANVAS CHART HELPERS =====
  function drawLineChart(canvasId, data, labels, colors) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width = canvas.offsetWidth;
    const H = canvas.height = canvas.offsetHeight || 180;
    ctx.clearRect(0, 0, W, H);

    const pad = { top: 20, right: 20, bottom: 30, left: 50 };
    const cW = W - pad.left - pad.right;
    const cH = H - pad.top - pad.bottom;

    const allVals = data.flat();
    const maxVal = Math.max(...allVals, 1);

    // Grid
    ctx.strokeStyle = 'rgba(99,179,237,0.08)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = pad.top + (cH / 4) * i;
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(W - pad.right, y); ctx.stroke();
      ctx.fillStyle = 'rgba(148,163,184,0.6)';
      ctx.font = '11px IBM Plex Sans Arabic';
      ctx.textAlign = 'right';
      ctx.fillText(Math.round(maxVal - (maxVal / 4) * i), pad.left - 6, y + 4);
    }

    // X labels
    ctx.fillStyle = 'rgba(148,163,184,0.8)';
    ctx.textAlign = 'center';
    labels.forEach((lbl, i) => {
      const x = pad.left + (cW / (labels.length - 1)) * i;
      ctx.fillText(lbl, x, H - 6);
    });

    // Lines
    data.forEach((series, si) => {
      const color = colors[si];
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';

      // Gradient fill
      const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + cH);
      grad.addColorStop(0, color.replace(')', ',0.2)').replace('rgb', 'rgba'));
      grad.addColorStop(1, 'rgba(0,0,0,0)');

      ctx.beginPath();
      series.forEach((val, i) => {
        const x = pad.left + (cW / (series.length - 1)) * i;
        const y = pad.top + cH - (val / maxVal) * cH;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      const linePath = new Path2D(ctx.currentPath);
      ctx.stroke();

      // Fill
      ctx.beginPath();
      series.forEach((val, i) => {
        const x = pad.left + (cW / (series.length - 1)) * i;
        const y = pad.top + cH - (val / maxVal) * cH;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.lineTo(pad.left + cW, pad.top + cH);
      ctx.lineTo(pad.left, pad.top + cH);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      // Dots
      ctx.fillStyle = color;
      series.forEach((val, i) => {
        const x = pad.left + (cW / (series.length - 1)) * i;
        const y = pad.top + cH - (val / maxVal) * cH;
        ctx.beginPath();
        ctx.arc(x, y, 3.5, 0, Math.PI * 2);
        ctx.fill();
      });
    });
  }

  function drawBarChart(canvasId, labels, values, colors) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width = canvas.offsetWidth;
    const H = canvas.height = canvas.offsetHeight || 180;
    ctx.clearRect(0, 0, W, H);

    const pad = { top: 20, right: 20, bottom: 50, left: 60 };
    const cW = W - pad.left - pad.right;
    const cH = H - pad.top - pad.bottom;
    const maxVal = Math.max(...values, 1);
    const barW = Math.max(20, (cW / labels.length) * 0.55);
    const gap = cW / labels.length;

    // Grid
    ctx.strokeStyle = 'rgba(99,179,237,0.08)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = pad.top + (cH / 4) * i;
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(W - pad.right, y); ctx.stroke();
      ctx.fillStyle = 'rgba(148,163,184,0.7)';
      ctx.font = '10px IBM Plex Sans Arabic';
      ctx.textAlign = 'right';
      ctx.fillText(Math.round(maxVal - (maxVal / 4) * i), pad.left - 6, y + 4);
    }

    labels.forEach((lbl, i) => {
      const x = pad.left + gap * i + gap / 2;
      const h = (values[i] / maxVal) * cH;
      const y = pad.top + cH - h;
      const color = colors[i % colors.length];

      const grad = ctx.createLinearGradient(0, y, 0, y + h);
      grad.addColorStop(0, color);
      grad.addColorStop(1, color.replace(')', ',0.6)').replace('rgb', 'rgba'));

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(x - barW / 2, y, barW, h, [4, 4, 0, 0]);
      ctx.fill();

      // Value on top
      ctx.fillStyle = 'rgba(232,240,254,0.8)';
      ctx.font = '10px IBM Plex Sans Arabic';
      ctx.textAlign = 'center';
      ctx.fillText(values[i].toLocaleString(), x, y - 6);

      // Label
      ctx.fillStyle = 'rgba(148,163,184,0.8)';
      ctx.font = '10px IBM Plex Sans Arabic';
      const shortLabel = lbl.length > 10 ? lbl.slice(0, 10) + '…' : lbl;
      ctx.save();
      ctx.translate(x, H - 8);
      ctx.rotate(-0.4);
      ctx.fillText(shortLabel, 0, 0);
      ctx.restore();
    });
  }

  function drawDonutChart(canvasId, segments, colors) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const size = Math.min(canvas.offsetWidth, canvas.offsetHeight, 160);
    canvas.width = canvas.height = size;
    const cx = size / 2, cy = size / 2;
    const r = size * 0.42, inner = size * 0.26;
    const total = segments.reduce((s, seg) => s + seg.value, 0);
    if (!total) return;

    let angle = -Math.PI / 2;
    segments.forEach((seg, i) => {
      const slice = (seg.value / total) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, angle, angle + slice);
      ctx.closePath();
      ctx.fillStyle = colors[i % colors.length];
      ctx.fill();
      angle += slice;
    });

    // Inner hole
    ctx.beginPath();
    ctx.arc(cx, cy, inner, 0, Math.PI * 2);
    ctx.fillStyle = '#131d35';
    ctx.fill();
  }

  // ===== POPULATE SELECT =====
  function populateSelect(selectId, items, placeholder) {
    const sel = document.getElementById(selectId);
    if (!sel) return;
    sel.innerHTML = `<option value="">${placeholder || 'اختر...'}</option>`;
    items.forEach(item => {
      const opt = document.createElement('option');
      opt.value = item; opt.textContent = item;
      sel.appendChild(opt);
    });
  }

  // ===== SET VALUE =====
  function setVal(id, val) { const el = document.getElementById(id); if (el) el.value = val || ''; }
  function getVal(id) { const el = document.getElementById(id); return el ? el.value.trim() : ''; }
  function setText(id, txt) { const el = document.getElementById(id); if (el) el.textContent = txt; }
  function setHTML(id, html) { const el = document.getElementById(id); if (el) el.innerHTML = html; }

  // ===== COUNTER ANIMATION =====
  function animateCounter(el, target, duration = 800) {
    if (!el) return;
    const start = parseFloat(el.textContent.replace(/[^0-9.-]/g, '')) || 0;
    const step = (target - start) / (duration / 16);
    let current = start;
    const timer = setInterval(() => {
      current += step;
      if ((step > 0 && current >= target) || (step < 0 && current <= target)) {
        current = target;
        clearInterval(timer);
      }
      el.textContent = Math.round(current).toLocaleString('ar-SA');
    }, 16);
  }

  return {
    toast, openModal, closeModal, closeAllModals, confirm,
    currency, percent, formatDate, formatDateTime, formatTime, calcAge,
    statusBadge, sourceBadge, genderBadge,
    drawLineChart, drawBarChart, drawDonutChart,
    populateSelect, setVal, getVal, setText, setHTML,
    animateCounter
  };
})();