import re

with open('home.html','r',encoding='utf-8') as f:
    html = f.read()

# Find intro block start
start = html.find('<!-- ═══════════════ INTRO CUTSCENE')
# Find the </script> just before <div class="home-root">
end_marker = '</script>\r\n\r\n<div class="home-root">'
end = html.find(end_marker) + len(end_marker) - len('<div class="home-root">')

if start < 0 or end < 0:
    print('Could not find intro block bounds')
    print('start:', start, 'end:', end)
else:
    print(f'Replacing intro block [{start}:{end}]')

NEW_INTRO = r'''<!-- INTRO CUTSCENE -->
<div id="intro-overlay">
  <canvas id="intro-canvas"></canvas>
  <div id="intro-flash"></div>
  <div id="intro-logo-wrap">
    <img id="intro-logo-img" src="logo.png" alt="99DEPO"
      onerror="this.style.display='none';document.getElementById('intro-logo-text').style.display='block'">
    <div id="intro-logo-text">
      <span class="il-99">99</span><span class="il-depo">DEPO</span>
    </div>
    <div id="intro-sub">The #1 PS99 Gambling Site</div>
  </div>
  <div id="intro-bottom-bar"></div>
  <div id="intro-skip" onclick="skipIntro()">TAP TO SKIP</div>
</div>

<style>
#intro-overlay {
  position:fixed; inset:0; z-index:99999;
  background:#000; display:flex;
  align-items:center; justify-content:center;
  overflow:hidden; font-family:'Segoe UI',system-ui,sans-serif;
}
#intro-canvas { position:absolute; inset:0; width:100%; height:100%; }
#intro-flash {
  position:absolute; inset:0; opacity:0; pointer-events:none;
  background:radial-gradient(ellipse at center, #fff 0%, rgba(160,80,255,.6) 40%, transparent 75%);
}
#intro-logo-wrap {
  position:relative; z-index:5; text-align:center;
  display:flex; flex-direction:column; align-items:center; gap:14px;
  opacity:0; transform:scale(1.6);
  transition:opacity .25s, transform .25s;
}
#intro-logo-img { height:180px; object-fit:contain; max-width:90vw; }
#intro-logo-text {
  display:none; font-size:7rem; font-weight:900; letter-spacing:-.04em; line-height:1;
}
.il-99 { color:#f472b6; text-shadow:0 0 40px #f472b6, 0 0 80px rgba(244,114,182,.5); }
.il-depo {
  background:linear-gradient(135deg,#e879f9,#a78bfa);
  -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
}
#intro-sub {
  font-size:.95rem; font-weight:700; letter-spacing:.28em; text-transform:uppercase;
  color:rgba(255,255,255,0); transition:color .4s;
}
#intro-bottom-bar {
  position:absolute; bottom:0; left:0; right:0; height:3px;
  background:linear-gradient(90deg, transparent, #f472b6, #a78bfa, #06b6d4, transparent);
  transform:scaleX(0); transform-origin:left;
  transition:transform .6s cubic-bezier(.4,0,.2,1);
}
#intro-skip {
  position:absolute; bottom:22px; right:24px;
  font-size:.6rem; font-weight:900; letter-spacing:.18em;
  color:rgba(255,255,255,.18); cursor:pointer;
}
#intro-skip:hover { color:rgba(255,255,255,.5); }
</style>

<script>
(function() {
  if (sessionStorage.getItem('99d_v2')) {
    document.getElementById('intro-overlay').style.display = 'none';
    return;
  }
  sessionStorage.setItem('99d_v2','1');
  setTimeout(function(){ if(!done) finishIntro(); }, 5500);

  var overlay = document.getElementById('intro-overlay');
  var canvas  = document.getElementById('intro-canvas');
  var ctx     = canvas.getContext('2d');
  var flash   = document.getElementById('intro-flash');
  var logoWrap= document.getElementById('intro-logo-wrap');
  var bottomBar=document.getElementById('intro-bottom-bar');
  var sub     = document.getElementById('intro-sub');
  var W, H, done = false, af = null;

  function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
  resize(); window.addEventListener('resize', resize);

  /* ── SOUND ── */
  function playSound() {
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      var ac = new AC(), m = ac.createGain(); m.gain.value = .45; m.connect(ac.destination);
      function n(f,t,d,v,tp) {
        var o=ac.createOscillator(),g=ac.createGain();
        o.type=tp||'sine'; o.frequency.value=f;
        var ct=ac.currentTime+t;
        g.gain.setValueAtTime(0,ct);
        g.gain.linearRampToValueAtTime(v,ct+.022);
        g.gain.exponentialRampToValueAtTime(.001,ct+d);
        o.connect(g);g.connect(m);o.start(ct);o.stop(ct+d+.04);
      }
      // Build-up sweep
      n(60, 0, .5, .3,'sawtooth'); n(80,.15,.4,.2,'sawtooth');
      // Impact
      n(55,.45,.35,.6,'sawtooth'); n(110,.45,.2,.3,'square');
      // Chord
      n(261,.52,1.2,.45); n(329,.56,1.1,.38); n(392,.60,1.0,.38);
      n(523,.64,1.4,.5); n(784,.68,.9,.22); n(1047,.72,.7,.12);
      setTimeout(function(){try{ac.close();}catch(e){}},3500);
    } catch(e){}
  }

  /* ── PARTICLES ── */
  var COLS = ['#f472b6','#a78bfa','#06b6d4','#fbbf24','#e879f9','#38bdf8','#fff'];
  var particles = [], burst = [];

  function spawnParticles() {
    particles = [];
    for (var i = 0; i < 280; i++) {
      var edge = Math.floor(Math.random()*4);
      var sx,sy;
      if (edge===0){sx=Math.random()*W;sy=-20;}
      else if(edge===1){sx=W+20;sy=Math.random()*H;}
      else if(edge===2){sx=Math.random()*W;sy=H+20;}
      else{sx=-20;sy=Math.random()*H;}
      particles.push({
        x:sx,y:sy,
        col:COLS[Math.floor(Math.random()*COLS.length)],
        r:Math.random()*2.5+.5,
        spd:Math.random()*9+4,
        op:0, done:false,
        trail:[]
      });
    }
  }

  function spawnBurst() {
    for (var i=0;i<200;i++) {
      var a=Math.random()*Math.PI*2;
      var spd=Math.random()*22+4;
      burst.push({
        x:W/2,y:H/2,
        vx:Math.cos(a)*spd, vy:Math.sin(a)*spd,
        col:COLS[Math.floor(Math.random()*COLS.length)],
        r:Math.random()*3.5+.8,
        life:1, decay:Math.random()*.022+.012
      });
    }
  }

  var cx2=0,cy2=0, convT=0, slamDone=false;
  var startT=null, lastT=0;

  function loop(ts) {
    if (done) return;
    if (!startT) startT=ts;
    var elapsed=ts-startT, dt=ts-lastT; lastT=ts;
    convT+=dt;
    var convProg = Math.min(convT/650,1);

    ctx.clearRect(0,0,W,H);

    // Radial glow behind logo
    var grd=ctx.createRadialGradient(W/2,H/2,0,W/2,H/2,W*.45);
    grd.addColorStop(0,'rgba(120,50,220,.25)');
    grd.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=grd; ctx.fillRect(0,0,W,H);

    // Particles converging
    if (!slamDone) {
      particles.forEach(function(p) {
        if (p.done) return;
        var dx=W/2-p.x, dy=H/2-p.y, dist=Math.sqrt(dx*dx+dy*dy);
        if (dist<6){p.done=true;return;}
        p.trail.push({x:p.x,y:p.y});
        if(p.trail.length>10) p.trail.shift();
        var spd=p.spd*(1+convProg*3.5);
        var f=Math.min(spd/dist,1);
        p.x+=dx*f; p.y+=dy*f;
        p.op=Math.min(p.op+.09,1);
        if (p.trail.length>1) {
          ctx.beginPath();
          ctx.moveTo(p.trail[0].x,p.trail[0].y);
          for(var j=1;j<p.trail.length;j++) ctx.lineTo(p.trail[j].x,p.trail[j].y);
          ctx.lineTo(p.x,p.y);
          ctx.strokeStyle=p.col+'44'; ctx.lineWidth=p.r*.7; ctx.stroke();
        }
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
        ctx.fillStyle=p.col; ctx.globalAlpha=p.op; ctx.fill(); ctx.globalAlpha=1;
      });
    }

    // Burst particles
    if (burst.length) {
      burst.forEach(function(p) {
        p.x+=p.vx; p.y+=p.vy; p.vy+=.3; p.vx*=.97; p.vy*=.97; p.life-=p.decay;
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r*p.life,0,Math.PI*2);
        ctx.fillStyle=p.col; ctx.globalAlpha=p.life*.8; ctx.fill(); ctx.globalAlpha=1;
      });
      burst=burst.filter(function(p){return p.life>0;});
    }

    if (!slamDone && elapsed>680) doSlam();
    af=requestAnimationFrame(loop);
  }

  /* ── SLAM ── */
  function doSlam() {
    if (slamDone) return;
    slamDone=true;
    playSound();
    spawnBurst();

    // Screen flash
    flash.style.transition='opacity .07s';
    flash.style.opacity='1';
    setTimeout(function(){flash.style.transition='opacity .55s';flash.style.opacity='0';},70);

    // Screen shake
    var sc=0, si=setInterval(function(){
      var ox=(Math.random()-.5)*20, oy=(Math.random()-.5)*20;
      overlay.style.transform='translate('+ox+'px,'+oy+'px)';
      if(++sc>9){clearInterval(si);overlay.style.transform='';}
    },40);

    // Logo slam in
    setTimeout(function(){
      logoWrap.style.transition='opacity .18s ease, transform .28s cubic-bezier(.34,1.56,.64,1)';
      logoWrap.style.opacity='1';
      logoWrap.style.transform='scale(1)';
    },80);

    // Subtitle fades in
    setTimeout(function(){sub.style.color='rgba(255,255,255,.55)';},450);

    // Bottom bar sweeps in
    setTimeout(function(){bottomBar.style.transform='scaleX(1)';},350);

    // Exit
    setTimeout(finishIntro, 2600);
  }

  function finishIntro() {
    if (done) return; done=true;
    if(af) cancelAnimationFrame(af);
    overlay.style.transition='opacity .65s ease';
    overlay.style.opacity='0';
    setTimeout(function(){overlay.style.display='none';},660);
  }

  window.skipIntro=function(){finishIntro();};
  overlay.addEventListener('click',finishIntro);

  spawnParticles();
  af=requestAnimationFrame(loop);
})();
</script>

'''

    new_html = html[:start] + NEW_INTRO + html[end:]
    with open('home.html','w',encoding='utf-8') as f:
        f.write(new_html)
    print('Done, new html length:', len(new_html))
