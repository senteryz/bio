/* ============================================================
   Main interactions
   loader · cursor · mobile menu · reveals · counters · faq · form
   ============================================================ */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------- Loader ---------- */
  var loader = document.getElementById('loader');
  function revealPage() {
    if (!loader) return;
    loader.classList.add('hidden');
    document.body.classList.add('loaded');
  }
  window.addEventListener('load', function () {
    setTimeout(revealPage, reduce ? 0 : 850);
  });
  setTimeout(revealPage, 3000); // safety fallback

  /* ---------- Custom cursor ---------- */
  var cursor = document.getElementById('cursor');
  var follower = document.getElementById('cursorFollower');

  if (finePointer && cursor && follower && !reduce) {
    var cx = 0, cy = 0, fx = 0, fy = 0;

    document.addEventListener('pointermove', function (e) {
      cx = e.clientX;
      cy = e.clientY;
      cursor.style.transform = 'translate(' + cx + 'px,' + cy + 'px) translate(-50%,-50%)';
    });

    (function loop() {
      fx += (cx - fx) * 0.14;
      fy += (cy - fy) * 0.14;
      follower.style.transform = 'translate(' + fx + 'px,' + fy + 'px) translate(-50%,-50%)';
      requestAnimationFrame(loop);
    })();

    document.querySelectorAll('a, button, input, textarea, .work-card, .svc, .price-card, .quote-card').forEach(function (el) {
      el.addEventListener('pointerenter', function () { follower.classList.add('hovering'); });
      el.addEventListener('pointerleave', function () { follower.classList.remove('hovering'); });
    });
  }

  /* ---------- Mobile menu ---------- */
  var burger = document.getElementById('burger');
  var mobileMenu = document.getElementById('mobileMenu');

  if (burger && mobileMenu) {
    function toggleMenu(open) {
      var isOpen = typeof open === 'boolean' ? open : !mobileMenu.classList.contains('open');
      mobileMenu.classList.toggle('open', isOpen);
      burger.classList.toggle('open', isOpen);
      burger.setAttribute('aria-expanded', String(isOpen));
      burger.setAttribute('aria-label', isOpen ? 'Закрыть меню' : 'Открыть меню');
      mobileMenu.setAttribute('aria-hidden', String(!isOpen));
      document.body.style.overflow = isOpen ? 'hidden' : '';
    }

    burger.addEventListener('click', function () { toggleMenu(); });
    mobileMenu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () { toggleMenu(false); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && mobileMenu.classList.contains('open')) toggleMenu(false);
    });
  }

  /* ---------- Scroll reveal ---------- */
  var revealObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var el = entry.target;
      var siblings = Array.prototype.filter.call(el.parentElement.children, function (c) {
        return c.classList.contains('fade-up');
      });
      var index = siblings.indexOf(el);
      el.style.transitionDelay = reduce ? '0ms' : Math.min(index * 70, 350) + 'ms';
      el.classList.add('visible');
      revealObserver.unobserve(el);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.fade-up').forEach(function (el) { revealObserver.observe(el); });

  /* ---------- Animated counters ---------- */
  function animateCount(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var suffix = el.getAttribute('data-suffix') || '';
    if (reduce) { el.textContent = target + suffix; return; }

    var duration = 1500, start = null;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(eased * target) + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  var countObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        animateCount(entry.target);
        countObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('.stat-value').forEach(function (el) { countObserver.observe(el); });

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll('.faq-item').forEach(function (item) {
    var btn = item.querySelector('.faq-q');
    var ans = item.querySelector('.faq-a');
    if (!btn || !ans) return;

    btn.setAttribute('aria-expanded', 'false');
    btn.addEventListener('click', function () {
      var isOpen = item.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(isOpen));
      ans.style.maxHeight = isOpen ? ans.scrollHeight + 'px' : '0px';
    });
  });

  /* ---------- Portfolio filter ---------- */
  var filterBtns = document.querySelectorAll('.filter-btn');
  var workCards = document.querySelectorAll('#workGrid .work-card');

  if (filterBtns.length && workCards.length) {
    filterBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var filter = btn.getAttribute('data-filter');
        filterBtns.forEach(function (b) { b.classList.remove('is-active'); });
        btn.classList.add('is-active');

        workCards.forEach(function (card) {
          var match = filter === 'all' || card.getAttribute('data-cat') === filter;
          card.classList.toggle('is-hidden', !match);
        });
      });
    });
  }

  /* ---------- Contact form ---------- */
  var form = document.getElementById('contactForm');
  if (form) {
    var submitBtn = document.getElementById('submitBtn');
    var formSuccess = document.getElementById('formSuccess');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      submitBtn.disabled = true;
      submitBtn.textContent = 'Отправка...';

      setTimeout(function () {
        submitBtn.textContent = 'Отправить заявку';
        submitBtn.disabled = false;
        formSuccess.textContent = 'Спасибо! Заявка получена — свяжусь с вами в ближайшее время.';
        form.reset();
        setTimeout(function () { formSuccess.textContent = ''; }, 6000);
      }, 900);
    });
  }
  /* ---------- Reviews Swiper ---------- */
  if (typeof Swiper !== 'undefined' && document.querySelector('.reviews-swiper')) {
    new Swiper('.reviews-swiper', {
      slidesPerView: 1,
      spaceBetween: 24,
      loop: true,
      grabCursor: true,
      speed: 500,
      autoHeight: false,
      pagination: {
        el: '.swiper-pagination',
        clickable: true,
      },
      navigation: {
        nextEl: '.reviews-next',
        prevEl: '.reviews-prev',
      },
      breakpoints: {
        640: {
          slidesPerView: 1.3,
          spaceBetween: 20,
        },
        900: {
          slidesPerView: 2,
          spaceBetween: 24,
        },
        1200: {
          slidesPerView: 2.5,
          spaceBetween: 28,
        }
      }
    });
  }
})();
  
