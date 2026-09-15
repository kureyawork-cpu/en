/* =========================================================
   Webページの背景「幾何学模様（点と線）」の設定
   ・えん用に調整: 白背景に極薄の墨色、ゆっくり、控えめ
   ・点の数 → number.value / 速さ → move.speed / 濃さ → opacity と line_linked.opacity
   ========================================================= */
particlesJS("particles-js", {
  particles: {
    number: { value: 28, density: { enable: true, value_area: 900 } }, // 点の数（少なめ）
    color: { value: "#1c1b19" },                                       // 点の色（墨）
    shape: { type: "circle", stroke: { width: 0 } },                   // 丸い点
    opacity: {
      value: 0.16, random: true,                                       // 点の濃さ（かなり薄め）
      anim: { enable: true, speed: 0.5, opacity_min: 0.04, sync: false }
    },
    size: { value: 2.4, random: true, anim: { enable: false } },       // 点の大きさ
    line_linked: {
      enable: true, distance: 150,
      color: "#1c1b19", opacity: 0.10, width: 1                        // つなぐ線（極薄）
    },
    move: {
      enable: true, speed: 0.8,                                        // ← 動きの速さ（ゆっくり）
      direction: "none", random: false, straight: false,
      out_mode: "out", bounce: false
    }
  },
  interactivity: {
    detect_on: "canvas",
    events: { onhover: { enable: false }, onclick: { enable: false }, resize: true }
  },
  retina_detect: true
});
