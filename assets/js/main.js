/* RobinHood Alliance — site-wide behaviour
   Vanilla JS, no dependencies. Everything here is presentational:
   no data is ever sent anywhere. */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    markActiveNav();
    setupMobileNav();
    setupStickyHeader();
    setupCounters();
    setupAccordions();
    setupReveal();
    setupDemoForms();
    setupImageFallbacks();
    setupTableHints();
    setCurrentYear();
  });

  /* ---------- Active navigation state ---------------------------------- */
  function markActiveNav() {
    var path = window.location.pathname.split('/').pop() || 'index.html';
    var links = document.querySelectorAll('.nav__list a');
    Array.prototype.forEach.call(links, function (link) {
      var href = link.getAttribute('href');
      if (!href) return;
      if (href.split('#')[0] === path) {
        link.classList.add('is-active');
        link.setAttribute('aria-current', 'page');
      }
    });
  }

  /* ---------- Mobile navigation ---------------------------------------- */
  function setupMobileNav() {
    var toggle = document.getElementById('navToggle');
    var nav = document.getElementById('primaryNav');
    if (!toggle || !nav) return;

    var backdrop = document.createElement('div');
    backdrop.className = 'nav-backdrop';
    document.body.appendChild(backdrop);

    function close() {
      nav.classList.remove('is-open');
      backdrop.classList.remove('is-open');
      document.body.classList.remove('nav-open');
      toggle.setAttribute('aria-expanded', 'false');
    }

    function open() {
      nav.classList.add('is-open');
      backdrop.classList.add('is-open');
      document.body.classList.add('nav-open');
      toggle.setAttribute('aria-expanded', 'true');
    }

    toggle.addEventListener('click', function () {
      if (toggle.getAttribute('aria-expanded') === 'true') { close(); } else { open(); }
    });

    backdrop.addEventListener('click', close);

    nav.addEventListener('click', function (event) {
      if (event.target.closest('a')) close();
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') close();
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 900) close();
    });
  }

  /* ---------- Sticky header shadow ------------------------------------- */
  function setupStickyHeader() {
    var header = document.getElementById('siteHeader');
    if (!header) return;
    var ticking = false;

    function update() {
      header.classList.toggle('is-stuck', window.scrollY > 12);
      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });

    update();
  }

  /* ---------- Animated statistics -------------------------------------- */
  function setupCounters() {
    var counters = document.querySelectorAll('[data-count]');
    if (!counters.length) return;

    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function render(el, value) {
      var decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
      var prefix = el.getAttribute('data-prefix') || '';
      var suffix = el.getAttribute('data-suffix') || '';
      var text = decimals > 0 ? value.toFixed(decimals) : Math.round(value).toLocaleString('en-US');
      el.textContent = prefix + text + suffix;
    }

    function run(el) {
      var target = parseFloat(el.getAttribute('data-count'));
      if (isNaN(target)) return;
      if (reduced) { render(el, target); return; }

      var duration = 1400;
      var start = null;

      function step(timestamp) {
        if (start === null) start = timestamp;
        var progress = Math.min((timestamp - start) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        render(el, target * eased);
        if (progress < 1) window.requestAnimationFrame(step);
      }

      window.requestAnimationFrame(step);
    }

    if (!('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(counters, run);
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          run(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });

    Array.prototype.forEach.call(counters, function (el) { observer.observe(el); });
  }

  /* ---------- Accordions (FAQ) ----------------------------------------- */
  function setupAccordions() {
    var buttons = document.querySelectorAll('.accordion__btn');
    Array.prototype.forEach.call(buttons, function (btn) {
      btn.addEventListener('click', function () {
        var panel = document.getElementById(btn.getAttribute('aria-controls'));
        var isOpen = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
        if (panel) panel.classList.toggle('is-open', !isOpen);
      });
    });
  }

  /* ---------- Reveal on scroll ----------------------------------------- */
  function setupReveal() {
    var items = document.querySelectorAll('.reveal');
    if (!items.length) return;

    if (!('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(items, function (el) { el.classList.add('is-visible'); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px' });

    Array.prototype.forEach.call(items, function (el) { observer.observe(el); });
  }

  /* ---------- Demo forms (newsletter, contact, volunteer) -------------- */
  function setupDemoForms() {
    var forms = document.querySelectorAll('.js-demo-form');
    Array.prototype.forEach.call(forms, function (form) {
      form.addEventListener('submit', function (event) {
        event.preventDefault();

        var status = form.querySelector('.js-form-status');
        var invalid = null;

        Array.prototype.forEach.call(form.querySelectorAll('[required]'), function (input) {
          var ok = input.value.trim() !== '' && (input.type !== 'email' || isEmail(input.value));
          input.setAttribute('aria-invalid', ok ? 'false' : 'true');
          if (!ok && !invalid) invalid = input;
        });

        if (invalid) {
          if (status) {
            status.textContent = 'Please complete the highlighted fields.';
            status.className = status.className.replace(/ ?is-(success|error)/g, '') + ' is-error';
          }
          invalid.focus();
          return;
        }

        if (status) {
          status.textContent = form.getAttribute('data-success') ||
            'Thank you — this is a demonstration form, so nothing was submitted.';
          status.className = status.className.replace(/ ?is-(success|error)/g, '') + ' is-success';
        }
        form.reset();
      });
    });
  }

  function isEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
  }

  /* ---------- Graceful image fallback ---------------------------------- */
  function setupImageFallbacks() {
    Array.prototype.forEach.call(document.images, function (img) {
      img.addEventListener('error', function () {
        if (img.dataset.fallbackApplied) return;
        img.dataset.fallbackApplied = 'true';
        img.removeAttribute('src');
        img.style.background = 'linear-gradient(135deg,#123b2e,#1b5e45 60%,#c9a227)';
        img.style.minHeight = '180px';
      });
    });
  }

  /* ---------- Table scroll hints --------------------------------------- */
  function setupTableHints() {
    var wraps = document.querySelectorAll('.table-wrap');
    if (!wraps.length) return;

    function update() {
      Array.prototype.forEach.call(wraps, function (wrap) {
        var hint = wrap.nextElementSibling;
        if (!hint || !hint.classList.contains('table-hint')) return;
        hint.classList.toggle('is-visible', wrap.scrollWidth > wrap.clientWidth + 1);
      });
    }

    update();
    window.addEventListener('resize', update);
  }

  /* ---------- Footer year ---------------------------------------------- */
  function setCurrentYear() {
    var year = String(new Date().getFullYear());
    Array.prototype.forEach.call(document.querySelectorAll('.js-year'), function (el) {
      el.textContent = year;
    });
  }
})();