/* ---------- Typing search animation ---------- */
(function () {
  var el = document.getElementById('typed-search-text');
  if (!el) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var phrases = [
    'заказать сайт для салона красоты',
    'заказать сайт для бизнеса',
    'разработка интернет-магазина под ключ',
    'корпоративный сайт для строительной компании',
    'лендинг для онлайн-школы',
    'сайт-визитка для стоматологии',
    'редизайн сайта под ключ'
  ];
  if (reduce) { el.textContent = phrases[0]; return; }

  var pi = 0, ci = 0, deleting = false;

  function tick() {
    var word = phrases[pi];
    if (!deleting) {
      ci++;
      el.textContent = word.slice(0, ci);
      if (ci === word.length) {
        deleting = true;
        return setTimeout(tick, 1600);
      }
      return setTimeout(tick, 55 + Math.random() * 55);
    } else {
      ci--;
      el.textContent = word.slice(0, ci);
      if (ci === 0) {
        deleting = false;
        pi = (pi + 1) % phrases.length;
        return setTimeout(tick, 350);
      }
      return setTimeout(tick, 28);
    }
  }
  setTimeout(tick, 600);
})();

/* ============================================================
   Process slider — smooth range + step markers + content sync
   ============================================================ */
(function () {
  var input = document.getElementById('processRangeInput');
  var activeBar = document.getElementById('processTrackActive');
  if (!input) return;

  var markers = Array.prototype.slice.call(document.querySelectorAll('.step-marker'));
  var slides = Array.prototype.slice.call(document.querySelectorAll('.process-slide'));
  var min = parseFloat(input.min) || 1;
  var max = parseFloat(input.max) || 4;

  // Allow smooth (fractional) dragging
  input.step = '0.001';

  function apply(rawVal, animate) {
    var val = parseFloat(rawVal);
    if (isNaN(val)) val = min;
    if (val < min) val = min;
    if (val > max) val = max;

    var step = Math.round(val);

    // Track fill follows raw fractional value → smooth motion
    var pct = ((val - min) / (max - min)) * 100;
    if (activeBar) {
      activeBar.style.transition = animate ? '' : 'none';
      activeBar.style.width = pct + '%';
    }

    // Markers / slides use nearest step
    markers.forEach(function (m) {
      var s = parseInt(m.getAttribute('data-step'), 10);
      m.classList.toggle('active', s === step);
    });
    slides.forEach(function (sl) {
      var s = parseInt(sl.getAttribute('data-step'), 10);
      sl.classList.toggle('active', s === step);
    });
  }

  // Live drag — smooth (fractional).
  input.addEventListener('input', function () { apply(input.value, false); });
  // On release, snap to integer step
  input.addEventListener('change', function () {
    var snapped = Math.round(parseFloat(input.value));
    input.value = snapped;
    apply(snapped, true);
  });
  input.addEventListener('pointerup', function () {
    var snapped = Math.round(parseFloat(input.value));
    input.value = snapped;
    apply(snapped, true);
  });

  markers.forEach(function (m) {
    m.addEventListener('click', function () {
      var s = parseInt(m.getAttribute('data-step'), 10);
      input.value = s;
      apply(s, true);
    });
  });

  // Init
  apply(parseFloat(input.value) || 1, false);
})();

