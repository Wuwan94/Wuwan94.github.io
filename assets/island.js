'use strict';

/* The about-page island is self contained so the site's navigation and geo gate remain independent. */
(function () {
  const canvas = document.getElementById('islandCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const stage = document.getElementById('islandStage');
  const hud = document.getElementById('islandCount');
  const card = document.getElementById('islandCard');
  const title = document.getElementById('islandCardTitle');
  const copy = document.getElementById('islandCardCopy');
  const link = document.getElementById('islandCardLink');
  const WW = 1000, WH = 620, CX = 500, CY = 310, RX = 452, RY = 258;
  const landmarks = [
    { id:'home', x:330,y:305,glyph:'屋',name:'雾晚的小屋',kind:'box',roof:'#8c5b42',title:'雾晚的小屋',copy:'你好，我是雾晚，一名开发者，也是终身学习者。这座小岛就是我的关于页——开车逛一圈，六个地方，六件我正在做的事。「好奇心会带我们走得更远。」' },
    { id:'workshop',x:435,y:155,glyph:'工',name:'wanBox 工坊',kind:'box',roof:'#477c5e',title:'wanBox 工坊',copy:'wanBox for Android 在这里打磨：基于 sing-box 核心的客户端加 Root 模块，瘦身到 26MB 以内，一个版本一个版本往前推。',link:{href:'#projects',label:'去项目页看看 →'} },
    { id:'tower',x:700,y:185,glyph:'塔',name:'汉字塔防',kind:'tower',roof:'#6e8050',title:'汉字塔防',copy:'《汉字塔防》是我做的文字塔防小游戏，已经上架 TapTap，点开就能玩。',link:{href:'https://www.taptap.cn/app/1019120',label:'去 TapTap 看看 ↗'} },
    { id:'lighthouse',x:872,y:300,glyph:'灯',name:'电报灯塔',kind:'lighthouse',roof:'#bd8c45',title:'电报灯塔',copy:'想找我聊天，来 Telegram：@wanwuyy。技术、合作，或者交换最近学到的新东西，都欢迎。',link:{href:'https://t.me/wanwuyy?direct',label:'去 Telegram ↗'} },
    { id:'konbini',x:745,y:415,glyph:'店',name:'雨夜便利店',kind:'box',roof:'#4d8a78',title:'雨夜便利店街角',copy:'一个能拖动旋转的 3D 小场景：下雨的夜里，街角便利店的灯还亮着。',link:{href:'/konbini/',label:'进店里坐坐 →'} },
    { id:'shop',x:520,y:465,glyph:'摊',name:'阿婉的小店',kind:'box',roof:'#a8754c',title:'阿婉的 AI 对接',copy:'我自己开的小店，卖 AI 成品号等虚拟商品，自动发货。',link:{href:'https://www.16688.com.cn/shop/S809062',label:'去逛小店 ↗'} }
  ];
  const visited = new Set(); let cardFor = null, suppressed = null, target = null;
  const rand = (() => { let s=20261122; return () => { s=(s+0x6d2b79f5)|0; let t=Math.imul(s^(s>>>15),1|s); t=(t+Math.imul(t^(t>>>7),61|t))^t; return ((t^(t>>>14))>>>0)/4294967296; }; })();
  const inside = (x,y,f) => ((x-CX)/(RX*f))**2+((y-CY)/(RY*f))**2<=1;
  const trees=[], rocks=[];
  for(let i=0;i<40&&trees.length<26;i++){const x=60+rand()*880,y=60+rand()*500;if(inside(x,y,.9)&&!landmarks.some(l=>Math.hypot(l.x-x,l.y-y)<82)&&Math.hypot(300-x,390-y)>64)trees.push({x,y,s:.8+rand()*.7});}
  for(let i=0;i<30&&rocks.length<8;i++){const x=60+rand()*880,y=60+rand()*500;if(inside(x,y,.92)&&!landmarks.some(l=>Math.hypot(l.x-x,l.y-y)<70))rocks.push({x,y,s:5+rand()*8});}
  const car={x:300,y:390,heading:-.5,speed:0}, keys=new Set(), keymap={ArrowUp:'up',KeyW:'up',ArrowDown:'down',KeyS:'down',ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right'};
  window.addEventListener('keydown',e=>{const k=keymap[e.code];if(k){keys.add(k);target=null;e.preventDefault();}}); window.addEventListener('keyup',e=>{const k=keymap[e.code];if(k)keys.delete(k);});
  stage.querySelectorAll('.island-pad button').forEach(b=>{const k=b.dataset.k,on=e=>{e.preventDefault();keys.add(k);target=null},off=()=>keys.delete(k);b.addEventListener('pointerdown',on);['pointerup','pointerleave','pointercancel'].forEach(t=>b.addEventListener(t,off));});
  canvas.addEventListener('pointerdown',e=>{const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left)/r.width*WW,y=(e.clientY-r.top)/r.height*WH,l=landmarks.find(v=>Math.hypot(v.x-x,v.y-y)<76);target=l?{x:l.x,y:l.y}:{x,y};});
  document.getElementById('islandCardClose').addEventListener('click',()=>{suppressed=cardFor;card.hidden=true;cardFor=null;});
  function show(l){cardFor=l.id;title.textContent=l.title;copy.textContent=l.copy;if(l.link){link.hidden=false;link.href=l.link.href;link.textContent=l.link.label;if(/^https?:/.test(l.link.href)){link.target='_blank';link.rel='noopener';}else link.removeAttribute('target');}else link.hidden=true;card.hidden=false;if(!visited.has(l.id)){visited.add(l.id);hud.textContent=visited.size===6?'全岛探索完成 · 6 / 6':`已探索 ${visited.size} / 6`;}}
  function step(dt){let steer=(keys.has('right')?1:0)-(keys.has('left')?1:0),throttle=(keys.has('up')?1:0)-(keys.has('down')?1:0);if(target){const dx=target.x-car.x,dy=target.y-car.y,d=Math.hypot(dx,dy);if(d<30)target=null;else{let diff=Math.atan2(dy,dx)-car.heading;while(diff>Math.PI)diff-=Math.PI*2;while(diff<-Math.PI)diff+=Math.PI*2;steer=Math.max(-1,Math.min(1,diff*2.2));throttle=Math.abs(diff)>2.4?-.6:1;}}car.speed+=throttle*300*dt;car.speed-=car.speed*1.6*dt;car.speed=Math.max(-80,Math.min(195,car.speed));if(Math.abs(car.speed)>2)car.heading+=steer*1.9*dt*Math.sign(car.speed)*Math.min(1,Math.abs(car.speed)/90);car.x+=Math.cos(car.heading)*car.speed*dt;car.y+=Math.sin(car.heading)*car.speed*dt;const edge=((car.x-CX)/RX)**2+((car.y-CY)/RY)**2;if(edge>1){const s=1/Math.sqrt(edge);car.x=CX+(car.x-CX)*s;car.y=CY+(car.y-CY)*s;car.speed*=.45;}let near=null,nd=1e9;landmarks.forEach(l=>{const d=Math.hypot(l.x-car.x,l.y-car.y);if(d<nd){nd=d;near=l;}});if(near&&nd<68){if(cardFor!==near.id&&suppressed!==near.id)show(near);}else{if(suppressed&&nd>100)suppressed=null;if(cardFor&&nd>100){card.hidden=true;cardFor=null;}}}
  const rr=(x,y,w,h,r)=>{ctx.beginPath();ctx.roundRect(x,y,w,h,r);};
  function building(l,dark){
    const {x,y}=l, wall=dark?'#b2b5a0':'#f1eee3', shade=dark?'#7c8974':'#d5d8bd', glow=dark?'#e1d19a':'#c8b77b';
    const rect=(dx,dy,w,h,color,r=2)=>{ctx.fillStyle=color;rr(x+dx,y+dy,w,h,r);ctx.fill();};
    const roof=(yy,w,h,color)=>{ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(x-w/2,y+yy);ctx.lineTo(x+w/2,y+yy);ctx.lineTo(x+w/2-12,y+yy-h);ctx.lineTo(x-w/2+12,y+yy-h);ctx.closePath();ctx.fill();ctx.strokeStyle='rgba(244,240,213,.35)';ctx.lineWidth=1;ctx.stroke();};
    ctx.fillStyle='rgba(20,39,27,.18)';ctx.beginPath();ctx.ellipse(x+7,y+6,43,12,0,0,Math.PI*2);ctx.fill();
    rect(-36,-3,72,8,dark?'#7f8d6a':'#c5caa6',3);
    if(l.kind==='lighthouse'){
      rect(-17,-8,34,8,shade);rect(-12,-71,24,64,wall,4);
      rect(4,-69,8,60,shade);rect(-12,-54,24,10,dark?'#64785d':'#718665');rect(-12,-30,24,10,dark?'#64785d':'#718665');
      rect(-5,-19,10,16,'#3b5141',3);rect(-17,-76,34,5,'#435c49');rect(-12,-89,24,13,'#3b5141');
      const halo=ctx.createRadialGradient(x,y-83,1,x,y-83,dark?53:27);halo.addColorStop(0,'rgba(234,218,163,.55)');halo.addColorStop(1,'rgba(234,218,163,0)');
      ctx.fillStyle=halo;ctx.beginPath();ctx.arc(x,y-83,dark?53:27,0,Math.PI*2);ctx.fill();rect(-8,-87,16,9,glow);rect(-1,-89,2,13,'#435c49');roof(-90,36,10,'#435c49');
    }else if(l.kind==='tower'){
      rect(-23,-27,46,24,wall);rect(13,-27,10,24,shade);rect(-6,-19,12,16,'#40553d',5);
      for(let i=0;i<3;i++){const yy=-27-i*20,w=65-i*13;if(i)rect(-w/2+9,yy,w-18,14,wall);roof(yy,w,12,l.roof);rect(-w/2,yy-1,w,3,'#3d533b');}
      rect(-1,-87,2,9,'#536647');ctx.fillStyle=glow;ctx.beginPath();ctx.arc(x,y-87,3,0,Math.PI*2);ctx.fill();
    }else{
      const shop=l.id==='shop',store=l.id==='konbini',workshop=l.id==='workshop';
      rect(-30,-39,60,36,wall);rect(19,-39,11,36,shade);
      if(store){
        rect(-34,-47,68,11,'#406c55');rect(-30,-44,60,4,glow);rect(-25,-31,33,22,'#476650');rect(-22,-28,27,16,glow);rect(-9,-29,2,19,'#658067');rect(-24,-19,31,2,'#658067');rect(14,-31,11,28,'#476650');rect(16,-28,7,17,glow);
      }else if(shop){
        roof(-39,72,13,l.roof);rect(-35,-32,70,9,wall);for(let i=0;i<7;i++)rect(-35+i*10,-32,10,9,i%2?'#788d62':'#e6dfbf');
        rect(-25,-18,50,12,'#687d57');rect(-28,-8,56,6,l.roof);for(let i=0;i<4;i++)rect(-22+i*12,-21,8,6,i%2?glow:'#aabc85');
      }else{
        roof(-39,72,16,l.roof);rect(-20,-31,13,14,'#4d6652');rect(-18,-29,9,10,glow);rect(-14,-29,1,10,'#7f946e');rect(6,-24,13,21,'#4a5c46');rect(9,-22,7,9,glow);
        if(workshop){rect(-22,-70,10,16,'#6a7760');rect(-24,-72,14,4,'#475e49');rect(-20,-13,15,7,'#667d5b');rect(-18,-11,11,2,glow);}
        else{rect(14,-61,9,14,'#7d8065');rect(12,-63,13,4,'#646d52');rect(-3,-55,7,7,glow);}
      }
      rect(-39,-15,6,12,'#7f8e67');ctx.fillStyle=dark?'#739363':'#597d4d';ctx.beginPath();ctx.arc(x-36,y-18,7,0,Math.PI*2);ctx.fill();
    }
    // Keep the original landmark markers and labels legible in both themes.
    ctx.beginPath();ctx.arc(x,y-108,13.5,0,Math.PI*2);ctx.fillStyle=dark?'#202d23':'#f7f4e8';ctx.fill();ctx.lineWidth=1.5;ctx.strokeStyle=visited.has(l.id)?(dark?'#c0d5a0':'#425b32'):(dark?'#7e9477':'#8c9b7d');ctx.stroke();
    ctx.fillStyle=dark?'#e9eee3':'#344831';ctx.font='600 12px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(l.glyph,x,y-107);
    const tw=ctx.measureText(l.name).width+22;ctx.fillStyle=dark?'rgba(26,37,28,.92)':'rgba(247,244,232,.94)';rr(x-tw/2,y+15,tw,23,11);ctx.fill();ctx.fillStyle=dark?'#e9eee3':'#344831';ctx.fillText(l.name,x,y+27);
  }
  function draw(t){const dark=document.documentElement.dataset.theme==='dark',w=canvas.width,h=canvas.height;ctx.setTransform(w/WW,0,0,h/WH,0,0);const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const time=reduced?0:t;
    const g=ctx.createLinearGradient(0,0,0,WH);g.addColorStop(0,dark?'#192e26':'#e0e8d9');g.addColorStop(1,dark?'#2b4436':'#becfba');ctx.fillStyle=g;ctx.fillRect(0,0,WW,WH);
    ctx.lineCap='round';ctx.lineWidth=1;
    for(let i=0;i<13;i++){ctx.strokeStyle=dark?'rgba(186,211,170,.1)':'rgba(75,106,78,.13)';ctx.beginPath();const y=14+i*51;for(let x=-10;x<WW+20;x+=16)ctx.lineTo(x,y+Math.sin(x/85+time/2300+i*1.7)*4);ctx.stroke();}
    const ellipse=(x,y,rx,ry,color)=>{ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();};
    // A quiet shore outline, sandy shelf and graded meadow give the island depth.
    ctx.strokeStyle=dark?'rgba(184,207,167,.12)':'rgba(246,245,226,.65)';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(CX,CY+8,RX+25,RY+22,0,0,Math.PI*2);ctx.stroke();
    ellipse(CX+3,CY+19,RX+13,RY+9,dark?'#1e3729':'#9aac90');ellipse(CX,CY+10,RX+10,RY+6,dark?'#929a73':'#d4cda7');ellipse(CX,CY+3,RX+5,RY+2,dark?'#b1ad83':'#e3d9b6');
    const grass=ctx.createLinearGradient(0,70,0,570);grass.addColorStop(0,dark?'#58734c':'#a5b88b');grass.addColorStop(1,dark?'#3d5c40':'#839e71');ellipse(CX,CY,RX-12,RY-12,grass);
    ctx.save();ctx.beginPath();ctx.ellipse(CX,CY,RX-15,RY-15,0,0,Math.PI*2);ctx.clip();
    for(let i=0;i<95;i++){const x=70+(i*137)%860,y=70+(i*83)%480;ctx.strokeStyle=dark?'rgba(179,201,142,.18)':'rgba(53,91,48,.14)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x-2,y);ctx.lineTo(x,y-4);ctx.lineTo(x+2,y);ctx.stroke();}
    ctx.restore();
    const road=()=>{ctx.beginPath();ctx.moveTo(330,305);ctx.quadraticCurveTo(390,220,435,155);ctx.quadraticCurveTo(580,130,700,185);ctx.quadraticCurveTo(800,230,872,300);ctx.moveTo(330,305);ctx.quadraticCurveTo(430,420,520,465);ctx.quadraticCurveTo(640,470,745,415);};
    ctx.strokeStyle=dark?'#5f714e':'#7f9668';ctx.lineWidth=19;road();ctx.stroke();ctx.strokeStyle=dark?'#a4a17b':'#dbd1ad';ctx.lineWidth=14;road();ctx.stroke();ctx.strokeStyle=dark?'rgba(232,225,185,.42)':'rgba(249,246,220,.75)';ctx.lineWidth=1;ctx.setLineDash([3,12]);road();ctx.stroke();ctx.setLineDash([]);
    // Timber landing and a few small shore stones stay in the existing earth tones.
    ctx.fillStyle=dark?'#7d8060':'#aaab84';rr(920,320,46,19,2);ctx.fill();ctx.strokeStyle=dark?'#4a6147':'#7b8c68';ctx.lineWidth=1;for(let x=924;x<966;x+=7){ctx.beginPath();ctx.moveTo(x,321);ctx.lineTo(x,338);ctx.stroke();}
    rocks.forEach(r=>{ellipse(r.x+2,r.y+3,r.s,r.s*.62,'rgba(30,50,33,.16)');ellipse(r.x,r.y,r.s,r.s*.62,dark?'#82917b':'#aeb79c');ellipse(r.x-2,r.y-2,r.s*.55,r.s*.24,dark?'#9aa78e':'#c9cfb7');});
    trees.forEach(tr=>{ellipse(tr.x+5,tr.y+5,15*tr.s,5*tr.s,'rgba(20,45,31,.15)');ctx.fillStyle='#6d6b49';ctx.fillRect(tr.x-2*tr.s,tr.y-10*tr.s,4*tr.s,13*tr.s);ellipse(tr.x,tr.y-15*tr.s,12*tr.s,15*tr.s,dark?'#2b5035':'#526f43');ellipse(tr.x-4*tr.s,tr.y-19*tr.s,8*tr.s,9*tr.s,dark?'#547449':'#718e56');});
    landmarks.forEach(l=>building(l,dark));if(target){ctx.strokeStyle='#d5a65b';ctx.lineWidth=3;ctx.beginPath();ctx.arc(target.x,target.y,14+Math.sin(time/220)*4,0,Math.PI*2);ctx.stroke();}ctx.save();ctx.translate(car.x,car.y);ctx.rotate(car.heading);ctx.fillStyle='rgba(20,45,31,.25)';rr(-16,-6,34,19,7);ctx.fill();ctx.fillStyle='#1d2821';rr(-13,-11,9,4,2);ctx.fill();rr(5,-11,9,4,2);ctx.fill();rr(-13,7,9,4,2);ctx.fill();rr(5,7,9,4,2);ctx.fill();ctx.fillStyle=dark?'#b8d28d':'#477c5e';rr(-17,-9,34,18,6);ctx.fill();ctx.fillStyle='#c7ddc1';rr(-4,-6,11,12,3);ctx.fill();ctx.fillStyle='#f6edc8';ctx.beginPath();ctx.arc(16,-5,2.2,0,Math.PI*2);ctx.arc(16,5,2.2,0,Math.PI*2);ctx.fill();ctx.restore();}
  function resize(){const r=stage.getBoundingClientRect(),dpr=Math.min(2,devicePixelRatio||1);canvas.width=Math.round(r.width*dpr);canvas.height=Math.round(r.width*(WH/WW)*dpr);}
  let last=performance.now();function frame(ts){const dt=Math.min(.05,(ts-last)/1000||.016);last=ts;step(dt);draw(ts);requestAnimationFrame(frame);}resize();window.addEventListener('resize',()=>{resize();draw(performance.now());});requestAnimationFrame(frame);
})();
