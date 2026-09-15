/* =========================================================
   えん en — 動きの設定（JavaScript）

   やっていることは3つだけ:
     1. スクロールでヘッダーを白帯に変える
     2. スマホのメニューを開け閉めする
     3. スクロールで各パーツをふわっと出す
   （＋おまけ: 背景動画の自動再生をサポート）
   ========================================================= */

document.addEventListener('DOMContentLoaded', function () {

  var nav    = document.getElementById('nav');
  var links  = document.getElementById('links');
  var toggle = document.getElementById('toggle');


  /* -------------------------------------------------------
     1. スクロールでヘッダーを白帯に
        画面の高さの6割ぶんスクロールしたら .is-solid を付ける
     ------------------------------------------------------- */
  function onScroll() {
    var passedHero = window.scrollY > window.innerHeight * 0.6;
    nav.classList.toggle('is-solid', passedHero);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // 最初の1回


  /* -------------------------------------------------------
     2. スマホのメニュー開閉
     ------------------------------------------------------- */
  toggle.addEventListener('click', function () {
    var opened = links.classList.toggle('open');
    toggle.setAttribute('aria-expanded', opened);
  });
  // メニュー内のリンクを押したら閉じる
  links.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') {
      links.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });


  /* -------------------------------------------------------
     3. スクロールで .reveal のパーツをふわっと表示
        （画面に入ったら .in を付ける。動きを減らす設定の人には即表示）
     ------------------------------------------------------- */
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var targets = document.querySelectorAll('.reveal');

  if (reduceMotion) {
    targets.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target); // 一度出したら監視をやめる
        }
      });
    }, { threshold: 0.18 });
    targets.forEach(function (el) { io.observe(el); });
  }


  /* -------------------------------------------------------
     おまけ. 背景動画の自動再生サポート
        ミュートなので基本は自動再生されるが、
        一部の環境で止まった時のために軽く再生を促す
     ------------------------------------------------------- */
  var video = document.querySelector('.hero__video');
  if (video) {
    var tryPlay = function () {
      var p = video.play();
      if (p && p.catch) { p.catch(function () {}); } // 失敗しても何もしない（ポスター画像が出る）
    };
    tryPlay();
    // タブに戻ってきた時に再生し直す
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) { tryPlay(); }
    });
  }


  /* -------------------------------------------------------
     パーティクル球体（TOPの canvas。点と線でできた回る球）
     ・外部ライブラリなし。#globe-canvas がある時だけ動きます
     ------------------------------------------------------- */
  (function () {
    var canvas = document.getElementById('globe-canvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);

    // 球の表面に点を均等配置（フィボナッチ球）
    var N = 150, pts = [], edges = [];
    var GA = Math.PI * (3 - Math.sqrt(5));
    for (var i = 0; i < N; i++) {
      var y = 1 - (i / (N - 1)) * 2;
      var r = Math.sqrt(1 - y * y);
      var t = i * GA;
      pts.push({ x: Math.cos(t) * r, y: y, z: Math.sin(t) * r });
    }
    // 近い点どうしを線で結ぶ（回っても関係は不変なので最初に一度だけ）
    var TH = 0.42;
    for (var a = 0; a < N; a++) for (var b = a + 1; b < N; b++) {
      var dx = pts[a].x - pts[b].x, dy = pts[a].y - pts[b].y, dz = pts[a].z - pts[b].z;
      if (dx * dx + dy * dy + dz * dz < TH * TH) edges.push([a, b]);
    }
    var accent = (getComputedStyle(document.documentElement).getPropertyValue('--accent') || '#c9653d').trim();

    var W, H, cx, cy, R;
    function resize() {
      var rect = canvas.getBoundingClientRect();
      W = rect.width; H = rect.height;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cx = W / 2; cy = H / 2; R = Math.min(W, H) * 0.34;
    }
    window.addEventListener('resize', resize); resize();

    var ang = 0, tilt = -0.35;
    function project(p) {
      var ca = Math.cos(ang), sa = Math.sin(ang);
      var x = p.x * ca - p.z * sa, z = p.x * sa + p.z * ca, y = p.y;   // Y軸まわりに回転
      var ct = Math.cos(tilt), st = Math.sin(tilt);
      var y2 = y * ct - z * st, z2 = y * st + z * ct;                  // 少し傾ける
      var persp = 1.6 / (1.6 + z2);
      return { sx: cx + x * R * persp, sy: cy + y2 * R * persp, depth: z2, persp: persp };
    }
    function frame() {
      ctx.clearRect(0, 0, W, H);
      var pr = pts.map(project);
      for (var e = 0; e < edges.length; e++) {                        // 線（奥ほど薄く）
        var p1 = pr[edges[e][0]], p2 = pr[edges[e][1]];
        var a = 0.05 + ((p1.depth + p2.depth) / 2 + 1) / 2 * 0.14;
        ctx.strokeStyle = 'rgba(28,27,25,' + a.toFixed(3) + ')';
        ctx.lineWidth = 0.6;
        ctx.beginPath(); ctx.moveTo(p1.sx, p1.sy); ctx.lineTo(p2.sx, p2.sy); ctx.stroke();
      }
      for (var i = 0; i < N; i++) {                                   // 点（37個ごとに柿色）
        var p = pr[i];
        var a = 0.3 + (p.depth + 1) / 2 * 0.5;
        ctx.beginPath(); ctx.arc(p.sx, p.sy, Math.max(0.7, 1.1 * p.persp), 0, 7);
        ctx.fillStyle = (i % 37 === 0) ? accent : 'rgba(28,27,25,' + Math.min(0.8, a).toFixed(3) + ')';
        ctx.fill();
      }
      if (!reduce) { ang += 0.0016; requestAnimationFrame(frame); }
    }
    frame();
  })();


  /* ===== クリックで初めてYouTubeを読み込む（自主制作リール等）===== */
  document.querySelectorAll('[data-yt]').forEach(function (el) {
    function play() {
      var id = el.getAttribute('data-yt');
      var f = document.createElement('iframe');
      f.className = 'reel__iframe';
      f.src = 'https://www.youtube.com/embed/' + id + '?autoplay=1&rel=0&modestbranding=1&playsinline=1';
      f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      f.setAttribute('allowfullscreen', '');
      el.innerHTML = '';
      el.appendChild(f);
    }
    el.addEventListener('click', play);
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); play(); }
    });
  });

});


/* =========================================================
   オープニング（最初の一度だけ表示）
   ・sessionStorage を使うので、同じタブで他ページを見て戻ってきた時は出ません
   ・毎回出したい場合は、下の sessionStorage の2行を消してください
   ========================================================= */
(function () {
  var op = document.getElementById('op');
  if (!op) return;

  // 2回目以降（同じタブ内）はスキップ
  if (sessionStorage.getItem('en_op_seen')) {
    op.remove();
    return;
  }
  sessionStorage.setItem('en_op_seen', '1');

  document.documentElement.classList.add('op-active');

  function close() {
    op.classList.add('is-done');
    document.documentElement.classList.remove('op-active');
    setTimeout(function () { if (op.parentNode) op.remove(); }, 1200);
  }

  // ロゴが描き終わるころに幕を開ける（3つの円→点→屋号で約3.3秒）
  var t = setTimeout(close, 3700);

  // クリック／タップですぐスキップできるように
  op.addEventListener('click', function () { clearTimeout(t); close(); });
})();