/* ============================================================
   Reviews swiper — override: always 1 slide per view
   ============================================================ */
(function () {
  if (typeof Swiper === 'undefined') return;
  var el = document.querySelector('.reviews-swiper');
  if (!el || el.swiper) {
    // If a prior init happened with different config, destroy it and redo
    if (el && el.swiper) el.swiper.destroy(true, true);
  }
  if (!el) return;

  new Swiper('.reviews-swiper', {
    slidesPerView: 1.15,
    spaceBetween: 24,
    loop: true,
    grabCursor: true,
    speed: 550,
    centeredSlides: false,
    autoHeight: true,
    breakpoints: {
      640: { slidesPerView: 1.2, spaceBetween: 28 },
      1024: { slidesPerView: 1.25, spaceBetween: 32 }
    },
    pagination: {
      el: '.reviews-pagination',
      clickable: true,
    },
    navigation: {
      nextEl: '.reviews-next',
      prevEl: '.reviews-prev',
    },
  });
})();

/* ============================================================
   Portfolio swiper init
   ============================================================ */
(function () {
  if (typeof Swiper === 'undefined') return;
  var el = document.querySelector('.portfolio-swiper');
  if (!el) return;
  if (el.swiper) el.swiper.destroy(true, true);

  var swiper = new Swiper('.portfolio-swiper', {
    slidesPerView: 1,
    spaceBetween: 20,
    speed: 500,
    grabCursor: true,
    pagination: {
      el: '.portfolio-swiper-pagination',
      clickable: true,
    },
    navigation: {
      nextEl: '.portfolio-swiper-next',
      prevEl: '.portfolio-swiper-prev',
    },
  });

  // Category filter
  var filterBtns = document.querySelectorAll('.filter-row .filter-btn');
  var slides = Array.prototype.slice.call(document.querySelectorAll('.portfolio-slide'));
  filterBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      filterBtns.forEach(function (b) { b.classList.remove('is-active'); });
      btn.classList.add('is-active');
      var f = btn.getAttribute('data-filter');
      slides.forEach(function (sl) {
        var cat = sl.getAttribute('data-cat');
        sl.style.display = (f === 'all' || f === cat) ? '' : 'none';
      });
      swiper.update();
      swiper.slideTo(0);
    });
  });
})();

/* ============================================================
   Pricing swiper init (on pricing.html)
   ============================================================ */
(function () {
  if (typeof Swiper === 'undefined') return;
  var el = document.querySelector('.pricing-swiper');
  if (!el) return;
  if (el.swiper) el.swiper.destroy(true, true);
  new Swiper('.pricing-swiper', {
    slidesPerView: 1,
    spaceBetween: 20,
    speed: 500,
    grabCursor: true,
    breakpoints: {
      720:  { slidesPerView: 2, spaceBetween: 22 },
      1100: { slidesPerView: 3, spaceBetween: 24 },
    },
    navigation: {
      nextEl: '.pricing-swiper-next',
      prevEl: '.pricing-swiper-prev',
    },
  });
})();
