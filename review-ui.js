/* ============================================================================
   review-ui.js — Approve / Reject review system for optimization bundles.

   Replaces the old "comment + export JSON" flow (bundle-ui.js). Each section
   gets an Approve / Reject bar at the bottom; Reject requires a reason. The
   floating button (bottom-right) lists every rejected section and its reason.

   Persistence:
     - If window.REVIEW_CONFIG.firebase is a real Firebase web config object,
       decisions are saved to Cloud Firestore (collection "reviews", live via
       onSnapshot) so they persist across devices with no JSON download.
     - Otherwise decisions persist to this browser via localStorage, so the
       UX is fully testable before Firebase is wired up.

   Page setup (in the bundle HTML, replacing the old FAB markup + bundle-ui.js):
     <script>
       window.REVIEW_CONFIG = {
         pageId: 'creative-presentation-ideas-college',
         firebase: null   // paste your Firebase web config here to go live
       };
     </script>
     <script src="../review-ui.js"></script>
   ========================================================================== */
(function (global) {
  'use strict';

  var CFG = global.REVIEW_CONFIG || {};
  var PAGE_ID = CFG.pageId ||
    (location.pathname.replace(/\/+$/, '').split('/').pop() || 'page');
  var FB = (CFG.firebase && CFG.firebase.projectId) ? CFG.firebase : null;
  var FB_SDK = 'https://www.gstatic.com/firebasejs/10.12.0/';

  var bars = {};   // blockId -> { wrap, chip, reasonView, approveBtn, rejectBtn }
  var order = [];  // blockId order for the panel
  var state = {};  // blockId -> { status, reason, label } — source of truth for render
  var statusEl = null; // status line in the panel (shows backend + any error)

  /* ---- small helpers ----------------------------------------------------- */
  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function onReady(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else { fn(); }
  }
  function loadScript(src, cb) {
    var s = document.createElement('script');
    s.src = src; s.onload = cb;
    s.onerror = function () { console.warn('[review-ui] failed to load ' + src); cb(); };
    document.head.appendChild(s);
  }

  /* ---- styles (injected; uses Daydream tokens when present) --------------- */
  var CSS = [
    '.comment-btn{display:none !important;}',
    '.review-bar{display:flex;align-items:center;gap:10px;flex-wrap:wrap;',
    '  margin-top:14px;padding:12px 14px;border-radius:12px;background:#fafafa;',
    "  border:1px solid #ececec;font-family:'Raleway',sans-serif;}",
    '.review-bar .rv-status{font-size:11px;font-weight:800;letter-spacing:.04em;',
    '  text-transform:uppercase;padding:4px 11px;border-radius:999px;',
    '  background:#eee;color:#666;border:1px solid #ddd;white-space:nowrap;}',
    '.review-bar.is-approved{background:#eefcf2;border-color:#bfe9cd;}',
    '.review-bar.is-approved .rv-status{background:#d6f5e1;color:#1a7a45;border-color:#8edda0;}',
    '.review-bar.is-rejected{background:#fdeeee;border-color:#f3c9c9;}',
    '.review-bar.is-rejected .rv-status{background:#f9d9d9;color:#a52727;border-color:#eaa9a9;}',
    '.review-bar .rv-spacer{flex:1 1 auto;}',
    '.rv-btn{font-size:12px;font-weight:700;padding:7px 14px;border-radius:8px;cursor:pointer;',
    "  border:1px solid transparent;font-family:'Raleway',sans-serif;transition:all .12s;}",
    '.rv-approve{background:#fff;color:#1a7a45;border-color:#8edda0;}',
    '.rv-approve:hover{background:#eefcf2;}',
    '.rv-approve.active{background:#1a7a45;color:#fff;border-color:#1a7a45;}',
    '.rv-reject{background:#fff;color:#a52727;border-color:#eaa9a9;}',
    '.rv-reject:hover{background:#fdeeee;}',
    '.rv-reject.active{background:#a52727;color:#fff;border-color:#a52727;}',
    '.rv-reason{flex-basis:100%;margin-top:4px;display:none;}',
    '.rv-reason.open{display:block;}',
    '.rv-reason textarea{width:100%;min-height:62px;border:1px solid #eaa9a9;border-radius:8px;',
    "  padding:9px 11px;font-size:13px;font-family:'Raleway',sans-serif;resize:vertical;color:#222;}",
    '.rv-reason textarea:focus{outline:none;border-color:#a52727;}',
    '.rv-reason-row{display:flex;align-items:center;gap:10px;margin-top:8px;}',
    '.rv-reason-save{background:#a52727;color:#fff;border-color:#a52727;}',
    '.rv-reason-save:hover{background:#8a1f1f;}',
    '.rv-reason-err{font-size:12px;color:#a52727;font-weight:600;display:none;}',
    '.rv-reason-err.show{display:inline;}',
    '.review-bar .rv-reason-shown{flex-basis:100%;font-size:12.5px;color:#7a2c2c;',
    '  margin-top:6px;line-height:1.5;}',
    '.review-bar .rv-reason-shown b{font-weight:800;}',
    /* floating button + panel */
    '.rv-fab{position:fixed;right:22px;bottom:22px;z-index:9000;',
    "  font-family:'Raleway',sans-serif;font-size:13px;font-weight:700;cursor:pointer;",
    '  padding:12px 18px;border-radius:999px;border:none;color:#fff;background:#1a1a1a;',
    '  box-shadow:0 8px 28px rgba(0,0,0,.22);display:flex;align-items:center;gap:9px;}',
    '.rv-fab .rv-fab-count{background:#a52727;color:#fff;font-size:11px;font-weight:800;',
    '  min-width:20px;height:20px;border-radius:999px;display:inline-flex;align-items:center;',
    '  justify-content:center;padding:0 6px;}',
    '.rv-fab .rv-fab-count.zero{background:#3a8f57;}',
    '.rv-panel{position:fixed;right:22px;bottom:74px;z-index:9000;width:min(380px,calc(100vw - 44px));',
    '  max-height:min(70vh,560px);background:#fff;border:1px solid #e4e4e4;border-radius:16px;',
    '  box-shadow:0 18px 50px rgba(0,0,0,.22);display:none;flex-direction:column;overflow:hidden;',
    "  font-family:'Raleway',sans-serif;}",
    '.rv-panel.open{display:flex;}',
    '.rv-panel-head{padding:15px 18px;border-bottom:1px solid #eee;display:flex;align-items:center;',
    '  justify-content:space-between;}',
    '.rv-panel-head strong{font-size:14px;}',
    '.rv-panel-sum{font-size:11px;color:#888;font-weight:600;margin-top:2px;}',
    '.rv-panel-close{background:none;border:none;font-size:20px;line-height:1;cursor:pointer;color:#999;}',
    '.rv-panel-body{padding:8px;overflow-y:auto;}',
    '.rv-empty{padding:26px 18px;text-align:center;color:#999;font-size:13px;}',
    '.rv-item{padding:12px 13px;border-radius:11px;cursor:pointer;border:1px solid transparent;}',
    '.rv-item:hover{background:#fdeeee;border-color:#f3c9c9;}',
    '.rv-item-label{font-size:12.5px;font-weight:700;color:#a52727;margin-bottom:4px;}',
    '.rv-item-reason{font-size:12.5px;color:#444;line-height:1.5;}',
    '.rv-mode{font-size:10px;color:#aaa;text-align:center;padding:6px 0 10px;font-weight:600;letter-spacing:.03em;}',
    '.rv-clear{background:none;border:none;color:#888;font-size:11px;font-weight:700;cursor:pointer;',
    "  text-decoration:underline;padding:4px 6px;font-family:'Raleway',sans-serif;}",
    '.rv-clear:hover{color:#333;}',
    /* guided tour */
    '.rv-tour-btn{position:fixed;left:22px;bottom:22px;z-index:9000;cursor:pointer;',
    "  font-family:'Raleway',sans-serif;font-size:12.5px;font-weight:700;padding:10px 16px;",
    '  border-radius:999px;border:1px solid #e0dceb;background:#fff;color:#5b3aa6;',
    '  box-shadow:0 6px 20px rgba(40,30,60,.12);}',
    '.rv-tour-btn:hover{background:#f6f2ff;}',
    '.rv-tour-overlay{position:fixed;inset:0;background:rgba(20,16,30,.55);z-index:9500;',
    '  display:none;align-items:center;justify-content:center;padding:20px;}',
    '.rv-tour-overlay.open{display:flex;}',
    ".rv-tour-card{background:#fff;border-radius:18px;max-width:450px;width:100%;padding:28px 28px 22px;",
    "  box-shadow:0 24px 70px rgba(0,0,0,.3);font-family:'Raleway',sans-serif;}",
    '.rv-tour-step{font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#7c3aed;margin-bottom:10px;}',
    '.rv-tour-card h3{font-size:21px;margin:0 0 11px;letter-spacing:-.01em;color:#1a1a1a;}',
    '.rv-tour-card p{font-size:14px;line-height:1.62;color:#444;margin:0 0 20px;}',
    '.rv-tour-card p b{color:#1a1a1a;}',
    '.rv-tour-actions{display:flex;align-items:center;justify-content:space-between;gap:10px;}',
    '.rv-tour-dots{display:flex;gap:6px;}',
    '.rv-tour-dots i{width:7px;height:7px;border-radius:999px;background:#ddd;display:block;}',
    '.rv-tour-dots i.on{background:#7c3aed;}',
    '.rv-tour-right{display:flex;align-items:center;gap:14px;}',
    '.rv-tour-skip{background:none;border:none;color:#999;font-size:12.5px;font-weight:600;cursor:pointer;}',
    '.rv-tour-skip:hover{color:#555;}',
    ".rv-tour-next{background:#1a1a1a;color:#fff;border:none;border-radius:9px;padding:9px 20px;",
    "  font-size:13px;font-weight:700;cursor:pointer;font-family:'Raleway',sans-serif;}",
    '.rv-tour-next:hover{background:#000;}'
  ].join('');

  function injectStyle() {
    var s = el('style'); s.textContent = CSS; document.head.appendChild(s);
  }

  /* ---- storage backends -------------------------------------------------- */
  function firebaseStore() {
    var app = global.firebase.apps && global.firebase.apps.length
      ? global.firebase.app() : global.firebase.initializeApp(FB);
    var db = global.firebase.firestore();
    var col = db.collection('reviews');
    return {
      mode: 'Firebase (Firestore)',
      save: function (blockId, rec) {
        return col.doc(PAGE_ID + '__' + blockId).set({
          page: PAGE_ID, blockId: blockId,
          status: rec.status, reason: rec.reason || '', label: rec.label || '',
          updatedAt: global.firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
      },
      remove: function (blockId) {
        return col.doc(PAGE_ID + '__' + blockId).delete();
      },
      subscribe: function (cb) {
        col.where('page', '==', PAGE_ID).onSnapshot(function (snap) {
          var m = {};
          snap.forEach(function (d) {
            var x = d.data();
            m[x.blockId] = { status: x.status, reason: x.reason, label: x.label };
          });
          cb(m);
        }, function (err) {
          showStatus('Not connected: ' + friendlyErr(err));
        });
      }
    };
  }
  function localStore() {
    var KEY = 'review_' + PAGE_ID, listeners = [];
    function read() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
    function emit() { var m = read(); listeners.forEach(function (cb) { cb(m); }); }
    return {
      mode: 'Local (this browser only)',
      save: function (blockId, rec) {
        var m = read();
        m[blockId] = { status: rec.status, reason: rec.reason || '', label: rec.label || '' };
        localStorage.setItem(KEY, JSON.stringify(m)); emit();
        return Promise.resolve();
      },
      remove: function (blockId) {
        var m = read(); delete m[blockId];
        localStorage.setItem(KEY, JSON.stringify(m)); emit();
        return Promise.resolve();
      },
      subscribe: function (cb) { listeners.push(cb); cb(read()); }
    };
  }

  /* ---- collect reviewable sections --------------------------------------- */
  function labelFor(node, fallback) {
    var l = node.querySelector('.block-label');
    if (l) return l.textContent.replace(/\s+/g, ' ').replace(/^\+?\s*/, '').trim();
    return fallback;
  }
  function collectTargets() {
    var out = [];
    document.querySelectorAll('#tab1 .change-block[id]').forEach(function (node) {
      var blockId = node.id.replace(/^block-/, '');
      out.push({ blockId: blockId, host: node, append: true, label: labelFor(node, blockId) });
    });
    var schema = document.querySelector('#tab1 .schema-wrap');
    if (schema) {
      var lab = 'Structured Data';
      var sl = schema.previousElementSibling;
      if (sl && sl.classList.contains('section-label')) lab = sl.textContent.trim();
      out.push({ blockId: 'structured-data', host: schema, append: false, label: lab });
    }
    return out;
  }

  /* ---- build one review bar ---------------------------------------------- */
  function buildBar(t) {
    var store = global.__reviewStore;
    var wrap = el('div', 'review-bar');
    wrap.setAttribute('data-block', t.blockId);

    var chip = el('span', 'rv-status', 'Pending');
    var spacer = el('div', 'rv-spacer');
    var clear = el('button', 'rv-clear', 'Clear');
    clear.style.display = 'none';
    var approve = el('button', 'rv-btn rv-approve', 'Approve');
    var reject = el('button', 'rv-btn rv-reject', 'Reject');

    var reason = el('div', 'rv-reason');
    var ta = el('textarea');
    ta.placeholder = 'Reason for rejection (required)…';
    var row = el('div', 'rv-reason-row');
    var saveBtn = el('button', 'rv-btn rv-reason-save', 'Save rejection');
    var err = el('span', 'rv-reason-err', 'A reason is required to reject.');
    row.appendChild(saveBtn); row.appendChild(err);
    reason.appendChild(ta); reason.appendChild(row);

    var reasonShown = el('div', 'rv-reason-shown');
    reasonShown.style.display = 'none';

    approve.addEventListener('click', function () {
      reason.classList.remove('open');
      applyDecision(t.blockId, { status: 'approved', reason: '', label: t.label });
    });
    reject.addEventListener('click', function () {
      reason.classList.add('open');
      ta.focus();
    });
    saveBtn.addEventListener('click', function () {
      var v = ta.value.trim();
      if (!v) { err.classList.add('show'); return; }
      err.classList.remove('show');
      reason.classList.remove('open');
      applyDecision(t.blockId, { status: 'rejected', reason: v, label: t.label });
    });
    clear.addEventListener('click', function () {
      reason.classList.remove('open');
      err.classList.remove('show');
      clearDecision(t.blockId);
    });

    wrap.appendChild(chip);
    wrap.appendChild(spacer);
    wrap.appendChild(clear);
    wrap.appendChild(approve);
    wrap.appendChild(reject);
    wrap.appendChild(reason);
    wrap.appendChild(reasonShown);

    if (t.append) t.host.appendChild(wrap);
    else t.host.insertAdjacentElement('afterend', wrap);

    bars[t.blockId] = {
      wrap: wrap, chip: chip, approve: approve, reject: reject, clear: clear,
      ta: ta, reasonShown: reasonShown, label: t.label
    };
    order.push(t.blockId);
  }

  /* ---- floating button + panel ------------------------------------------- */
  var fab, fabCount, panel, panelBody, panelSum;
  function buildFab() {
    fab = el('button', 'rv-fab');
    fabCount = el('span', 'rv-fab-count zero', '0');
    fab.appendChild(document.createTextNode('Rejected '));
    fab.appendChild(fabCount);

    panel = el('div', 'rv-panel');
    var head = el('div', 'rv-panel-head');
    var titleWrap = el('div');
    titleWrap.appendChild(el('strong', null, 'Rejected sections'));
    panelSum = el('div', 'rv-panel-sum', '');
    titleWrap.appendChild(panelSum);
    var close = el('button', 'rv-panel-close', '&times;');
    head.appendChild(titleWrap); head.appendChild(close);
    panelBody = el('div', 'rv-panel-body');
    statusEl = el('div', 'rv-mode', 'Saving to: ' + (global.__reviewStore.mode || ''));
    panel.appendChild(head); panel.appendChild(panelBody); panel.appendChild(statusEl);

    fab.addEventListener('click', function () { panel.classList.toggle('open'); });
    close.addEventListener('click', function () { panel.classList.remove('open'); });

    document.body.appendChild(fab);
    document.body.appendChild(panel);
  }

  /* ---- decisions + status ------------------------------------------------- */
  function applyDecision(blockId, rec) {
    // optimistic: reflect the choice immediately, then persist
    state[blockId] = { status: rec.status, reason: rec.reason || '', label: rec.label || '' };
    render();
    var p = global.__reviewStore.save(blockId, rec);
    if (p && p.catch) {
      p.catch(function (e) { showStatus('Not saved: ' + friendlyErr(e)); });
    }
  }
  function clearDecision(blockId) {
    delete state[blockId];
    var b = bars[blockId];
    if (b) { b.ta.value = ''; }
    render();
    var p = global.__reviewStore.remove(blockId);
    if (p && p.catch) { p.catch(function (e) { showStatus('Not cleared: ' + friendlyErr(e)); }); }
  }
  function mergeRemote(remote) {
    // snapshot is authoritative for this page, so replace state wholesale
    // (this is what lets a cleared/deleted decision disappear everywhere)
    state = {};
    Object.keys(remote || {}).forEach(function (k) { state[k] = remote[k]; });
    if (statusEl) { statusEl.style.color = ''; statusEl.textContent = 'Saving to: ' + (global.__reviewStore.mode || ''); }
  }
  function showStatus(msg) {
    console.warn('[review-ui] ' + msg);
    if (statusEl) { statusEl.style.color = '#a52727'; statusEl.textContent = msg; }
  }
  function friendlyErr(e) {
    var code = e && e.code ? e.code : '';
    var msg = e && e.message ? e.message : String(e);
    if (/permission-denied|insufficient permissions/i.test(code + ' ' + msg)) {
      return 'Firestore rules are blocking writes. Publish rules allowing the "reviews" collection.';
    }
    if (/not-found|database.*does not exist|NOT_FOUND/i.test(code + ' ' + msg)) {
      return 'No Firestore database found. Create one in Build > Firestore Database.';
    }
    return msg;
  }

  /* ---- render from state -------------------------------------------------- */
  function render() {
    var map = state;
    var approved = 0, rejected = 0, pending = 0;
    order.forEach(function (id) {
      var b = bars[id], st = map[id];
      var status = st && st.status;
      b.wrap.classList.remove('is-approved', 'is-rejected');
      b.approve.classList.remove('active');
      b.reject.classList.remove('active');
      if (status === 'approved') {
        approved++;
        b.wrap.classList.add('is-approved');
        b.chip.textContent = 'Approved';
        b.approve.classList.add('active');
        b.reasonShown.style.display = 'none';
        b.clear.style.display = '';
        b.ta.value = '';
      } else if (status === 'rejected') {
        rejected++;
        b.wrap.classList.add('is-rejected');
        b.chip.textContent = 'Rejected';
        b.reject.classList.add('active');
        b.reasonShown.style.display = 'block';
        b.reasonShown.innerHTML = '<b>Reason:</b> ' + escapeHtml(st.reason || '');
        b.clear.style.display = '';
        b.ta.value = st.reason || '';
      } else {
        pending++;
        b.chip.textContent = 'Pending';
        b.reasonShown.style.display = 'none';
        b.clear.style.display = 'none';
      }
    });

    fabCount.textContent = String(rejected);
    fabCount.classList.toggle('zero', rejected === 0);
    panelSum.textContent = approved + ' approved · ' + rejected + ' rejected · ' + pending + ' pending';

    panelBody.innerHTML = '';
    var rejects = order.filter(function (id) { return map[id] && map[id].status === 'rejected'; });
    if (!rejects.length) {
      panelBody.appendChild(el('div', 'rv-empty', 'No rejected sections yet.'));
      return;
    }
    rejects.forEach(function (id) {
      var st = map[id];
      var item = el('div', 'rv-item');
      item.appendChild(el('div', 'rv-item-label', escapeHtml(bars[id].label)));
      item.appendChild(el('div', 'rv-item-reason', escapeHtml(st.reason || '')));
      item.addEventListener('click', function () {
        switchToTab1();
        bars[id].wrap.scrollIntoView({ behavior: 'smooth', block: 'center' });
        panel.classList.remove('open');
      });
      panelBody.appendChild(item);
    });
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  function switchToTab1() {
    if (typeof global.switchTab === 'function') {
      var link = document.querySelector('.tab-link');
      global.switchTab('tab1', link);
    }
  }

  /* ---- keep the schema Copy button working (was in bundle-ui.js) --------- */
  global.copySchema = function () {
    var node = document.getElementById('schema-json-store');
    if (!node || !navigator.clipboard) return;
    navigator.clipboard.writeText(node.textContent).then(function () {
      var btn = document.querySelector('.schema-copy-btn');
      if (btn) { btn.textContent = 'Copied'; setTimeout(function () { btn.textContent = 'Copy'; }, 2000); }
    });
  };
  /* neutralize legacy comment hook if any markup still calls it */
  global.toggleComment = global.toggleComment || function () {};

  /* ---- guided tour (approve / reject model) ------------------------------ */
  var WT_KEY = 'review_tour_' + PAGE_ID + '_v2';
  function goTab(id) {
    var links = document.querySelectorAll('.tab-link');
    var idx = id === 'tab2' ? 1 : (id === 'tab3' ? 2 : 0);
    if (typeof global.switchTab === 'function' && links[idx]) global.switchTab(id, links[idx]);
  }
  function scrollTo(sel) {
    var n = typeof sel === 'string' ? document.querySelector(sel) : sel;
    if (n) n.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  var TOUR = [
    { step: 'Welcome', title: 'How to review this draft',
      body: 'This is an on-page SEO <b>optimization draft</b> for one page. It has three tabs: the draft itself, a full-page mockup, and a research appendix. This quick tour shows you how to read it and give feedback.',
      on: function () { goTab('tab1'); } },
    { step: '1 of 8', title: 'The colored tags',
      body: 'Every section is labeled by the kind of change: <b style="color:#7c3aed">Optimized</b> (reworded copy), <b style="color:#1a7a45">New</b> (a brand-new section), <b style="color:#1a6a8c">Unchanged</b> (kept as-is), and <b style="color:#a06a00">Revised FAQ</b>. The legend at the top is your key.',
      on: function () { goTab('tab1'); scrollTo('.legend'); } },
    { step: '2 of 8', title: 'Before, After, and why',
      body: 'Each section shows the <b>current</b> copy on the left and our <b>proposed</b> copy on the right, exactly as it would appear on the page. Underneath, a short line explains <b>why</b> we recommend the change.',
      on: function () { goTab('tab1'); var f = bars[order[0]]; if (f) scrollTo(f.wrap); } },
    { step: '3 of 8', title: 'Approve or reject each section',
      body: 'At the bottom of every section, use the <b>Approve</b> or <b>Reject</b> button. Approved turns the section green, rejected turns it red.',
      on: function () { goTab('tab1'); var f = bars[order[0]]; if (f) scrollTo(f.wrap); } },
    { step: '4 of 8', title: 'Rejecting? Tell us why',
      body: 'When you click <b>Reject</b>, a box appears asking for a quick reason. A reason is required before the rejection saves, so we know exactly what to change.' },
    { step: '5 of 8', title: 'Changed your mind? Clear it',
      body: 'Once a section is decided, a small <b>Clear</b> link appears in its bar. Click it to reset that section back to undecided, no rejection needed.' },
    { step: '6 of 8', title: 'The Mockup tab',
      body: 'The <b>Mockup</b> tab shows the whole page as it would actually look once the approved changes are applied, top to bottom, in plain layout.',
      on: function () { goTab('tab2'); } },
    { step: '7 of 8', title: 'The Appendix tab',
      body: 'The <b>Appendix</b> tab is the research behind the recommendations: who currently ranks, the gaps we are closing, the keyword plan, and the structured-data plan.',
      on: function () { goTab('tab3'); } },
    { step: '8 of 8', title: 'Everything saves automatically',
      body: 'No files to download or send back. Decisions save to the cloud instantly and sync to everyone. The <b>Rejected</b> button in the bottom-right lists every section you rejected and why, click any one to jump straight to it.',
      on: function () { goTab('tab1'); } }
  ];
  var tourIdx = 0, tourOverlay = null, tourCard = null;
  function buildTour() {
    tourOverlay = el('div', 'rv-tour-overlay');
    tourCard = el('div', 'rv-tour-card');
    tourOverlay.appendChild(tourCard);
    tourOverlay.addEventListener('click', function (e) { if (e.target === tourOverlay) closeTour(); });
    document.body.appendChild(tourOverlay);
  }
  function renderTour() {
    var s = TOUR[tourIdx], last = tourIdx === TOUR.length - 1;
    var dots = TOUR.map(function (_, i) { return '<i class="' + (i === tourIdx ? 'on' : '') + '"></i>'; }).join('');
    tourCard.innerHTML =
      '<div class="rv-tour-step">' + s.step + '</div>' +
      '<h3>' + s.title + '</h3>' +
      '<p>' + s.body + '</p>' +
      '<div class="rv-tour-actions"><div class="rv-tour-dots">' + dots + '</div>' +
      '<div class="rv-tour-right">' +
        (last ? '' : '<button class="rv-tour-skip" data-act="skip">Skip</button>') +
        '<button class="rv-tour-next" data-act="next">' + (last ? 'Got it' : 'Next') + '</button>' +
      '</div></div>';
    tourCard.querySelectorAll('[data-act]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (btn.getAttribute('data-act') === 'skip' || last) { closeTour(); return; }
        tourIdx++; renderTour();
      });
    });
    if (s.on) s.on();
  }
  function openTour() { tourIdx = 0; tourOverlay.classList.add('open'); renderTour(); }
  function closeTour() { tourOverlay.classList.remove('open'); goTab('tab1'); try { localStorage.setItem(WT_KEY, '1'); } catch (e) {} }
  function buildTourButton() {
    var b = el('button', 'rv-tour-btn', 'Take a tour');
    b.addEventListener('click', openTour);
    document.body.appendChild(b);
  }
  function maybeAutoTour() {
    var seen = false; try { seen = localStorage.getItem(WT_KEY) === '1'; } catch (e) {}
    if (!seen) setTimeout(openTour, 650);
  }

  /* ---- boot -------------------------------------------------------------- */
  onReady(function () {
    injectStyle();
    var go = function () {
      global.__reviewStore = (FB && global.firebase && global.firebase.firestore)
        ? firebaseStore() : localStore();
      collectTargets().forEach(buildBar);
      buildFab();
      buildTour();
      buildTourButton();
      render();
      global.__reviewStore.subscribe(function (remote) { mergeRemote(remote); render(); });
      maybeAutoTour();
    };
    if (FB) {
      loadScript(FB_SDK + 'firebase-app-compat.js', function () {
        loadScript(FB_SDK + 'firebase-firestore-compat.js', go);
      });
    } else { go(); }
  });

})(window);
