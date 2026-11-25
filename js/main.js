(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  const hasGSAP = typeof window.gsap !== "undefined";
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches || !hasGSAP;
  if (reduced) root.classList.add("reduced");
  if (hasGSAP) root.classList.add("js");

  /* ====================== i18n ====================== */
  const D = window.I18N;
  const params = new URLSearchParams(location.search);
  let lang = params.get("lang") || localStorage.getItem("tachox-lang") ||
    ((navigator.language || "es").toLowerCase().startsWith("en") ? "en" : "es");
  if (!D[lang]) lang = "es";
  const t = (k) => (D[lang][k] ?? D.es[k] ?? k);

  /* ====================== Mascot "Tachi" ====================== */
  const EYE = (cx) => `
    <g class="t-eye" transform="translate(${cx} 34.5)">
      <g class="t-open">
        <circle r="10" fill="#2b3039" stroke="#D5D8DD" stroke-width="2.6"/>
        <circle r="6.8" fill="#0d1016"/>
        <g class="t-pupil"><circle r="3.8" fill="#26304a"/><circle cx="-1.4" cy="-1.6" r="1.4" fill="#fff"/></g>
      </g>
      <rect class="t-eyelid" x="-13" y="-13" width="26" height="26" fill="#15171c"/>
      <path class="t-happy" d="M-7 3 Q0 -7 7 3" stroke="#D5D8DD" stroke-width="3" fill="none" stroke-linecap="round"/>
    </g>`;
  const TACHI = `
  <svg class="tachi-svg" viewBox="-10 -30 140 190" aria-hidden="true" focusable="false">
    <ellipse class="t-shadow" cx="60" cy="151" rx="58" ry="6" fill="#000" opacity=".2"/>
    <g class="t-all">
      <g class="t-arm t-arm-l" opacity="0"><rect x="-5" y="64" width="9" height="34" rx="4.5" fill="#8a9099"/></g>
      <g class="t-arm t-arm-r" opacity="0"><rect x="116" y="64" width="9" height="34" rx="4.5" fill="#8a9099"/></g>
      <rect x="6" y="50" width="108" height="98" fill="url(#tg-body)"/>
      <rect x="6" y="50" width="108" height="98" fill="url(#tg-brush)"/>
      <rect x="6" y="50" width="108" height="6" fill="#000" opacity=".28"/>
      <g class="t-lcd-glow">
        <rect class="t-lcd-bg" x="20" y="66" width="80" height="26" rx="2" fill="#0B2A6B" stroke="#0a0d14" stroke-width="3.5"/>
        <text class="t-lcd-txt t-l1" x="25" y="77.5"></text>
        <text class="t-lcd-txt t-l2" x="25" y="88"></text>
      </g>
      <rect x="6" y="124" width="108" height="7" fill="#1b1d22"/>
      <rect x="6" y="131" width="108" height="17" fill="#F3F3F0" stroke="#D8DCE3" stroke-width=".8"/>
      <g class="t-head">
        <rect x="0" y="12" width="120" height="42" rx="4" fill="url(#tg-head)"/>
        <rect x="0" y="12" width="120" height="42" rx="4" fill="url(#tg-brush)"/>
        <g class="t-lid"><rect x="1" y="5" width="118" height="9" rx="2.5" fill="url(#tg-lid)" stroke="#8E949C" stroke-width=".8"/></g>
        <path d="M14 20 H106 L97 49 H23 Z" fill="#15171c"/>
        ${EYE(45)}${EYE(75)}
      </g>
    </g>
  </svg>`;

  const tachis = [];
  class Tachi {
    constructor(host, lcdFn) {
      host.innerHTML = TACHI;
      this.host = host;
      this.svg = $("svg", host);
      this.all = $(".t-all", host);
      this.lid = $(".t-lid", host);
      this.head = $(".t-head", host);
      this.pupils = $$(".t-pupil", host);
      this.lids = $$(".t-eyelid", host);
      this.opens = $$(".t-open", host);
      this.happies = $$(".t-happy", host);
      this.l1 = $(".t-l1", host);
      this.l2 = $(".t-l2", host);
      this.armR = $(".t-arm-r", host);
      this.lcdFn = lcdFn;
      this.visible = false;
      this.mood = "idle";
      this.lidOpen = false;
      if (hasGSAP) {
        this.px = this.pupils.map((p) => gsap.quickTo(p, "x", { duration: 0.3, ease: "power3" }));
        this.py = this.pupils.map((p) => gsap.quickTo(p, "y", { duration: 0.3, ease: "power3" }));
        if (!reduced) gsap.to(this.all, { y: -2, duration: 1.2, ease: "sine.inOut", yoyo: true, repeat: -1, delay: Math.random() });
      }
      this.refresh();
      tachis.push(this);
    }
    lcd(a, b) { this.l1.textContent = a; this.l2.textContent = b; }
    refresh() { if (this.lcdFn) { const [a, b] = this.lcdFn(); this.lcd(a, b); } }
    look(x, y) {
      if (!this.px || this.mood === "happy") return;
      const r = this.head.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height * 0.55;
      const dx = x - cx, dy = y - cy, d = Math.hypot(dx, dy) || 1;
      const m = Math.min(3, d / 40);
      this.px.forEach((f) => f((dx / d) * m));
      this.py.forEach((f) => f((dy / d) * m * 0.8));
    }
    blink() {
      if (!hasGSAP || this.mood === "happy") return;
      gsap.timeline()
        .to(this.lids, { scaleY: 1, duration: 0.08, ease: "power2.in" })
        .to(this.lids, { scaleY: this.mood === "full" ? 0.5 : 0, duration: 0.14, ease: "power2.out" });
    }
    happy(ms = 1100) {
      if (!hasGSAP) return;
      this.mood = "happy";
      gsap.set(this.opens, { opacity: 0 }); gsap.set(this.happies, { opacity: 1 });
      gsap.fromTo(this.all, { scaleY: 0.92, scaleX: 1.04, transformOrigin: "50% 100%" },
        { scaleY: 1, scaleX: 1, duration: 0.6, ease: "elastic.out(1,0.4)" });
      clearTimeout(this._ht);
      this._ht = setTimeout(() => {
        gsap.set(this.happies, { opacity: 0 }); gsap.set(this.opens, { opacity: 1 });
        if (this.mood === "happy") this.mood = this._full ? "full" : "idle";
      }, ms);
    }
    setFull(on) {
      this._full = on;
      clearTimeout(this._ht);
      if (hasGSAP) { gsap.set(this.happies, { opacity: 0 }); gsap.set(this.opens, { opacity: 1 }); }
      this.host.classList.toggle("full", on);
      this.mood = on ? "full" : "idle";
      if (hasGSAP) gsap.to(this.lids, { scaleY: on ? 0.5 : 0, duration: 0.3 });
    }
    shake() {
      if (!hasGSAP) return;
      gsap.fromTo(this.head, { rotation: 0 }, { keyframes: { rotation: [-5, 5, -4, 4, 0] }, duration: 0.5, svgOrigin: "60 54", ease: "none" });
    }
    wave() {
      if (!hasGSAP) return;
      gsap.timeline()
        .set(this.armR, { opacity: 1, rotation: 0, svgOrigin: "120 98" })
        .to(this.armR, { rotation: -150, duration: 0.25, svgOrigin: "120 98" })
        .to(this.armR, { rotation: -115, duration: 0.18, yoyo: true, repeat: 5, ease: "sine.inOut" })
        .to(this.armR, { rotation: 0, duration: 0.25 })
        .set(this.armR, { opacity: 0 });
    }
    openLid() {
      if (!hasGSAP || this.lidOpen) return;
      this.lidOpen = true;
      gsap.to(this.lid, { rotation: -42, svgOrigin: "1 14", duration: 0.35, ease: "back.out(1.6)", overwrite: true });
    }
    closeLid() {
      if (!hasGSAP || !this.lidOpen) return;
      this.lidOpen = false;
      gsap.to(this.lid, { rotation: 0, svgOrigin: "1 14", duration: 0.4, ease: "power2.inOut", overwrite: true });
    }
  }

  // visibility tracking for eye-follow
  const io = new IntersectionObserver((es) => es.forEach((e) => { e.target.__tachi.visible = e.isIntersecting; }));
  function makeTachi(host, fn) { const tc = new Tachi(host, fn); host.__tachi = tc; io.observe(host); return tc; }

  // blink loop
  (function blinkLoop() {
    tachis.forEach((tc) => { if (tc.visible && Math.random() < 0.5) setTimeout(() => tc.blink(), Math.random() * 600); });
    setTimeout(blinkLoop, 2200 + Math.random() * 2200);
  })();

  // eye follow: pointer (mouse or finger)
  let lastP = null;
  const follow = (x, y) => { lastP = { x, y }; tachis.forEach((tc) => tc.visible && tc.look(x, y)); };
  addEventListener("pointermove", (e) => follow(e.clientX, e.clientY), { passive: true });
  addEventListener("pointerdown", (e) => follow(e.clientX, e.clientY), { passive: true });

  /* ---- create mascots ---- */
  const howState = { step: 0 };
  const howTachi = makeTachi($(".how-tachi"), () =>
    howState.step === 3 ? [t("lcd.status"), t("lcd.full")] :
    howState.step === 1 ? [t("lcd.status"), t("lcd.open")] : [t("lcd.status"), t("lcd.available")]);

  const demo = { count: 0, max: 5, busy: false, msg: null };
  const demoTachi = makeTachi($(".demo-tachi"), () =>
    demo.msg ? [demo.msg, ""] : [t("lcd.status"), demo.count >= demo.max ? t("lcd.full") : t("lcd.available")]);

  $$('.member [data-tachi="mini"]').forEach((h) => makeTachi(h, () => [t("lcd.hi"), h.dataset.l2]));
  const footTachi = makeTachi($(".footer-tachi"), () => [t("lcd.thanksFoot"), t("lcd.forComing")]);
  let buddyLabel = "";
  const buddyTachi = makeTachi($('.buddy [data-tachi]'), () => [buddyLabel || t("lcd.hi"), ""]);

  /* ====================== language apply ====================== */
  function applyLang(l, animate) {
    lang = l;
    localStorage.setItem("tachox-lang", l);
    root.lang = l;
    $(".lang").classList.toggle("en", l === "en");
    $$(".lang button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === l)));
    const swap = () => {
      $$("[data-i18n]").forEach((el) => { const v = D[l][el.dataset.i18n]; if (v != null) el.textContent = v; });
      $$("[data-i18n-alt]").forEach((el) => { const v = D[l][el.dataset.i18nAlt]; if (v) el.alt = v; });
      $$("[data-i18n-aria]").forEach((el) => { const v = D[l][el.dataset.i18nAria]; if (v) el.setAttribute("aria-label", v); });
      $$(".item").forEach((el) => el.setAttribute("aria-label", D[l].items[el.dataset.item]));
      document.title = l === "en" ? "TachoX · The bin that sees you coming" : "TachoX · El tacho que te ve venir";
      updateSectionLabel(true);
      tachis.forEach((tc) => tc.refresh());
      updateDemoStatus();
      typeLCD();
    };
    if (animate && hasGSAP && !reduced) {
      const els = $$("main [data-i18n], footer [data-i18n]");
      gsap.to(els, { opacity: 0, duration: 0.15, onComplete: () => { swap(); gsap.to(els, { opacity: 1, duration: 0.2 }); ScrollTrigger.refresh(); } });
    } else swap();
  }
  $$(".lang button").forEach((b) => b.addEventListener("click", () => b.dataset.lang !== lang && applyLang(b.dataset.lang, true)));

  /* ---- hero LCD typing ---- */
  let typeTimer;
  function typeLCD() {
    const el = $(".lcd-type");
    const txt = lang === "en" ? el.dataset.lcdEn : el.dataset.lcd;
    clearInterval(typeTimer);
    if (reduced) { el.textContent = txt; return; }
    let i = 0; el.textContent = "";
    typeTimer = setInterval(() => { el.textContent = txt.slice(0, ++i); if (i >= txt.length) clearInterval(typeTimer); }, 55);
  }

  /* ====================== scroll: nav + buddy ====================== */
  const nav = $(".nav");
  const buddy = $(".buddy");
  const sections = $$("[data-section]");
  const darks = $$(".dark");
  let currentSec = null;
  function updateSectionLabel(force) {
    const mid = innerHeight * 0.5;
    let sec = sections.find((s) => { const r = s.getBoundingClientRect(); return r.top <= mid && r.bottom >= mid; });
    if (!sec) return;
    if (sec === currentSec && !force) return;
    currentSec = sec;
    buddyLabel = (lang === "en" && sec.dataset.sectionEn) || sec.dataset.section;
    buddyTachi.refresh();
  }
  let ticking = false;
  function onScroll() {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      const y = scrollY;
      nav.classList.toggle("scrolled", y > 20);
      nav.classList.toggle("on-dark", darks.some((d) => { const r = d.getBoundingClientRect(); return r.top <= 28 && r.bottom >= 28; }));
      const heroBottom = $(".hero").getBoundingClientRect().bottom;
      const dr = $(".demo-card").getBoundingClientRect();
      const demoVisible = dr.top < innerHeight * 0.85 && dr.bottom > innerHeight * 0.15;
      buddy.classList.toggle("show", heroBottom < innerHeight * 0.4 && !demoVisible);
      updateSectionLabel();
      if (lastP) tachis.forEach((tc) => tc.visible && tc.look(lastP.x, lastP.y));
    });
  }
  addEventListener("scroll", onScroll, { passive: true });
  buddy.addEventListener("click", () => {
    buddyTachi.wave();
    setTimeout(() => scrollToEl($("#demo")), 350);
  });

  /* ====================== smooth scroll ====================== */
  let lenis = null;
  if (!reduced && window.Lenis) {
    lenis = new Lenis({ duration: 1.1, easing: (x) => 1 - Math.pow(1 - x, 3) });
    lenis.on("scroll", () => { ScrollTrigger.update(); onScroll(); });
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  function scrollToEl(el) {
    if (lenis) lenis.scrollTo(el, { offset: -56, duration: 1.4 });
    else el.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
  }
  $$('a[href^="#"]').forEach((a) => a.addEventListener("click", (e) => {
    const el = $(a.getAttribute("href")); if (!el) return;
    e.preventDefault(); scrollToEl(el);
  }));

  /* ====================== animations ====================== */
  if (hasGSAP) gsap.registerPlugin(ScrollTrigger);
  if (!reduced) {
    ScrollTrigger.config({ ignoreMobileResize: true });

    // ---- hero intro
    const intro = gsap.timeline({ defaults: { ease: "expo.out" } });
    intro
      .from(".hero-eyebrow", { y: -20, opacity: 0, duration: 0.6 })
      .from(".wm-letters span", { yPercent: 110, duration: 0.9, stagger: 0.05 }, 0.1)
      .from(".wm-x", { scale: 0.3, rotation: -200, opacity: 0, duration: 1.1, ease: "back.out(1.6)" }, 0.35)
      .from(".hero-sub", { y: 16, opacity: 0, duration: 0.7 }, 0.55)
      .from(".hero-bin", { y: -80, opacity: 0, duration: 1, ease: "bounce.out" }, 0.55)
      .from(".hero-floor", { scaleX: 0.3, opacity: 0, duration: 1 }, 0.7)
      .from(".lcd-chip", { y: 20, opacity: 0, duration: 0.6, onStart: typeLCD }, 1.1)
      .from(".hero-cta", { y: 20, opacity: 0, duration: 0.6 }, 1.25)
      .from(".blob", { scale: 0, duration: 1.6, stagger: 0.15, ease: "power3.out" }, 0.2);
    // ambient
    gsap.to(".wm-x", { rotation: 8, y: -4, duration: 2.6, ease: "sine.inOut", yoyo: true, repeat: -1 });
    gsap.to(".b1", { x: 40, y: 30, duration: 7, ease: "sine.inOut", yoyo: true, repeat: -1 });
    gsap.to(".b2", { x: -30, y: -40, duration: 8, ease: "sine.inOut", yoyo: true, repeat: -1 });
    // hero tilt on pointer / device
    const binQX = gsap.quickTo(".hero-stage", "rotationY", { duration: 0.8, ease: "power3" });
    const binQY = gsap.quickTo(".hero-stage", "rotationX", { duration: 0.8, ease: "power3" });
    gsap.set(".hero-stage", { transformPerspective: 900 });
    addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse") return;
      binQX((e.clientX / innerWidth - 0.5) * 14);
      binQY(-(e.clientY / innerHeight - 0.5) * 8);
    }, { passive: true });

    // parallax
    gsap.timeline({ scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 0.5 } })
      .to(".hero-bin", { yPercent: -18, ease: "none" }, 0)
      .to(".wordmark", { yPercent: -60, opacity: 0.2, ease: "none" }, 0)
      .to(".hero-sub", { yPercent: -80, opacity: 0, ease: "none" }, 0)
      .to(".hero-grid", { yPercent: 20, ease: "none" }, 0)
      .to(".hero-spot", { scale: 1.3, ease: "none" }, 0)
      .to(".b1", { yPercent: -120, ease: "none" }, 0)
      .to(".b2", { yPercent: 80, ease: "none" }, 0)
      .to(".b3", { yPercent: -200, ease: "none" }, 0);
    gsap.to(".marquee", { xPercent: -8, ease: "none", scrollTrigger: { trigger: ".marquee", start: "top bottom", end: "bottom top", scrub: true } });

    // reveals
    ScrollTrigger.batch(".reveal", {
      start: "top 88%", once: true,
      onEnter: (b) => gsap.to(b, { opacity: 1, y: 0, duration: 0.8, ease: "power3.out", stagger: 0.08, overwrite: true })
    });

    // about
    gsap.fromTo(".about-bin", { rotation: -5, yPercent: 8 }, { rotation: 4, yPercent: -8, ease: "none", scrollTrigger: { trigger: ".about", start: "top bottom", end: "bottom top", scrub: 0.6 } });
    gsap.to(".about-ring", { rotation: 360, duration: 20, ease: "none", repeat: -1 });
    $$(".count").forEach((el) => {
      const to = +el.dataset.to, from = to === 0 ? 10 : 0, o = { v: from };
      el.textContent = from;
      ScrollTrigger.create({ trigger: el, start: "top 90%", once: true,
        onEnter: () => gsap.to(o, { v: to, duration: to === 0 ? 1.2 : 0.9, ease: "power2.out", onUpdate: () => { el.textContent = Math.round(o.v); } }) });
    });

    // how it works (pinned scrub)
    const sonarHow = document.createElement("div");
    sonarHow.className = "sonar how-sonar"; sonarHow.innerHTML = "<i></i><i></i><i></i>";
    sonarHow.style.cssText = "left:50%;top:30%;z-index:3";
    $(".how-stage").appendChild(sonarHow);
    const gFill = $(".gauge-fill"), gLabel = $(".gauge-label");
    const steps = $$(".step"), dots = $$(".how-dots i");
    const setStep = (s) => {
      if (s === howState.step) return;
      howState.step = s;
      steps.forEach((el, i) => el.classList.toggle("is-active", i === s));
      dots.forEach((el, i) => el.classList.toggle("on", i <= s));
      howTachi.setFull(s === 3);
      if (s === 3) howTachi.shake();
      howTachi.refresh();
      gsap.to(sonarHow, { opacity: s === 0 ? 1 : 0, duration: 0.3 });
    };
    const howTL = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: ".how", start: "top top", end: () => "+=" + innerHeight * (innerWidth < 860 ? 2.6 : 3),
        pin: ".how-pin", scrub: 0.6, anticipatePin: 1,
        onUpdate: (st) => setStep(Math.min(3, Math.floor(st.progress * 4 * 0.999)))
      }
    });
    howTL
      .fromTo(".how-hand", { x: 80, opacity: 0 }, { x: 0, opacity: 1, duration: 0.7, ease: "power2.out" }, 0)
      .to(howTachi.lid, { rotation: -42, svgOrigin: "1 14", duration: 0.5, ease: "back.out(1.4)" }, 1.05)
      .to(".how-hand", { x: -30, y: -20, rotation: -20, duration: 0.4 }, 1.2)
      .to(".how-hand", { opacity: 0, x: 60, duration: 0.4 }, 1.7)
      .fromTo(gFill, { height: "0%" }, { height: "100%", duration: 1, onUpdate() { gLabel.textContent = Math.round(this.progress() * 100) + "%"; } }, 2.0)
      .to(howTachi.lid, { rotation: 0, svgOrigin: "1 14", duration: 0.3 }, 1.9)
      .to({}, { duration: 1 }, 3);

    // circuit
    gsap.from(".hot", { scale: 0, duration: 0.5, ease: "back.out(2)", stagger: 0.1, scrollTrigger: { trigger: ".circ-diagram", start: "top 75%" } });
    gsap.from(".part", { y: 40, opacity: 0, duration: 0.7, ease: "power3.out", stagger: 0.08, scrollTrigger: { trigger: ".parts", start: "top 90%" } });
    gsap.fromTo(".circ-photo img", { scale: 1.25 }, { scale: 1, ease: "none", scrollTrigger: { trigger: ".circ-photo", start: "top bottom", end: "bottom top", scrub: true } });

    // code typing
    gsap.from(".code-card .ln", { opacity: 0, x: -12, duration: 0.4, stagger: 0.05, ease: "power2.out", scrollTrigger: { trigger: ".code-card", start: "top 75%" } });

    // process
    const mm = gsap.matchMedia();
    mm.add("(min-width: 860px)", () => {
      const track = $(".process-track");
      const dist = () => track.scrollWidth - innerWidth;
      gsap.to(track, { x: () => -dist(), ease: "none",
        scrollTrigger: { trigger: ".process", start: "top top", end: () => "+=" + dist(), pin: ".process-pin", scrub: 1, invalidateOnRefresh: true, anticipatePin: 1 } });
    });
    mm.add("(max-width: 859px)", () => {
      $$(".pcard").forEach((c) => {
        gsap.from($(".pimg", c), { clipPath: "inset(0 0 100% 0)", duration: 0.9, ease: "power4.out", scrollTrigger: { trigger: c, start: "top 85%" } });
        gsap.from($$("h3,p,.pnum", c), { y: 20, opacity: 0, duration: 0.6, stagger: 0.06, scrollTrigger: { trigger: c, start: "top 80%" } });
      });
    });

    // team
    gsap.from(".member", { rotationX: 60, y: 40, opacity: 0, transformPerspective: 800, transformOrigin: "50% 100%", duration: 0.8, ease: "power3.out", stagger: 0.07, scrollTrigger: { trigger: ".team-grid", start: "top 85%" } });
    ScrollTrigger.create({ trigger: ".team-grid", start: "top 60%", once: true, onEnter: () => tachis.slice(0).forEach((tc, i) => { if (tc.host.closest(".member")) setTimeout(() => tc.happy(900), i * 120); }) });

    // school
    gsap.from(".school-logo", { rotation: -12, scale: 0.7, duration: 1, ease: "back.out(1.7)", scrollTrigger: { trigger: ".school-card", start: "top 80%" } });

    // footer wave
    ScrollTrigger.create({ trigger: ".footer", start: "top 85%", onEnter: () => footTachi.wave() });
  } else {
    $$(".count").forEach((el) => (el.textContent = el.dataset.to));
  }

  /* ====================== circuit hotspots ====================== */
  const tip = $(".tip");
  $$(".hot").forEach((h) => h.addEventListener("click", () => {
    const on = !h.classList.contains("on");
    $$(".hot").forEach((x) => x.classList.remove("on"));
    h.classList.toggle("on", on);
    tip.textContent = on ? t(h.dataset.tip) : "";
    tip.classList.toggle("show", on);
  }));

  /* ====================== DEMO ====================== */
  const demoSec = $(".demo");
  const toastEl = $(".toast");
  const segs = $$(".meter-segs i");
  const pctEl = $(".meter-pct");
  let closeT, toastT, msgT;
  const isFull = () => demo.count >= demo.max;

  function toast(msg, bad) {
    toastEl.textContent = msg;
    toastEl.classList.toggle("bad", !!bad);
    toastEl.classList.add("show");
    clearTimeout(toastT);
    toastT = setTimeout(() => toastEl.classList.remove("show"), 1800);
  }
  function updateDemoStatus() {
    const full = isFull();
    demoSec.classList.toggle("is-full", full);
    $(".status-text").textContent = full ? t("demo.full") : t("demo.available");
    segs.forEach((s, i) => s.classList.toggle("on", i < demo.count));
    pctEl.textContent = Math.round((demo.count / demo.max) * 100) + "%";
  }
  function lcdMsg(m, ms = 1200) {
    demo.msg = m; demoTachi.refresh();
    clearTimeout(msgT);
    msgT = setTimeout(() => { demo.msg = null; demoTachi.refresh(); }, ms);
  }
  function scheduleClose(ms = 3000) { clearTimeout(closeT); closeT = setTimeout(() => demoTachi.closeLid(), ms); }
  let lastRefuse = 0;
  function refuse() {
    const now = Date.now();
    if (now - lastRefuse < 900) return;
    lastRefuse = now;
    demoTachi.shake();
    demoTachi.closeLid();
    toast(t("demo.fullToast"), true);
    if (navigator.vibrate) navigator.vibrate(60);
  }
  function feed() {
    demo.count = Math.min(demo.max, demo.count + 1);
    updateDemoStatus();
    if (isFull()) {
      demoTachi.setFull(true);
      demoTachi.refresh();
      demoTachi.shake();
      demoTachi.closeLid();
      toast(t("demo.fullToast"), true);
      if (navigator.vibrate) navigator.vibrate([60, 40, 60]);
    } else {
      demoTachi.happy();
      lcdMsg(t("lcd.thanks"));
      toast(t("demo.thanks"));
      scheduleClose(3000);
      if (navigator.vibrate) navigator.vibrate(15);
    }
  }
  function binPoint() {
    const r = demoTachi.head.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height * 0.15 };
  }
  function makeFlyer(item) {
    const f = document.createElement("div");
    f.className = "flyer-item";
    f.textContent = $("span", item).textContent;
    document.body.appendChild(f);
    const r = item.getBoundingClientRect();
    const w = 40, h = 40;
    f.style.width = w + "px"; f.style.height = h + "px"; f.style.lineHeight = h + "px"; f.style.textAlign = "center";
    if (hasGSAP) gsap.set(f, { x: r.left + r.width / 2 - w / 2, y: r.top + r.height / 2 - h / 2 });
    return f;
  }
  function land(f, item, p) {
    item.classList.add("used");
    gsap.to(f, { x: p.x - 20, y: p.y + 8, scale: 0.2, opacity: 0, duration: 0.35, ease: "power2.in", onComplete: () => { f.remove(); feed(); } });
  }
  function bounceBack(f, item) {
    const r = item.getBoundingClientRect();
    gsap.to(f, { x: r.left + r.width / 2 - 20, y: r.top + r.height / 2 - 20, rotation: 0, scale: 1, duration: 0.7, ease: "elastic.out(1,0.5)",
      onComplete: () => { f.remove(); item.classList.remove("dragging"); } });
  }
  function throwItem(item) {
    if (!hasGSAP || item.classList.contains("used") || demo.busy) return;
    demo.busy = true;
    const f = makeFlyer(item);
    item.classList.add("dragging");
    const p = binPoint();
    const sx = gsap.getProperty(f, "x"), sy = gsap.getProperty(f, "y");
    const peak = Math.min(sy, p.y) - 110;
    if (isFull()) {
      gsap.timeline({ onComplete: () => { demo.busy = false; bounceBack(f, item); } })
        .to(f, { x: p.x - 20 + 50, duration: 0.5, ease: "none" }, 0)
        .to(f, { keyframes: { y: [peak, p.y - 30], easeEach: "sine.inOut" }, duration: 0.5 }, 0)
        .add(refuse, 0.3);
      return;
    }
    gsap.timeline({ onComplete: () => { demo.busy = false; item.classList.remove("dragging"); land(f, item, p); } })
      .to(f, { x: p.x - 20, rotation: 300, duration: 0.65, ease: "none" }, 0)
      .to(f, { keyframes: { y: [peak, p.y - 40], easeEach: "sine.inOut" }, duration: 0.65 }, 0)
      .add(() => { demoTachi.openLid(); demoSec.classList.add("near"); }, 0.15)
      .add(() => demoSec.classList.remove("near"), 0.65);
  }

  $$(".item").forEach((item) => {
    let f = null, start = null, dragging = false, off = { x: 0, y: 0 }, pid = null;
    item.addEventListener("pointerdown", (e) => {
      if (!hasGSAP || item.classList.contains("used") || demo.busy) return;
      e.preventDefault();
      pid = e.pointerId;
      item.setPointerCapture(pid);
      start = { x: e.clientX, y: e.clientY };
      dragging = false;
    });
    item.addEventListener("pointermove", (e) => {
      if (!start || e.pointerId !== pid) return;
      if (!dragging) {
        if (Math.hypot(e.clientX - start.x, e.clientY - start.y) < 8) return;
        dragging = true;
        f = makeFlyer(item);
        item.classList.add("dragging");
        off = { x: 20, y: 30 };
        gsap.to(f, { scale: 1.3, duration: 0.2 });
      }
      gsap.set(f, { x: e.clientX - off.x, y: e.clientY - off.y - 10 });
      const p = binPoint();
      const d = Math.hypot(e.clientX - p.x, e.clientY - p.y);
      const near = d < 150;
      demoSec.classList.toggle("near", near);
      if (near) {
        if (isFull()) refuse();
        else { clearTimeout(closeT); demoTachi.openLid(); }
      } else if (demoTachi.lidOpen) scheduleClose(600);
    });
    const end = (e) => {
      if (!start || (e && e.pointerId !== pid)) return;
      const wasDrag = dragging;
      start = null; dragging = false;
      demoSec.classList.remove("near");
      if (!wasDrag) { throwItem(item); return; }
      const p = binPoint();
      const fx = gsap.getProperty(f, "x") + 20, fy = gsap.getProperty(f, "y") + 20;
      const d = Math.hypot(fx - p.x, fy - p.y);
      const ff = f; f = null;
      if (d < 110 && !isFull()) { item.classList.remove("dragging"); land(ff, item, p); }
      else { if (d < 110) refuse(); bounceBack(ff, item); scheduleClose(500); }
    };
    item.addEventListener("pointerup", end);
    item.addEventListener("pointercancel", end);
    item.addEventListener("click", (e) => { if (e.detail === 0) throwItem(item); });
  });

  $(".reset").addEventListener("click", () => {
    if (demo.count === 0) { demoTachi.wave(); return; }
    const p = binPoint();
    const emojis = ["🧴", "📄", "🥫", "🍌", "🥤"].slice(0, demo.count);
    if (hasGSAP && !reduced) {
      gsap.timeline()
        .to(demoTachi.all, { rotation: 18, svgOrigin: "114 148", duration: 0.3, ease: "power2.out" })
        .add(() => {
          demoTachi.openLid();
          emojis.forEach((em, i) => {
            const f = document.createElement("div");
            f.className = "flyer-item"; f.textContent = em; document.body.appendChild(f);
            gsap.set(f, { x: p.x - 20, y: p.y - 10, scale: 0.4 });
            gsap.to(f, { x: p.x - 20 + (i - 2) * 60 + (Math.random() * 30 - 15), y: p.y - 140 - Math.random() * 80, scale: 1, rotation: Math.random() * 360 - 180, duration: 0.6, ease: "power2.out" });
            gsap.to(f, { opacity: 0, y: "+=260", duration: 0.6, delay: 0.6, ease: "power2.in", onComplete: () => f.remove() });
          });
        })
        .to(demoTachi.all, { rotation: 0, svgOrigin: "114 148", duration: 0.6, ease: "elastic.out(1,0.5)" }, "+=0.35")
        .add(() => demoTachi.closeLid(), "-=0.3");
    }
    demo.count = 0;
    demoTachi.setFull(false);
    updateDemoStatus();
    $$(".item").forEach((i) => i.classList.remove("used", "dragging"));
    setTimeout(() => { demoTachi.happy(); lcdMsg(t("lcd.hi"), 1000); toast(t("demo.emptied")); }, 700);
  });

  /* ====================== init ====================== */
  applyLang(lang, false);
  onScroll();
  if (hasGSAP) addEventListener("load", () => ScrollTrigger.refresh());
})();
