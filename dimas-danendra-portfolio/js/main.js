/* ============================================================
   Hero ID card — spring physics
   Ubah nilai stiffness / damping di sini untuk mengatur pantulan.
   ============================================================ */
var CARD_SPRING = {
  stiffness: 0.12,
  damping: 0.85,
  restTop: 150,
  minTop: 24,
  edge: 8,
  clipInset: -22,
  maxTilt: 0.6
};

(function () {
  "use strict";

  var items = document.querySelectorAll(".reveal");
  if (!items.length) return;

  if (!("IntersectionObserver" in window)) {
    items.forEach(function (el) {
      el.classList.add("in");
    });
    return;
  }

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
  );

  items.forEach(function (el) {
    observer.observe(el);
  });
})();

(function () {
  "use strict";

  var hero = document.getElementById("hero");
  var card = document.getElementById("idCard");
  var rope = document.getElementById("heroRope");
  if (!hero || !card || !rope) return;

  var ctx = rope.getContext("2d");
  if (!ctx) return;

  var W = 240;
  var H = 320;
  var x = 0;
  var y = CARD_SPRING.restTop;
  var vx = 0;
  var vy = 0;
  var running = false;
  var dragging = false;
  var startPointerX = 0;
  var startPointerY = 0;
  var startX = 0;
  var startY = 0;

  function refreshMetrics() {
    W = card.offsetWidth || W;
    H = card.offsetHeight || H;
  }

  function fitCanvas() {
    var width = hero.clientWidth;
    var height = hero.clientHeight;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    rope.width = Math.round(width * dpr);
    rope.height = Math.round(height * dpr);
    rope.style.width = width + "px";
    rope.style.height = height + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function draw() {
    var width = hero.clientWidth;
    var height = hero.clientHeight;
    var centerX = width / 2 + x;
    var centerY = y + H / 2;
    var angle = -Math.atan2(x, centerY);
    angle = clamp(angle, -CARD_SPRING.maxTilt, CARD_SPRING.maxTilt);

    var distance = H / 2 - CARD_SPRING.clipInset;
    var attachX = centerX + Math.sin(angle) * distance;
    var attachY = centerY - Math.cos(angle) * distance;

    card.style.transform =
      "translate3d(calc(-50% + " + x + "px), " + y + "px, 0) rotate(" + angle + "rad)";

    ctx.clearRect(0, 0, width, height);
    ctx.beginPath();
    ctx.lineWidth = 9;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#C9C9C9";
    ctx.moveTo(width / 2, -8);
    ctx.lineTo(attachX, attachY);
    ctx.stroke();
  }

  function frame() {
    if (!dragging) {
      vx += (0 - x) * CARD_SPRING.stiffness;
      vy += (CARD_SPRING.restTop - y) * CARD_SPRING.stiffness;
      vx *= CARD_SPRING.damping;
      vy *= CARD_SPRING.damping;
      x += vx;
      y += vy;

      if (
        Math.abs(vx) < 0.02 &&
        Math.abs(vy) < 0.02 &&
        Math.abs(x) < 0.1 &&
        Math.abs(y - CARD_SPRING.restTop) < 0.1
      ) {
        x = 0;
        y = CARD_SPRING.restTop;
        vx = 0;
        vy = 0;
        running = false;
        draw();
        return;
      }
    }

    draw();
    requestAnimationFrame(frame);
  }

  function kick() {
    if (running) return;
    running = true;
    requestAnimationFrame(frame);
  }

  function reset() {
    dragging = false;
    running = false;
    vx = 0;
    vy = 0;
    x = 0;
    y = CARD_SPRING.restTop;
    card.classList.remove("is-dragging");
    fitCanvas();
    refreshMetrics();
    draw();
  }

  card.addEventListener("dragstart", function (event) {
    event.preventDefault();
  });

  card.addEventListener("pointerdown", function (event) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    event.preventDefault();
    refreshMetrics();
    dragging = true;
    startPointerX = event.clientX;
    startPointerY = event.clientY;
    startX = x;
    startY = y;
    card.classList.add("is-dragging");
    if (card.setPointerCapture) {
      try {
        card.setPointerCapture(event.pointerId);
      } catch (error) {
        /* pointer capture tidak tersedia */
      }
    }
  });

  card.addEventListener("pointermove", function (event) {
    if (!dragging) return;
    var width = hero.clientWidth;
    var height = hero.clientHeight;
    var maxOffsetX = Math.max(0, width / 2 - W / 2 - CARD_SPRING.edge);
    var maxY = Math.max(CARD_SPRING.minTop, height - H - CARD_SPRING.edge);

    x = clamp(startX + (event.clientX - startPointerX), -maxOffsetX, maxOffsetX);
    y = clamp(startY + (event.clientY - startPointerY), CARD_SPRING.minTop, maxY);
    draw();
  });

  function endDrag(event) {
    if (!dragging) return;
    dragging = false;
    card.classList.remove("is-dragging");
    if (card.releasePointerCapture && event.pointerId !== undefined) {
      try {
        card.releasePointerCapture(event.pointerId);
      } catch (error) {
        /* pointer capture tidak tersedia */
      }
    }
    kick();
  }

  card.addEventListener("pointerup", endDrag);
  card.addEventListener("pointercancel", endDrag);

  window.addEventListener("resize", reset);

  reset();
})();

