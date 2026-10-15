(() => {
  'use strict';

  const root = document.documentElement;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- Header state on scroll ---------- */
  const header = document.querySelector('.header');
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Smooth scroll for in-page anchors ---------- */
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      const hash = link.getAttribute('href');
      if (hash.length < 2) return;
      const target = document.querySelector(hash);
      if (!target) return;

      event.preventDefault();
      target.scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth', block: 'start' });
      history.pushState(null, '', hash);

      // Move keyboard focus to the section without jumping the page
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    });
  });

  /* ---------- Reveal on scroll ---------- */
  const revealItems = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reducedMotion.matches) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    revealItems.forEach((el) => observer.observe(el));
  } else {
    revealItems.forEach((el) => el.classList.add('is-visible'));
  }

  /* ---------- Modal ---------- */
  const modal = document.getElementById('course-modal');
  const dialog = modal.querySelector('.modal__dialog');
  const closeBtn = modal.querySelector('.modal__close');
  const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
  let lastFocused = null;
  let hideTimer = null;

  const openModal = () => {
    if (modal.classList.contains('is-open')) return;
    lastFocused = document.activeElement;
    clearTimeout(hideTimer);

    // Prevent layout shift when the scrollbar disappears
    const scrollbar = window.innerWidth - root.clientWidth;
    if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`;
    root.classList.add('modal-open');

    modal.hidden = false;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => modal.classList.add('is-open'));
    });
    closeBtn.focus({ preventScroll: true });
    document.addEventListener('keydown', onModalKeydown);
  };

  const closeModal = () => {
    if (!modal.classList.contains('is-open')) return;
    modal.classList.remove('is-open');
    document.removeEventListener('keydown', onModalKeydown);

    hideTimer = setTimeout(() => {
      modal.hidden = true;
      root.classList.remove('modal-open');
      document.body.style.paddingRight = '';
    }, reducedMotion.matches ? 0 : 320);

    if (lastFocused) lastFocused.focus({ preventScroll: true });
  };

  function onModalKeydown(event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeModal();
      return;
    }
    if (event.key !== 'Tab') return;

    // Keep focus inside the dialog
    const items = [...dialog.querySelectorAll(FOCUSABLE)];
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  document.querySelectorAll('[data-modal-open]').forEach((btn) => {
    btn.setAttribute('aria-haspopup', 'dialog');
    btn.addEventListener('click', openModal);
  });
  modal.querySelectorAll('[data-modal-close]').forEach((el) => el.addEventListener('click', closeModal));

  /* ---------- FAQ accordion (one open at a time) ---------- */
  const faqItems = [...document.querySelectorAll('.faq__item')];

  const setOpen = (item, open) => {
    item.classList.toggle('is-open', open);
    item.querySelector('.faq__q').setAttribute('aria-expanded', String(open));
  };

  faqItems.forEach((item) => {
    item.querySelector('.faq__q').addEventListener('click', () => {
      const willOpen = !item.classList.contains('is-open');
      faqItems.forEach((other) => setOpen(other, false));
      if (willOpen) setOpen(item, true);
    });
  });
})();
