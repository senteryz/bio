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
    try {
      sessionStorage.setItem('visited', 'true');
    } catch (e) {}
  }
  if (document.documentElement.classList.contains('no-loader')) {
    revealPage();
  } else {
    window.addEventListener('load', function () {
      setTimeout(revealPage, reduce ? 0 : 850);
    });
    setTimeout(revealPage, 3000); // safety fallback
  }

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

    // Parse URL parameters for contact form pre-fill
    var urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('type')) {
      var typeVal = urlParams.get('type');
      var radio = form.querySelector('input[name="project_type"][value="' + typeVal + '"]');
      if (radio) radio.checked = true;
    }
    if (urlParams.has('budget')) {
      var budgetVal = urlParams.get('budget');
      var radio = form.querySelector('input[name="budget"][value="' + budgetVal + '"]');
      if (radio) radio.checked = true;
    }
    if (urlParams.has('msg')) {
      var msgField = form.querySelector('textarea[name="message"]');
      if (msgField) msgField.value = urlParams.get('msg');
    }

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
      autoHeight: true,
      pagination: {
        el: '.swiper-pagination',
        clickable: true,
      },
      navigation: {
        nextEl: '.reviews-next',
        prevEl: '.reviews-prev',
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
    slidesPerView: 1,
    spaceBetween: 24,
    loop: true,
    grabCursor: true,
    speed: 550,
    centeredSlides: true,
    autoHeight: true,
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
   Portfolio Bento Grid Filtering
   ============================================================ */
window.initPortfolioFilters = function () {
  var filterBtns = document.querySelectorAll('.filter-row .filter-btn');
  var cards = document.querySelectorAll('.portfolio-grid .portfolio-card');
  if (!filterBtns.length || !cards.length) return;

  // Clear existing listeners to prevent duplicates
  filterBtns.forEach(function (btn) {
    var newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
  });
  filterBtns = document.querySelectorAll('.filter-row .filter-btn');

  filterBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      // 1. Update active button state
      filterBtns.forEach(function (b) { b.classList.remove('is-active'); });
      btn.classList.add('is-active');

      var filter = btn.getAttribute('data-filter');

      cards.forEach(function (card) {
        var cat = card.getAttribute('data-cat');
        var match = (filter === 'all' || filter === cat);

        if (match) {
          // Fade in matching items
          card.classList.remove('is-hidden');
          void card.offsetWidth;
          card.style.opacity = '1';
          card.style.transform = 'translateY(0) scale(1)';
        } else {
          // Fade out and hide non-matching items
          card.style.opacity = '0';
          card.style.transform = 'translateY(12px) scale(0.98)';
          
          var onTransitionEnd = function (e) {
            if (e.propertyName === 'opacity' && card.style.opacity === '0') {
              card.classList.add('is-hidden');
              card.removeEventListener('transitionend', onTransitionEnd);
            }
          };
          card.addEventListener('transitionend', onTransitionEnd);
          
          setTimeout(function () {
            if (card.style.opacity === '0') {
              card.classList.add('is-hidden');
            }
          }, 350);
        }
      });
    });
  });
};

// Run automatically in case of static HTML loading
setTimeout(window.initPortfolioFilters, 100);

/* ============================================================
   Dynamic Data Loader (AJAX JSON Integration)
   ============================================================ */
