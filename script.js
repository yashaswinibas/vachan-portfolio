(function(){"use strict";
// Scene is drawn on a canvas and scrubbed by scroll, same idea as a scroll-scrubbed video:
// scroll position -> target time; the displayed time eases toward it every frame.
var PHOTO="vachan.webp"; // transparent-background cutout
var cv=document.getElementById("clip"),ctx=cv.getContext("2d"),boot=document.getElementById("boot"),bootBar=document.getElementById("bootBar"),bootPct=document.getElementById("bootPct"),meter=document.getElementById("meter"),panels=[].slice.call(document.querySelectorAll("[data-panel]"));
// Cue table: [fadeInStart, fadeInEnd, fadeOutStart, fadeOutEnd]. Gaps are dead zones, scene only.
var CUES=[[0,0,.15,.23],[.35,.43,.57,.65],[.77,.85,1.10,1.20]],DRIFT=22;
// Camera keyframes. fx/fy = where the face sits (fraction of canvas), s = photo height / canvas height, r = disc radius, d = disc opacity, c = background colour.
var D=[{p:0,fx:.70,fy:.34,cy:.56,s:1.12,r:.30,d:0,c:[242,240,236]},{p:.5,fx:.72,fy:.47,cy:.62,s:1.9,r:.42,d:.92,c:[223,229,255]},{p:1,fx:.30,fy:.36,cy:.56,s:1.2,r:.38,d:.7,c:[255,227,214]}];
var M=[{p:0,fx:.5,fy:.74,cy:.84,s:1.05,r:.24,d:0,c:[242,240,236]},{p:.5,fx:.5,fy:.78,cy:.88,s:1.35,r:.30,d:.92,c:[223,229,255]},{p:1,fx:.5,fy:.76,cy:.86,s:1.1,r:.26,d:.7,c:[255,227,214]}];
var img=new Image(),aspect=.665,progress=0,seekTo=0,seekAt=0,ready=false,W=0,H=0,reduce=matchMedia("(prefers-reduced-motion:reduce)").matches;
function clamp(v,a,b){return Math.min(b,Math.max(a,v))}
function smooth(t){return t*t*(3-2*t)}
function ramp(p,a,b){return b<=a?(p>=b?1:0):smooth(clamp((p-a)/(b-a),0,1))}
function lerp(a,b,t){return a+(b-a)*t}
function cam(p){var K=innerWidth<=720?M:D,i=p<.5?0:1,t=smooth(clamp((p-K[i].p)/(K[i+1].p-K[i].p),0,1)),a=K[i],b=K[i+1],o={};
  ["fx","fy","cy","s","r","d"].forEach(function(k){o[k]=lerp(a[k],b[k],t)});o.c=a.c.map(function(v,j){return Math.round(lerp(v,b.c[j],t))});return o}
// Phones resize the viewport while the address bar hides; ignore that so the scene never jumps.
var vw=0,vh=0;
function stable(){var w=innerWidth,h=innerHeight;if(w!==vw||Math.abs(h-vh)>150){vw=w;vh=h}else if(h>vh){vh=h}return vh}
function size(){var dpr=Math.min(devicePixelRatio||1,2);stable();W=cv.width=Math.round(vw*dpr);H=cv.height=Math.round(vh*dpr);cv.style.height=vh+"px";draw(seekAt)}
function draw(p){if(!W)return;var k=cam(p);ctx.fillStyle="rgb("+k.c.join(",")+")";ctx.fillRect(0,0,W,H);
  ctx.font="500 "+Math.round(H*.62)+"px 'Inter Tight',Helvetica,Arial,sans-serif";ctx.textBaseline="middle";ctx.fillStyle="rgba(13,12,11,.06)";
  ctx.fillText("VACHAN S M",W*.04-p*W*1.15,H*.5);
  ctx.fillStyle="rgba(43,59,255,"+k.d+")";ctx.beginPath();ctx.arc(k.fx*W,k.cy*H,k.r*H,0,6.2832);ctx.fill();
  if(img.complete&&img.naturalWidth){var ih=k.s*H,iw=ih*aspect;ctx.drawImage(img,k.fx*W-iw/2,k.fy*H-ih*.22,iw,ih)}}
function readScroll(){var max=document.documentElement.scrollHeight-stable();progress=max>0?clamp(pageYOffset/max,0,1):0;seekTo=progress}
function paint(){meter.style.transform="scaleX("+progress+")";
  panels.forEach(function(el,i){var c=CUES[i],e=ramp(progress,c[0],c[1]),l=ramp(progress,c[2],c[3]),o=e*(1-l),y=(1-e)*DRIFT-l*DRIFT;
    el.style.opacity=o;el.style.transform="translate3d(0,"+y+"px,0)";el.style.pointerEvents=o>.6?"auto":"none"})}
function frame(){if(ready){var g=seekTo-seekAt;if(Math.abs(g)>.0008){seekAt+=reduce?g:g*.115;draw(seekAt)}}paint();requestAnimationFrame(frame)}
function setProgress(f){bootBar.style.transform="scaleX("+f+")";bootPct.textContent="LOADING "+Math.round(f*100)+"%"}
function start(){if(ready)return;ready=true;boot.classList.add("done");readScroll();seekAt=seekTo;size()}
var t0=performance.now(),loaded=false;
img.onload=function(){aspect=img.naturalWidth/img.naturalHeight;loaded=true};img.onerror=function(){loaded=true};img.src=PHOTO;
(function tick(){var f=Math.min((performance.now()-t0)/900,1);setProgress(loaded?f:Math.min(f,.9));
  if(f>=1&&loaded){setProgress(1);(document.fonts&&document.fonts.ready?document.fonts.ready:Promise.resolve()).then(start)}else requestAnimationFrame(tick)})();
setTimeout(start,6000);
[].forEach.call(document.querySelectorAll("[data-go]"),function(a){a.addEventListener("click",function(e){e.preventDefault();
  var max=document.documentElement.scrollHeight-stable();scrollTo({top:max*parseFloat(a.dataset.go),behavior:reduce?"auto":"smooth"})})});
var openEl=null;
function show(id){var el=document.getElementById(id);if(!el)return;if(openEl)hide();el.hidden=false;openEl=el;document.body.style.overflow="hidden";var c=el.querySelector("[data-close]");if(c)c.focus()}
function hide(){if(!openEl)return;openEl.hidden=true;openEl=null;document.body.style.overflow=""}
function copy(t,btn){var o=btn.textContent;function done(){btn.textContent="Copied";setTimeout(function(){btn.textContent=o},1400)}
  function fb(){var a=document.createElement("textarea");a.value=t;a.style.cssText="position:fixed;opacity:0";document.body.appendChild(a);a.select();try{document.execCommand("copy")}catch(e){}a.remove();done()}
  if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(t).then(done,fb)}else fb()}
document.addEventListener("click",function(e){var t=e.target,o=t.closest&&t.closest("[data-open]"),cp=t.closest&&t.closest("[data-copy]");
  if(o){e.preventDefault();show(o.dataset.open);return}
  if(cp){copy(cp.dataset.copy,cp);return}
  if((t.closest&&t.closest("[data-close]"))||t===openEl)hide()});
document.addEventListener("keydown",function(e){if(e.key==="Escape")hide();if((e.key==="Enter"||e.key===" ")&&e.target.dataset&&e.target.dataset.open){e.preventDefault();show(e.target.dataset.open)}});
addEventListener("scroll",readScroll,{passive:true});addEventListener("resize",function(){var ow=vw,oh=vh;stable();readScroll();if(vw!==ow||vh!==oh)size()});
readScroll();paint();size();requestAnimationFrame(frame);
})();
