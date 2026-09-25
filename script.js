/* ============================================================
   ЭСТЕТИК - скрипт страницы.
   Плиты и «отпечаток на подоскопе»: в герое фото проступает сквозь три пятна
   давления (пятка → свод → пальцы) на интро и по --stay расходится за края экрана,
   изолинии нагрузки вокруг пятен тают; кадры услуг открываются теми же пятнами
   по --open. Меню · i18n (казахский словарь грузится отдельным файлом) ·
   бегущая строка · WhatsApp с текстом по услуге · лента видео с кнопками ·
   немые петли по видимости · модальный плеер · счётчики · ленивая карта.
   Библиотек нет. Ссылки tel/wa не перезаписываются в момент клика -
   обработчик кликов только в фазе захвата (совместимость с LeadBot).
   ============================================================ */
(function(){
"use strict";

var WA = "77056044869";
var ASSET_V = ((document.currentScript && document.currentScript.src.match(/[?&]v=([^&]+)/)) || [])[1] || "";
var RED = matchMedia("(prefers-reduced-motion: reduce)").matches;
var HAS_IO = typeof IntersectionObserver === "function";
var root = document.documentElement;
root.classList.add("js");

/* ---------------- КОНВЕРСИИ GOOGLE ADS (ярлыки задаст index.html позже) ---------------- */
function conv(key){
  var id = (window.MP_CONV || {})[key];
  if (!id || typeof window.gtag !== "function") return;
  window.gtag("event", "conversion", {send_to: id, value: 1.0, currency: "USD", transport_type: "beacon"});
}
window.addEventListener("click", function(e){
  var a = e.target.closest ? e.target.closest("a[href]") : null;
  if (!a) return;
  var h = a.getAttribute("href") || "";
  if (h.indexOf("tel:") === 0) conv("phone");
  else if (h.indexOf("wa.me") > -1) conv("contact");
}, true);

/* ---------------- ТЕКСТЫ WHATSAPP ПО УСЛУГАМ ---------------- */
var WA_RU = {
  hero:     "Здравствуйте! Пишу с сайта «Эстетик». Хочу записаться на приём. Проблема: ",
  vrosshiy: "Здравствуйте! Пишу с сайта «Эстетик».\nУслуга: коррекция вросшего ногтя.\nХочу записаться. Удобное время: ",
  stelki:   "Здравствуйте! Пишу с сайта «Эстетик».\nУслуга: ортопедические стельки.\nХочу записаться на диагностику. Удобное время: ",
  gribok:   "Здравствуйте! Пишу с сайта «Эстетик».\nУслуга: обработка ногтей при грибке.\nХочу записаться. Удобное время: ",
  pedikyur: "Здравствуйте! Пишу с сайта «Эстетик».\nУслуга: медицинский педикюр.\nХочу записаться. Удобное время: ",
  stopy:    "Здравствуйте! Пишу с сайта «Эстетик».\nУслуга: обработка стоп (натоптыши, мозоли, бородавки).\nХочу записаться. Удобное время: ",
  online:   "Здравствуйте! Хочу бесплатную онлайн-консультацию по фото. Отправляю фото проблемы:",
  kontakty: "Здравствуйте! Пишу с сайта «Эстетик». Вопрос: "
};
function setWaLinks(lang){
  var T = (lang === "kk" && window.SITE_KK && window.SITE_KK.__wa) ? window.SITE_KK.__wa : WA_RU;
  document.querySelectorAll("[data-wa]").forEach(function(a){
    var t = T[a.dataset.wa] || WA_RU[a.dataset.wa] || WA_RU.hero;
    a.href = "https://wa.me/" + WA + "?text=" + encodeURIComponent(t);
    a.target = "_blank"; a.rel = "noopener";
  });
}

/* ---------------- ЯЗЫК ----------------
   Русский - в разметке (снимок в RU), казахский - assets/lang/kk.js по кнопке KZ,
   ?lang=kk или сохранённому выбору. По navigator.language не угадываем. */
var RU_MQ = "Вросший ноготь|Скоба вместо хирургии|Ортопедические стельки|Грибок ногтей|Медицинский педикюр|Стержневая мозоль|Натоптыши|Бородавки|Онлайн-консультация в подарок";
var I18N = {}, RU = {};
function curLang(){ return root.getAttribute("lang") || "ru"; }
function snapshot(){
  document.querySelectorAll("[data-i]").forEach(function(el){ RU[el.dataset.i] = el.textContent; });
  document.querySelectorAll("[data-i-t]").forEach(function(el){ RU[el.dataset.iT] = el.textContent; });
  document.querySelectorAll("[data-i-c]").forEach(function(el){ RU[el.dataset.iC] = el.getAttribute("content"); });
  RU["mq.list"] = RU_MQ;
}
function tr(key){ var d = I18N[curLang()]; return (d && d[key]) || RU[key] || ""; }
function applyLang(lang){
  var d = lang === "ru" ? RU : (I18N[lang] || RU);
  function g(k){ return d[k] != null ? d[k] : RU[k]; }
  document.querySelectorAll("[data-i]").forEach(function(el){ var v = g(el.dataset.i); if (v != null) el.textContent = v; });
  document.querySelectorAll("[data-i-t]").forEach(function(el){ var v = g(el.dataset.iT); if (v != null) el.textContent = v; });
  document.querySelectorAll("[data-i-c]").forEach(function(el){ var v = g(el.dataset.iC); if (v != null) el.setAttribute("content", v); });
  root.setAttribute("lang", lang);
  document.querySelectorAll(".lang button").forEach(function(b){
    var on = b.dataset.lang === lang;
    b.classList.toggle("is-active", on); b.setAttribute("aria-pressed", on ? "true" : "false");
  });
  try { localStorage.setItem("mp-lang", lang); } catch(e){}
  setWaLinks(lang);
  buildMarquee(g("mq.list"));
  fitText();
}
function loadLang(lang, done){
  if (I18N[lang] || lang !== "kk") return done();
  var s = document.createElement("script");
  s.src = "assets/lang/kk.js" + (ASSET_V ? "?v=" + ASSET_V : "");
  s.onload = function(){ if (window.SITE_KK) I18N.kk = window.SITE_KK; done(); };
  s.onerror = function(){ done(); };
  document.head.appendChild(s);
}
function setLang(lang){
  if (lang !== "kk") lang = "ru";
  loadLang(lang, function(){ applyLang((I18N[lang] || lang === "ru") ? lang : "ru"); });
}
document.querySelectorAll(".lang button").forEach(function(b){ b.addEventListener("click", function(){ setLang(b.dataset.lang); }); });
function initLang(){
  var q = new URLSearchParams(location.search).get("lang"), saved = null;
  try { saved = localStorage.getItem("mp-lang"); } catch(e){}
  var L = q || saved || "ru";
  if (L === "kk") setLang("kk"); else { setWaLinks("ru"); buildMarquee(RU_MQ); }
}

/* ---------------- БЕГУЩАЯ СТРОКА (две копии, цикл в одну копию) ---------------- */
function buildMarquee(list){
  var box = document.getElementById("mq"); if (!box) return;
  var html = "";
  (list || RU_MQ).split("|").forEach(function(t){ html += "<b>" + t + "</b>"; });
  box.innerHTML = html + html;
  requestAnimationFrame(function(){
    var w = box.scrollWidth / 2;
    box.style.setProperty("--tkw", w + "px");
    box.style.setProperty("--tkd", Math.max(22, w / 55) + "s");
  });
}

/* ---------------- ДИСПЛЕЙНАЯ СТРОКА В ОДНУ СТРОКУ ---------------- */
function fitText(){
  document.querySelectorAll(".fit").forEach(function(el){
    el.style.fontSize = "";
    var box = el.parentElement; if (!box) return;
    var bw = box.clientWidth; if (!bw) return;
    var size = parseFloat(getComputedStyle(el).fontSize), base = size;
    while (el.scrollWidth > bw + 1 && size > base * 0.5) { size *= 0.95; el.style.fontSize = size + "px"; }
  });
}

/* ---------------- МЕНЮ ---------------- */
var burger = document.getElementById("burger"), mnav = document.getElementById("mnav");
function closeMenu(){
  document.body.classList.remove("menu-open");
  if (burger) burger.setAttribute("aria-expanded", "false");
}
if (burger) burger.addEventListener("click", function(){
  var open = document.body.classList.toggle("menu-open");
  burger.setAttribute("aria-expanded", open ? "true" : "false");
});
if (mnav) mnav.addEventListener("click", function(e){ if (e.target.closest("a")) closeMenu(); });

/* ---------------- ЯКОРЯ ---------------- */
var HH = function(){ return parseFloat(getComputedStyle(root).getPropertyValue("--hh")) || 72; };
document.addEventListener("click", function(e){
  var a = e.target.closest('a[href^="#"]'); if (!a) return;
  var id = a.getAttribute("href").slice(1); if (!id) return;
  var t = document.getElementById(id); if (!t) return;
  e.preventDefault();
  closeMenu();
  var top = t.getBoundingClientRect().top + scrollY - (t.classList.contains("pw") ? 0 : HH() + 12);
  scrollTo({ top: Math.max(0, top), behavior: RED ? "auto" : "smooth" });
  try { history.pushState(null, "", "#" + id); } catch(err){}
});

/* ---------------- ШАПКА ---------------- */
var hdr = document.getElementById("hdr");
function hdrState(){ if (hdr) hdr.classList.toggle("solid", scrollY > 30); }

/* ---------------- ПЛИТЫ, ГЕРОЙ, КАДРЫ ----------------
   Один слушатель scroll через rAF. На .pw пишем --enter/--exit/--stay;
   герой: три пятна давления (центры и радиусы в px) + изолинии; .fr: --open и фазы --p1..3. */
function clamp(v){ return v < 0 ? 0 : (v > 1 ? 1 : v); }
function easeOut(t){ return 1 - Math.pow(1 - t, 3); }
function easeIn(t){ return t * t * t; }
function easeInOut(t){ return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
var pws = [].slice.call(document.querySelectorAll(".pw"));
var frames = [].slice.call(document.querySelectorAll(".fr"));
var heroPw = document.getElementById("top");
var hero = document.getElementById("hero");
var heroPh = document.querySelector(".hero-ph");
var isoBox = document.getElementById("iso");
var bar = document.getElementById("bar");
var kont = document.getElementById("kontakty");
var introK = 1, introDone = true;
var DBG = new URLSearchParams(location.search);
var dbgIntro = parseFloat(DBG.get("intro")), dbgOpen = parseFloat(DBG.get("open")), dbgStay = parseFloat(DBG.get("stay"));

/* изолинии: по три кольца вокруг каждого пятна */
var rings = [];
if (isoBox) {
  for (var si = 0; si < 3; si++) for (var k = 1; k <= 3; k++) {
    var el = document.createElement("i"); el.dataset.s = si; el.dataset.k = k;
    isoBox.appendChild(el); rings.push(el);
  }
}
function heroGeom(W, H){
  var mob = W <= 760;
  var base = mob ? Math.min(W * .30, H * .16) : Math.min(W * .15, H * .30);
  return {
    c: mob ? [[.50 * W, .19 * H], [.56 * W, .40 * H], [.47 * W, .60 * H]]
           : [[.68 * W, .27 * H], [.715 * W, .55 * H], [.66 * W, .84 * H]],
    r: [base * 1.04, base * 1.18, base * .98],
    soft: base * .42,
    Rmax: Math.hypot(W, H) * 1.02
  };
}
function heroSpots(intro, stay){
  if (!heroPh) return;
  var W = innerWidth, H = innerHeight, g = heroGeom(W, H);
  /* интро: пятка → свод → пальцы; скролл: те же три фазы */
  var b = [easeOut(clamp(intro * 1.6 - .6)), easeOut(clamp(intro * 1.6 - .3)), easeOut(clamp(intro * 1.6))];
  var s = [easeIn(clamp(stay * 1.35 - .35)), easeIn(clamp(stay * 1.35 - .18)), easeIn(clamp(stay * 1.35))];
  for (var i = 0; i < 3; i++) {
    var rest = g.r[i] * b[i];
    var r = rest + (g.Rmax - rest) * s[i];
    var inner = Math.max(0, r - g.soft * (1 + 2 * s[i]));
    heroPh.style.setProperty("--c" + (i + 1), g.c[i][0].toFixed(0) + "px " + g.c[i][1].toFixed(0) + "px");
    heroPh.style.setProperty("--o" + (i + 1), r.toFixed(0) + "px");
    heroPh.style.setProperty("--i" + (i + 1), inner.toFixed(0) + "px");
  }
  rings.forEach(function(el){
    var i = +el.dataset.s, kk = +el.dataset.k;
    var rr = g.r[i] * b[i] + kk * (g.soft * .55) + (g.Rmax - g.r[i]) * s[i];
    el.style.setProperty("--x", g.c[i][0].toFixed(0) + "px");
    el.style.setProperty("--y", g.c[i][1].toFixed(0) + "px");
    el.style.setProperty("--d", (2 * rr).toFixed(0) + "px");
    el.style.setProperty("--o", (b[i] * (1 - kk * .24) * (1 - clamp(stay * 2.2))).toFixed(3));
  });
}
function update(){
  var H = innerHeight || root.clientHeight;
  if (root.classList.contains("no-plate")) {
    hdrState();
    if (bar) bar.classList.toggle("show", scrollY > H * 0.55 && !(kont && kont.getBoundingClientRect().top < H * 0.6));
    return;
  }
  pws.forEach(function(pw){
    var r = pw.getBoundingClientRect();
    var enter = clamp(1 - r.top / H);
    var exit  = clamp(1 - r.bottom / H);
    var stay  = r.height > H + 1 ? clamp(-r.top / (r.height - H)) : enter;
    pw.style.setProperty("--enter", enter.toFixed(3));
    pw.style.setProperty("--exit",  exit.toFixed(3));
    pw.style.setProperty("--stay",  stay.toFixed(3));
    pw.classList.toggle("gone", exit >= 1);
    pw.classList.toggle("on", enter > 0.62);
    if (pw === heroPw) {
      var ip = introDone ? 1 : easeOut(introK);
      if (!isNaN(dbgIntro)) ip = dbgIntro;
      if (!isNaN(dbgStay)) stay = dbgStay;
      pw.style.setProperty("--intro", ip.toFixed(4));
      heroSpots(ip, stay);
    }
  });
  frames.forEach(function(f){
    /* раскрытие считаем по въезду самой плиты: пятна проступают, пока плита наезжает */
    var host = f.closest(".pw") || f;
    var r = host.getBoundingClientRect();
    var e = clamp(1 - r.top / H);
    var open = !isNaN(dbgOpen) ? dbgOpen : easeInOut(clamp((e - .38) / .58));
    f.style.setProperty("--open", open.toFixed(3));
    f.style.setProperty("--p1", clamp(open * 1.7).toFixed(3));
    f.style.setProperty("--p2", clamp(open * 1.7 - .35).toFixed(3));
    f.style.setProperty("--p3", clamp(open * 1.7 - .7).toFixed(3));
    f.classList.toggle("opened", open >= .999);
  });
  hdrState();
  var onKont = kont && kont.getBoundingClientRect().top < H * 0.6;
  if (bar) bar.classList.toggle("show", scrollY > H * 0.55 && !onKont);
}
if (RED) {
  root.classList.add("no-plate");
  root.classList.add("no-intro");
  if (hero) hero.classList.add("on");
  pws.forEach(function(pw){ pw.classList.add("on"); });
  frames.forEach(function(f){ f.classList.add("opened"); });
  addEventListener("scroll", function(){ hdrState(); if (bar) bar.classList.toggle("show", scrollY > innerHeight * 0.55 && !(kont && kont.getBoundingClientRect().top < innerHeight * 0.6)); }, {passive:true});
  hdrState();
} else {
  var tick = false;
  addEventListener("scroll", function(){
    if (tick) return; tick = true;
    requestAnimationFrame(function(){ tick = false; update(); });
  }, {passive:true});
  addEventListener("load", update);
  /* интро 1400 мс: пятна давления проступают пятка → свод → пальцы, текст поднимается.
     Пропускаем при хэше / прокрутке - человек из рекламы сразу видит собранный экран. */
  var skip = location.hash || scrollY > 80;
  if (skip) {
    root.classList.add("no-intro");
    if (hero) hero.classList.add("on");
    update();
  } else {
    introK = 0; introDone = false; update();
    var t0 = null;
    var step = function(ts){
      if (introDone) return;
      if (t0 === null) t0 = ts;
      var p = clamp((ts - t0) / 1400);
      introK = p;
      if (p > .25 && hero) hero.classList.add("on");
      update();
      if (p < 1) requestAnimationFrame(step);
      else { introDone = true; update(); }
    };
    requestAnimationFrame(function(){ requestAnimationFrame(step); });
    setTimeout(function(){ if (hero) hero.classList.add("on"); }, 700);
    setTimeout(function(){ if (!introDone) { introDone = true; introK = 1; update(); } }, 2600);
  }
}
[1500, 3000, 5000].forEach(function(ms){ setTimeout(update, ms); });
window.plateSync = function(){ introDone = true; introK = 1; if (hero) hero.classList.add("on"); update(); };
addEventListener("hashchange", function(){ root.classList.add("no-intro"); });

var rsTimer;
addEventListener("resize", function(){
  update();
  clearTimeout(rsTimer);
  rsTimer = setTimeout(function(){ buildMarquee(tr("mq.list")); fitText(); update(); updateArrows(); }, 200);
});
if (document.fonts && document.fonts.ready) document.fonts.ready.then(function(){ fitText(); buildMarquee(tr("mq.list")); update(); });

/* ---------------- ПОЯВЛЕНИЕ В КАТАЛОЖНЫХ СЕКЦИЯХ + СЧЁТЧИКИ ---------------- */
function runCount(b){
  var to = parseInt(b.dataset.count, 10), suf = b.dataset.suffix || "", t0 = null;
  if (RED || !to) return;
  var fmt = function(n){ return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " "); };
  var step = function(ts){
    if (t0 === null) t0 = ts;
    var p = clamp((ts - t0) / 1400), v = Math.round(to * (1 - Math.pow(1 - p, 3)));
    b.textContent = fmt(v) + (p >= 1 ? suf : "");
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
if (HAS_IO) {
  var io = new IntersectionObserver(function(es){
    es.forEach(function(e){
      if (!e.isIntersecting) return;
      e.target.classList.add("in");
      e.target.querySelectorAll("[data-count]").forEach(runCount);
      io.unobserve(e.target);
    });
  }, {threshold:.08, rootMargin:"0px 0px -6% 0px"});
  document.querySelectorAll(".rv").forEach(function(el){ io.observe(el); });
  setTimeout(function(){ document.querySelectorAll(".rv:not(.in)").forEach(function(el){
    if (el.getBoundingClientRect().top < innerHeight) { el.classList.add("in"); el.querySelectorAll("[data-count]").forEach(runCount); io.unobserve(el); }
  }); }, 1500);
} else {
  document.querySelectorAll(".rv").forEach(function(el){ el.classList.add("in"); });
}

/* ---------------- ЛЕНТЫ С КНОПКАМИ ЛИСТАНИЯ ----------------
   Шаг - одна карточка (ширина + gap из стилей), крайняя кнопка гаснет, обе прячутся, если всё влезло. */
function trackStep(track){
  var li = track.querySelector("li"); if (!li) return track.clientWidth * .8;
  var gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap) || 16;
  return li.getBoundingClientRect().width + gap;
}
function updateArrows(){
  document.querySelectorAll(".track").forEach(function(track){
    var id = "#" + track.id;
    var prev = document.querySelector('[data-prev="' + id + '"]'), next = document.querySelector('[data-next="' + id + '"]');
    if (!prev || !next) return;
    var max = track.scrollWidth - track.clientWidth;
    var none = max <= 1;
    prev.hidden = none; next.hidden = none;
    prev.disabled = track.scrollLeft <= 1;
    next.disabled = track.scrollLeft >= max - 1;
  });
}
document.querySelectorAll("[data-prev],[data-next]").forEach(function(b){
  b.addEventListener("click", function(){
    var sel = b.dataset.prev || b.dataset.next;
    var track = document.querySelector(sel); if (!track) return;
    track.scrollBy({left: (b.dataset.prev ? -1 : 1) * trackStep(track), behavior: RED ? "auto" : "smooth"});
  });
});
document.querySelectorAll(".track").forEach(function(track){
  var st;
  track.addEventListener("scroll", function(){ clearTimeout(st); st = setTimeout(updateArrows, 80); }, {passive:true});
});
updateArrows();
addEventListener("load", updateArrows);

/* ---------------- ВИДЕО: немые петли по видимости + модальный плеер ---------------- */
var vcards = [].slice.call(document.querySelectorAll(".vplay"));
var modal = document.getElementById("vmodal"), player = document.getElementById("vplayer"), vmCap = document.getElementById("vm-cap");
var modalOpen = false, lastFocus = null;
function playLoop(card){
  var v = card.querySelector(".loop");
  if (!v || modalOpen || RED) return;
  if (!v.getAttribute("src")) {
    v.addEventListener("playing", function(){ card.classList.add("is-live"); });
    v.setAttribute("src", v.getAttribute("data-loop"));
  }
  var pr = v.play(); if (pr && pr.catch) pr.catch(function(){});
  if (!v.paused) card.classList.add("is-live");
}
function stopLoop(card){
  var v = card.querySelector(".loop"); if (!v) return;
  card.classList.remove("is-live");
  try { v.pause(); } catch(e){}
}
if (vcards.length && HAS_IO && !RED) {
  var vio = new IntersectionObserver(function(es){
    es.forEach(function(en){
      en.target._seen = en.isIntersecting;
      if (en.isIntersecting) playLoop(en.target); else stopLoop(en.target);
    });
  }, {threshold:.55});
  vcards.forEach(function(c){ vio.observe(c); });
}
function openVideo(card){
  var src = card.getAttribute("data-video");
  if (!src || !modal || !player) return;
  lastFocus = card;
  vcards.forEach(stopLoop);
  modalOpen = true;
  if (vmCap) vmCap.textContent = tr(card.dataset.title) || "";
  player.setAttribute("src", src);
  modal.classList.add("is-open");
  document.body.classList.add("modal-open");
  var pr = player.play(); if (pr && pr.catch) pr.catch(function(){});
  var x = modal.querySelector(".vm-x"); if (x) x.focus();
}
function closeVideo(){
  if (!modalOpen) return;
  modalOpen = false;
  try { player.pause(); } catch(e){}
  player.removeAttribute("src");
  try { player.load(); } catch(e){}
  modal.classList.remove("is-open");
  document.body.classList.remove("modal-open");
  vcards.forEach(function(c){ if (c._seen) playLoop(c); });
  if (lastFocus && lastFocus.focus) lastFocus.focus();
}
vcards.forEach(function(c){ c.addEventListener("click", function(){ openVideo(c); }); });
if (modal) modal.addEventListener("click", function(e){ if (e.target.closest("[data-vm-close]")) closeVideo(); });
addEventListener("keydown", function(e){ if (e.key === "Escape") { closeMenu(); closeVideo(); } });

/* ---------------- КАРТА: грузим, когда контакты близко ---------------- */
var mapFrame = document.querySelector("#map iframe[data-src]");
function loadMap(){ if (mapFrame && !mapFrame.src) mapFrame.src = mapFrame.dataset.src; }
if (mapFrame) {
  if (HAS_IO) {
    var mio = new IntersectionObserver(function(es){ if (es[0].isIntersecting) { loadMap(); mio.disconnect(); } }, {rootMargin:"600px 0px"});
    mio.observe(mapFrame);
  } else setTimeout(loadMap, 3000);
}

/* ---------------- СТАРТ ---------------- */
snapshot();
initLang();
fitText();
hdrState();
})();
