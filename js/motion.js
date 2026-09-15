/* =========================================================
   えん en — 追加の動き（波形 / ページトップ / 数字カウント）

   ・jQuery は使いません。素のJSだけで動きます。
   ・「動きを減らす」設定の端末では、自動で静止します。
   ========================================================= */
(function () {
  'use strict';

  var reduce = window.matchMedia &&
               window.matchMedia('(prefers-reduced-motion: reduce)').matches;


  /* -------------------------------------------------------
     1. 波形（1本だけ・黒・ゆっくり）
        <canvas class="wave__canvas"> を探して描きます
     ------------------------------------------------------- */
  (function wave() {
    var canvas = document.querySelector('.wave__canvas');
    if (!canvas) return;

    var ctx = canvas.getContext('2d');
    var dpr = window.devicePixelRatio || 1;
    var t = 0;
    var visible = true;

    function resize() {
      var w = canvas.clientWidth;
      var h = canvas.clientHeight;
      canvas.width  = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    /* 3本ぶんの設定。上から順に描かれます。
       op   = 濃さ（主線だけ濃く、あとは薄く）
       amp  = 揺れの大きさ（画面高さに対する割合）
       freq = 波の細かさ
       ph   = 位相のずれ（重ならないように）
       sp   = 流れる速さの倍率            */
    var lines = [
      { op: .10, amp: .26, freq: 1.7, ph: 1.9, sp: 0.75, w: 1.0 },
      { op: .14, amp: .17, freq: 2.9, ph: 3.4, sp: 1.25, w: 1.0 },
      { op: .22, amp: .20, freq: 2.2, ph: 0.0, sp: 1.00, w: 1.0 }
    ];

    function draw() {
      var w = canvas.clientWidth;
      var h = canvas.clientHeight;
      var mid = h / 2;

      ctx.clearRect(0, 0, w, h);

      for (var li = 0; li < lines.length; li++) {
        var L = lines[li];
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(28,27,25,' + L.op + ')';   /* --ink */
        ctx.lineWidth = L.w;
        ctx.lineCap = 'round';

        var tt = t * L.sp + L.ph;

        for (var x = 0; x <= w; x += 4) {
          var y = mid
                + Math.sin((x / w) * Math.PI * L.freq * 2 + tt) * (h * L.amp)
                + Math.sin((x / w) * Math.PI * 3.7 + tt * 0.6) * (h * L.amp * 0.35);
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    }

    function loop() {
      if (visible) { t += 0.006; draw(); }   /* 数字を上げると波が速くなります */
      requestAnimationFrame(loop);
    }

    resize();
    window.addEventListener('resize', function () { resize(); draw(); });

    /* 画面外にいる間は描画を止める（スマホのバッテリー対策）*/
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        visible = es[0].isIntersecting;
      }, { threshold: 0 }).observe(canvas);
    }

    if (reduce) { draw(); } else { loop(); }
  })();


  /* -------------------------------------------------------
     2. ページトップへ戻るボタン
        一定量スクロールしたら下からふわっと出ます
     ------------------------------------------------------- */
  (function pageTop() {
    var btn = document.getElementById('page-top');
    if (!btn) return;

    var shown = false;

    function check() {
      /* 画面1つぶん以上スクロールしたら表示 */
      var should = window.pageYOffset > window.innerHeight * 0.9;
      if (should === shown) return;
      shown = should;
      btn.classList.toggle('is-in', shown);
    }

    window.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check);
    check();

    btn.addEventListener('click', function (e) {
      e.preventDefault();
      window.scrollTo({
        top: 0,
        behavior: reduce ? 'auto' : 'smooth'
      });
    });
  })();


  /* -------------------------------------------------------
     3. 数字のカウントアップ
        <span class="count" data-count="19000"> のように書くと、
        画面に入ったタイミングで 0 → その数字まで動きます。
        data-suffix / data-prefix で単位を足せます。
     ------------------------------------------------------- */
  (function countUp() {
    var els = document.querySelectorAll('.count');
    if (!els.length) return;

    function format(n, el) {
      var dec = parseInt(el.dataset.decimals || '0', 10);
      var s = dec > 0 ? n.toFixed(dec) : String(Math.round(n));
      if (el.dataset.comma === 'true') {
        s = s.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      }
      return (el.dataset.prefix || '') + s + (el.dataset.suffix || '');
    }

    function run(el) {
      var target = parseFloat(el.dataset.count);
      if (isNaN(target)) return;

      /* ゆっくり止まる動き。速いカウントは安っぽく見えるので長めにしています */
      var dur = parseInt(el.dataset.duration || '1800', 10);

      if (reduce) { el.textContent = format(target, el); return; }

      var start = null;
      function step(ts) {
        if (start === null) start = ts;
        var p = Math.min((ts - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);       /* 最後にすっと減速 */
        el.textContent = format(target * eased, el);
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }

    if (!('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(els, run);
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        run(en.target);
        io.unobserve(en.target);   /* 一度だけ */
      });
    }, { threshold: 0.6 });

    Array.prototype.forEach.call(els, function (el) {
      el.textContent = format(0, el);
      io.observe(el);
    });
  })();

})();
