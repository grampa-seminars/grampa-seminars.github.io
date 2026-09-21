// Parse a .md file: blocks start with "## heading"; "Key: value" lines until blank; rest = body.
function parseBlocks(md) {
  return md.replace(/<!--[\s\S]*?-->/g, '').split(/^## /m).slice(1).map(function (block) {
    var lines = block.split('\n'), item = { title: lines.shift().trim(), body: '' }, i = 0;
    for (; i < lines.length && lines[i].trim(); i++) {
      var m = lines[i].match(/^(\w+):\s*(.*)$/);
      if (m) item[m[1].toLowerCase()] = m[2].trim();
    }
    item.body = lines.slice(i).join('\n').trim();
    return item;
  });
}
function load(file, id, render) {
  var box = document.getElementById(id);
  // no-cache: revalidate with the server each load (GitHub Pages caches for 10 min otherwise)
  return fetch(file, { cache: 'no-cache' }).then(function (r) { return r.text(); }).then(function (md) {
    var items = parseBlocks(md); box.innerHTML = '';
    items.forEach(function (it) { box.appendChild(render(it)); });
    return items;
  }).catch(function () {
    box.innerHTML = '<p class="placeholder">Could not load ' + file + '. ' +
      (location.protocol === 'file:' ? 'Browsers block reading files from file://. Serve the folder over HTTP (e.g. python3 -m http.server) or view the site on GitHub Pages.' : '') + '</p>';
    return [];
  });
}
function el(tag, cls, text) {
  var e = document.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; return e;
}
function showTalk(t, kind, meta) {
  var d = document.getElementById('talk-dialog');
  d.querySelector('#dialog-kind').textContent = kind;
  d.querySelector('h3').textContent = t.title;
  d.querySelector('.meta').textContent = meta || [t.speaker, t.date].filter(Boolean).join('  \u00b7  ');
  var abs = d.querySelector('.abs'); abs.innerHTML = '';
  t.body.split(/\n\s*\n/).forEach(function (para) { abs.appendChild(el('p', null, para.trim())); });
  d.showModal();
}
function talkButton(kind) {
  return function (t) {
    var cell = el('div'), b = el('button');
    b.appendChild(el('span', 'pill', t.date ? t.date.split(',')[0] : 'Talk'));
    b.appendChild(el('span', 't', t.title));
    b.appendChild(el('span', 's', t.speaker || ''));
    b.appendChild(el('span', 'open', 'Read abstract \u2192'));
    b.addEventListener('click', function () { showTalk(t, kind); });
    cell.appendChild(b); return cell;
  };
}

document.getElementById('talk-dialog').addEventListener('click', function (e) {
  var r = this.getBoundingClientRect();
  if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) this.close();
});

load('upcoming_talks.md', 'upcoming-talks', talkButton('Upcoming talk')).then(function (talks) {
  var n = document.querySelector('.card.next'), t = talks[0];
  if (!t) { n.querySelector('.title').textContent = 'To be announced'; n.querySelector('.abs').textContent = 'Join the mailing list to hear first.'; return; }
  n.querySelector('.date').textContent = t.date || '';
  n.querySelector('.who').textContent = t.speaker || '';
  n.querySelector('.title').textContent = t.title;
  n.querySelector('.abs').textContent = t.body.split(/\n\s*\n/)[0];
});
load('past_talks.md', 'talks', talkButton('Past talk')).then(function (talks) {
  document.getElementById('talk-count').textContent = talks.length;
});
load('workshops.md', 'workshops-list', function (w) {
  var c = el('div', 'card shop');
  c.appendChild(el('span', 'pill', w.date || 'Workshop'));
  c.appendChild(el('h3', null, w.title));
  if (w.where) c.appendChild(el('p', 'where', w.where));
  if (w.body) c.appendChild(el('p', 'desc', w.body));
  if (w.link) { var a = el('a', 'btn light small', 'Workshop page \u2192'); a.href = w.link; a.target = '_blank'; a.rel = 'noopener'; c.appendChild(a); }
  return c;
});
load('organizers.md', 'organisers-list', function (o) {
  if (o.former) return document.createComment('former');
  var c = el('div', 'card org');
  c.appendChild(el('p', 'name', o.title));
  c.appendChild(el('p', 'aff', o.affiliation || ''));
  if (o.email) { var m = el('a', 'mail', o.email); m.href = 'mailto:' + o.email; m.addEventListener('click', function (e) { e.stopPropagation(); }); c.appendChild(m); }
  if (o.body) {
    c.classList.add('clickable'); c.tabIndex = 0; c.setAttribute('role', 'button');
    c.appendChild(el('span', 'open', 'About \u2192'));
    var open = function () { showTalk(o, 'Organiser', [o.affiliation, o.email].filter(Boolean).join('  \u00b7  ')); };
    c.addEventListener('click', open);
    c.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
  }
  return c;
}).then(function (items) {
  var former = items.filter(function (o) { return o.former; });
  if (!former.length) return;
  var c = el('div', 'card org former');
  c.appendChild(el('span', 'pill', 'Previous organisers'));
  var ul = el('ul');
  former.forEach(function (o) { var li = el('li', null, o.title); if (o.affiliation) li.appendChild(el('span', 'aff', ' (' + o.affiliation + ')')); ul.appendChild(li); });
  c.appendChild(ul);
  document.getElementById('organisers-list').appendChild(c);
});
