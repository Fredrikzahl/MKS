(function(){
  var root = document.documentElement;

  /* ---------- språk ---------- */
  var q = new URLSearchParams(location.search), lang = q.get('lang');
  if (!lang){ try { lang = localStorage.getItem('mks-lang'); } catch(e){} }
  function setLang(l){
    root.lang = l === 'en' ? 'en' : 'no';
    document.querySelectorAll('[data-alt-en]').forEach(function(el){
      if (!el.dataset.altNo) el.dataset.altNo = el.getAttribute(el.dataset.attr || 'alt') || '';
      el.setAttribute(el.dataset.attr || 'alt', l === 'en' ? el.dataset.altEn : el.dataset.altNo);
    });
    document.querySelectorAll('.lang').forEach(function(b){ b.textContent = l === 'en' ? 'NO' : 'EN'; b.setAttribute('aria-label', l === 'en' ? 'Bytt til norsk' : 'Switch to English'); });
    try { localStorage.setItem('mks-lang', root.lang); } catch(e){}
  }
  setLang(lang || 'no');
  document.querySelectorAll('.lang').forEach(function(b){ b.addEventListener('click', function(){ setLang(root.lang === 'en' ? 'no' : 'en'); if (window.ScrollTrigger) ScrollTrigger.refresh(); }); });
  window.mksLang = function(){ return root.lang; };

  /* ---------- meny ---------- */
  var burger = document.querySelector('.burger'), nav = document.querySelector('.nav');
  if (burger) burger.addEventListener('click', function(){ var o = nav.classList.toggle('open'); burger.setAttribute('aria-expanded', o); });
  if (nav) nav.addEventListener('click', function(e){ if (e.target.closest('a')) { nav.classList.remove('open'); if (burger) burger.setAttribute('aria-expanded', false); } });

  /* ---------- header + mobil-CTA ---------- */
  var top = document.querySelector('.top'), mcta = document.querySelector('.mcta'), isHome = document.body.classList.contains('home');
  function onScroll(){ var y = window.scrollY, h = window.innerHeight; if (isHome) top.classList.toggle('solid', y > h * 0.5); if (mcta) mcta.classList.toggle('show', isHome ? y > h * 1.2 : y > 200); }
  window.addEventListener('scroll', onScroll, {passive:true}); onScroll();

  /* ---------- kopier telefon og e-post ---------- */
  document.querySelectorAll('.copy').forEach(function(b){
    b.addEventListener('click', function(){
      var lbl = b.innerHTML, done = function(){ b.innerHTML = '<span class="no">Kopiert</span><span class="en">Copied</span>'; setTimeout(function(){ b.innerHTML = lbl; }, 1600); };
      var sel = function(){ var r = document.createRange(); r.selectNodeContents(b.dataset.copy ? document.querySelector('.aside .mail') : document.querySelector('.phone')); var s = getSelection(); s.removeAllRanges(); s.addRange(r); };
      try { navigator.clipboard.writeText(b.dataset.copy || '90555989').then(done, sel); } catch(e){ sel(); }
    });
  });

  /* ---------- skjema ---------- */
  var form = document.getElementById('f');
  if (form){
    var step = 1, sets = form.querySelectorAll('fieldset'), lis = document.querySelectorAll('#steps li');
    var prev = document.getElementById('prev'), next = document.getElementById('next'), send = document.getElementById('send'), err = document.getElementById('err');
    var M = {
      kunde:['Velg hvem du er.','Choose who you are.'], tjeneste:['Velg hva du trenger.','Choose what you need.'],
      adresse:['Skriv inn adressen for oppdraget.','Enter the address of the job.'], navn:['Skriv inn navnet ditt.','Enter your name.'],
      telefon:['Skriv inn et telefonnummer med 8 siffer.','Enter a phone number with at least 8 digits.'],
      epost:['Skriv inn en gyldig e-postadresse, så får du kopi av forespørselen.','Enter a valid email address so we can send you a copy.']
    };
    var t = function(k){ return M[k][root.lang === 'en' ? 1 : 0]; };
    var val = function(n){ var el = form.elements[n]; return el ? (el.value || '').trim() : ''; };
    var check = function(s){
      if (s===1){ if(!val('kunde')) return t('kunde'); if(!val('tjeneste')) return t('tjeneste'); }
      if (s===2){ if(val('adresse').length < 4) return t('adresse'); }
      if (s===3){ if(val('navn').length < 2) return t('navn'); if(val('telefon').replace(/\D/g,'').length < 8) return t('telefon'); if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val('epost'))) return t('epost'); }
      return '';
    };
    var show = function(s){
      step = s;
      sets.forEach(function(fs){ fs.hidden = (+fs.dataset.step !== s); });
      lis.forEach(function(li,i){ li.className = (i+1===s) ? 'on' : (i+1 < s ? 'done' : ''); });
      prev.hidden = s===1; next.hidden = s===3; send.hidden = s!==3; err.hidden = true;
    };
    next.addEventListener('click', function(){ var m = check(step); if (m){ err.textContent = m; err.hidden = false; return; } show(step+1); var f = sets[step-1].querySelector('input:not([type=radio]),textarea'); if (f) f.focus({preventScroll:true}); });
    prev.addEventListener('click', function(){ show(step-1); });
    form.addEventListener('submit', function(e){
      e.preventDefault();
      var m = check(3); if (m){ err.textContent = m; err.hidden = false; return; }
      var data = {}; new FormData(form).forEach(function(v,k){ data[k] = v; }); data.sprak = root.lang;
      send.disabled = true;
      var finish = function(ok){
        form.hidden = true; document.getElementById('steps').hidden = true;
        var first = data.navn.split(' ')[0], en = root.lang === 'en';
        document.getElementById('done').hidden = false;
        document.getElementById('done-h').textContent = (en ? 'Thank you, ' : 'Takk, ') + first + '!';
        document.getElementById('done-p').textContent = en
          ? (ok ? 'We have received your request and sent a copy to ' + data.epost + '. ' : '') + 'We will call you as soon as we can to arrange a site visit. If it is snowing, we are probably sitting in a wheel loader, but we have not forgotten you. In a hurry? Call +47 905 55 989.'
          : (ok ? 'Vi har mottatt forespørselen din og sendt en kopi til ' + data.epost + '. ' : '') + 'Vi ringer deg snarest for å avtale befaring. Laver det ned, sitter vi nok i en hjullaster, men vi har ikke glemt deg. Haster det? Ring 905 55 989.';
        document.getElementById('demo').hidden = ok;
      };
      fetch('/api/foresporsel', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(data)})
        .then(function(r){ finish(r.ok); }).catch(function(){ finish(false); });
    });
  }

  /* ---------- galleri-lysboks ---------- */
  var lb = document.getElementById('lb');
  if (lb){
    var lbImg = lb.querySelector('img');
    document.querySelectorAll('.collage button').forEach(function(b){
      b.addEventListener('click', function(){ var i = b.querySelector('img'); lbImg.src = i.src; lbImg.alt = i.alt; lb.showModal(); });
    });
    lb.addEventListener('click', function(e){ if (e.target === lb || e.target.closest('.x')) lb.close(); });
  }

  /* ---------- referanse-tidslinje ---------- */
  var tl = document.getElementById('tl');
  if (tl){
    var Y0 = 1975, Y1 = 2026, NOW = 2026;
    var refs = [
      {n:'7 borettslag på Håpet', ne:'7 housing co-ops at Håpet', s:1975, fam:1997},
      {n:'Sameiet Bo i Nord', s:1995, lbl:['1990-tallet – i dag','1990s – today']},
      {n:'Bohus', r:'Pål J., Håpet Invest', s:2000, e:2025},
      {n:'Biltema', r:'Pål J., Håpet Invest', s:2000, e:2025},
      {n:'Widerøe Ground Handling', r:'Helge R.', s:2017, famFrom:1975},
      {n:'Drytech', r:'Trond H.', s:2018},
      {n:'UiT Norges arktiske universitet', ne:'UiT The Arctic University of Norway', r:'Frode J.', s:2018, e:2022},
      {n:'Teknisk Bureau (Mercedes)', r:'Anita J.', s:2019, e:2024},
      {n:'Politihuset i Tromsø', ne:'Tromsø Police Station', s:2019, e:2026},
      {n:'Optimera', r:'Frode B.', s:2020}
    ];
    var pct = function(y){ return ((y - Y0) / (Y1 - Y0) * 100).toFixed(2) + '%'; };
    var ticks = document.getElementById('ticks');
    [1975,1985,1997,2007,2017,2026].forEach(function(y){ var s = document.createElement('span'); s.style.left = pct(y); s.textContent = y; ticks.appendChild(s); });
    refs.forEach(function(r){
      var row = document.createElement('div'); row.className = 'trow'; row.setAttribute('role','row');
      var yn = r.lbl ? r.lbl[0] : (r.e ? r.s + '–' + r.e : r.s + ' – i dag');
      var ye = r.lbl ? r.lbl[1] : (r.e ? r.s + '–' + r.e : r.s + ' – today');
      row.innerHTML = '<div class="who" role="cell"><b><span class="no"></span><span class="en"></span></b><small><span class="no"></span><span class="en"></span></small></div><div class="track" role="cell"></div>';
      var b = row.querySelectorAll('b span'), sm = row.querySelectorAll('small span');
      b[0].textContent = r.n; b[1].textContent = r.ne || r.n;
      sm[0].textContent = yn + (r.r ? ' · ' + r.r : ''); sm[1].textContent = ye + (r.r ? ' · ' + r.r : '');
      var tr = row.querySelector('.track'); tr.setAttribute('aria-label', r.n + ', ' + yn);
      var famEnd = r.fam || (r.famFrom ? r.s : null), famStart = r.famFrom || r.s;
      if (famEnd){ var f = document.createElement('i'); f.className = 'fam'; f.style.left = pct(famStart); f.style.width = 'calc(' + pct(famEnd) + ' - ' + pct(famStart) + ')'; tr.appendChild(f); }
      var st = r.fam || r.s, en = r.e || NOW, bar = document.createElement('i');
      bar.style.left = pct(st); bar.style.width = 'calc(' + pct(en) + ' - ' + pct(st) + ')'; if (!r.e) bar.className = 'open';
      tr.appendChild(bar); tl.appendChild(row);
    });
  }

  /* ---------- Lenis + GSAP (felles) ---------- */
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.mks = {reduce: reduce, lenis: null};
  if (!reduce && window.gsap && window.ScrollTrigger){
    gsap.registerPlugin(ScrollTrigger);
    if (q.get('jump') !== null) history.scrollRestoration = 'manual';
    if (window.Lenis && q.get('jump') === null){
      var lenis = new Lenis({lerp:.1, smoothWheel:true});
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function(tt){ lenis.raf(tt*1000); }); gsap.ticker.lagSmoothing(0);
      window.mks.lenis = lenis;
      document.querySelectorAll('a[href^="#"]').forEach(function(a){ a.addEventListener('click', function(e){ var id = a.getAttribute('href'); var el = id.length > 1 && document.querySelector(id); if (!el) return; e.preventDefault(); lenis.scrollTo(el, {offset: id === '#film' ? 0 : -70}); }); });
    }
  }

  /* ambient-effekter: kjøres etter evt. film-pin (film.js kaller mks.ambient()) */
  window.mks.ambient = function(){
    if (reduce || !window.gsap) return;
    gsap.utils.toArray('.svc-photo img, .sc img, .fleet-hero img, .case img, .page-hero .bg img').forEach(function(img){
      gsap.fromTo(img, {scale:1.08}, {scale:1, ease:'none', scrollTrigger:{trigger:img, start:'top bottom', end:'bottom top', scrub:true}});
    });
    gsap.utils.toArray('.track i').forEach(function(b){ gsap.from(b, {scaleX:0, transformOrigin:'left center', duration:1, ease:'power3.out', scrollTrigger:{trigger:b, start:'top 94%'}}); });
    var b30 = document.querySelector('.big30'); if (b30) gsap.to(b30, {yPercent:-20, ease:'none', scrollTrigger:{trigger:b30.parentNode, start:'top top', end:'bottom top', scrub:true}});
  };

  /* dev-kontrakt: ?jump=<scrollY>, window.__ready */
  window.mks.finish = function(after, ready){
    window.addEventListener('load', function(){
      if (window.ScrollTrigger) ScrollTrigger.refresh();
      var j = q.get('jump');
      if (j !== null){ var y = +j; window.scrollTo(0, y); if (window.ScrollTrigger) ScrollTrigger.update(); if (after) after(); }
      var t0 = Date.now();
      (function wait(){ if (!ready || ready() || Date.now() - t0 > 6000) setTimeout(function(){ window.__ready = true; }, 350); else setTimeout(wait, 50); })();
    });
  };
  if (!document.body.classList.contains('home')){ window.mks.ambient(); window.mks.finish(); }
})();
