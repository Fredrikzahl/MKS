(function(){
  var mks = window.mks || {};
  if (mks.reduce || !window.gsap || !window.ScrollTrigger){
    document.querySelectorAll('.scene,.cap').forEach(function(el){ el.style.visibility = 'visible'; el.style.opacity = 1; });
    if (mks.finish) mks.finish(); else window.__ready = true;
    return;
  }

  /* snø */
  var cv = document.getElementById('snow'), cx = cv.getContext('2d'), flakes = [], intensity = 1, wind = -0.6, W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2), running = true;
  function size(){ W = cv.clientWidth; H = cv.clientHeight; cv.width = W*dpr; cv.height = H*dpr; cx.setTransform(dpr,0,0,dpr,0,0); }
  size(); window.addEventListener('resize', size);
  var N = Math.round(Math.min(260, Math.max(90, W/5)));
  for (var i=0;i<N;i++) flakes.push({x:Math.random()*W, y:Math.random()*H, r:Math.random()*2.2+.4, v:Math.random()*1.2+.6, d:Math.random()*Math.PI*2});
  function draw(){
    if (running){
      cx.clearRect(0,0,W,H);
      var n = Math.round(flakes.length * intensity);
      cx.fillStyle = 'rgba(243,241,234,.85)';
      for (var i=0;i<n;i++){ var f = flakes[i]; f.d += .01; f.y += f.v * (0.8 + intensity); f.x += wind * f.v * .6 + Math.sin(f.d) * .3;
        if (f.y > H+4){ f.y = -4; f.x = Math.random()*W; } if (f.x < -4) f.x = W+4; if (f.x > W+4) f.x = -4;
        cx.globalAlpha = .35 + f.r/3.5; cx.beginPath(); cx.arc(f.x,f.y,f.r,0,Math.PI*2); cx.fill(); }
      cx.globalAlpha = 1;
    }
    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);

  /* tittel: tegn for tegn */
  document.querySelectorAll('.split').forEach(function(el){
    var txt = el.textContent; el.textContent = '';
    txt.split(' ').forEach(function(w, wi, arr){
      var ws = document.createElement('span'); ws.style.whiteSpace = 'nowrap'; ws.setAttribute('aria-hidden','true');
      w.split('').forEach(function(c){ var s = document.createElement('span'); s.className = 'char'; s.textContent = c; ws.appendChild(s); });
      el.appendChild(ws); if (wi < arr.length-1) el.appendChild(document.createTextNode(' '));
    });
  });
  gsap.from('.c1 .char', {yPercent:110, opacity:0, duration:.9, ease:'power4.out', stagger:.02, delay:.15});
  gsap.from('.c1 .eyebrow, .badge30, .hud', {opacity:0, y:14, duration:1, delay:.5, stagger:.1});

  /* HUD */
  var hT = document.getElementById('h-time'), hTe = document.getElementById('h-temp'), hS = document.querySelectorAll('.h-snow'), hB = document.getElementById('h-bar'), hL = document.querySelectorAll('.h-lbl');
  function hud(p){
    var m = Math.round(220 + p * (450 - 220));
    hT.textContent = String(Math.floor(m/60)).padStart(2,'0') + ':' + String(m%60).padStart(2,'0');
    hTe.textContent = '−' + Math.round(9 - p*3);
    var snow = Math.max(0, Math.round(34 * (1 - p*1.08)));
    hS.forEach(function(e){ e.textContent = snow; });
    hL.forEach(function(e){ e.dataset.state = snow ? 'u' : 'd'; });
    hB.style.width = (p*100).toFixed(1) + '%';
  }

  /* filmen: videoklipp som bilder, scrubbet på canvas */
  var rc = document.getElementById('reel'), rx = rc.getContext('2d'), FN = +rc.dataset.frames, frames = new Array(FN), want = 0, cur = -1, shown = -1;
  function rsize(){ rc.width = rc.clientWidth * dpr; rc.height = rc.clientHeight * dpr; shown = -1; paint(); }
  function src(i){ return 'img/reel/f' + String(i+1).padStart(3,'0') + '.webp'; }
  function load(i){ if (frames[i]) return; var im = new Image(); im.decoding = 'async'; im.onload = function(){ im.ok = true; if (Math.abs(i - want) < 3) paint(); }; im.src = src(i); frames[i] = im; }
  function near(i){ for (var d=0; d<FN; d++){ if (frames[i-d] && frames[i-d].ok) return i-d; if (frames[i+d] && frames[i+d].ok) return i+d; } return -1; }
  function paint(){
    var i = near(want); if (i < 0 || i === shown) return; shown = i;
    var im = frames[i], cw = rc.width, ch = rc.height, s = Math.max(cw/im.naturalWidth, ch/im.naturalHeight), w = im.naturalWidth*s, h = im.naturalHeight*s;
    rx.drawImage(im, (cw-w)/2, (ch-h)/2, w, h);
    if (!rc.classList.contains('on')) rc.classList.add('on');
  }
  /* først hvert 8. bilde, så resten */
  load(0); for (var k=8; k<FN; k+=8) load(k);
  setTimeout(function(){ for (var k=0; k<FN; k++) load(k); }, 600);
  window.addEventListener('resize', rsize); rsize();
    (function tick(){ cur += (want - cur) * .35; var f = Math.round(cur); if (f !== shown && frames[f] && frames[f].ok){ var w0 = want; want = f; paint(); want = w0; } requestAnimationFrame(tick); })();

  gsap.set('.c2,.c3,.c4,.c5', {y:20});
  var ftl = gsap.timeline({defaults:{ease:'none'}, scrollTrigger:{trigger:'#film', start:'top top', end:'+=520%', pin:true, scrub:.4, anticipatePin:1,
    onUpdate:function(s){ hud(s.progress); want = Math.min(FN-1, Math.round(s.progress * (FN-1))); intensity = Math.max(.1, .5 - s.progress*0.45); wind = -0.6 + s.progress*0.4; },
    onLeave:function(){ running = false; }, onEnterBack:function(){ running = true; } }});
  ftl.to('.c1', {opacity:0, y:-40, duration:.35}, .55)
     .to('.c2', {autoAlpha:1, y:0, duration:.3}, 1.0)
     .to('.c2', {autoAlpha:0, y:-30, duration:.25}, 1.7)
     .to('.c3', {autoAlpha:1, y:0, duration:.3}, 2.0)
     .to('.c3', {autoAlpha:0, duration:.25}, 2.7)
     .to('.c4', {autoAlpha:1, y:0, duration:.3}, 3.0)
     .to('.c4', {autoAlpha:0, duration:.25}, 3.7)
     .to('.c5', {autoAlpha:1, y:0, duration:.3}, 4.1)
     .to({}, {duration:.5}, 4.9);

  mks.ambient();
  mks.finish(function(){ if (ftl.scrollTrigger){ var p = ftl.scrollTrigger.progress; ftl.progress(p); hud(p); want = Math.min(FN-1, Math.round(p*(FN-1))); cur = want; load(want); } }, function(){ var f = frames[want]; return f && f.ok; });
})();