(function () {
  var main = document.getElementById("showcaseMain");
  if (!main) return;

  var thumbs = Array.prototype.slice.call(document.querySelectorAll(".showcase__thumb"));
  if (!thumbs.length) return;

  var prev = document.getElementById("showcasePrev");
  var next = document.getElementById("showcaseNext");
  var caseLink = document.getElementById("showcaseCase");
  var moreLink = document.getElementById("showcaseMore");
  var active = -1;

  function select(index) {
    active = (index + thumbs.length) % thumbs.length;
    var thumb = thumbs[active];
    var caseHref = thumb.getAttribute("data-case");
    var moreHref = thumb.getAttribute("data-more");
    var moreLabel = thumb.getAttribute("data-more-label") || "Selengkapnya";
    var img = thumb.getAttribute("data-img");
    var bg = thumb.getAttribute("data-bg") || "#1a1a1a";

    if (img) {
      main.style.backgroundImage = "linear-gradient(180deg, rgba(10,10,10,0.02), rgba(10,10,10,0.28)), url('" + img + "')";
      main.style.backgroundSize = "cover";
      main.style.backgroundPosition = "center top";
      main.style.backgroundColor = bg;
    } else {
      main.style.backgroundImage = "";
      main.style.background = bg;
    }
    main.style.color = thumb.getAttribute("data-ink") || "#fff";
    main.textContent = thumb.getAttribute("data-title") || "";
    if (main.tagName === "A") main.href = caseHref || "#showcase";

    if (caseLink) caseLink.href = caseHref || "#showcase";

    if (moreLink) {
      if (moreHref) {
        moreLink.hidden = false;
        moreLink.href = moreHref;
        moreLink.innerHTML = moreLabel + ' <span aria-hidden="true">↗</span>';
        if (/^https?:\/\//.test(moreHref)) {
          moreLink.target = "_blank";
          moreLink.rel = "noopener noreferrer";
        } else {
          moreLink.removeAttribute("target");
          moreLink.removeAttribute("rel");
        }
      } else {
        moreLink.hidden = true;
      }
    }

    thumbs.forEach(function (item, i) {
      item.classList.toggle("is-active", i === active);
    });
  }

  thumbs.forEach(function (thumb, index) {
    thumb.addEventListener("click", function () {
      select(index);
    });
  });

  if (prev) {
    prev.addEventListener("click", function () {
      select(active - 1 < 0 ? thumbs.length - 1 : active - 1);
    });
  }

  if (next) {
    next.addEventListener("click", function () {
      select(active + 1);
    });
  }

  select(0);
})();

(function () {
  var section = document.getElementById("process");
  if (!section) return;

  var wrapper = section.querySelector(".process__wrapper");
  var card = section.querySelector(".process__card");
  var slide = section.querySelector(".process__slide");
  var title = section.querySelector(".process__title");
  var desc = section.querySelector(".process__desc");
  var tabs = Array.prototype.slice.call(section.querySelectorAll(".process__tab"));
  if (!wrapper || !card || !slide || !tabs.length) return;

  var steps = [
    ["Hard Skill", "Pengembangan web (PHP, Laravel, MySQL) · Perancangan & pengelolaan basis data · Analisis & perancangan sistem informasi · Analisis data dasar · Pengujian fungsional"],
    ["Soft Skill", "Ketelitian · Komunikasi efektif · Kerja sama tim · Manajemen waktu · Problem solving"],
    ["Data & Administrasi", "Pengolahan & rekapitulasi data · Administrasi dokumen · Pelayanan pengguna"]
  ];

  var current = -1;
  var fadeTimer = null;

  function updateText(index) {
    title.textContent = steps[index][0];
    desc.textContent = steps[index][1];
  }

  function applyStep(index, animate) {
    index = Math.max(0, Math.min(steps.length - 1, index));
    if (index === current) return;
    current = index;

    tabs.forEach(function (tab, i) {
      tab.classList.toggle("is-active", i === index);
      tab.setAttribute("aria-pressed", i === index ? "true" : "false");
    });

    if (!animate) {
      updateText(index);
      return;
    }

    slide.classList.add("is-fading");
    window.clearTimeout(fadeTimer);
    fadeTimer = window.setTimeout(function () {
      updateText(index);
      slide.classList.remove("is-fading");
    }, 200);
  }

  function travel() {
    return wrapper.offsetHeight - card.offsetHeight;
  }

  function getStep() {
    var rect = wrapper.getBoundingClientRect();
    var progress = -rect.top / travel();
    progress = Math.max(0, Math.min(0.9999, progress));
    return Math.floor(progress * steps.length);
  }

  function onScroll() {
    applyStep(getStep(), true);
  }

  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      var index = parseInt(tab.getAttribute("data-step"), 10) || 0;
      var rect = wrapper.getBoundingClientRect();
      var segment = travel() / steps.length;
      var target = window.scrollY + rect.top + segment * (index + 0.5);
      var smooth = !(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
      window.scrollTo({ top: target, behavior: smooth ? "smooth" : "auto" });
    });
  });

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);

  applyStep(getStep(), false);
})();

