/* tuwebuy — presentación. Movimiento: GSAP + ScrollTrigger + Lenis (en /vendor), fondo WebGL propio.
   Si algo falla (sin JS, librerías, WebGL o "reducir movimiento") la página sigue completa y legible. */
(function () {
  'use strict';
  var doc = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var hasLibs = !!(window.gsap && window.ScrollTrigger);
  var lenis = null;

  /* ============ siempre: cosas que no dependen de animar ============ */
  function hideLoaderNow() { doc.classList.add('ld-done'); }

  // Preguntas frecuentes (acordeón)
  $$('.faq-item').forEach(function (it) {
    var q = $('.faq-q', it);
    q.addEventListener('click', function () {
      var open = it.classList.contains('open');
      $$('.faq-item.open').forEach(function (o) { o.classList.remove('open'); $('.faq-q', o).setAttribute('aria-expanded', 'false'); });
      if (!open) { it.classList.add('open'); q.setAttribute('aria-expanded', 'true'); }
      if (window.ScrollTrigger) setTimeout(function () { ScrollTrigger.refresh(); }, 560);
    });
  });

  // Menú móvil
  var burger = $('#burger'), mnav = $('#mnav');
  function setMenu(open) {
    doc.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    if (lenis) { open ? lenis.stop() : lenis.start(); }
  }
  burger.addEventListener('click', function () { setMenu(!doc.classList.contains('menu-open')); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });

  // Instalar como app (PWA)
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
  }
  var installBtn = $('#install-btn'), installHint = $('#install-hint');
  var isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  var deferredInstall = null;
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); deferredInstall = e; if (!isStandalone) installBtn.hidden = false; });
  installBtn.addEventListener('click', function () {
    if (deferredInstall) { deferredInstall.prompt(); deferredInstall.userChoice.then(function () { deferredInstall = null; installBtn.hidden = true; }); }
    else { installHint.hidden = false; }
  });
  window.addEventListener('appinstalled', function () { installBtn.hidden = true; });
  var isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (isIOS && !isStandalone) installBtn.hidden = false;

  // Marquesinas: se llenan por JS para no repetir HTML
  var ROW1 = [['Tu web ', 'a medida'], ['Diseño ', 'y creatividad'], ['', 'Confianza'], ['Pedidos ', 'online'], ['Reservas ', '24/7']];
  var ROW2 = [['', 'Rápidas'], ['Con ', 'movimiento'], ['Listas ', 'para vender'], ['', 'WhatsApp directo'], ['Panel ', 'privado']];
  function fillRow(el, data, outline) {
    var one = '';
    data.forEach(function (d, i) {
      one += '<span class="mq-item' + (outline && i % 2 ? ' out' : '') + '">' + d[0] + '<em class="accent">' + d[1] + '</em></span><span class="mq-dot"></span>';
    });
    el.innerHTML = one + one + one + one; // 2 juegos por mitad: la mitad siempre supera el ancho de pantalla
  }
  fillRow($('#mq1'), ROW1, true); fillRow($('#mq2'), ROW2, false);

  // Contadores sin animación (se animan más abajo si hay motion)
  if (!hasLibs || reduce) {
    hideLoaderNow();
    var fabEl = $('#fab');
    window.addEventListener('scroll', function () { fabEl.classList.toggle('show', window.scrollY > 600); }, { passive: true });
    if ('IntersectionObserver' in window) {
      var secs = $$('main section[id]'), links = $$('nav.links a');
      var so = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) links.forEach(function (a) { a.classList.toggle('is-on', a.dataset.sec === e.target.id); }); }); }, { rootMargin: '-45% 0px -50% 0px' });
      secs.forEach(function (s) { so.observe(s); });
      // bentos: activar micro-animaciones si no hay reducción de movimiento
      if (!reduce) {
        var bo = new IntersectionObserver(function (es) { es.forEach(function (e) { e.target.classList.toggle('on', e.isIntersecting); }); }, { threshold: .25 });
        $$('.bcard').forEach(function (c) { bo.observe(c); });
      }
    }
    $$('a[href^="#"]').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    return;
  }

  /* ============ con movimiento ============ */
  doc.classList.add('anim');
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });
  $$('#stage img').forEach(function (i) { i.loading = 'eager'; });

  // Scroll suave
  lenis = new Lenis({ lerp: 0.1, smoothWheel: true, wheelMultiplier: 0.95 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
  gsap.ticker.lagSmoothing(0);
  lenis.stop();

  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href'); if (id.length < 2) return;
      var t = id === '#top' ? 0 : $(id); if (t === null) return;
      e.preventDefault(); setMenu(false);
      // si el destino está dentro de una sección fijada, ScrollTrigger sabe la posición real
      lenis.scrollTo(t, { offset: id === '#top' ? 0 : -10, duration: 1.6, easing: function (x) { return 1 - Math.pow(1 - x, 4); }, force: true });
    });
  });

  /* ---------- utilidades de texto ---------- */
  function splitWords(el, mask) {
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            var s = document.createElement('span');
            if (mask) { s.className = 'w'; var i = document.createElement('span'); i.className = 'wi'; i.textContent = part; s.appendChild(i); }
            else { s.className = 'mw'; s.textContent = part; }
            frag.appendChild(s);
          });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1) walk(n);
      });
    })(el);
    return mask ? $$('.wi', el) : $$('.mw', el);
  }

  /* ---------- fondo WebGL (auroras) ---------- */
  var gl = { scroll: 0 };
  (function initGL() {
    var cv = $('#gl'); if (!cv) return;
    var ctx = cv.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' });
    if (!ctx) return;
    var vs = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
    var fs = 'precision mediump float;uniform vec2 r;uniform float t;uniform vec2 m;uniform float s;' +
      'float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}' +
      'float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1.,0.)),f.x),mix(h(i+vec2(0.,1.)),h(i+vec2(1.,1.)),f.x),f.y);}' +
      'float fbm(vec2 p){float a=.5,v=0.;for(int i=0;i<4;i++){v+=a*n(p);p*=2.03;a*=.5;}return v;}' +
      'void main(){vec2 uv=gl_FragCoord.xy/r;vec2 p=(gl_FragCoord.xy-.5*r)/r.y;float tt=t*.05;' +
      'vec2 q=vec2(fbm(p*1.3+tt),fbm(p*1.3+vec2(5.2,1.3)-tt));' +
      'vec2 w=vec2(fbm(p*1.5+2.*q+vec2(1.7,9.2)+tt*1.3),fbm(p*1.5+2.*q+vec2(8.3,2.8)-tt));' +
      'float f=fbm(p*1.2+2.*w+m*.35);' +
      'vec3 navy=vec3(.043,.137,.278);vec3 lime=vec3(.776,1.,.118);vec3 cyan=vec3(.133,.78,.94);vec3 blue=vec3(.145,.388,.922);vec3 teal=vec3(.078,.72,.65);' +
      'vec3 col=navy*.9;' +
      'col=mix(col,blue,smoothstep(.35,.95,q.x)*.30);' +
      'col=mix(col,teal,smoothstep(.45,1.,w.y)*.30);' +
      'float lm=1.-smoothstep(.0,1.15,length(p-vec2(-.6+s*.9,-.5+s*.5)+(w-.5)*.55));' +
      'col+=lime*lm*.42*(.55+f);' +
      'float cm=1.-smoothstep(.0,1.,length(p-vec2(.7-s*.8,.5-s*.3)+(q-.5)*.45));' +
      'col+=cyan*cm*.26;' +
      'col*=1.-.38*length(uv-.5);col+=(h(gl_FragCoord.xy+fract(t))-.5)*.012;gl_FragColor=vec4(col,1.);}';
    function sh(type, src) { var s = ctx.createShader(type); ctx.shaderSource(s, src); ctx.compileShader(s); return ctx.getShaderParameter(s, ctx.COMPILE_STATUS) ? s : null; }
    var v = sh(ctx.VERTEX_SHADER, vs), f = sh(ctx.FRAGMENT_SHADER, fs); if (!v || !f) return;
    var pr = ctx.createProgram(); ctx.attachShader(pr, v); ctx.attachShader(pr, f); ctx.linkProgram(pr);
    if (!ctx.getProgramParameter(pr, ctx.LINK_STATUS)) return;
    ctx.useProgram(pr);
    var buf = ctx.createBuffer(); ctx.bindBuffer(ctx.ARRAY_BUFFER, buf);
    ctx.bufferData(ctx.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), ctx.STATIC_DRAW);
    var loc = ctx.getAttribLocation(pr, 'p'); ctx.enableVertexAttribArray(loc); ctx.vertexAttribPointer(loc, 2, ctx.FLOAT, false, 0, 0);
    var uR = ctx.getUniformLocation(pr, 'r'), uT = ctx.getUniformLocation(pr, 't'), uM = ctx.getUniformLocation(pr, 'm'), uS = ctx.getUniformLocation(pr, 's');
    function resize() {
      var sc = Math.min(window.devicePixelRatio || 1, 1) * 0.5;
      cv.width = Math.max(2, Math.round(window.innerWidth * sc)); cv.height = Math.max(2, Math.round(window.innerHeight * sc));
      ctx.viewport(0, 0, cv.width, cv.height); ctx.uniform2f(uR, cv.width, cv.height);
    }
    resize(); window.addEventListener('resize', resize);
    var mx = 0, my = 0, tx = 0, ty = 0, sm = 0;
    window.addEventListener('pointermove', function (e) { tx = e.clientX / window.innerWidth - .5; ty = .5 - e.clientY / window.innerHeight; }, { passive: true });
    var last = 0;
    function draw(time) {
      mx += (tx - mx) * .06; my += (ty - my) * .06; sm += (gl.scroll - sm) * .08;
      ctx.uniform1f(uT, time); ctx.uniform2f(uM, mx, my); ctx.uniform1f(uS, sm);
      ctx.drawArrays(ctx.TRIANGLE_STRIP, 0, 4);
    }
    draw(2.5); // primer cuadro inmediato: nunca se ve el lienzo vacío
    window.addEventListener('resize', function () { draw(last || 2.5); });
    gsap.ticker.add(function (time) {
      if (document.hidden) return;
      if (time - last < 0.032) return; last = time;
      draw(time + 2.5);
    });
    doc.classList.add('gl');
  })();

  /* ---------- progreso, cabecera, FAB ---------- */
  var progFill = $('.progress i'), hdr = $('#hdr'), fab = $('#fab');
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate: function (self) {
      progFill.style.transform = 'scaleX(' + self.progress.toFixed(4) + ')';
      gl.scroll = self.progress;
      var y = self.scroll();
      hdr.classList.toggle('is-hidden', self.direction === 1 && y > 320 && !doc.classList.contains('menu-open'));
      fab.classList.toggle('show', y > window.innerHeight * 0.9);
    }
  });
  ScrollTrigger.create({ trigger: '#contacto', start: 'top 70%', end: 'bottom bottom', onToggle: function (s) { fab.style.opacity = s.isActive ? 0 : ''; fab.style.pointerEvents = s.isActive ? 'none' : ''; } });
  ['sitios', 'incluye', 'pasos', 'preguntas', 'contacto'].forEach(function (id) {
    ScrollTrigger.create({ trigger: '#' + id, start: 'top 55%', end: 'bottom 55%', onToggle: function (s) { if (s.isActive) $$('nav.links a').forEach(function (a) { a.classList.toggle('is-on', a.dataset.sec === id); }); else $$('nav.links a[data-sec="' + id + '"]').forEach(function (a) { a.classList.remove('is-on'); }); } });
  });

  /* ---------- cursor, imanes, inclinación ---------- */
  if (fine) {
    doc.classList.add('has-cursor');
    var cur = $('#cursor'), cx = gsap.quickTo(cur, 'x', { duration: .35, ease: 'power3' }), cy = gsap.quickTo(cur, 'y', { duration: .35, ease: 'power3' });
    gsap.set(cur, { x: -100, y: -100 });
    window.addEventListener('pointermove', function (e) { cx(e.clientX); cy(e.clientY); }, { passive: true });
    document.addEventListener('pointerover', function (e) {
      var t = e.target.closest ? e.target.closest('a,button,[data-cursor]') : null;
      cur.classList.toggle('is-hot', !!t);
      var lab = t && t.getAttribute('data-cursor');
      cur.classList.toggle('has-label', !!lab); $('span', cur).textContent = lab || '';
    });
    $$('.magnetic').forEach(function (el) {
      var qx = gsap.quickTo(el, 'x', { duration: .5, ease: 'power3' }), qy = gsap.quickTo(el, 'y', { duration: .5, ease: 'power3' });
      el.addEventListener('pointermove', function (e) { var r = el.getBoundingClientRect(); qx((e.clientX - r.left - r.width / 2) * .28); qy((e.clientY - r.top - r.height / 2) * .38); });
      el.addEventListener('pointerleave', function () { qx(0); qy(0); });
    });
  }

  /* ---------- confeti ---------- */
  var cf = $('#confetti'), cctx = cf.getContext('2d'), parts = [], cfRun = false;
  function sizeCF() { cf.width = window.innerWidth; cf.height = window.innerHeight; } sizeCF(); window.addEventListener('resize', sizeCF);
  function burst(x, y) {
    var cols = ['#C6FF1E', '#22C7F0', '#14B8A6', '#f5f9ff', '#62EBA4'];
    for (var i = 0; i < 90; i++) { var a = Math.random() * Math.PI * 2, sp = 4 + Math.random() * 11; parts.push({ x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 6, g: .32, r: 3 + Math.random() * 5, c: cols[i % cols.length], rot: Math.random() * 6, vr: (Math.random() - .5) * .4, l: 1, sq: i % 3 === 0 }); }
    if (!cfRun) { cfRun = true; requestAnimationFrame(loopCF); }
  }
  function loopCF() {
    cctx.clearRect(0, 0, cf.width, cf.height);
    parts = parts.filter(function (p) { return p.l > 0 && p.y < cf.height + 40; });
    parts.forEach(function (p) {
      p.vy += p.g; p.x += p.vx; p.y += p.vy; p.vx *= .985; p.rot += p.vr; p.l -= .011;
      cctx.save(); cctx.globalAlpha = clamp(p.l, 0, 1); cctx.translate(p.x, p.y); cctx.rotate(p.rot); cctx.fillStyle = p.c;
      if (p.sq) cctx.fillRect(-p.r, -p.r / 2, p.r * 2, p.r); else { cctx.beginPath(); cctx.arc(0, 0, p.r / 1.6, 0, 7); cctx.fill(); }
      cctx.restore();
    });
    if (parts.length) requestAnimationFrame(loopCF); else { cfRun = false; cctx.clearRect(0, 0, cf.width, cf.height); }
  }
  $('#bigwa').addEventListener('click', function (e) { burst(e.clientX || window.innerWidth / 2, e.clientY || window.innerHeight / 2); });

  /* ---------- HERO ---------- */
  var h1Words = splitWords($('#h1'), true);
  gsap.set(h1Words, { yPercent: 115, rotate: 7 });
  gsap.set(['#lead', '#cta1'], { opacity: 0, y: 36 });
  gsap.set('#stage', { opacity: 0, y: 90, scale: .92 });

  function buildHero() {
    var N = 7, names = ['Escritorio Camy', 'El Barto', "Grosso's Barbershop", 'Consultorio Oftalmológico', 'Timbó Guazú Vivero', 'Valentino Alonso', 'Siguiendo el Camino'];
    var phone = $$('#iscr .sl'), lap = $$('#lscr .sl'), nm = $('#hsname');
    var proxy = { p: 0 }, shown = -1;
    function paint() {
      for (var i = 0; i < N; i++) { var o = clamp(1 - Math.abs(proxy.p - i), 0, 1); phone[i].style.opacity = o; lap[i].style.opacity = o; }
      var idx = Math.round(proxy.p);
      if (idx !== shown) { shown = idx; nm.innerHTML = '<b>0' + (idx + 1) + '</b> · ' + names[idx]; }
    }
    paint();
    var small = window.innerWidth < 900;
    var tl = gsap.timeline({ scrollTrigger: { trigger: '#hero', start: 'top top', end: small ? '+=135%' : '+=190%', pin: true, scrub: .7, anticipatePin: 1 } });
    tl.to(proxy, { p: N - 1, ease: 'none', duration: 1, onUpdate: paint }, 0);
    tl.to('#iph', { scale: small ? 1.1 : 1.22, rotateY: 0, rotateZ: 0, y: small ? 10 : 20, ease: 'none', duration: 1 }, 0);
    tl.to('#laptop', { x: small ? 10 : 50, scale: .94, opacity: .75, ease: 'none', duration: 1 }, 0);
    tl.to('.hero-copy', { y: -70, opacity: 0, ease: 'power1.in', duration: .4 }, .6);
    tl.to('#hsin', { y: small ? -10 : -30, ease: 'none', duration: 1 }, 0);
    // inclinación con el puntero
    if (fine) {
      var rx = gsap.quickTo('#hsin', 'rotationX', { duration: .8, ease: 'power3' }), ry = gsap.quickTo('#hsin', 'rotationY', { duration: .8, ease: 'power3' });
      $('#hero').addEventListener('pointermove', function (e) { ry((e.clientX / window.innerWidth - .5) * 12); rx((.5 - e.clientY / window.innerHeight) * 8); });
    }
  }

  /* ---------- carga + entrada ---------- */
  var ldBar = $('.ld-bar i'), ldN = $('.ld-n'), ld = { v: 0 };
  var minTime = gsap.to(ld, { v: 100, duration: 1.4, ease: 'power2.inOut', onUpdate: function () { ldBar.style.transform = 'scaleX(' + (ld.v / 100) + ')'; ldN.textContent = Math.round(ld.v); } });
  var fontsOk = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
  var imgOk = new Promise(function (res) { var im = $('#iscr .sl'); if (!im || im.complete) res(); else { im.addEventListener('load', res); im.addEventListener('error', res); } });
  var started = false;
  function start() {
    if (started) return; started = true;
    var tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
    tl.to('#loader', { yPercent: -100, duration: .9, ease: 'power4.inOut', onComplete: hideLoaderNow })
      .to(h1Words, { yPercent: 0, rotate: 0, duration: 1.1, stagger: .07 }, '-=.35')
      .to('#lead', { opacity: 1, y: 0, duration: .9 }, '-=.8')
      .to('#cta1', { opacity: 1, y: 0, duration: .9 }, '-=.7')
      .to('#stage', { opacity: 1, y: 0, scale: 1, duration: 1.3 }, '-=1.1');
    lenis.start();
  }
  Promise.all([fontsOk, imgOk, new Promise(function (r) { minTime.eventCallback('onComplete', r); })]).then(start);
  setTimeout(start, 4200); // por si algo tarda de más

  buildHero();

  /* ---------- marquesinas ---------- */
  var t1 = gsap.to('#mq1', { xPercent: -50, duration: 38, ease: 'none', repeat: -1 });
  var t2 = gsap.fromTo('#mq2', { xPercent: -50 }, { xPercent: 0, duration: 46, ease: 'none', repeat: -1 });
  var mqBox = $('.marquee'), ts = 1, dir = 1;
  ScrollTrigger.create({ trigger: mqBox, start: 'top bottom', end: 'bottom top', onUpdate: function (self) { dir = self.direction || dir; } });
  gsap.ticker.add(function () {
    var v = ScrollTrigger.getAll()[0] ? Math.abs(lenis.velocity || 0) : 0;
    ts += ((1 + Math.min(v / 18, 7)) - ts) * .08;
    t1.timeScale(ts * dir); t2.timeScale(ts * dir);
    mqBox.style.setProperty('--sk', (clamp((lenis.velocity || 0) * -.18, -6, 6)).toFixed(2));
  });
  gsap.ticker.add(function () { var s = parseFloat(mqBox.style.getPropertyValue('--sk')) || 0; mqBox.style.transform = 'rotate(-1.4deg) skewX(' + s + 'deg)'; });

  /* ---------- manifiesto: palabras que se encienden ---------- */
  var mw = splitWords($('#mf'), false);
  var mfTl = gsap.timeline({ scrollTrigger: { trigger: '#manifiesto', start: 'top top', end: 'bottom bottom', scrub: .5 } });
  mfTl.to(mw, { opacity: 1, ease: 'none', stagger: { each: .06 }, duration: .25 }).to({}, { duration: .5 });

  /* ---------- contadores ---------- */
  $$('.count').forEach(function (el) {
    var to = parseFloat(el.dataset.to), o = { v: 0 };
    ScrollTrigger.create({ trigger: el, start: 'top 90%', end: 'bottom 5%',
      onEnter: run, onEnterBack: run, onLeave: function () { o.v = 0; el.textContent = 0; }, onLeaveBack: function () { o.v = 0; el.textContent = 0; } });
    el.textContent = 0;
    function run() { gsap.killTweensOf(o); o.v = 0; gsap.to(o, { v: to, duration: 1.8, ease: 'power3.out', onUpdate: function () { el.textContent = Math.round(o.v); } }); }
  });

  /* ---------- revelado general (entra desde la izquierda y vuelve a salir) ---------- */
  function reveals() {
    $$('[data-reveal]').forEach(function (el) {
      gsap.fromTo(el, { x: -56, opacity: 0 }, { x: 0, opacity: 1, duration: .7, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%', end: 'bottom 5%', toggleActions: 'play reverse play reverse' } });
    });
  }
  /* ---------- galería de sitios ---------- */
  var mm = gsap.matchMedia();
  mm.add('(min-width: 900px)', function () {
    var gal = $('#sitios'), track = $('#gtrack'), slides = $$('.slide', track), n = slides.length;
    gal.classList.add('is-h');
    var bg = $('.g-bg', gal); bg.innerHTML = '';
    slides.forEach(function (s) { var i = document.createElement('i'); i.style.setProperty('--glow', s.style.getPropertyValue('--glow')); bg.appendChild(i); });
    var glows = $$('i', bg), cur = $('#gcur'), fill = $('#gfill');
    var dist = function () { return Math.max(0, track.scrollWidth - window.innerWidth); };
    var tween = gsap.to(track, { x: function () { return -dist(); }, ease: 'none',
      scrollTrigger: { trigger: gal, start: 'top top', end: function () { return '+=' + dist(); }, pin: true, scrub: .6, invalidateOnRefresh: true, anticipatePin: 1,
        onUpdate: function (self) {
          var pos = self.progress * (n - 1);
          fill.style.transform = 'scaleX(' + self.progress.toFixed(4) + ')';
          var idx = Math.round(pos); cur.textContent = '0' + (idx + 1);
          glows.forEach(function (g, i) { g.style.opacity = clamp(1 - Math.abs(pos - i), 0, 1).toFixed(3); });
        } } });
    slides.forEach(function (s) {
      gsap.fromTo($('.shot img', s), { xPercent: -5 }, { xPercent: 5, ease: 'none', scrollTrigger: { trigger: s, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true } });
      gsap.fromTo($('.iphone', s), { y: 40, rotate: 6 }, { y: -30, rotate: -2, ease: 'none', scrollTrigger: { trigger: s, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true } });
      gsap.fromTo($('.slide-copy', s), { y: 30, opacity: .2 }, { y: 0, opacity: 1, ease: 'none', scrollTrigger: { trigger: s, containerAnimation: tween, start: 'left 90%', end: 'left 45%', scrub: true } });
    });
    return function () { gal.classList.remove('is-h'); };
  });
  mm.add('(max-width: 899px)', function () {
    $$('.slide').forEach(function (s) {
      gsap.fromTo(s, { x: -56, opacity: 0 }, { x: 0, opacity: 1, duration: .7, ease: 'power3.out', scrollTrigger: { trigger: s, start: 'top 88%', end: 'bottom 5%', toggleActions: 'play reverse play reverse' } });
      gsap.fromTo($('.iphone', s), { y: 30 }, { y: -20, ease: 'none', scrollTrigger: { trigger: s, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
  });

  reveals(); // después de fijar la galería, para que ScrollTrigger cuente bien el espacio

  /* ---------- bento: micro-animaciones, foco y 3D ---------- */
  $$('.bcard').forEach(function (c) {
    ScrollTrigger.create({ trigger: c, start: 'top 85%', end: 'bottom 12%', toggleClass: { targets: c, className: 'on' } });
    if (fine) {
      var rx = gsap.quickTo(c, 'rotationX', { duration: .6, ease: 'power3' }), ry = gsap.quickTo(c, 'rotationY', { duration: .6, ease: 'power3' });
      gsap.set(c, { transformPerspective: 900 });
      c.addEventListener('pointermove', function (e) {
        var r = c.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
        c.style.setProperty('--mx', x + 'px'); c.style.setProperty('--my', y + 'px');
        ry((x / r.width - .5) * 7); rx(-(y / r.height - .5) * 7);
      });
      c.addEventListener('pointerleave', function () { rx(0); ry(0); });
    }
  });
  gsap.utils.toArray('.svc-mega span').forEach(function (s) { /* título gigante: pequeña deriva */ });
  gsap.fromTo('.svc-mega', { letterSpacing: '0.04em' }, { letterSpacing: '-0.05em', ease: 'none', scrollTrigger: { trigger: '.incl-head', start: 'top 90%', end: 'top 30%', scrub: true } });

  /* ---------- proceso (pantalla fija, un paso a la vez) ---------- */
  mm.add('(min-width: 0px)', function () {
    var bigs = $$('.pbig'), steps = $$('.pstep'), line = $('#pline'), idx = -1;
    gsap.set(bigs, { opacity: 0, y: 60 });
    function setIdx(i) {
      if (i === idx) return; var prev = idx; idx = i;
      steps.forEach(function (s, k) { s.classList.toggle('is-active', k === i); });
      if (prev >= 0) gsap.to(bigs[prev], { opacity: 0, y: -60, duration: .45, ease: 'power3.in', overwrite: true });
      gsap.fromTo(bigs[i], { opacity: 0, y: 70 }, { opacity: 1, y: 0, duration: .7, ease: 'power3.out', overwrite: true, delay: prev >= 0 ? .12 : 0 });
    }
    ScrollTrigger.create({ trigger: '#pasos', start: 'top top', end: 'bottom bottom',
      onUpdate: function (self) { setIdx(Math.min(3, Math.floor(self.progress * 4 + .001))); line.style.transform = 'scaleY(' + clamp((self.progress * 4 - .0) / 4 + .04, 0, 1).toFixed(3) + ')'; },
      onToggle: function (s) { if (!s.isActive && idx < 0) setIdx(0); } });
    setIdx(0);
  });

  /* ---------- cierre ---------- */
  gsap.from('#fh .g', { yPercent: 70, opacity: 0, stagger: .14, duration: 1, ease: 'power4.out', scrollTrigger: { trigger: '#fh', start: 'top 85%', toggleActions: 'play reverse play reverse' } });
  // palabra gigante del pie: cada letra sube una por una al llegar al final
  var bw = $('#bigword'), word = bw.textContent; bw.setAttribute('aria-label', word); bw.textContent = '';
  var letters = word.split('').map(function (ch) { var s = document.createElement('span'); s.className = 'bl'; s.setAttribute('aria-hidden', 'true'); s.textContent = ch; bw.appendChild(s); return s; });
  gsap.set(letters, { yPercent: 70, opacity: 0 });
  gsap.to(letters, { yPercent: 0, opacity: 1, duration: 1, ease: 'power4.out', stagger: .09, scrollTrigger: { trigger: 'footer', start: 'top 96%', toggleActions: 'play none none reverse' } });

  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
})();
