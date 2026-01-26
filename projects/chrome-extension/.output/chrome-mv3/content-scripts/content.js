var content=(function(){"use strict";function Ve(e){return e}let X={},ee;function Z(e={}){X={animate:!0,allowClose:!0,overlayClickBehavior:"close",overlayOpacity:.7,smoothScroll:!1,disableActiveInteraction:!1,showProgress:!1,stagePadding:10,stageRadius:5,popoverOffset:10,showButtons:["next","previous","close"],disableButtons:[],overlayColor:"#000",...e}}function d(e){return e?X[e]:X}function we(e){ee=e}function A(){return ee}let W={};function F(e,t){W[e]=t}function R(e){var t;(t=W[e])==null||t.call(W)}function be(){W={}}function U(e,t,n,i){return(e/=i/2)<1?n/2*e*e+t:-n/2*(--e*(e-2)-1)+t}function te(e){const t='a[href]:not([disabled]), button:not([disabled]), textarea:not([disabled]), input[type="text"]:not([disabled]), input[type="radio"]:not([disabled]), input[type="checkbox"]:not([disabled]), select:not([disabled])';return e.flatMap(n=>{const i=n.matches(t),o=Array.from(n.querySelectorAll(t));return[...i?[n]:[],...o]}).filter(n=>getComputedStyle(n).pointerEvents!=="none"&&Ce(n))}function ne(e){if(!e||ye(e))return;const t=d("smoothScroll"),n=e.offsetHeight>window.innerHeight;e.scrollIntoView({behavior:!t||xe(e)?"auto":"smooth",inline:"center",block:n?"start":"center"})}function xe(e){if(!e||!e.parentElement)return;const t=e.parentElement;return t.scrollHeight>t.clientHeight}function ye(e){const t=e.getBoundingClientRect();return t.top>=0&&t.left>=0&&t.bottom<=(window.innerHeight||document.documentElement.clientHeight)&&t.right<=(window.innerWidth||document.documentElement.clientWidth)}function Ce(e){return!!(e.offsetWidth||e.offsetHeight||e.getClientRects().length)}let O={};function M(e,t){O[e]=t}function p(e){return e?O[e]:O}function oe(){O={}}function Ee(e,t,n,i){let o=p("__activeStagePosition");const r=o||n.getBoundingClientRect(),f=i.getBoundingClientRect(),y=U(e,r.x,f.x-r.x,t),c=U(e,r.y,f.y-r.y,t),w=U(e,r.width,f.width-r.width,t),s=U(e,r.height,f.height-r.height,t);o={x:y,y:c,width:w,height:s},re(o),M("__activeStagePosition",o)}function ie(e){if(!e)return;const t=e.getBoundingClientRect(),n={x:t.x,y:t.y,width:t.width,height:t.height};M("__activeStagePosition",n),re(n)}function ke(){const e=p("__activeStagePosition"),t=p("__overlaySvg");if(!e)return;if(!t){console.warn("No stage svg found.");return}const n=window.innerWidth,i=window.innerHeight;t.setAttribute("viewBox",`0 0 ${n} ${i}`)}function Le(e){const t=Se(e);document.body.appendChild(t),de(t,n=>{n.target.tagName==="path"&&R("overlayClick")}),M("__overlaySvg",t)}function re(e){const t=p("__overlaySvg");if(!t){Le(e);return}const n=t.firstElementChild;if(n?.tagName!=="path")throw new Error("no path element found in stage svg");n.setAttribute("d",se(e))}function Se(e){const t=window.innerWidth,n=window.innerHeight,i=document.createElementNS("http://www.w3.org/2000/svg","svg");i.classList.add("driver-overlay","driver-overlay-animated"),i.setAttribute("viewBox",`0 0 ${t} ${n}`),i.setAttribute("xmlSpace","preserve"),i.setAttribute("xmlnsXlink","http://www.w3.org/1999/xlink"),i.setAttribute("version","1.1"),i.setAttribute("preserveAspectRatio","xMinYMin slice"),i.style.fillRule="evenodd",i.style.clipRule="evenodd",i.style.strokeLinejoin="round",i.style.strokeMiterlimit="2",i.style.zIndex="10000",i.style.position="fixed",i.style.top="0",i.style.left="0",i.style.width="100%",i.style.height="100%";const o=document.createElementNS("http://www.w3.org/2000/svg","path");return o.setAttribute("d",se(e)),o.style.fill=d("overlayColor")||"rgb(0,0,0)",o.style.opacity=`${d("overlayOpacity")}`,o.style.pointerEvents="auto",o.style.cursor="auto",i.appendChild(o),i}function se(e){const t=window.innerWidth,n=window.innerHeight,i=d("stagePadding")||0,o=d("stageRadius")||0,r=e.width+i*2,f=e.height+i*2,y=Math.min(o,r/2,f/2),c=Math.floor(Math.max(y,0)),w=e.x-i+c,s=e.y-i,_=r-c*2,l=f-c*2;return`M${t},0L0,0L0,${n}L${t},${n}L${t},0Z
    M${w},${s} h${_} a${c},${c} 0 0 1 ${c},${c} v${l} a${c},${c} 0 0 1 -${c},${c} h-${_} a${c},${c} 0 0 1 -${c},-${c} v-${l} a${c},${c} 0 0 1 ${c},-${c} z`}function Te(){const e=p("__overlaySvg");e&&e.remove()}function _e(){const e=document.getElementById("driver-dummy-element");if(e)return e;let t=document.createElement("div");return t.id="driver-dummy-element",t.style.width="0",t.style.height="0",t.style.pointerEvents="none",t.style.opacity="0",t.style.position="fixed",t.style.top="50%",t.style.left="50%",document.body.appendChild(t),t}function ae(e){const{element:t}=e;let n=typeof t=="function"?t():typeof t=="string"?document.querySelector(t):t;n||(n=_e()),$e(n,e)}function Me(){const e=p("__activeElement"),t=p("__activeStep");e&&(ie(e),ke(),ge(e,t))}function $e(e,t){var n;const i=Date.now(),o=p("__activeStep"),r=p("__activeElement")||e,f=!r||r===e,y=e.id==="driver-dummy-element",c=r.id==="driver-dummy-element",w=d("animate"),s=t.onHighlightStarted||d("onHighlightStarted"),_=t?.onHighlighted||d("onHighlighted"),l=o?.onDeselected||d("onDeselected"),u=d(),m=p();!f&&l&&l(c?void 0:r,o,{config:u,state:m,driver:A()}),s&&s(y?void 0:e,t,{config:u,state:m,driver:A()});const h=!f&&w;let a=!1;Ie(),M("previousStep",o),M("previousElement",r),M("activeStep",t),M("activeElement",e);const v=()=>{if(p("__transitionCallback")!==v)return;const g=Date.now()-i,b=400-g<=400/2;t.popover&&b&&!a&&h&&(ce(e,t),a=!0),d("animate")&&g<400?Ee(g,400,r,e):(ie(e),_&&_(y?void 0:e,t,{config:d(),state:p(),driver:A()}),M("__transitionCallback",void 0),M("__previousStep",o),M("__previousElement",r),M("__activeStep",t),M("__activeElement",e)),window.requestAnimationFrame(v)};M("__transitionCallback",v),window.requestAnimationFrame(v),ne(e),!h&&t.popover&&ce(e,t),r.classList.remove("driver-active-element","driver-no-interaction"),r.removeAttribute("aria-haspopup"),r.removeAttribute("aria-expanded"),r.removeAttribute("aria-controls"),((n=t.disableActiveInteraction)!=null?n:d("disableActiveInteraction"))&&e.classList.add("driver-no-interaction"),e.classList.add("driver-active-element"),e.setAttribute("aria-haspopup","dialog"),e.setAttribute("aria-expanded","true"),e.setAttribute("aria-controls","driver-popover-content")}function Be(){var e;(e=document.getElementById("driver-dummy-element"))==null||e.remove(),document.querySelectorAll(".driver-active-element").forEach(t=>{t.classList.remove("driver-active-element","driver-no-interaction"),t.removeAttribute("aria-haspopup"),t.removeAttribute("aria-expanded"),t.removeAttribute("aria-controls")})}function z(){const e=p("__resizeTimeout");e&&window.cancelAnimationFrame(e),M("__resizeTimeout",window.requestAnimationFrame(Me))}function He(e){var t;if(!p("isInitialized")||!(e.key==="Tab"||e.keyCode===9))return;const n=p("__activeElement"),i=(t=p("popover"))==null?void 0:t.wrapper,o=te([...i?[i]:[],...n?[n]:[]]),r=o[0],f=o[o.length-1];if(e.preventDefault(),e.shiftKey){const y=o[o.indexOf(document.activeElement)-1]||f;y?.focus()}else{const y=o[o.indexOf(document.activeElement)+1]||r;y?.focus()}}function le(e){var t;((t=d("allowKeyboardControl"))==null||t)&&(e.key==="Escape"?R("escapePress"):e.key==="ArrowRight"?R("arrowRightPress"):e.key==="ArrowLeft"&&R("arrowLeftPress"))}function de(e,t,n){const i=(o,r)=>{const f=o.target;e.contains(f)&&((!n||n(f))&&(o.preventDefault(),o.stopPropagation(),o.stopImmediatePropagation()),r?.(o))};document.addEventListener("pointerdown",i,!0),document.addEventListener("mousedown",i,!0),document.addEventListener("pointerup",i,!0),document.addEventListener("mouseup",i,!0),document.addEventListener("click",o=>{i(o,t)},!0)}function Ae(){window.addEventListener("keyup",le,!1),window.addEventListener("keydown",He,!1),window.addEventListener("resize",z),window.addEventListener("scroll",z)}function Pe(){window.removeEventListener("keyup",le),window.removeEventListener("resize",z),window.removeEventListener("scroll",z)}function Ie(){const e=p("popover");e&&(e.wrapper.style.display="none")}function ce(e,t){var n,i;let o=p("popover");o&&document.body.removeChild(o.wrapper),o=Ne(),document.body.appendChild(o.wrapper);const{title:r,description:f,showButtons:y,disableButtons:c,showProgress:w,nextBtnText:s=d("nextBtnText")||"Next &rarr;",prevBtnText:_=d("prevBtnText")||"&larr; Previous",progressText:l=d("progressText")||"{current} of {total}"}=t.popover||{};o.nextButton.innerHTML=s,o.previousButton.innerHTML=_,o.progress.innerHTML=l,r?(o.title.innerHTML=r,o.title.style.display="block"):o.title.style.display="none",f?(o.description.innerHTML=f,o.description.style.display="block"):o.description.style.display="none";const u=y||d("showButtons"),m=w||d("showProgress")||!1,h=u?.includes("next")||u?.includes("previous")||m;o.closeButton.style.display=u.includes("close")?"block":"none",h?(o.footer.style.display="flex",o.progress.style.display=m?"block":"none",o.nextButton.style.display=u.includes("next")?"block":"none",o.previousButton.style.display=u.includes("previous")?"block":"none"):o.footer.style.display="none";const a=c||d("disableButtons")||[];a!=null&&a.includes("next")&&(o.nextButton.disabled=!0,o.nextButton.classList.add("driver-popover-btn-disabled")),a!=null&&a.includes("previous")&&(o.previousButton.disabled=!0,o.previousButton.classList.add("driver-popover-btn-disabled")),a!=null&&a.includes("close")&&(o.closeButton.disabled=!0,o.closeButton.classList.add("driver-popover-btn-disabled"));const v=o.wrapper;v.style.display="block",v.style.left="",v.style.top="",v.style.bottom="",v.style.right="",v.id="driver-popover-content",v.setAttribute("role","dialog"),v.setAttribute("aria-labelledby","driver-popover-title"),v.setAttribute("aria-describedby","driver-popover-description");const g=o.arrow;g.className="driver-popover-arrow";const b=((n=t.popover)==null?void 0:n.popoverClass)||d("popoverClass")||"";v.className=`driver-popover ${b}`.trim(),de(o.wrapper,P=>{var I,T,$;const L=P.target,N=((I=t.popover)==null?void 0:I.onNextClick)||d("onNextClick"),B=((T=t.popover)==null?void 0:T.onPrevClick)||d("onPrevClick"),k=(($=t.popover)==null?void 0:$.onCloseClick)||d("onCloseClick");if(L.closest(".driver-popover-next-btn"))return N?N(e,t,{config:d(),state:p(),driver:A()}):R("nextClick");if(L.closest(".driver-popover-prev-btn"))return B?B(e,t,{config:d(),state:p(),driver:A()}):R("prevClick");if(L.closest(".driver-popover-close-btn"))return k?k(e,t,{config:d(),state:p(),driver:A()}):R("closeClick")},P=>!(o!=null&&o.description.contains(P))&&!(o!=null&&o.title.contains(P))&&typeof P.className=="string"&&P.className.includes("driver-popover")),M("popover",o);const S=((i=t.popover)==null?void 0:i.onPopoverRender)||d("onPopoverRender");S&&S(o,{config:d(),state:p(),driver:A()}),ge(e,t),ne(v);const C=e.classList.contains("driver-dummy-element"),E=te([v,...C?[]:[e]]);E.length>0&&E[0].focus()}function pe(){const e=p("popover");if(!(e!=null&&e.wrapper))return;const t=e.wrapper.getBoundingClientRect(),n=d("stagePadding")||0,i=d("popoverOffset")||0;return{width:t.width+n+i,height:t.height+n+i,realWidth:t.width,realHeight:t.height}}function ue(e,t){const{elementDimensions:n,popoverDimensions:i,popoverPadding:o,popoverArrowDimensions:r}=t;return e==="start"?Math.max(Math.min(n.top-o,window.innerHeight-i.realHeight-r.width),r.width):e==="end"?Math.max(Math.min(n.top-i?.realHeight+n.height+o,window.innerHeight-i?.realHeight-r.width),r.width):e==="center"?Math.max(Math.min(n.top+n.height/2-i?.realHeight/2,window.innerHeight-i?.realHeight-r.width),r.width):0}function ve(e,t){const{elementDimensions:n,popoverDimensions:i,popoverPadding:o,popoverArrowDimensions:r}=t;return e==="start"?Math.max(Math.min(n.left-o,window.innerWidth-i.realWidth-r.width),r.width):e==="end"?Math.max(Math.min(n.left-i?.realWidth+n.width+o,window.innerWidth-i?.realWidth-r.width),r.width):e==="center"?Math.max(Math.min(n.left+n.width/2-i?.realWidth/2,window.innerWidth-i?.realWidth-r.width),r.width):0}function ge(e,t){const n=p("popover");if(!n)return;const{align:i="start",side:o="left"}=t?.popover||{},r=i,f=e.id==="driver-dummy-element"?"over":o,y=d("stagePadding")||0,c=pe(),w=n.arrow.getBoundingClientRect(),s=e.getBoundingClientRect(),_=s.top-c.height;let l=_>=0;const u=window.innerHeight-(s.bottom+c.height);let m=u>=0;const h=s.left-c.width;let a=h>=0;const v=window.innerWidth-(s.right+c.width);let g=v>=0;const b=!l&&!m&&!a&&!g;let S=f;if(f==="top"&&l?g=a=m=!1:f==="bottom"&&m?g=a=l=!1:f==="left"&&a?g=l=m=!1:f==="right"&&g&&(a=l=m=!1),f==="over"){const C=window.innerWidth/2-c.realWidth/2,E=window.innerHeight/2-c.realHeight/2;n.wrapper.style.left=`${C}px`,n.wrapper.style.right="auto",n.wrapper.style.top=`${E}px`,n.wrapper.style.bottom="auto"}else if(b){const C=window.innerWidth/2-c?.realWidth/2,E=10;n.wrapper.style.left=`${C}px`,n.wrapper.style.right="auto",n.wrapper.style.bottom=`${E}px`,n.wrapper.style.top="auto"}else if(a){const C=Math.min(h,window.innerWidth-c?.realWidth-w.width),E=ue(r,{elementDimensions:s,popoverDimensions:c,popoverPadding:y,popoverArrowDimensions:w});n.wrapper.style.left=`${C}px`,n.wrapper.style.top=`${E}px`,n.wrapper.style.bottom="auto",n.wrapper.style.right="auto",S="left"}else if(g){const C=Math.min(v,window.innerWidth-c?.realWidth-w.width),E=ue(r,{elementDimensions:s,popoverDimensions:c,popoverPadding:y,popoverArrowDimensions:w});n.wrapper.style.right=`${C}px`,n.wrapper.style.top=`${E}px`,n.wrapper.style.bottom="auto",n.wrapper.style.left="auto",S="right"}else if(l){const C=Math.min(_,window.innerHeight-c.realHeight-w.width);let E=ve(r,{elementDimensions:s,popoverDimensions:c,popoverPadding:y,popoverArrowDimensions:w});n.wrapper.style.top=`${C}px`,n.wrapper.style.left=`${E}px`,n.wrapper.style.bottom="auto",n.wrapper.style.right="auto",S="top"}else if(m){const C=Math.min(u,window.innerHeight-c?.realHeight-w.width);let E=ve(r,{elementDimensions:s,popoverDimensions:c,popoverPadding:y,popoverArrowDimensions:w});n.wrapper.style.left=`${E}px`,n.wrapper.style.bottom=`${C}px`,n.wrapper.style.top="auto",n.wrapper.style.right="auto",S="bottom"}b?n.arrow.classList.add("driver-popover-arrow-none"):De(r,S,e)}function De(e,t,n){const i=p("popover");if(!i)return;const o=n.getBoundingClientRect(),r=pe(),f=i.arrow,y=r.width,c=window.innerWidth,w=o.width,s=o.left,_=r.height,l=window.innerHeight,u=o.top,m=o.height;f.className="driver-popover-arrow";let h=t,a=e;if(t==="top"?(s+w<=0?(h="right",a="end"):s+w-y<=0&&(h="top",a="start"),s>=c?(h="left",a="end"):s+y>=c&&(h="top",a="end")):t==="bottom"?(s+w<=0?(h="right",a="start"):s+w-y<=0&&(h="bottom",a="start"),s>=c?(h="left",a="start"):s+y>=c&&(h="bottom",a="end")):t==="left"?(u+m<=0?(h="bottom",a="end"):u+m-_<=0&&(h="left",a="start"),u>=l?(h="top",a="end"):u+_>=l&&(h="left",a="end")):t==="right"&&(u+m<=0?(h="bottom",a="start"):u+m-_<=0&&(h="right",a="start"),u>=l?(h="top",a="start"):u+_>=l&&(h="right",a="end")),!h)f.classList.add("driver-popover-arrow-none");else{f.classList.add(`driver-popover-arrow-side-${h}`),f.classList.add(`driver-popover-arrow-align-${a}`);const v=n.getBoundingClientRect(),g=f.getBoundingClientRect(),b=d("stagePadding")||0,S=v.left-b<window.innerWidth&&v.right+b>0&&v.top-b<window.innerHeight&&v.bottom+b>0;t==="bottom"&&S&&(g.x>v.x&&g.x+g.width<v.x+v.width?i.wrapper.style.transform="translateY(0)":(f.classList.remove(`driver-popover-arrow-align-${a}`),f.classList.add("driver-popover-arrow-none"),i.wrapper.style.transform=`translateY(-${b/2}px)`))}}function Ne(){const e=document.createElement("div");e.classList.add("driver-popover");const t=document.createElement("div");t.classList.add("driver-popover-arrow");const n=document.createElement("header");n.id="driver-popover-title",n.classList.add("driver-popover-title"),n.style.display="none",n.innerText="Popover Title";const i=document.createElement("div");i.id="driver-popover-description",i.classList.add("driver-popover-description"),i.style.display="none",i.innerText="Popover description is here";const o=document.createElement("button");o.type="button",o.classList.add("driver-popover-close-btn"),o.setAttribute("aria-label","Close"),o.innerHTML="&times;";const r=document.createElement("footer");r.classList.add("driver-popover-footer");const f=document.createElement("span");f.classList.add("driver-popover-progress-text"),f.innerText="";const y=document.createElement("span");y.classList.add("driver-popover-navigation-btns");const c=document.createElement("button");c.type="button",c.classList.add("driver-popover-prev-btn"),c.innerHTML="&larr; Previous";const w=document.createElement("button");return w.type="button",w.classList.add("driver-popover-next-btn"),w.innerHTML="Next &rarr;",y.appendChild(c),y.appendChild(w),r.appendChild(f),r.appendChild(y),e.appendChild(o),e.appendChild(t),e.appendChild(n),e.appendChild(i),e.appendChild(r),{wrapper:e,arrow:t,title:n,description:i,footer:r,previousButton:c,nextButton:w,closeButton:o,footerButtons:y,progress:f}}function qe(){var e;const t=p("popover");t&&((e=t.wrapper.parentElement)==null||e.removeChild(t.wrapper))}function Re(e={}){Z(e);function t(){d("allowClose")&&s()}function n(){const l=d("overlayClickBehavior");if(d("allowClose")&&l==="close"){s();return}if(typeof l=="function"){const u=p("__activeStep"),m=p("__activeElement");l(m,u,{config:d(),state:p(),driver:A()});return}l==="nextStep"&&i()}function i(){const l=p("activeIndex"),u=d("steps")||[];if(typeof l>"u")return;const m=l+1;u[m]?w(m):s()}function o(){const l=p("activeIndex"),u=d("steps")||[];if(typeof l>"u")return;const m=l-1;u[m]?w(m):s()}function r(l){(d("steps")||[])[l]?w(l):s()}function f(){var l;if(p("__transitionCallback"))return;const u=p("activeIndex"),m=p("__activeStep"),h=p("__activeElement");if(typeof u>"u"||typeof m>"u"||typeof p("activeIndex")>"u")return;const a=((l=m.popover)==null?void 0:l.onPrevClick)||d("onPrevClick");if(a)return a(h,m,{config:d(),state:p(),driver:A()});o()}function y(){var l;if(p("__transitionCallback"))return;const u=p("activeIndex"),m=p("__activeStep"),h=p("__activeElement");if(typeof u>"u"||typeof m>"u")return;const a=((l=m.popover)==null?void 0:l.onNextClick)||d("onNextClick");if(a)return a(h,m,{config:d(),state:p(),driver:A()});i()}function c(){p("isInitialized")||(M("isInitialized",!0),document.body.classList.add("driver-active",d("animate")?"driver-fade":"driver-simple"),Ae(),F("overlayClick",n),F("escapePress",t),F("arrowLeftPress",f),F("arrowRightPress",y))}function w(l=0){var u,m,h,a,v,g,b,S;const C=d("steps");if(!C){console.error("No steps to drive through"),s();return}if(!C[l]){s();return}M("__activeOnDestroyed",document.activeElement),M("activeIndex",l);const E=C[l],P=C[l+1],I=C[l-1],T=((u=E.popover)==null?void 0:u.doneBtnText)||d("doneBtnText")||"Done",$=d("allowClose"),L=typeof((m=E.popover)==null?void 0:m.showProgress)<"u"?(h=E.popover)==null?void 0:h.showProgress:d("showProgress"),N=(((a=E.popover)==null?void 0:a.progressText)||d("progressText")||"{{current}} of {{total}}").replace("{{current}}",`${l+1}`).replace("{{total}}",`${C.length}`),B=((v=E.popover)==null?void 0:v.showButtons)||d("showButtons"),k=["next","previous",...$?["close"]:[]].filter(q=>!(B!=null&&B.length)||B.includes(q)),x=((g=E.popover)==null?void 0:g.onNextClick)||d("onNextClick"),H=((b=E.popover)==null?void 0:b.onPrevClick)||d("onPrevClick"),D=((S=E.popover)==null?void 0:S.onCloseClick)||d("onCloseClick");ae({...E,popover:{showButtons:k,nextBtnText:P?void 0:T,disableButtons:[...I?[]:["previous"]],showProgress:L,progressText:N,onNextClick:x||(()=>{P?w(l+1):s()}),onPrevClick:H||(()=>{w(l-1)}),onCloseClick:D||(()=>{s()}),...E?.popover||{}}})}function s(l=!0){const u=p("__activeElement"),m=p("__activeStep"),h=p("__activeOnDestroyed"),a=d("onDestroyStarted");if(l&&a){const b=!u||u?.id==="driver-dummy-element";a(b?void 0:u,m,{config:d(),state:p(),driver:A()});return}const v=m?.onDeselected||d("onDeselected"),g=d("onDestroyed");if(document.body.classList.remove("driver-active","driver-fade","driver-simple"),Pe(),qe(),Be(),Te(),be(),oe(),u&&m){const b=u.id==="driver-dummy-element";v&&v(b?void 0:u,m,{config:d(),state:p(),driver:A()}),g&&g(b?void 0:u,m,{config:d(),state:p(),driver:A()})}h&&h.focus()}const _={isActive:()=>p("isInitialized")||!1,refresh:z,drive:(l=0)=>{c(),w(l)},setConfig:Z,setSteps:l=>{oe(),Z({...d(),steps:l})},getConfig:d,getState:p,getActiveIndex:()=>p("activeIndex"),isFirstStep:()=>p("activeIndex")===0,isLastStep:()=>{const l=d("steps")||[],u=p("activeIndex");return u!==void 0&&u===l.length-1},getActiveStep:()=>p("activeStep"),getActiveElement:()=>p("activeElement"),getPreviousElement:()=>p("previousElement"),getPreviousStep:()=>p("previousStep"),moveNext:i,movePrevious:o,moveTo:r,hasNextStep:()=>{const l=d("steps")||[],u=p("activeIndex");return u!==void 0&&!!l[u+1]},hasPreviousStep:()=>{const l=d("steps")||[],u=p("activeIndex");return u!==void 0&&!!l[u-1]},highlight:l=>{c(),ae({...l,popover:l.popover?{showButtons:[],showProgress:!1,progressText:"",...l.popover}:void 0})},destroy:()=>{s(!1)}};return we(_),_}const ze={matches:["https://www.patent.go.kr/*"],main(){console.log("Patent Guide Assistant - Content Script Loaded");const e="patent_guide_state",t=document.createElement("div");t.id="patent-chat-panel-container",document.body.appendChild(t);const n=document.createElement("div");n.id="patent-guide-container",n.style.cssText=`
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 999999;
    `;const i=n.attachShadow({mode:"open"}),o=document.createElement("button");o.textContent="💬 가이드 도우미",o.style.cssText=`
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 50px;
      padding: 12px 24px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
      transition: all 0.3s ease;
    `;const r=document.createElement("div");r.style.cssText=`
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 320px;
      height: 100vh;
      background: white;
      box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
      z-index: 999998;
      flex-direction: column;
    `,r.innerHTML=`
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .chat-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .chat-header h1 {
          font-size: 18px;
          font-weight: 600;
        }
        .close-btn {
          background: none;
          border: none;
          color: white;
          font-size: 24px;
          cursor: pointer;
          padding: 0;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .close-btn:hover {
          opacity: 0.8;
        }
        .messages {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
        }
        .message {
          margin-bottom: 16px;
          display: flex;
          flex-direction: column;
        }
        .message.user {
          align-items: flex-end;
        }
        .message.assistant {
          align-items: flex-start;
        }
        .message-content {
          max-width: 80%;
          padding: 12px 16px;
          border-radius: 12px;
          word-wrap: break-word;
        }
        .message.user .message-content {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        .message.assistant .message-content {
          background: #f3f4f6;
          color: #1f2937;
        }
        .input-container {
          padding: 20px;
          border-top: 1px solid #e5e7eb;
          display: flex;
          gap: 10px;
        }
        .input-container input {
          flex: 1;
          padding: 12px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          font-size: 14px;
        }
        .input-container input:focus {
          outline: none;
          border-color: #667eea;
        }
        .input-container button {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 8px;
          padding: 12px 24px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
        }
        .input-container button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .input-container button:hover:not(:disabled) {
          opacity: 0.9;
        }
        .quick-actions {
          padding: 20px;
          border-top: 1px solid #e5e7eb;
          display: flex;
          gap: 10px;
          justify-content: center;
        }
        .quick-actions button {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 12px;
          padding: 14px 28px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }
        .quick-actions button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(102, 126, 234, 0.5);
        }
        .quick-actions.hidden {
          display: none;
        }
        .input-container.hidden {
          display: none;
        }
        .reset-btn {
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 8px;
          padding: 8px 16px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .reset-btn:hover {
          background: #dc2626;
        }
      </style>
      <div class="chat-header">
        <h1>💬 특허 가이드 도우미</h1>
        <div style="display: flex; gap: 8px; align-items: center;">
          <button class="reset-btn">처음부터 다시</button>
          <button class="close-btn">×</button>
        </div>
      </div>
      <div class="messages">
        <div class="message assistant">
          <div class="message-content">안녕하세요! 특허 고객 등록을 도와드릴까요? 🚀<br><br>12단계로 구성된 가이드를 통해 쉽게 등록하실 수 있습니다.</div>
        </div>
      </div>
      <div class="quick-actions">
        <button class="start-guide-btn">넵! 시작할게요 👍</button>
      </div>
      <div class="input-container hidden">
        <input type="text" placeholder="메시지를 입력하세요" />
        <button>전송</button>
      </div>
    `,o.addEventListener("mouseenter",()=>{o.style.transform="translateY(-2px)",o.style.boxShadow="0 6px 20px rgba(102, 126, 234, 0.6)"}),o.addEventListener("mouseleave",()=>{o.style.transform="translateY(0)",o.style.boxShadow="0 4px 15px rgba(102, 126, 234, 0.4)"}),o.addEventListener("click",()=>{console.log("Button clicked!"),r.style.display="flex",o.style.display="none"}),r.querySelector(".close-btn")?.addEventListener("click",()=>{r.style.display="none",o.style.display="block"}),r.querySelector(".reset-btn")?.addEventListener("click",()=>{chrome.storage.local.remove([e],()=>{console.log("Guide state cleared - restarting from beginning"),location.reload()})});const c=r.querySelector("input"),w=r.querySelector(".input-container button"),s=r.querySelector(".messages"),_=r.querySelector(".quick-actions"),l=r.querySelector(".start-guide-btn"),u=r.querySelector(".input-container"),m=async()=>{const a=c.value.trim();if(!a)return;const v=document.createElement("div");v.className="message user",v.innerHTML=`<div class="message-content">${a}</div>`,s?.appendChild(v),c.value="",w.disabled=!0,s?.scrollTo({top:s.scrollHeight,behavior:"smooth"});const g=a.toLowerCase().trim();if(g==="네"||g==="예"||g==="시작"||g==="ㅇㅇ"||g==="ok"||g==="yes"||g.includes("시작")){const S=document.createElement("div");S.className="message assistant",S.innerHTML='<div class="message-content">좋습니다! 특허 고객 등록 가이드를 시작하겠습니다. 🎯<br><br>화면의 하이라이트를 따라가며 단계별로 진행해주세요!</div>',s?.appendChild(S),s?.scrollTo({top:s.scrollHeight,behavior:"smooth"}),w.disabled=!1,chrome.runtime.sendMessage({type:"ASK_AI",question:a},C=>{C.success&&h(C.steps)})}else chrome.runtime.sendMessage({type:"ASK_AI",question:a},S=>{const C=document.createElement("div");C.className="message assistant",C.innerHTML='<div class="message-content">가이드를 시작하겠습니다. 화면을 확인해주세요!</div>',s?.appendChild(C),s?.scrollTo({top:s.scrollHeight,behavior:"smooth"}),w.disabled=!1,S.success&&h(S.steps)})};l?.addEventListener("click",()=>{const a=document.createElement("div");a.className="message user",a.innerHTML='<div class="message-content">넵! 시작할게요 👍</div>',s?.appendChild(a),_?.classList.add("hidden"),u?.classList.remove("hidden");const v=document.createElement("div");v.className="message assistant",v.innerHTML='<div class="message-content">좋습니다! 특허 고객 등록 가이드를 시작하겠습니다. 🎯<br><br>화면의 하이라이트를 따라가며 단계별로 진행해주세요!</div>',s?.appendChild(v),s?.scrollTo({top:s.scrollHeight,behavior:"smooth"}),chrome.runtime.sendMessage({type:"ASK_AI",question:"시작"},g=>{g.success&&h(g.steps)})}),w?.addEventListener("click",m),c?.addEventListener("keypress",a=>{a.key==="Enter"&&m()}),i.appendChild(o),t.appendChild(r),document.body.appendChild(n),chrome.storage.local.get([e],a=>{if(a[e]){const{currentStep:v}=a[e];console.log(`Resuming guide from step ${v+1}`),r.style.display="flex",o.style.display="none",chrome.runtime.sendMessage({type:"ASK_AI",question:"가이드 재개"},g=>{if(g.success){const b=document.createElement("div");b.className="message assistant",b.innerHTML=`<div class="message-content">가이드를 계속 진행합니다! (${v+1}/${g.steps.length}단계)</div>`,s?.appendChild(b),h(g.steps,v)}})}}),chrome.runtime.onMessage.addListener((a,v,g)=>{a.type==="START_GUIDE"&&(h(a.steps),g({success:!0}))});function h(a,v=0){let g=v,b=null,S=null;const C=T=>{chrome.storage.local.set({[e]:{currentStep:T}})},E=()=>{chrome.storage.local.remove([e])},P=()=>{if(b&&(b.destroy(),b=null),S){const T=a[g],$=document.querySelector(T.selector);$&&$.removeEventListener("click",S),S=null}g++,g<a.length?(C(g),setTimeout(()=>I(g),300)):(E(),chrome.storage.local.get(["patent_invention_names"],T=>{const $=document.createElement("div");if($.className="message assistant",$.innerHTML='<div class="message-content">🎉 가이드를 모두 완료했습니다!</div>',s?.appendChild($),T.patent_invention_names){const{korean:L,english:N}=T.patent_invention_names,B=document.createElement("div");B.style.cssText="padding: 0 20px 20px;",B.innerHTML=`
                <div style="background: #f3f4f6; border-radius: 12px; padding: 16px; margin-bottom: 12px;">
                  <h3 style="font-size: 14px; font-weight: 600; margin-bottom: 12px; color: #1f2937;">📋 발명의 명칭</h3>
                  
                  <div style="background: white; border-radius: 8px; padding: 12px; margin-bottom: 8px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                      <div style="flex: 1;">
                        <p style="font-size: 11px; color: #6b7280; margin-bottom: 4px;">국문</p>
                        <p style="font-size: 14px; font-weight: 500; color: #1f2937;">${L}</p>
                      </div>
                      <button class="copy-korean-btn" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 6px; padding: 8px 16px; font-size: 12px; font-weight: 600; cursor: pointer; margin-left: 12px; white-space: nowrap;">복사</button>
                    </div>
                  </div>
                  
                  <div style="background: white; border-radius: 8px; padding: 12px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                      <div style="flex: 1;">
                        <p style="font-size: 11px; color: #6b7280; margin-bottom: 4px;">영문</p>
                        <p style="font-size: 14px; font-weight: 500; color: #1f2937;">${N}</p>
                      </div>
                      <button class="copy-english-btn" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 6px; padding: 8px 16px; font-size: 12px; font-weight: 600; cursor: pointer; margin-left: 12px; white-space: nowrap;">복사</button>
                    </div>
                  </div>
                </div>
              `,r.appendChild(B);const k=B.querySelector(".copy-korean-btn"),x=B.querySelector(".copy-english-btn");k?.addEventListener("click",async()=>{await navigator.clipboard.writeText(L);const H=k.textContent;k.textContent="✓ 복사됨!",setTimeout(()=>{k.textContent=H},2e3)}),x?.addEventListener("click",async()=>{await navigator.clipboard.writeText(N);const H=x.textContent;x.textContent="✓ 복사됨!",setTimeout(()=>{x.textContent=H},2e3)})}s?.scrollTo({top:s.scrollHeight,behavior:"smooth"})}))},I=(T,$=0)=>{if(T>=a.length)return;const L=a[T];if(T===5&&window.location.href.includes("popUpInfo.do")){const k=document.createElement("div");k.className="message assistant",k.innerHTML='<div class="message-content">ℹ️ 특허고객 행정처리 편리화에 대한 안내 페이지입니다.<br><br>내용을 확인하신 후 팝업을 닫고 원래 페이지로 돌아가서 계속 진행하시면 됩니다.</div>',s?.appendChild(k),s?.scrollTo({top:s.scrollHeight,behavior:"smooth"});const x=setInterval(()=>{if(!window.location.href.includes("popUpInfo.do")){clearInterval(x);const H=document.createElement("div");H.className="message assistant",H.innerHTML='<div class="message-content">✅ 원래 페이지로 돌아왔습니다. 다시 시도합니다...</div>',s?.appendChild(H),s?.scrollTo({top:s.scrollHeight,behavior:"smooth"}),setTimeout(()=>I(T,0),500)}},1e3);return}if(L.url&&!window.location.href.includes(L.url.split("/").pop()||""))if(console.log(`Current page doesn't match step ${T+1} URL. Expected: ${L.url}, Current: ${window.location.href}`),$<10){setTimeout(()=>I(T,$+1),500);return}else{const k=document.createElement("div");k.className="message assistant",k.innerHTML=`<div class="message-content">⚠️ 올바른 페이지로 이동하지 않았습니다.<br><br>예상 페이지: ${L.url}<br>현재 페이지: ${window.location.href}<br><br>페이지를 확인해주세요.</div>`,s?.appendChild(k),s?.scrollTo({top:s.scrollHeight,behavior:"smooth"});const x=document.createElement("div");x.style.cssText="padding: 0 20px 20px; display: flex; gap: 10px;",x.innerHTML=`
              <button style="flex: 1; background: #ef4444; color: white; border: none; border-radius: 8px; padding: 12px; font-weight: 600; cursor: pointer;">가이드 종료</button>
              <button style="flex: 1; background: #667eea; color: white; border: none; border-radius: 8px; padding: 12px; font-weight: 600; cursor: pointer;">다시 시도</button>
            `;const H=x.querySelector("button:first-child"),D=x.querySelector("button:last-child");H?.addEventListener("click",()=>{E(),x.remove();const q=document.createElement("div");q.className="message assistant",q.innerHTML='<div class="message-content">가이드를 종료했습니다.</div>',s?.appendChild(q)}),D?.addEventListener("click",()=>{x.remove(),I(T,0)}),r.appendChild(x);return}const N=document.querySelector(L.selector);if(!N)if(console.warn(`Element not found: ${L.selector}, retry ${$+1}/10`),$<10){setTimeout(()=>I(T,$+1),500);return}else{const k=document.createElement("div");k.className="message assistant",k.innerHTML='<div class="message-content">⚠️ 이 페이지에서 다음 단계를 찾을 수 없습니다.<br><br>올바른 페이지로 이동했는지 확인해주세요.<br><br>진행을 계속하려면 아래 버튼을 눌러주세요.</div>',s?.appendChild(k),s?.scrollTo({top:s.scrollHeight,behavior:"smooth"});const x=document.createElement("div");x.style.cssText="padding: 0 20px 20px; display: flex; gap: 10px;",x.innerHTML=`
              <button style="flex: 1; background: #ef4444; color: white; border: none; border-radius: 8px; padding: 12px; font-weight: 600; cursor: pointer;">가이드 종료</button>
              <button style="flex: 1; background: #667eea; color: white; border: none; border-radius: 8px; padding: 12px; font-weight: 600; cursor: pointer;">다시 시도</button>
            `;const H=x.querySelector("button:first-child"),D=x.querySelector("button:last-child");H?.addEventListener("click",()=>{E(),x.remove();const q=document.createElement("div");q.className="message assistant",q.innerHTML='<div class="message-content">가이드를 종료했습니다.</div>',s?.appendChild(q)}),D?.addEventListener("click",()=>{x.remove(),I(T,0)}),r.appendChild(x);return}let B=L.description;if(L.externalLink&&(B+=`<br><br><a href="${L.externalLink}" target="_blank" style="color: #667eea; font-weight: bold;">🔗 ${L.externalLink}</a>`),L.autoAdvance!==!1)B+='<br><br><small style="color: #9ca3af;">💡 이 요소를 직접 클릭하면 자동으로 다음 단계로 넘어갑니다.</small>',b=Re({showProgress:!0,showButtons:["next","previous","close"],steps:[{element:L.selector,popover:{title:L.title,description:B,side:"left",align:"start",onNextClick:()=>{P()},onPrevClick:()=>{b&&(b.destroy(),b=null),T>0&&(g=T-1,C(g),I(g))},onCloseClick:()=>{b&&(b.destroy(),b=null),E()}}}]}),S=k=>{console.log("Element clicked! Moving to next step...");const x=g+1;x<a.length&&(C(x),console.log(`Saved progress: step ${x}`)),setTimeout(()=>{P()},100)},N.addEventListener("click",S,{capture:!0,once:!0}),N.scrollIntoView({behavior:"smooth",block:"center"}),b.drive();else{const k=document.createElement("div");k.className="message assistant",k.innerHTML=`<div class="message-content"><strong>${L.title}</strong><br><br>${L.description}${L.externalLink?`<br><br><a href="${L.externalLink}" target="_blank" style="color: #667eea; font-weight: bold;">🔗 ${L.externalLink}</a>`:""}</div>`,s?.appendChild(k),L.showCopyButton&&chrome.storage.local.get(["patent_invention_names"],D=>{if(D.patent_invention_names){const{korean:q,english:Oe}=D.patent_invention_names,he=L.showCopyButton,fe=he==="korean"?q:Oe,Ye=he==="korean"?"국문 명칭":"영문 명칭",K=document.createElement("div");K.style.cssText="padding: 0 20px 20px;",K.innerHTML=`
                  <div style="background: #f3f4f6; border-radius: 12px; padding: 16px; margin-bottom: 12px;">
                    <p style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">${Ye}</p>
                    <div style="background: white; border-radius: 8px; padding: 12px; display: flex; justify-content: space-between; align-items: center;">
                      <p style="font-size: 14px; font-weight: 500; color: #1f2937; flex: 1;">${fe}</p>
                      <button class="copy-name-btn" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 6px; padding: 8px 16px; font-size: 12px; font-weight: 600; cursor: pointer; margin-left: 12px; white-space: nowrap;">📋 복사</button>
                    </div>
                  </div>
                `,r.appendChild(K);const j=K.querySelector(".copy-name-btn");j?.addEventListener("click",async()=>{await navigator.clipboard.writeText(fe);const Ge=j.textContent;j.textContent="✓ 복사됨!",setTimeout(()=>{j.textContent=Ge},2e3)})}});const x=document.createElement("div");x.style.cssText="padding: 0 20px 20px; display: flex; gap: 10px;",x.innerHTML=`
            <button style="flex: 1; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; border: none; border-radius: 12px; padding: 14px 28px; font-size: 16px; font-weight: 600; cursor: pointer; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">✅ 완료했어요!</button>
          `,x.querySelector("button")?.addEventListener("click",()=>{x.remove();const D=document.createElement("div");D.className="message user",D.innerHTML='<div class="message-content">완료했어요!</div>',s?.appendChild(D),P()}),r.appendChild(x),s?.scrollTo({top:s.scrollHeight,behavior:"smooth"})}setTimeout(()=>{const k=document.querySelector(".driver-active-element");k&&(k.style.pointerEvents="auto",k.style.cursor="pointer")},100)};I(v)}}},me=globalThis.browser?.runtime?.id?globalThis.browser:globalThis.chrome;function Y(e,...t){}const We={debug:(...e)=>Y(console.debug,...e),log:(...e)=>Y(console.log,...e),warn:(...e)=>Y(console.warn,...e),error:(...e)=>Y(console.error,...e)};class J extends Event{constructor(t,n){super(J.EVENT_NAME,{}),this.newUrl=t,this.oldUrl=n}static EVENT_NAME=Q("wxt:locationchange")}function Q(e){return`${me?.runtime?.id}:content:${e}`}function Fe(e){let t,n;return{run(){t==null&&(n=new URL(location.href),t=e.setInterval(()=>{let i=new URL(location.href);i.href!==n.href&&(window.dispatchEvent(new J(i,n)),n=i)},1e3))}}}class G{constructor(t,n){this.contentScriptName=t,this.options=n,this.abortController=new AbortController,this.isTopFrame?(this.listenForNewerScripts({ignoreFirstEvent:!0}),this.stopOldScripts()):this.listenForNewerScripts()}static SCRIPT_STARTED_MESSAGE_TYPE=Q("wxt:content-script-started");isTopFrame=window.self===window.top;abortController;locationWatcher=Fe(this);receivedMessageIds=new Set;get signal(){return this.abortController.signal}abort(t){return this.abortController.abort(t)}get isInvalid(){return me.runtime.id==null&&this.notifyInvalidated(),this.signal.aborted}get isValid(){return!this.isInvalid}onInvalidated(t){return this.signal.addEventListener("abort",t),()=>this.signal.removeEventListener("abort",t)}block(){return new Promise(()=>{})}setInterval(t,n){const i=setInterval(()=>{this.isValid&&t()},n);return this.onInvalidated(()=>clearInterval(i)),i}setTimeout(t,n){const i=setTimeout(()=>{this.isValid&&t()},n);return this.onInvalidated(()=>clearTimeout(i)),i}requestAnimationFrame(t){const n=requestAnimationFrame((...i)=>{this.isValid&&t(...i)});return this.onInvalidated(()=>cancelAnimationFrame(n)),n}requestIdleCallback(t,n){const i=requestIdleCallback((...o)=>{this.signal.aborted||t(...o)},n);return this.onInvalidated(()=>cancelIdleCallback(i)),i}addEventListener(t,n,i,o){n==="wxt:locationchange"&&this.isValid&&this.locationWatcher.run(),t.addEventListener?.(n.startsWith("wxt:")?Q(n):n,i,{...o,signal:this.signal})}notifyInvalidated(){this.abort("Content script context invalidated"),We.debug(`Content script "${this.contentScriptName}" context invalidated`)}stopOldScripts(){window.postMessage({type:G.SCRIPT_STARTED_MESSAGE_TYPE,contentScriptName:this.contentScriptName,messageId:Math.random().toString(36).slice(2)},"*")}verifyScriptStartedEvent(t){const n=t.data?.type===G.SCRIPT_STARTED_MESSAGE_TYPE,i=t.data?.contentScriptName===this.contentScriptName,o=!this.receivedMessageIds.has(t.data?.messageId);return n&&i&&o}listenForNewerScripts(t){let n=!0;const i=o=>{if(this.verifyScriptStartedEvent(o)){this.receivedMessageIds.add(o.data.messageId);const r=n;if(n=!1,r&&t?.ignoreFirstEvent)return;this.notifyInvalidated()}};addEventListener("message",i),this.onInvalidated(()=>removeEventListener("message",i))}}function je(){}function V(e,...t){}const Ue={debug:(...e)=>V(console.debug,...e),log:(...e)=>V(console.log,...e),warn:(...e)=>V(console.warn,...e),error:(...e)=>V(console.error,...e)};return(async()=>{try{const{main:e,...t}=ze,n=new G("content",t);return await e(n)}catch(e){throw Ue.error('The content script "content" crashed on startup!',e),e}})()})();
content;