/* Client review UI — set window.ONPAGE_COMMENT_KEY and ONPAGE_EXPORT_NAME before loading */
(function (global) {
  var STORAGE_KEY = global.ONPAGE_COMMENT_KEY || 'onpage_opt_comments';
  function loadComments() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
    catch (e) { return {}; }
  }
  function saveComments(c) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(c)); } catch (e) {} }
  function getCopyForBlock(id) {
    var b = document.getElementById(id);
    if (!b) return '';
    var a = b.querySelector('.ba-after p');
    if (a) return a.innerText.substring(0, 120);
    var u = b.querySelector('.unch-block p, .new-block p');
    return u ? u.innerText.substring(0, 120) : id;
  }
  function updateFabCount() {
    var badge = document.getElementById('fabCount');
    var btn = document.getElementById('commentsFab');
    var comments = loadComments();
    var n = Object.keys(comments).filter(function (k) {
      var c = comments[k]; return c && c.comment && c.comment.trim();
    }).length;
    // The Comments button stays available so the panel (and its empty state) is always reachable;
    // the count badge only shows once there is at least one comment.
    if (btn) btn.style.display = 'flex';
    if (badge) { badge.textContent = n; badge.style.display = n > 0 ? 'inline-block' : 'none'; }
  }
  function renderPanel() {
    var body = document.getElementById('panelBody');
    if (!body) return;
    var comments = loadComments();
    var keys = Object.keys(comments).filter(function (k) {
      return comments[k] && comments[k].comment && comments[k].comment.trim();
    });
    if (!keys.length) {
      body.innerHTML = '<p class="panel-empty">No comments yet. Click <strong>+</strong> on any change block.</p>';
      return;
    }
    body.innerHTML = keys.map(function (k) {
      var c = comments[k];
      return '<div class="comment-item"><div class="ci-section">' + k.replace('block-','').replace(/-/g,' ') +
        '</div><div class="ci-copy">' + (c.copy||'').substring(0,100) + '…</div><div class="ci-comment">' + c.comment + '</div></div>';
    }).join('');
  }
  global.toggleComment = function (blockId) {
    var el = document.getElementById('comment-' + blockId);
    // The inline comment box is created on demand, so a block only needs the
    // `+` button (onclick="toggleComment('block-id')") — no per-block markup.
    if (!el) {
      var block = document.getElementById(blockId);
      if (!block) return;
      el = document.createElement('div');
      el.className = 'inline-comment';
      el.id = 'comment-' + blockId;
      el.innerHTML = '<textarea placeholder="Leave a comment on this section…"></textarea>';
      block.appendChild(el);
    }
    var open = el.style.display === 'block';
    el.style.display = open ? 'none' : 'block';
    if (!open) {
      var ta = el.querySelector('textarea');
      var comments = loadComments();
      if (ta) {
        ta.value = (comments[blockId] && comments[blockId].comment) || '';
        ta.focus();
        ta.oninput = function () {
          comments[blockId] = { section: blockId, copy: getCopyForBlock(blockId), comment: ta.value };
          saveComments(comments); renderPanel(); updateFabCount();
        };
      }
    }
  };
  global.togglePanel = function () {
    var p = document.getElementById('commentsPanel');
    if (!p) return;
    p.classList.toggle('open');
    if (p.classList.contains('open')) renderPanel();
  };
  global.exportComments = function () {
    var data = Object.values(loadComments()).filter(function (c) { return c && c.comment && c.comment.trim(); });
    if (!data.length) return;
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
    a.download = (global.ONPAGE_EXPORT_NAME || 'optimization-comments') + '.json';
    a.click();
  };
  global.copySchema = function () {
    var el = document.getElementById('schema-json-store');
    if (!el || !navigator.clipboard) return;
    navigator.clipboard.writeText(el.textContent).then(function () {
      var btn = document.querySelector('.schema-copy-btn');
      if (btn) { btn.textContent = 'Copied'; setTimeout(function(){ btn.textContent = 'Copy Schema'; }, 2000); }
    });
  };

  /* ---- Guided walkthrough -------------------------------------------------
     Introduces the three tabs on first load. Auto-shown once (remembered in
     localStorage); re-openable anytime via the "Take a tour" button. Steps
     switch the underlying tab so the dimmed tab is visible behind the card. */
  var WT_KEY = STORAGE_KEY + '_wt_v2';
  var WT_STEPS = [
    { tab: 'tab1', step: 'Step 1 of 4', title: 'Your optimization draft',
      body: 'Every section of the page is shown as a card with a <strong>Before / After</strong> comparison. The colored pill on each card tells you what changed: <strong>Optimized</strong> (purple), <strong>New</strong> (green), <strong>Unchanged</strong> (blue), and <strong>Revised FAQ</strong> (amber).' },
    { tab: 'tab1', step: 'Step 2 of 4', title: 'Leave comments for Daydream',
      body: 'Click the <strong>+</strong> on any section to leave a comment. When you\'re done, open the <strong>Comments</strong> button in the bottom-right and choose <strong>Export JSON</strong> to download your feedback as a file — send that file back to Daydream and we\'ll turn your notes into revisions.' },
    { tab: 'tab2', step: 'Step 3 of 4', title: 'Preview the mockup',
      body: 'The <strong>Mockup</strong> tab is a wireframe preview of how the optimized copy looks laid out on the live page, section by section.' },
    { tab: 'tab3', step: 'Step 4 of 4', title: 'See the rationale',
      body: 'The <strong>Appendix</strong> shows the context behind every recommendation — the SERP analysis, competitor patterns, and keyword research that drive the changes.' }
  ];
  var wtEl = null, wtIdx = 0;
  function wtTabLink(tab) { return document.querySelector('.tab-link[onclick*="' + tab + '"]'); }
  function wtSwitch(tab) { if (global.switchTab) global.switchTab(tab, wtTabLink(tab)); }
  function wtBuild() {
    if (wtEl) return;
    wtEl = document.createElement('div');
    wtEl.className = 'wt-overlay';
    wtEl.id = 'wtOverlay';
    wtEl.style.display = 'none';
    wtEl.innerHTML =
      '<div class="wt-card">' +
        '<div class="wt-step" id="wtStep"></div>' +
        '<h2 id="wtTitle"></h2>' +
        '<p id="wtBody"></p>' +
        '<div class="wt-nav">' +
          '<div class="wt-dots-row" id="wtDots"></div>' +
          '<div class="wt-btns">' +
            '<button class="wt-btn wt-btn-ghost" id="wtSkip">Skip</button>' +
            '<button class="wt-btn wt-btn-ghost" id="wtBack">Back</button>' +
            '<button class="wt-btn wt-btn-primary" id="wtNext">Next</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(wtEl);
    var dots = wtEl.querySelector('#wtDots');
    WT_STEPS.forEach(function () { dots.appendChild(document.createElement('span')).className = 'wt-dot'; });
    wtEl.querySelector('#wtSkip').onclick = wtEnd;
    wtEl.querySelector('#wtBack').onclick = function () { if (wtIdx > 0) wtGo(wtIdx - 1); };
    wtEl.querySelector('#wtNext').onclick = function () {
      if (wtIdx < WT_STEPS.length - 1) wtGo(wtIdx + 1); else wtEnd();
    };
    wtEl.addEventListener('click', function (e) { if (e.target === wtEl) wtEnd(); });
  }
  function wtGo(i) {
    wtIdx = i;
    var s = WT_STEPS[i];
    wtSwitch(s.tab);
    wtEl.querySelector('#wtStep').textContent = s.step;
    wtEl.querySelector('#wtTitle').textContent = s.title;
    wtEl.querySelector('#wtBody').innerHTML = s.body;
    wtEl.querySelector('#wtBack').style.visibility = i === 0 ? 'hidden' : 'visible';
    wtEl.querySelector('#wtNext').textContent = i === WT_STEPS.length - 1 ? 'Done' : 'Next';
    var dots = wtEl.querySelectorAll('.wt-dot');
    for (var d = 0; d < dots.length; d++) dots[d].className = 'wt-dot' + (d === i ? ' on' : '');
  }
  function wtEnd() {
    if (wtEl) wtEl.style.display = 'none';
    try { localStorage.setItem(WT_KEY, '1'); } catch (e) {}
    wtSwitch('tab1');
  }
  global.startWalkthrough = function () {
    wtBuild();
    wtEl.style.display = 'flex';
    wtGo(0);
  };
  function wtAddRelaunch() {
    if (document.getElementById('wtRelaunch')) return;
    var b = document.createElement('button');
    b.className = 'wt-relaunch';
    b.id = 'wtRelaunch';
    b.textContent = 'Take a tour';
    b.onclick = global.startWalkthrough;
    document.body.appendChild(b);
  }

  document.addEventListener('DOMContentLoaded', function () {
    updateFabCount();
    // Only offer the tour on a real draft (skip SERP-fail bundles with no change blocks).
    if (document.querySelector('.change-block')) {
      wtAddRelaunch();
      var seen; try { seen = localStorage.getItem(WT_KEY); } catch (e) {}
      if (!seen) global.startWalkthrough();
    }
  });
})(window);
