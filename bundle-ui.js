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
    var fab = document.getElementById('fabCount');
    if (!fab) return;
    var n = Object.keys(loadComments()).filter(function (k) {
      var c = loadComments()[k]; return c && c.comment && c.comment.trim();
    }).length;
    fab.textContent = n;
    fab.style.display = n > 0 ? 'flex' : 'none';
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
    if (!el) return;
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
  document.addEventListener('DOMContentLoaded', updateFabCount);
})(window);
