/* ============================================================
   Main interactions: loader, cursor, nav, reveals, counters, form
   ============================================================ */
(function () {
  'use strict';

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Loader ---------- */
  var loader = document.getElementById('loader');
  window.addEventListener('load', function () {
    setTimeout(function () {
      loader.classList.add('hidden');
      document.body.classList.add('loaded');
    }, prefersReducedMotion ? 0 : 900);
  });
  // Fallback in case load event is slow
  setTimeout(function () {
    loader.classList.add('hidden');
    document.body.classList.add('loaded');
  }, 3000);

  /* ---------- Custom cursor ---------- */
  var cursor = document.getElementById('cursor');
  var follower = document.getElementById('cursorFollower');
  var hasFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  if (hasFinePointer && cursor && follower && !prefersReducedMotion) {
    var cx = 0, cy = 0, fx = 0, fy = 0;

    document.addEventListener('pointermove', function (e) {
      cx = e.clientX;
      cy = e.clientY;
      cursor.style.transform = 'translate(' + cx + 'px,' + cy + 'px) translate(-50%,-50%)';
    });

    (function followLoop() {
      fx += (cx - fx) * 0.12;
      fy += (cy - fy) * 0.12;
      follower.style.transform = 'translate(' + fx + 'px,' + fy + 'px) translate(-50%,-50%)';
      requestAnimationFrame(followLoop);
    })();

    var hoverTargets = document.querySelectorAll('a, button, input, textarea, .glass-card, .work-card, .price-card');
    hoverTargets.forEach(function (el) {
      el.addEventListener('pointerenter', function () {
        follower.classList.add('hovering');
      });
      el.addEventListener('pointerleave', function () {
        follower.classList.remove('hovering');
      });
    });
  }

  /* ---------- Nav scroll state ---------- */
  var nav = document.getElementById('nav');
  var lastScrollHandler = function () {
    if (window.scrollY > 40) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  };
  window.addEventListener('scroll', lastScrollHandler, { passive: true });
  lastScrollHandler();

  /* ---------- Mobile menu ---------- */
  var burger = document.getElementById('burger');
  var mobileMenu = document.getElementById('mobileMenu');

  function toggleMenu(open) {
    var isOpen = typeof open === 'boolean' ? open : !mobileMenu.classList.contains('open');
    mobileMenu.classList.toggle('open', isOpen);
    burger.classList.toggle('open', isOpen);
    burger.setAttribute('aria-expanded', String(isOpen));
    burger.setAttribute('aria-label', isOpen ? 'Закрыть меню' : 'Открыть меню');
    mobileMenu.setAttribute('aria-hidden', String(!isOpen));
    document.body.style.overflow = isOpen ? 'hidden' : '';
  }

  burger.addEventListener('click', function () {
    toggleMenu();
  });

  mobileMenu.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () {
      toggleMenu(false);
    });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && mobileMenu.classList.contains('open')) {
      toggleMenu(false);
    }
  });

  /* ---------- Scroll reveal (fade-up) ---------- */
  var revealObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          // Stagger siblings slightly
          var el = entry.target;
          var siblings = Array.prototype.filter.call(
            el.parentElement.children,
            function (c) { return c.classList.contains('fade-up'); }
          );
          var index = siblings.indexOf(el);
          el.style.transitionDelay = prefersReducedMotion ? '0ms' : Math.min(index * 80, 400) + 'ms';
          el.classList.add('visible');
          revealObserver.unobserve(el);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  document.querySelectorAll('.fade-up').forEach(function (el) {
    revealObserver.observe(el);
  });

  /* ---------- Animated counters ---------- */
  function animateCount(el) {
    var target = parseInt(el.getAttribute('data-count'), 10);
    var suffix = el.getAttribute('data-suffix') || '';

    if (prefersReducedMotion) {
      el.textContent = target + suffix;
      return;
    }

    var duration = 1600;
    var start = null;

    function step(ts) {
      if (!start) start = ts;
      var progress = Math.min((ts - start) / duration, 1);
      // ease-out cubic
      var eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(eased * target) + suffix;
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  var countObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          countObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );

  document.querySelectorAll('.stat-value').forEach(function (el) {
    countObserver.observe(el);
  });

  /* ---------- Work slider ---------- */
  var workTrack = document.getElementById('workTrack');
  var workPrev = document.getElementById('workPrev');
  var workNext = document.getElementById('workNext');
  var workDots = document.getElementById('workDots');

  if (workTrack && workPrev && workNext && workDots) {
    var slides = workTrack.querySelectorAll('.work-slide');

    function slideStep() {
      var slide = slides[0];
      var gap = parseFloat(getComputedStyle(workTrack).gap) || 0;
      return slide.getBoundingClientRect().width + gap;
    }

    function pageCount() {
      return Math.max(1, Math.round((workTrack.scrollWidth - workTrack.clientWidth) / slideStep()) + 1);
    }

    function currentPage() {
      return Math.round(workTrack.scrollLeft / slideStep());
    }

    function buildDots() {
      workDots.innerHTML = '';
      var total = pageCount();
      for (var i = 0; i < total; i++) {
        var dot = document.createElement('button');
        dot.className = 'slider-dot';
        dot.setAttribute('role', 'tab');
        dot.setAttribute('aria-label', 'Слайд ' + (i + 1));
        (function (index) {
          dot.addEventListener('click', function () {
            workTrack.scrollTo({ left: index * slideStep(), behavior: prefersReducedMotion ? 'auto' : 'smooth' });
          });
        })(i);
        workDots.appendChild(dot);
      }
      updateSliderUI();
    }

    function updateSliderUI() {
      var page = currentPage();
      var dots = workDots.querySelectorAll('.slider-dot');
      dots.forEach(function (d, i) {
        d.classList.toggle('active', i === page);
        d.setAttribute('aria-selected', String(i === page));
      });
      workPrev.disabled = workTrack.scrollLeft <= 4;
      workNext.disabled = workTrack.scrollLeft >= workTrack.scrollWidth - workTrack.clientWidth - 4;
    }

    workPrev.addEventListener('click', function () {
      workTrack.scrollBy({ left: -slideStep(), behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    });

    workNext.addEventListener('click', function () {
      workTrack.scrollBy({ left: slideStep(), behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    });

    var scrollRaf;
    workTrack.addEventListener('scroll', function () {
      cancelAnimationFrame(scrollRaf);
      scrollRaf = requestAnimationFrame(updateSliderUI);
    }, { passive: true });

    workTrack.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        workPrev.click();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        workNext.click();
      }
    });

    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(buildDots, 200);
    });

    buildDots();
  }

  /* ---------- 3D tilt on pricing cards ---------- */
  if (hasFinePointer && !prefersReducedMotion) {
    document.querySelectorAll('.tilt-card').forEach(function (card) {
      var rafId = null;
      var targetRX = 0, targetRY = 0;
      var maxTilt = 7;

      function applyTilt() {
        card.style.transform = 'rotateX(' + targetRX + 'deg) rotateY(' + targetRY + 'deg)';
        rafId = null;
      }

      card.addEventListener('pointermove', function (e) {
        var rect = card.getBoundingClientRect();
        var px = (e.clientX - rect.left) / rect.width;
        var py = (e.clientY - rect.top) / rect.height;
        targetRY = (px - 0.5) * 2 * maxTilt;
        targetRX = -(py - 0.5) * 2 * maxTilt;
        card.style.setProperty('--shine-x', (px * 100) + '%');
        card.style.setProperty('--shine-y', (py * 100) + '%');
        if (!rafId) rafId = requestAnimationFrame(applyTilt);
      });

      card.addEventListener('pointerleave', function () {
        if (rafId) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
        card.style.transition = 'transform 0.6s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.5s';
        card.style.transform = 'rotateX(0deg) rotateY(0deg)';
        setTimeout(function () {
          card.style.transition = '';
        }, 600);
      });
    });
  }

  /* ---------- Contact form ---------- */
  var form = document.getElementById('contactForm');
  var submitBtn = document.getElementById('submitBtn');
  var formSuccess = document.getElementById('formSuccess');

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    submitBtn.disabled = true;
    submitBtn.textContent = 'Отправка...';

    // Simulated submit (no backend on a static site)
    setTimeout(function () {
      submitBtn.textContent = 'Отправить заявку';
      submitBtn.disabled = false;
      formSuccess.textContent = 'Спасибо! Заявка получена — свяжусь с вами в ближайшее время.';
      form.reset();
      setTimeout(function () {
        formSuccess.textContent = '';
      }, 6000);
    }, 900);
  });
})();
