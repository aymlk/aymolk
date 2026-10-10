/* =========================================================
   金浩 · 作品集  —  交互脚本
   ========================================================= */
(function () {
  "use strict";

  /* ---------- 1. 顶部滚动进度 + 导航毛玻璃 ---------- */
  var nav = document.getElementById("nav");
  var progress = document.getElementById("scrollProgress");
  function onScroll() {
    var h = document.documentElement;
    var scrolled = h.scrollTop;
    var max = h.scrollHeight - h.clientHeight;
    var ratio = max > 0 ? scrolled / max : 0;
    if (progress) progress.style.width = (ratio * 100).toFixed(2) + "%";
    if (nav) nav.classList.toggle("is-scrolled", scrolled > 40);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- 2. 滚动揭示动画 ---------- */
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -8% 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("is-in"); });
  }

  /* ---------- 3. 数字递增动画 ---------- */
  function animateCount(el) {
    var target = parseFloat(el.getAttribute("data-count")) || 0;
    var suffix = el.getAttribute("data-suffix") || "";
    var dur = 1400, start = null;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = target + suffix;
    }
    requestAnimationFrame(step);
  }
  var nums = document.querySelectorAll(".stat__num");
  if ("IntersectionObserver" in window && nums.length) {
    var io2 = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { animateCount(e.target); io2.unobserve(e.target); }
      });
    }, { threshold: 0.6 });
    nums.forEach(function (el) { io2.observe(el); });
  } else {
    nums.forEach(function (el) {
      el.textContent = (el.getAttribute("data-count") || "0") + (el.getAttribute("data-suffix") || "");
    });
  }

  /* ---------- 4. HERO 粒子背景（canvas） ---------- */
  var canvas = document.getElementById("heroCanvas");
  if (canvas && canvas.getContext) {
    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W, H, particles = [];
    // 双色撞色 identity：绯红 + 电青（约 30% 粒子为电青）
    var HOT = "255, 45, 85";
    var VOLT = "33, 230, 255";

    function resize() {
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var count = Math.floor((W * H) / 16000);
      count = Math.max(40, Math.min(count, 120));
      particles = [];
      for (var i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * W,
          y: Math.random() * H,
          vx: (Math.random() - 0.5) * 0.35,
          vy: (Math.random() - 0.5) * 0.35,
          r: Math.random() * 1.6 + 0.5,
          rgb: Math.random() < 0.3 ? VOLT : HOT
        });
      }
    }

    function tick() {
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(" + p.rgb + ",0.55)";
        ctx.fill();
        for (var j = i + 1; j < particles.length; j++) {
          var q = particles[j];
          var dx = p.x - q.x, dy = p.y - q.y;
          var dist = dx * dx + dy * dy;
          if (dist < 15000) {
            var a = (1 - dist / 15000) * 0.18;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = "rgba(" + p.rgb + "," + a.toFixed(3) + ")";
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }
      requestAnimationFrame(tick);
    }
    resize();
    window.addEventListener("resize", resize);
    tick();
  }

  /* ---------- 5. 真实视频背景 ----------
     视频已在 HTML 中设置 src=assets/hero.mp4，此处负责在就绪后淡入、
     并隐藏粒子 canvas 兜底。不支持/加载失败时保留粒子背景。 */
  (function () {
    var hero = document.querySelector(".hero");
    var video = document.getElementById("heroVideo");
    var canvas = document.getElementById("heroCanvas");
    if (!video) return;
    function activate() {
      video.classList.add("is-ready");
      if (hero) hero.classList.add("has-video");
    }
    if (video.readyState >= 3) {
      activate();
    } else {
      video.addEventListener("canplay", activate, { once: true });
      video.addEventListener("loadeddata", activate, { once: true });
    }
    // 播放被浏览器拦截时（极少数情况）也尝试触发一次
    var p = video.play && video.play();
    if (p && p.catch) p.catch(function () {});
  })();
})();