(function () {
  const isPricingPage = !!document.querySelector('.pricing-swiper');
  const isPortfolioPage = !!document.getElementById('portfolioGrid');
  const isPrivacyPage = !!document.getElementById('privacyContent');

  if (!isPricingPage && !isPortfolioPage && !isPrivacyPage) return;

  fetch('/api/get-data')
    .then(res => {
      if (!res.ok) throw new Error('Failed to fetch data');
      return res.json();
    })
    .then(data => {
      if (isPricingPage && data.pricing) {
        renderPricing(data.pricing);
      }
      if (isPortfolioPage && data.portfolio) {
        renderPortfolio(data.portfolio);
      }
      if (isPrivacyPage && data.privacy) {
        renderPrivacy(data.privacy);
      }
    })
    .catch(err => console.error('Error fetching dynamic data:', err));

  function renderPricing(plans) {
    const wrapper = document.querySelector('.pricing-swiper .swiper-wrapper');
    if (!wrapper) return;

    let html = '';
    plans.forEach(plan => {
      const featuredClass = plan.featured ? ' pricing-card-featured' : '';
      const buttonClass = plan.featured ? 'btn-light' : 'btn-dark';
      
      let featuresHtml = '';
      plan.features.forEach(feat => {
        let strokeColor = '#3b82f6';
        let fillColor = 'rgba(59, 130, 246, 0.1)';
        if (plan.id === 'multipage') { strokeColor = '#f59e0b'; fillColor = 'rgba(245, 158, 11, 0.1)'; }
        if (plan.id === 'corp') { strokeColor = '#10b981'; fillColor = 'rgba(16, 185, 129, 0.1)'; }
        if (plan.id === 'shop') { strokeColor = '#8b5cf6'; fillColor = 'rgba(139, 92, 246, 0.1)'; }
        if (plan.featured) { strokeColor = '#ffffff'; fillColor = 'rgba(255, 255, 255, 0.15)'; }

        featuresHtml += `
          <li>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="plan-feature-ico">
              <circle cx="12" cy="12" r="10" fill="${fillColor}" stroke="${strokeColor}"/>
              <path d="M8 12l3 3 5-5" stroke="${plan.featured ? '#ffffff' : '#10b981'}"/>
            </svg>
            ${feat}
          </li>`;
      });

      html += `
        <div class="swiper-slide pricing-card${featuredClass}">
          <h3 class="plan-name">${plan.name}</h3>
          <div class="plan-price">
            <span class="price-val">${plan.price}</span>
          </div>
          <div class="plan-term">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="plan-term-ico">
              <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
            </svg>
            <span>${plan.term}</span>
          </div>
          <p class="plan-desc">${plan.desc}</p>
          <hr class="plan-divider" />
          <ul class="plan-features">
            ${featuresHtml}
          </ul>
          <a href="contact.html?plan=${plan.id}" class="btn ${buttonClass} plan-btn">Начать проект</a>
        </div>`;
    });

    wrapper.innerHTML = html;

    // Initialize Swiper after slides are loaded
    if (typeof Swiper !== 'undefined') {
      const el = document.querySelector('.pricing-swiper');
      if (el.swiper) el.swiper.destroy(true, true);
      new Swiper('.pricing-swiper', {
        slidesPerView: 1,
        spaceBetween: 20,
        loop: true,
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
    }
  }

  function renderPortfolio(items) {
    const grid = document.getElementById('portfolioGrid');
    if (!grid) return;

    let html = '';
    items.forEach(item => {
      const spanClass = item.spanClass ? ` ${item.spanClass}` : '';
      const className = item.className || 'project-custom';
      
      let stackHtml = '';
      item.stack.forEach(tech => {
        stackHtml += `<span>${tech}</span>`;
      });

      html += `
        <a href="${item.link || 'contact.html'}" ${item.link ? 'target="_blank" rel="noopener"' : ''} class="portfolio-card${spanClass} ${className}" data-cat="${item.category}">
          <div class="portfolio-card-image">
            <img src="${item.photo}" alt="${item.title} — ${item.categoryText}" loading="lazy" />
            <div class="work-hover-arrow" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </div>
          </div>
          <div class="portfolio-card-info">
            <div class="portfolio-card-header">
              <span class="portfolio-card-category">${item.categoryText}</span>
              <span class="portfolio-card-year">${item.year}</span>
            </div>
            <h3 class="portfolio-card-title">${item.title}</h3>
            <p class="portfolio-card-desc">${item.desc}</p>
            <div class="portfolio-card-stack">
              ${stackHtml}
            </div>
            <div class="portfolio-card-meta">
              <div class="meta-item">
                <span class="meta-label">Роль</span>
                <span class="meta-val">${item.role}</span>
              </div>
            </div>
            <span class="btn btn-dark btn-small portfolio-card-btn">${item.link ? 'Перейти на сайт →' : 'Обсудить проект →'}</span>
          </div>
        </a>`;
    });

    grid.innerHTML = html;

    // Trigger categories filtering
    if (window.initPortfolioFilters) {
      window.initPortfolioFilters();
    }
  }

  function renderPrivacy(privacy) {
    const contentDiv = document.getElementById('privacyContent');
    if (!contentDiv) return;

    let html = `<p>${privacy.intro}</p>`;
    privacy.sections.forEach(sec => {
      html += `
        <h2 style="font-size: 1.5rem; font-weight: 700; color: var(--ink); margin: 32px 0 16px;">${sec.title}</h2>
        <p style="white-space: pre-line;">${sec.content}</p>`;
    });

    contentDiv.innerHTML = html;
  }
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
    loop: true,
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

/* ============================================================
   Interactive Price Calculator (on services.html)
   ============================================================ */
(function () {
  var container = document.querySelector('.calc-container');
  if (!container) return;

  var tabs = container.querySelectorAll('.calc-tab');
  var pagesOption = container.querySelector('#pagesOption');
  var pagesRange = container.querySelector('#pagesRange');
  var pagesVal = container.querySelector('#pagesVal');
  var shopIntegrationAddon = container.querySelector('#shopIntegrationAddon');
  var checkboxes = container.querySelectorAll('.calc-addon input');
  var calcPrice = container.querySelector('#calcPrice');
  var calcDays = container.querySelector('#calcDays');
  var calcSubmitBtn = container.querySelector('#calcSubmitBtn');

  var currentType = 'onepage';

  function calculate() {
    var basePrice = 3000;
    var baseDays = 2;

    // Determine active tab values
    var activeTab = container.querySelector('.calc-tab.active');
    if (activeTab) {
      currentType = activeTab.dataset.type;
      basePrice = parseInt(activeTab.dataset.price, 10);
      baseDays = parseInt(activeTab.dataset.days, 10);
    }

    // Show/hide pages range based on type
    if (currentType === 'onepage') {
      pagesOption.style.display = 'none';
    } else {
      pagesOption.style.display = 'block';
      var pageCount = parseInt(pagesRange.value, 10);
      pagesVal.textContent = pageCount;

      // Calculate pages cost based on pricing.html values
      if (currentType === 'multipage') {
        pagesRange.min = 2;
        pagesRange.max = 30;
        if (pageCount > 30) { pagesRange.value = 30; pageCount = 30; }
        if (pageCount < 2)  { pagesRange.value = 2;  pageCount = 2;  }
        pagesVal.textContent = pageCount;

        var extraPages = Math.max(0, pageCount - 2);
        basePrice += extraPages * 1000;
        baseDays  += Math.ceil(extraPages * 0.5);
      } else if (currentType === 'corp') {
        pagesRange.min = 5;
        pagesRange.max = 30;
        if (pageCount > 30) { pagesRange.value = 30; pageCount = 30; }
        if (pageCount < 5)  { pagesRange.value = 5;  pageCount = 5;  }
        pagesVal.textContent = pageCount;

        var extraPages = Math.max(0, pageCount - 5);
        basePrice += extraPages * 1500;
        baseDays  += Math.ceil(extraPages * 0.5);
      } else if (currentType === 'shop') {
        pagesRange.min = 5;
        pagesRange.max = 30;
        if (pageCount > 30) { pagesRange.value = 30; pageCount = 30; }
        if (pageCount < 5)  { pagesRange.value = 5;  pageCount = 5;  }
        pagesVal.textContent = pageCount;

        var extraPages = Math.max(0, pageCount - 5);
        basePrice += extraPages * 2000;
        baseDays  += Math.ceil(extraPages * 0.5);
      }
    }

    // Show/hide shop integration checkbox
    if (currentType === 'shop') {
      shopIntegrationAddon.style.display = 'block';
    } else {
      shopIntegrationAddon.style.display = 'none';
      var integrationCheck = shopIntegrationAddon.querySelector('input');
      if (integrationCheck) integrationCheck.checked = false;
    }

    // Calculate checkboxes
    checkboxes.forEach(function (cb) {
      if (cb.checked && cb.closest('.calc-addon').style.display !== 'none') {
        basePrice += parseInt(cb.dataset.price, 10);
        baseDays += parseInt(cb.dataset.days, 10);
      }
    });

    // Animate price display
    animatePrice(basePrice);
    calcDays.textContent = baseDays;
  }

  var animationTimer;
  function animatePrice(targetPrice) {
    var current = parseInt(calcPrice.textContent.replace(/\s/g, ''), 10) || 0;
    if (current === targetPrice) return;
    
    clearInterval(animationTimer);
    var duration = 300;
    var start = performance.now();

    animationTimer = setInterval(function () {
      var elapsed = performance.now() - start;
      var progress = Math.min(elapsed / duration, 1);
      var currentVal = Math.round(current + (targetPrice - current) * progress);
      calcPrice.textContent = currentVal.toLocaleString('ru-RU');
      if (progress === 1) clearInterval(animationTimer);
    }, 16);
  }

  // Event listeners
  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      tabs.forEach(function (t) { t.classList.remove('active'); });
      tab.classList.add('active');
      
      // Reset pages value when switching types to avoid limits index issues
      if (tab.dataset.type === 'multipage') pagesRange.value = 5;
      if (tab.dataset.type === 'corp') pagesRange.value = 10;
      if (tab.dataset.type === 'shop') pagesRange.value = 15;

      calculate();
    });
  });

  pagesRange.addEventListener('input', calculate);

  checkboxes.forEach(function (cb) {
    cb.addEventListener('change', calculate);
  });

  calcSubmitBtn.addEventListener('click', function () {
    var price = parseInt(calcPrice.textContent.replace(/\s/g, ''), 10);
    var days = calcDays.textContent;
    
    var typeText = 'Лендинг';
    var contactType = 'landing';
    if (currentType === 'multipage') { typeText = 'Многостраничный сайт (' + pagesRange.value + ' стр.)'; contactType = 'corp'; }
    if (currentType === 'corp') { typeText = 'Корпоративный сайт (' + pagesRange.value + ' стр.)'; contactType = 'corp'; }
    if (currentType === 'shop') { typeText = 'Интернет-магазин (' + pagesRange.value + ' стр.)'; contactType = 'shop'; }

    var additions = [];
    checkboxes.forEach(function (cb) {
      if (cb.checked && cb.closest('.calc-addon').style.display !== 'none') {
        if (cb.value === 'design') additions.push('уникальный дизайн');
        if (cb.value === 'cms') additions.push('CMS');
        if (cb.value === 'seo') additions.push('SEO');
        if (cb.value === 'integration') additions.push('интеграция 1С');
      }
    });

    var budgetCode = '30-70';
    if (price > 120000) budgetCode = '120+';
    else if (price > 70000) budgetCode = '70-120';

    var messageText = 'Расчет на калькуляторе:\n' + typeText + '.\nСтоимость: ' + price.toLocaleString('ru-RU') + ' ₽, Сроки: ' + days + ' дней.';
    if (additions.length > 0) {
      messageText += '\nОпции: ' + additions.join(', ') + '.';
    }

    var url = 'contact.html?type=' + contactType + '&budget=' + budgetCode + '&msg=' + encodeURIComponent(messageText);
    window.location.href = url;
  });

  calculate();
})();