(function () {
  var faq = document.getElementById("faq");

  if (faq) {
    var items = faq.querySelectorAll(".faq__item");

    function setOpen(item, open) {
      var button = item.querySelector(".faq__question");
      var answer = item.querySelector(".faq__answer");
      item.classList.toggle("is-open", open);
      button.setAttribute("aria-expanded", open ? "true" : "false");
      answer.style.maxHeight = open ? answer.scrollHeight + "px" : "0px";
    }

    items.forEach(function (item) {
      var button = item.querySelector(".faq__question");
      button.addEventListener("click", function () {
        var isOpen = item.classList.contains("is-open");
        items.forEach(function (other) {
          if (other !== item) setOpen(other, false);
        });
        setOpen(item, !isOpen);
      });
    });

    window.addEventListener("resize", function () {
      items.forEach(function (item) {
        if (item.classList.contains("is-open")) {
          var answer = item.querySelector(".faq__answer");
          answer.style.maxHeight = answer.scrollHeight + "px";
        }
      });
    });
  }

  var form = document.querySelector(".contact__form");
  if (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
    });
  }
})();

(function () {
  var nav = document.querySelector(".nav");
  var toggle = document.getElementById("navToggle");
  var menu = document.getElementById("navMenu");
  if (!nav || !toggle || !menu) return;

  function setOpen(open) {
    nav.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute("aria-label", open ? "Tutup menu" : "Buka menu");
  }

  toggle.addEventListener("click", function () {
    setOpen(!nav.classList.contains("is-open"));
  });

  menu.addEventListener("click", function (event) {
    if (event.target.closest("a")) setOpen(false);
  });

  document.addEventListener("click", function (event) {
    if (nav.classList.contains("is-open") && !nav.contains(event.target)) {
      setOpen(false);
    }
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") setOpen(false);
  });

  window.addEventListener("resize", function () {
    if (window.innerWidth > 430) setOpen(false);
  });
})();

(function () {
  var topButton = document.querySelector(".footer__top");
  if (topButton) {
    topButton.addEventListener("click", function () {
      if ("scrollBehavior" in document.documentElement.style) {
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        window.scrollTo(0, 0);
      }
    });
  }
})();

(function () {
  var bar = document.getElementById("scrollProgressBar");
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav__menu a[href^="#"]'));
  if (!bar && !navLinks.length) return;

  var sections = navLinks.map(function (link) {
    var id = (link.getAttribute("href") || "").slice(1);
    return id ? document.getElementById(id) : null;
  }).filter(Boolean);

  function setProgress() {
    if (!bar) return;
    var doc = document.documentElement;
    var max = doc.scrollHeight - window.innerHeight;
    var pct = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    bar.style.transform = "scaleX(" + pct + ")";
  }

  function setActive() {
    if (!sections.length) return;
    var current = sections[0];
    var offset = 140;
    sections.forEach(function (section) {
      var top = section.getBoundingClientRect().top;
      if (top - offset <= 0) current = section;
    });
    var currentId = current ? current.id : "";
    navLinks.forEach(function (link) {
      var match = (link.getAttribute("href") || "").slice(1) === currentId;
      link.classList.toggle("is-active", match);
      if (match) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      setProgress();
      setActive();
      ticking = false;
    });
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  window.addEventListener("hashchange", function () { window.setTimeout(onScroll, 0); });
  onScroll();
})();
