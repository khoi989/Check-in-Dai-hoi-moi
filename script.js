// ===== CONFIG — PASTE your Apps Script Web App URL (must end with /exec)
const CONFIG = {
  WEB_APP_URL: 'https://script.google.com/macros/s/AKfycbw2VlUtETAnMnkc9coyV6YtjAjlFGib6z5dv4XsgChhbQLn59i0YfVzwYyfYkkY8ic/exec'
};

// ---------- helpers ----------
const $ = (id) => document.getElementById(id);

function htmlEscape(s) {
  const str = s == null ? '' : String(s);
  return str.replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function showMessage(kind, seat = '') {
  const el = $('result');
  let html = "";

  if (kind === 'ok') {
    html = `<div class="ok">
      <div><strong>Check-In thành công!</strong></div>
      <div><strong>Số ghế của bạn: ${htmlEscape(seat)}</strong></div>
      <div class="muted"><em>Cảm ơn bạn đã tham dự chương trình ĐẠI HỘI X 2025. 
      Xin vui lòng di chuyển lên hội trường và ngồi đúng số ghế đã chỉ định.</em></div>
    </div>`;
  } else if (kind === 'err') {
    html = `<div class="err">
      <div><strong>Check-In không thành công!</strong></div>
      <div class="muted"><em>Xin vui lòng kiểm tra lại các thông tin hoặc di chuyển tới khu vực lễ tân để được hỗ trợ.</em></div>
    </div>`;
  } else {
    html = `<div class="warn">
      <div><strong>Vui lòng điền đầy đủ thông tin</strong></div>
    </div>`;
  }

  el.innerHTML = html;
}

// JSONP helper (with timeout)
function jsonp(url, params = {}, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    const cbName = `jsonp_cb_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
    const script = document.createElement('script');
    const cleanup = () => {
      try { delete window[cbName]; } catch(_) {}
      if (script.parentNode) script.parentNode.removeChild(script);
    };
    window[cbName] = (data) => { cleanup(); resolve(data); };

    const qs = new URLSearchParams({ ...params, callback: cbName }).toString();
    const fullSrc = `${url}?${qs}`;
    script.src = fullSrc;
    script.async = true;
    script.onerror = () => {
      cleanup();
      reject(new Error('JSONP network error'));
    };
    document.head.appendChild(script);

    setTimeout(() => {
      if (window[cbName]) {
        cleanup();
        reject(new Error('JSONP timeout'));
      }
    }, timeoutMs);
  });
}

// ---------- main ----------
document.addEventListener('DOMContentLoaded', () => {
  const form = $('seat-form');
  const submitBtn = $('submitBtn');

  if (!/^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/.test(CONFIG.WEB_APP_URL)) {
    showMessage('err');
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = $('name').value.trim();
    const studentID = $('studentID').value.trim();
    const lop = $('lop').value.trim();

    if (!name || !studentID || !lop) {
      showMessage('warn');
      return;
    }

    const cleanName = name.replace(/\s+/g, ' ');
    const cleanLop  = lop.replace(/\s+/g, ' ');

    submitBtn.disabled = true;
    submitBtn.textContent = 'Đang kiểm tra…';

    try {
      const res = await jsonp(CONFIG.WEB_APP_URL, { name: cleanName, studentID, lop: cleanLop });

      if (res && res.ok) {
        showMessage('ok', res.seat || '');
      } else {
        showMessage('err');
      }
    } catch (err) {
      showMessage('err');
      console.error(err);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Check in';
    }
  });
});
