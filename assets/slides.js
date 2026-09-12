/* پیمایش اسلایدها: شماره‌گذاری خودکار، حالت ارائه، کلیدهای جهت‌دار */
(function () {
  const slides = Array.from(document.querySelectorAll('.slide'));
  if (!slides.length) return;

  slides.forEach((s, i) => s.setAttribute('data-n', (i + 1) + ' / ' + slides.length));

  // ── جاسازی خودکار محتوا: هیچ اسلایدی نباید بریده شود ──
  slides.forEach(s => {
    const box = document.createElement('div');
    box.className = 'fitbox';
    while (s.firstChild) box.appendChild(s.firstChild);
    s.appendChild(box);
    s.__fit = box;
  });

  function fitContent() {
    slides.forEach(s => {
      const box = s.__fit;
      box.style.width = '';
      box.style.transform = '';
      const cs = getComputedStyle(s);
      const avail = s.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
      let k = 1;
      for (let i = 0; i < 6; i++) {
        const h = box.scrollHeight;
        if (h * k <= avail + 1) break;
        k = Math.max(0.62, (avail / h) * 0.998);
        box.style.width = (100 / k) + '%';
        box.style.transform = 'scale(' + k + ')';
        box.style.transformOrigin = 'top right';
      }
    });
  }
  fitContent();
  window.addEventListener('resize', fitContent);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitContent);

  let idx = 0;
  let presenting = false;

  const bar = document.createElement('div');
  bar.className = 'navbar';
  bar.innerHTML =
    '<button data-act="prev">قبلی ›</button>' +
    '<span class="counter"></span>' +
    '<button data-act="next">‹ بعدی</button>' +
    '<button data-act="present">حالت ارائه (F)</button>' +
    '<button data-act="print">چاپ / PDF</button>';
  document.body.appendChild(bar);
  const counter = bar.querySelector('.counter');

  function fit() {
    if (!presenting) {
      slides.forEach(s => (s.style.transform = ''));
      return;
    }
    const scale = Math.min(window.innerWidth / 1280, (window.innerHeight - 46) / 720);
    slides.forEach(s => (s.style.transform = 'scale(' + scale + ')'));
  }

  function render() {
    slides.forEach((s, i) => s.classList.toggle('current', i === idx));
    counter.textContent = (idx + 1) + ' / ' + slides.length;
    if (!presenting) slides[idx].scrollIntoView({ behavior: 'smooth', block: 'center' });
    fit();
  }

  function go(n) {
    idx = Math.max(0, Math.min(slides.length - 1, n));
    render();
  }

  function togglePresent() {
    presenting = !presenting;
    document.body.classList.toggle('presenting', presenting);
    render();
  }

  bar.addEventListener('click', e => {
    const act = e.target.getAttribute('data-act');
    if (act === 'next') go(idx + 1);
    else if (act === 'prev') go(idx - 1);
    else if (act === 'present') togglePresent();
    else if (act === 'print') window.print();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft' || e.key === 'PageDown' || e.key === ' ') { go(idx + 1); e.preventDefault(); }
    else if (e.key === 'ArrowRight' || e.key === 'PageUp') { go(idx - 1); e.preventDefault(); }
    else if (e.key === 'Home') go(0);
    else if (e.key === 'End') go(slides.length - 1);
    else if (e.key === 'f' || e.key === 'F') togglePresent();
    else if (e.key === 'Escape' && presenting) togglePresent();
  });

  window.addEventListener('resize', fit);

  // اسلاید کنونی هنگام اسکرول در حالت عادی
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      if (presenting) return;
      entries.forEach(en => {
        if (en.isIntersecting) {
          idx = slides.indexOf(en.target);
          counter.textContent = (idx + 1) + ' / ' + slides.length;
        }
      });
    }, { threshold: 0.55 });
    slides.forEach(s => io.observe(s));
  }

  render();
})();
