(function(){
  var mks = window.mks || {};
  var vid = document.getElementById('reel');

  /* video i bakgrunnen: spiller av seg selv, ingen scrolling nødvendig */
  if (vid){
    vid.muted = true;
    var play = function(){ var p = vid.play(); if (p && p.catch) p.catch(function(){}); };
    if (mks.reduce){ vid.removeAttribute('autoplay'); vid.pause(); }
    else { play(); document.addEventListener('visibilitychange', function(){ if (!document.hidden) play(); }); }
    vid.addEventListener('playing', function(){ vid.classList.add('on'); });
    /* noen mobiler (f.eks. iPhone i strømsparing) stopper autoplay: prøv igjen ved første berøring eller scroll */
    var kick = function(){ if (vid.paused && !mks.reduce) play(); };
    /* reserve: får vi ikke spilt filmen, bytt stillbildet med en animert versjon som alltid går */
    var still = document.querySelector('.film .still');
    setTimeout(function(){
      if (!mks.reduce && still && (vid.paused || vid.readyState < 3) && !vid.classList.contains('on')){
        var a = new Image(); a.onload = function(){ still.src = a.src; still.classList.add('anim'); }; a.src = 'img/reel-anim.webp';
      }
    }, 1500);
    ['touchstart','pointerdown','scroll','keydown'].forEach(function(ev){ window.addEventListener(ev, kick, {passive:true, once:true}); });
  }

  if (mks.reduce || !window.gsap){
    if (mks.finish) mks.finish(); else window.__ready = true;
    return;
  }

  /* snø */
  var cv = document.getElementById('snow'), cx = cv.getContext('2d'), flakes = [], W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2), visible = true;
  function size(){ W = cv.clientWidth; H = cv.clientHeight; cv.width = W*dpr; cv.height = H*dpr; cx.setTransform(dpr,0,0,dpr,0,0); }
  size(); window.addEventListener('resize', size);
  var N = Math.round(Math.min(140, Math.max(50, W/9)));
  for (var i=0;i<N;i++) flakes.push({x:Math.random()*W, y:Math.random()*H, r:Math.random()*2+.4, v:Math.random()*1+.5, d:Math.random()*Math.PI*2});
  function draw(){
    if (visible){
      cx.clearRect(0,0,W,H);
      cx.fillStyle = 'rgba(243,241,234,.85)';
      for (var i=0;i<flakes.length;i++){ var f = flakes[i]; f.d += .01; f.y += f.v; f.x += -.35 * f.v + Math.sin(f.d) * .3;
        if (f.y > H+4){ f.y = -4; f.x = Math.random()*W; } if (f.x < -4) f.x = W+4; if (f.x > W+4) f.x = -4;
        cx.globalAlpha = .3 + f.r/4; cx.beginPath(); cx.arc(f.x,f.y,f.r,0,Math.PI*2); cx.fill(); }
      cx.globalAlpha = 1;
    }
    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);
  if ('IntersectionObserver' in window) new IntersectionObserver(function(e){ visible = e[0].isIntersecting; if (vid){ if (visible) play(); else vid.pause(); } }).observe(document.getElementById('film'));

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
  gsap.from('.c1 .eyebrow, .c1 .lede, .c1 .chips, .c1 .ctas, .badge30, .hud', {opacity:0, y:14, duration:.9, delay:.45, stagger:.08});

  /* HUD følger filmen: natt til blåtime */
  var hT = document.getElementById('h-time'), hTe = document.getElementById('h-temp'), hS = document.querySelectorAll('.h-snow'), hB = document.getElementById('h-bar');
  function hud(p){
    var m = Math.round(220 + p * (450 - 220));
    hT.textContent = String(Math.floor(m/60)).padStart(2,'0') + ':' + String(m%60).padStart(2,'0');
    hTe.textContent = '−' + Math.round(9 - p*3);
    var snow = Math.max(0, Math.round(34 * (1 - p*1.08)));
    hS.forEach(function(e){ e.textContent = snow; });
    hB.style.width = (p*100).toFixed(1) + '%';
  }
  hud(0);
  if (vid) vid.addEventListener('timeupdate', function(){ if (vid.duration) hud(vid.currentTime / vid.duration); });

  /* litt parallakse når man scroller forbi */
  if (window.ScrollTrigger) gsap.to('.film .c1', {yPercent:-12, opacity:.2, ease:'none', scrollTrigger:{trigger:'#film', start:'top top', end:'bottom top', scrub:true}});

  mks.ambient();
  mks.finish();
})();
