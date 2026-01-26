var content = (function() {
  "use strict";
  function defineContentScript(definition2) {
    return definition2;
  }
  let z = {}, J;
  function F(e = {}) {
    z = {
      animate: true,
      allowClose: true,
      overlayClickBehavior: "close",
      overlayOpacity: 0.7,
      smoothScroll: false,
      disableActiveInteraction: false,
      showProgress: false,
      stagePadding: 10,
      stageRadius: 5,
      popoverOffset: 10,
      showButtons: ["next", "previous", "close"],
      disableButtons: [],
      overlayColor: "#000",
      ...e
    };
  }
  function s(e) {
    return e ? z[e] : z;
  }
  function le(e) {
    J = e;
  }
  function _() {
    return J;
  }
  let I = {};
  function N(e, o) {
    I[e] = o;
  }
  function L(e) {
    var o;
    (o = I[e]) == null || o.call(I);
  }
  function de() {
    I = {};
  }
  function O(e, o, t, i) {
    return (e /= i / 2) < 1 ? t / 2 * e * e + o : -t / 2 * (--e * (e - 2) - 1) + o;
  }
  function U(e) {
    const o = 'a[href]:not([disabled]), button:not([disabled]), textarea:not([disabled]), input[type="text"]:not([disabled]), input[type="radio"]:not([disabled]), input[type="checkbox"]:not([disabled]), select:not([disabled])';
    return e.flatMap((t) => {
      const i = t.matches(o), d = Array.from(t.querySelectorAll(o));
      return [...i ? [t] : [], ...d];
    }).filter((t) => getComputedStyle(t).pointerEvents !== "none" && ve(t));
  }
  function ee(e) {
    if (!e || ue(e))
      return;
    const o = s("smoothScroll"), t = e.offsetHeight > window.innerHeight;
    e.scrollIntoView({
      // Removing the smooth scrolling for elements which exist inside the scrollable parent
      // This was causing the highlight to not properly render
      behavior: !o || pe(e) ? "auto" : "smooth",
      inline: "center",
      block: t ? "start" : "center"
    });
  }
  function pe(e) {
    if (!e || !e.parentElement)
      return;
    const o = e.parentElement;
    return o.scrollHeight > o.clientHeight;
  }
  function ue(e) {
    const o = e.getBoundingClientRect();
    return o.top >= 0 && o.left >= 0 && o.bottom <= (window.innerHeight || document.documentElement.clientHeight) && o.right <= (window.innerWidth || document.documentElement.clientWidth);
  }
  function ve(e) {
    return !!(e.offsetWidth || e.offsetHeight || e.getClientRects().length);
  }
  let D = {};
  function k(e, o) {
    D[e] = o;
  }
  function l(e) {
    return e ? D[e] : D;
  }
  function X() {
    D = {};
  }
  function fe(e, o, t, i) {
    let d = l("__activeStagePosition");
    const n = d || t.getBoundingClientRect(), f = i.getBoundingClientRect(), w = O(e, n.x, f.x - n.x, o), r = O(e, n.y, f.y - n.y, o), v = O(e, n.width, f.width - n.width, o), g = O(e, n.height, f.height - n.height, o);
    d = {
      x: w,
      y: r,
      width: v,
      height: g
    }, oe(d), k("__activeStagePosition", d);
  }
  function te(e) {
    if (!e)
      return;
    const o = e.getBoundingClientRect(), t = {
      x: o.x,
      y: o.y,
      width: o.width,
      height: o.height
    };
    k("__activeStagePosition", t), oe(t);
  }
  function he() {
    const e = l("__activeStagePosition"), o = l("__overlaySvg");
    if (!e)
      return;
    if (!o) {
      console.warn("No stage svg found.");
      return;
    }
    const t = window.innerWidth, i = window.innerHeight;
    o.setAttribute("viewBox", `0 0 ${t} ${i}`);
  }
  function ge(e) {
    const o = we(e);
    document.body.appendChild(o), re(o, (t) => {
      t.target.tagName === "path" && L("overlayClick");
    }), k("__overlaySvg", o);
  }
  function oe(e) {
    const o = l("__overlaySvg");
    if (!o) {
      ge(e);
      return;
    }
    const t = o.firstElementChild;
    if ((t == null ? void 0 : t.tagName) !== "path")
      throw new Error("no path element found in stage svg");
    t.setAttribute("d", ie(e));
  }
  function we(e) {
    const o = window.innerWidth, t = window.innerHeight, i = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    i.classList.add("driver-overlay", "driver-overlay-animated"), i.setAttribute("viewBox", `0 0 ${o} ${t}`), i.setAttribute("xmlSpace", "preserve"), i.setAttribute("xmlnsXlink", "http://www.w3.org/1999/xlink"), i.setAttribute("version", "1.1"), i.setAttribute("preserveAspectRatio", "xMinYMin slice"), i.style.fillRule = "evenodd", i.style.clipRule = "evenodd", i.style.strokeLinejoin = "round", i.style.strokeMiterlimit = "2", i.style.zIndex = "10000", i.style.position = "fixed", i.style.top = "0", i.style.left = "0", i.style.width = "100%", i.style.height = "100%";
    const d = document.createElementNS("http://www.w3.org/2000/svg", "path");
    return d.setAttribute("d", ie(e)), d.style.fill = s("overlayColor") || "rgb(0,0,0)", d.style.opacity = `${s("overlayOpacity")}`, d.style.pointerEvents = "auto", d.style.cursor = "auto", i.appendChild(d), i;
  }
  function ie(e) {
    const o = window.innerWidth, t = window.innerHeight, i = s("stagePadding") || 0, d = s("stageRadius") || 0, n = e.width + i * 2, f = e.height + i * 2, w = Math.min(d, n / 2, f / 2), r = Math.floor(Math.max(w, 0)), v = e.x - i + r, g = e.y - i, y = n - r * 2, a = f - r * 2;
    return `M${o},0L0,0L0,${t}L${o},${t}L${o},0Z
    M${v},${g} h${y} a${r},${r} 0 0 1 ${r},${r} v${a} a${r},${r} 0 0 1 -${r},${r} h-${y} a${r},${r} 0 0 1 -${r},-${r} v-${a} a${r},${r} 0 0 1 ${r},-${r} z`;
  }
  function me() {
    const e = l("__overlaySvg");
    e && e.remove();
  }
  function ye() {
    const e = document.getElementById("driver-dummy-element");
    if (e)
      return e;
    let o = document.createElement("div");
    return o.id = "driver-dummy-element", o.style.width = "0", o.style.height = "0", o.style.pointerEvents = "none", o.style.opacity = "0", o.style.position = "fixed", o.style.top = "50%", o.style.left = "50%", document.body.appendChild(o), o;
  }
  function j(e) {
    const { element: o } = e;
    let t = typeof o == "function" ? o() : typeof o == "string" ? document.querySelector(o) : o;
    t || (t = ye()), be(t, e);
  }
  function xe() {
    const e = l("__activeElement"), o = l("__activeStep");
    e && (te(e), he(), ae(e, o));
  }
  function be(e, o) {
    var C;
    const i = Date.now(), d = l("__activeStep"), n = l("__activeElement") || e, f = !n || n === e, w = e.id === "driver-dummy-element", r = n.id === "driver-dummy-element", v = s("animate"), g = o.onHighlightStarted || s("onHighlightStarted"), y = (o == null ? void 0 : o.onHighlighted) || s("onHighlighted"), a = (d == null ? void 0 : d.onDeselected) || s("onDeselected"), p = s(), c = l();
    !f && a && a(r ? void 0 : n, d, {
      config: p,
      state: c,
      driver: _()
    }), g && g(w ? void 0 : e, o, {
      config: p,
      state: c,
      driver: _()
    });
    const u = !f && v;
    let h = false;
    Se(), k("previousStep", d), k("previousElement", n), k("activeStep", o), k("activeElement", e);
    const m = () => {
      if (l("__transitionCallback") !== m)
        return;
      const b = Date.now() - i, E = 400 - b <= 400 / 2;
      o.popover && E && !h && u && (Q(e, o), h = true), s("animate") && b < 400 ? fe(b, 400, n, e) : (te(e), y && y(w ? void 0 : e, o, {
        config: s(),
        state: l(),
        driver: _()
      }), k("__transitionCallback", void 0), k("__previousStep", d), k("__previousElement", n), k("__activeStep", o), k("__activeElement", e)), window.requestAnimationFrame(m);
    };
    k("__transitionCallback", m), window.requestAnimationFrame(m), ee(e), !u && o.popover && Q(e, o), n.classList.remove("driver-active-element", "driver-no-interaction"), n.removeAttribute("aria-haspopup"), n.removeAttribute("aria-expanded"), n.removeAttribute("aria-controls"), ((C = o.disableActiveInteraction) != null ? C : s("disableActiveInteraction")) && e.classList.add("driver-no-interaction"), e.classList.add("driver-active-element"), e.setAttribute("aria-haspopup", "dialog"), e.setAttribute("aria-expanded", "true"), e.setAttribute("aria-controls", "driver-popover-content");
  }
  function Ce() {
    var e;
    (e = document.getElementById("driver-dummy-element")) == null || e.remove(), document.querySelectorAll(".driver-active-element").forEach((o) => {
      o.classList.remove("driver-active-element", "driver-no-interaction"), o.removeAttribute("aria-haspopup"), o.removeAttribute("aria-expanded"), o.removeAttribute("aria-controls");
    });
  }
  function M() {
    const e = l("__resizeTimeout");
    e && window.cancelAnimationFrame(e), k("__resizeTimeout", window.requestAnimationFrame(xe));
  }
  function Pe(e) {
    var r;
    if (!l("isInitialized") || !(e.key === "Tab" || e.keyCode === 9))
      return;
    const i = l("__activeElement"), d = (r = l("popover")) == null ? void 0 : r.wrapper, n = U([
      ...d ? [d] : [],
      ...i ? [i] : []
    ]), f = n[0], w = n[n.length - 1];
    if (e.preventDefault(), e.shiftKey) {
      const v = n[n.indexOf(document.activeElement) - 1] || w;
      v == null || v.focus();
    } else {
      const v = n[n.indexOf(document.activeElement) + 1] || f;
      v == null || v.focus();
    }
  }
  function ne(e) {
    var t;
    ((t = s("allowKeyboardControl")) == null || t) && (e.key === "Escape" ? L("escapePress") : e.key === "ArrowRight" ? L("arrowRightPress") : e.key === "ArrowLeft" && L("arrowLeftPress"));
  }
  function re(e, o, t) {
    const i = (n, f) => {
      const w = n.target;
      e.contains(w) && ((!t || t(w)) && (n.preventDefault(), n.stopPropagation(), n.stopImmediatePropagation()), f == null || f(n));
    };
    document.addEventListener("pointerdown", i, true), document.addEventListener("mousedown", i, true), document.addEventListener("pointerup", i, true), document.addEventListener("mouseup", i, true), document.addEventListener(
      "click",
      (n) => {
        i(n, o);
      },
      true
    );
  }
  function ke() {
    window.addEventListener("keyup", ne, false), window.addEventListener("keydown", Pe, false), window.addEventListener("resize", M), window.addEventListener("scroll", M);
  }
  function _e() {
    window.removeEventListener("keyup", ne), window.removeEventListener("resize", M), window.removeEventListener("scroll", M);
  }
  function Se() {
    const e = l("popover");
    e && (e.wrapper.style.display = "none");
  }
  function Q(e, o) {
    var b, P;
    let t = l("popover");
    t && document.body.removeChild(t.wrapper), t = Le(), document.body.appendChild(t.wrapper);
    const {
      title: i,
      description: d,
      showButtons: n,
      disableButtons: f,
      showProgress: w,
      nextBtnText: r = s("nextBtnText") || "Next &rarr;",
      prevBtnText: v = s("prevBtnText") || "&larr; Previous",
      progressText: g = s("progressText") || "{current} of {total}"
    } = o.popover || {};
    t.nextButton.innerHTML = r, t.previousButton.innerHTML = v, t.progress.innerHTML = g, i ? (t.title.innerHTML = i, t.title.style.display = "block") : t.title.style.display = "none", d ? (t.description.innerHTML = d, t.description.style.display = "block") : t.description.style.display = "none";
    const y = n || s("showButtons"), a = w || s("showProgress") || false, p = (y == null ? void 0 : y.includes("next")) || (y == null ? void 0 : y.includes("previous")) || a;
    t.closeButton.style.display = y.includes("close") ? "block" : "none", p ? (t.footer.style.display = "flex", t.progress.style.display = a ? "block" : "none", t.nextButton.style.display = y.includes("next") ? "block" : "none", t.previousButton.style.display = y.includes("previous") ? "block" : "none") : t.footer.style.display = "none";
    const c = f || s("disableButtons") || [];
    c != null && c.includes("next") && (t.nextButton.disabled = true, t.nextButton.classList.add("driver-popover-btn-disabled")), c != null && c.includes("previous") && (t.previousButton.disabled = true, t.previousButton.classList.add("driver-popover-btn-disabled")), c != null && c.includes("close") && (t.closeButton.disabled = true, t.closeButton.classList.add("driver-popover-btn-disabled"));
    const u = t.wrapper;
    u.style.display = "block", u.style.left = "", u.style.top = "", u.style.bottom = "", u.style.right = "", u.id = "driver-popover-content", u.setAttribute("role", "dialog"), u.setAttribute("aria-labelledby", "driver-popover-title"), u.setAttribute("aria-describedby", "driver-popover-description");
    const h = t.arrow;
    h.className = "driver-popover-arrow";
    const m = ((b = o.popover) == null ? void 0 : b.popoverClass) || s("popoverClass") || "";
    u.className = `driver-popover ${m}`.trim(), re(
      t.wrapper,
      (E) => {
        var B, R, W;
        const T = E.target, A = ((B = o.popover) == null ? void 0 : B.onNextClick) || s("onNextClick"), H = ((R = o.popover) == null ? void 0 : R.onPrevClick) || s("onPrevClick"), $ = ((W = o.popover) == null ? void 0 : W.onCloseClick) || s("onCloseClick");
        if (T.closest(".driver-popover-next-btn"))
          return A ? A(e, o, {
            config: s(),
            state: l(),
            driver: _()
          }) : L("nextClick");
        if (T.closest(".driver-popover-prev-btn"))
          return H ? H(e, o, {
            config: s(),
            state: l(),
            driver: _()
          }) : L("prevClick");
        if (T.closest(".driver-popover-close-btn"))
          return $ ? $(e, o, {
            config: s(),
            state: l(),
            driver: _()
          }) : L("closeClick");
      },
      (E) => !(t != null && t.description.contains(E)) && !(t != null && t.title.contains(E)) && typeof E.className == "string" && E.className.includes("driver-popover")
    ), k("popover", t);
    const x = ((P = o.popover) == null ? void 0 : P.onPopoverRender) || s("onPopoverRender");
    x && x(t, {
      config: s(),
      state: l(),
      driver: _()
    }), ae(e, o), ee(u);
    const C = e.classList.contains("driver-dummy-element"), S = U([u, ...C ? [] : [e]]);
    S.length > 0 && S[0].focus();
  }
  function se() {
    const e = l("popover");
    if (!(e != null && e.wrapper))
      return;
    const o = e.wrapper.getBoundingClientRect(), t = s("stagePadding") || 0, i = s("popoverOffset") || 0;
    return {
      width: o.width + t + i,
      height: o.height + t + i,
      realWidth: o.width,
      realHeight: o.height
    };
  }
  function Z(e, o) {
    const { elementDimensions: t, popoverDimensions: i, popoverPadding: d, popoverArrowDimensions: n } = o;
    return e === "start" ? Math.max(
      Math.min(
        t.top - d,
        window.innerHeight - i.realHeight - n.width
      ),
      n.width
    ) : e === "end" ? Math.max(
      Math.min(
        t.top - (i == null ? void 0 : i.realHeight) + t.height + d,
        window.innerHeight - (i == null ? void 0 : i.realHeight) - n.width
      ),
      n.width
    ) : e === "center" ? Math.max(
      Math.min(
        t.top + t.height / 2 - (i == null ? void 0 : i.realHeight) / 2,
        window.innerHeight - (i == null ? void 0 : i.realHeight) - n.width
      ),
      n.width
    ) : 0;
  }
  function G(e, o) {
    const { elementDimensions: t, popoverDimensions: i, popoverPadding: d, popoverArrowDimensions: n } = o;
    return e === "start" ? Math.max(
      Math.min(
        t.left - d,
        window.innerWidth - i.realWidth - n.width
      ),
      n.width
    ) : e === "end" ? Math.max(
      Math.min(
        t.left - (i == null ? void 0 : i.realWidth) + t.width + d,
        window.innerWidth - (i == null ? void 0 : i.realWidth) - n.width
      ),
      n.width
    ) : e === "center" ? Math.max(
      Math.min(
        t.left + t.width / 2 - (i == null ? void 0 : i.realWidth) / 2,
        window.innerWidth - (i == null ? void 0 : i.realWidth) - n.width
      ),
      n.width
    ) : 0;
  }
  function ae(e, o) {
    const t = l("popover");
    if (!t)
      return;
    const { align: i = "start", side: d = "left" } = (o == null ? void 0 : o.popover) || {}, n = i, f = e.id === "driver-dummy-element" ? "over" : d, w = s("stagePadding") || 0, r = se(), v = t.arrow.getBoundingClientRect(), g = e.getBoundingClientRect(), y = g.top - r.height;
    let a = y >= 0;
    const p = window.innerHeight - (g.bottom + r.height);
    let c = p >= 0;
    const u = g.left - r.width;
    let h = u >= 0;
    const m = window.innerWidth - (g.right + r.width);
    let x = m >= 0;
    const C = !a && !c && !h && !x;
    let S = f;
    if (f === "top" && a ? x = h = c = false : f === "bottom" && c ? x = h = a = false : f === "left" && h ? x = a = c = false : f === "right" && x && (h = a = c = false), f === "over") {
      const b = window.innerWidth / 2 - r.realWidth / 2, P = window.innerHeight / 2 - r.realHeight / 2;
      t.wrapper.style.left = `${b}px`, t.wrapper.style.right = "auto", t.wrapper.style.top = `${P}px`, t.wrapper.style.bottom = "auto";
    } else if (C) {
      const b = window.innerWidth / 2 - (r == null ? void 0 : r.realWidth) / 2, P = 10;
      t.wrapper.style.left = `${b}px`, t.wrapper.style.right = "auto", t.wrapper.style.bottom = `${P}px`, t.wrapper.style.top = "auto";
    } else if (h) {
      const b = Math.min(
        u,
        window.innerWidth - (r == null ? void 0 : r.realWidth) - v.width
      ), P = Z(n, {
        elementDimensions: g,
        popoverDimensions: r,
        popoverPadding: w,
        popoverArrowDimensions: v
      });
      t.wrapper.style.left = `${b}px`, t.wrapper.style.top = `${P}px`, t.wrapper.style.bottom = "auto", t.wrapper.style.right = "auto", S = "left";
    } else if (x) {
      const b = Math.min(
        m,
        window.innerWidth - (r == null ? void 0 : r.realWidth) - v.width
      ), P = Z(n, {
        elementDimensions: g,
        popoverDimensions: r,
        popoverPadding: w,
        popoverArrowDimensions: v
      });
      t.wrapper.style.right = `${b}px`, t.wrapper.style.top = `${P}px`, t.wrapper.style.bottom = "auto", t.wrapper.style.left = "auto", S = "right";
    } else if (a) {
      const b = Math.min(
        y,
        window.innerHeight - r.realHeight - v.width
      );
      let P = G(n, {
        elementDimensions: g,
        popoverDimensions: r,
        popoverPadding: w,
        popoverArrowDimensions: v
      });
      t.wrapper.style.top = `${b}px`, t.wrapper.style.left = `${P}px`, t.wrapper.style.bottom = "auto", t.wrapper.style.right = "auto", S = "top";
    } else if (c) {
      const b = Math.min(
        p,
        window.innerHeight - (r == null ? void 0 : r.realHeight) - v.width
      );
      let P = G(n, {
        elementDimensions: g,
        popoverDimensions: r,
        popoverPadding: w,
        popoverArrowDimensions: v
      });
      t.wrapper.style.left = `${P}px`, t.wrapper.style.bottom = `${b}px`, t.wrapper.style.top = "auto", t.wrapper.style.right = "auto", S = "bottom";
    }
    C ? t.arrow.classList.add("driver-popover-arrow-none") : Ee(n, S, e);
  }
  function Ee(e, o, t) {
    const i = l("popover");
    if (!i)
      return;
    const d = t.getBoundingClientRect(), n = se(), f = i.arrow, w = n.width, r = window.innerWidth, v = d.width, g = d.left, y = n.height, a = window.innerHeight, p = d.top, c = d.height;
    f.className = "driver-popover-arrow";
    let u = o, h = e;
    if (o === "top" ? (g + v <= 0 ? (u = "right", h = "end") : g + v - w <= 0 && (u = "top", h = "start"), g >= r ? (u = "left", h = "end") : g + w >= r && (u = "top", h = "end")) : o === "bottom" ? (g + v <= 0 ? (u = "right", h = "start") : g + v - w <= 0 && (u = "bottom", h = "start"), g >= r ? (u = "left", h = "start") : g + w >= r && (u = "bottom", h = "end")) : o === "left" ? (p + c <= 0 ? (u = "bottom", h = "end") : p + c - y <= 0 && (u = "left", h = "start"), p >= a ? (u = "top", h = "end") : p + y >= a && (u = "left", h = "end")) : o === "right" && (p + c <= 0 ? (u = "bottom", h = "start") : p + c - y <= 0 && (u = "right", h = "start"), p >= a ? (u = "top", h = "start") : p + y >= a && (u = "right", h = "end")), !u)
      f.classList.add("driver-popover-arrow-none");
    else {
      f.classList.add(`driver-popover-arrow-side-${u}`), f.classList.add(`driver-popover-arrow-align-${h}`);
      const m = t.getBoundingClientRect(), x = f.getBoundingClientRect(), C = s("stagePadding") || 0, S = m.left - C < window.innerWidth && m.right + C > 0 && m.top - C < window.innerHeight && m.bottom + C > 0;
      o === "bottom" && S && (x.x > m.x && x.x + x.width < m.x + m.width ? i.wrapper.style.transform = "translateY(0)" : (f.classList.remove(`driver-popover-arrow-align-${h}`), f.classList.add("driver-popover-arrow-none"), i.wrapper.style.transform = `translateY(-${C / 2}px)`));
    }
  }
  function Le() {
    const e = document.createElement("div");
    e.classList.add("driver-popover");
    const o = document.createElement("div");
    o.classList.add("driver-popover-arrow");
    const t = document.createElement("header");
    t.id = "driver-popover-title", t.classList.add("driver-popover-title"), t.style.display = "none", t.innerText = "Popover Title";
    const i = document.createElement("div");
    i.id = "driver-popover-description", i.classList.add("driver-popover-description"), i.style.display = "none", i.innerText = "Popover description is here";
    const d = document.createElement("button");
    d.type = "button", d.classList.add("driver-popover-close-btn"), d.setAttribute("aria-label", "Close"), d.innerHTML = "&times;";
    const n = document.createElement("footer");
    n.classList.add("driver-popover-footer");
    const f = document.createElement("span");
    f.classList.add("driver-popover-progress-text"), f.innerText = "";
    const w = document.createElement("span");
    w.classList.add("driver-popover-navigation-btns");
    const r = document.createElement("button");
    r.type = "button", r.classList.add("driver-popover-prev-btn"), r.innerHTML = "&larr; Previous";
    const v = document.createElement("button");
    return v.type = "button", v.classList.add("driver-popover-next-btn"), v.innerHTML = "Next &rarr;", w.appendChild(r), w.appendChild(v), n.appendChild(f), n.appendChild(w), e.appendChild(d), e.appendChild(o), e.appendChild(t), e.appendChild(i), e.appendChild(n), {
      wrapper: e,
      arrow: o,
      title: t,
      description: i,
      footer: n,
      previousButton: r,
      nextButton: v,
      closeButton: d,
      footerButtons: w,
      progress: f
    };
  }
  function Te() {
    var o;
    const e = l("popover");
    e && ((o = e.wrapper.parentElement) == null || o.removeChild(e.wrapper));
  }
  function Ae(e = {}) {
    F(e);
    function o() {
      s("allowClose") && g();
    }
    function t() {
      const a = s("overlayClickBehavior");
      if (s("allowClose") && a === "close") {
        g();
        return;
      }
      if (typeof a == "function") {
        const p = l("__activeStep"), c = l("__activeElement");
        a(c, p, {
          config: s(),
          state: l(),
          driver: _()
        });
        return;
      }
      a === "nextStep" && i();
    }
    function i() {
      const a = l("activeIndex"), p = s("steps") || [];
      if (typeof a == "undefined")
        return;
      const c = a + 1;
      p[c] ? v(c) : g();
    }
    function d() {
      const a = l("activeIndex"), p = s("steps") || [];
      if (typeof a == "undefined")
        return;
      const c = a - 1;
      p[c] ? v(c) : g();
    }
    function n(a) {
      (s("steps") || [])[a] ? v(a) : g();
    }
    function f() {
      var x;
      if (l("__transitionCallback"))
        return;
      const p = l("activeIndex"), c = l("__activeStep"), u = l("__activeElement");
      if (typeof p == "undefined" || typeof c == "undefined" || typeof l("activeIndex") == "undefined")
        return;
      const m = ((x = c.popover) == null ? void 0 : x.onPrevClick) || s("onPrevClick");
      if (m)
        return m(u, c, {
          config: s(),
          state: l(),
          driver: _()
        });
      d();
    }
    function w() {
      var m;
      if (l("__transitionCallback"))
        return;
      const p = l("activeIndex"), c = l("__activeStep"), u = l("__activeElement");
      if (typeof p == "undefined" || typeof c == "undefined")
        return;
      const h = ((m = c.popover) == null ? void 0 : m.onNextClick) || s("onNextClick");
      if (h)
        return h(u, c, {
          config: s(),
          state: l(),
          driver: _()
        });
      i();
    }
    function r() {
      l("isInitialized") || (k("isInitialized", true), document.body.classList.add("driver-active", s("animate") ? "driver-fade" : "driver-simple"), ke(), N("overlayClick", t), N("escapePress", o), N("arrowLeftPress", f), N("arrowRightPress", w));
    }
    function v(a = 0) {
      var $, B, R, W, V, q, K, Y;
      const p = s("steps");
      if (!p) {
        console.error("No steps to drive through"), g();
        return;
      }
      if (!p[a]) {
        g();
        return;
      }
      k("__activeOnDestroyed", document.activeElement), k("activeIndex", a);
      const c = p[a], u = p[a + 1], h = p[a - 1], m = (($ = c.popover) == null ? void 0 : $.doneBtnText) || s("doneBtnText") || "Done", x = s("allowClose"), C = typeof ((B = c.popover) == null ? void 0 : B.showProgress) != "undefined" ? (R = c.popover) == null ? void 0 : R.showProgress : s("showProgress"), b = (((W = c.popover) == null ? void 0 : W.progressText) || s("progressText") || "{{current}} of {{total}}").replace("{{current}}", `${a + 1}`).replace("{{total}}", `${p.length}`), P = ((V = c.popover) == null ? void 0 : V.showButtons) || s("showButtons"), E = [
        "next",
        "previous",
        ...x ? ["close"] : []
      ].filter((ce) => !(P != null && P.length) || P.includes(ce)), T = ((q = c.popover) == null ? void 0 : q.onNextClick) || s("onNextClick"), A = ((K = c.popover) == null ? void 0 : K.onPrevClick) || s("onPrevClick"), H = ((Y = c.popover) == null ? void 0 : Y.onCloseClick) || s("onCloseClick");
      j({
        ...c,
        popover: {
          showButtons: E,
          nextBtnText: u ? void 0 : m,
          disableButtons: [...h ? [] : ["previous"]],
          showProgress: C,
          progressText: b,
          onNextClick: T || (() => {
            u ? v(a + 1) : g();
          }),
          onPrevClick: A || (() => {
            v(a - 1);
          }),
          onCloseClick: H || (() => {
            g();
          }),
          ...(c == null ? void 0 : c.popover) || {}
        }
      });
    }
    function g(a = true) {
      const p = l("__activeElement"), c = l("__activeStep"), u = l("__activeOnDestroyed"), h = s("onDestroyStarted");
      if (a && h) {
        const C = !p || (p == null ? void 0 : p.id) === "driver-dummy-element";
        h(C ? void 0 : p, c, {
          config: s(),
          state: l(),
          driver: _()
        });
        return;
      }
      const m = (c == null ? void 0 : c.onDeselected) || s("onDeselected"), x = s("onDestroyed");
      if (document.body.classList.remove("driver-active", "driver-fade", "driver-simple"), _e(), Te(), Ce(), me(), de(), X(), p && c) {
        const C = p.id === "driver-dummy-element";
        m && m(C ? void 0 : p, c, {
          config: s(),
          state: l(),
          driver: _()
        }), x && x(C ? void 0 : p, c, {
          config: s(),
          state: l(),
          driver: _()
        });
      }
      u && u.focus();
    }
    const y = {
      isActive: () => l("isInitialized") || false,
      refresh: M,
      drive: (a = 0) => {
        r(), v(a);
      },
      setConfig: F,
      setSteps: (a) => {
        X(), F({
          ...s(),
          steps: a
        });
      },
      getConfig: s,
      getState: l,
      getActiveIndex: () => l("activeIndex"),
      isFirstStep: () => l("activeIndex") === 0,
      isLastStep: () => {
        const a = s("steps") || [], p = l("activeIndex");
        return p !== void 0 && p === a.length - 1;
      },
      getActiveStep: () => l("activeStep"),
      getActiveElement: () => l("activeElement"),
      getPreviousElement: () => l("previousElement"),
      getPreviousStep: () => l("previousStep"),
      moveNext: i,
      movePrevious: d,
      moveTo: n,
      hasNextStep: () => {
        const a = s("steps") || [], p = l("activeIndex");
        return p !== void 0 && !!a[p + 1];
      },
      hasPreviousStep: () => {
        const a = s("steps") || [], p = l("activeIndex");
        return p !== void 0 && !!a[p - 1];
      },
      highlight: (a) => {
        r(), j({
          ...a,
          popover: a.popover ? {
            showButtons: [],
            showProgress: false,
            progressText: "",
            ...a.popover
          } : void 0
        });
      },
      destroy: () => {
        g(false);
      }
    };
    return le(y), y;
  }
  const definition = defineContentScript({
    matches: ["https://www.patent.go.kr/*"],
    main() {
      console.log("Patent Guide Assistant - Content Script Loaded");
      const STORAGE_KEY = "patent_guide_state";
      const chatPanelContainer = document.createElement("div");
      chatPanelContainer.id = "patent-chat-panel-container";
      document.body.appendChild(chatPanelContainer);
      const container = document.createElement("div");
      container.id = "patent-guide-container";
      container.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 999999;
    `;
      const shadow = container.attachShadow({ mode: "open" });
      const button = document.createElement("button");
      button.textContent = "💬 가이드 도우미";
      button.style.cssText = `
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
    `;
      const chatPanel = document.createElement("div");
      chatPanel.style.cssText = `
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
    `;
      chatPanel.innerHTML = `
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
    `;
      button.addEventListener("mouseenter", () => {
        button.style.transform = "translateY(-2px)";
        button.style.boxShadow = "0 6px 20px rgba(102, 126, 234, 0.6)";
      });
      button.addEventListener("mouseleave", () => {
        button.style.transform = "translateY(0)";
        button.style.boxShadow = "0 4px 15px rgba(102, 126, 234, 0.4)";
      });
      button.addEventListener("click", () => {
        console.log("Button clicked!");
        chatPanel.style.display = "flex";
        button.style.display = "none";
      });
      const closeBtn = chatPanel.querySelector(".close-btn");
      closeBtn?.addEventListener("click", () => {
        chatPanel.style.display = "none";
        button.style.display = "block";
      });
      const resetBtn = chatPanel.querySelector(".reset-btn");
      resetBtn?.addEventListener("click", () => {
        chrome.storage.local.remove([STORAGE_KEY], () => {
          console.log("Guide state cleared - restarting from beginning");
          location.reload();
        });
      });
      const input = chatPanel.querySelector("input");
      const sendBtn = chatPanel.querySelector(".input-container button");
      const messagesContainer = chatPanel.querySelector(".messages");
      const quickActions = chatPanel.querySelector(".quick-actions");
      const startGuideBtn = chatPanel.querySelector(".start-guide-btn");
      const inputContainer = chatPanel.querySelector(".input-container");
      const sendMessage = async () => {
        const message = input.value.trim();
        if (!message) return;
        const userMessageDiv = document.createElement("div");
        userMessageDiv.className = "message user";
        userMessageDiv.innerHTML = `<div class="message-content">${message}</div>`;
        messagesContainer?.appendChild(userMessageDiv);
        input.value = "";
        sendBtn.disabled = true;
        messagesContainer?.scrollTo({ top: messagesContainer.scrollHeight, behavior: "smooth" });
        const normalizedMessage = message.toLowerCase().trim();
        const isStartCommand = normalizedMessage === "네" || normalizedMessage === "예" || normalizedMessage === "시작" || normalizedMessage === "ㅇㅇ" || normalizedMessage === "ok" || normalizedMessage === "yes" || normalizedMessage.includes("시작");
        if (isStartCommand) {
          const assistantMessageDiv = document.createElement("div");
          assistantMessageDiv.className = "message assistant";
          assistantMessageDiv.innerHTML = `<div class="message-content">좋습니다! 특허 고객 등록 가이드를 시작하겠습니다. 🎯<br><br>화면의 하이라이트를 따라가며 단계별로 진행해주세요!</div>`;
          messagesContainer?.appendChild(assistantMessageDiv);
          messagesContainer?.scrollTo({ top: messagesContainer.scrollHeight, behavior: "smooth" });
          sendBtn.disabled = false;
          chrome.runtime.sendMessage(
            {
              type: "ASK_AI",
              question: message
            },
            (response) => {
              if (response.success) {
                startGuide(response.steps);
              }
            }
          );
        } else {
          chrome.runtime.sendMessage(
            {
              type: "ASK_AI",
              question: message
            },
            (response) => {
              const assistantMessageDiv = document.createElement("div");
              assistantMessageDiv.className = "message assistant";
              assistantMessageDiv.innerHTML = `<div class="message-content">가이드를 시작하겠습니다. 화면을 확인해주세요!</div>`;
              messagesContainer?.appendChild(assistantMessageDiv);
              messagesContainer?.scrollTo({ top: messagesContainer.scrollHeight, behavior: "smooth" });
              sendBtn.disabled = false;
              if (response.success) {
                startGuide(response.steps);
              }
            }
          );
        }
      };
      startGuideBtn?.addEventListener("click", () => {
        const userMessageDiv = document.createElement("div");
        userMessageDiv.className = "message user";
        userMessageDiv.innerHTML = `<div class="message-content">넵! 시작할게요 👍</div>`;
        messagesContainer?.appendChild(userMessageDiv);
        quickActions?.classList.add("hidden");
        inputContainer?.classList.remove("hidden");
        const assistantMessageDiv = document.createElement("div");
        assistantMessageDiv.className = "message assistant";
        assistantMessageDiv.innerHTML = `<div class="message-content">좋습니다! 특허 고객 등록 가이드를 시작하겠습니다. 🎯<br><br>화면의 하이라이트를 따라가며 단계별로 진행해주세요!</div>`;
        messagesContainer?.appendChild(assistantMessageDiv);
        messagesContainer?.scrollTo({ top: messagesContainer.scrollHeight, behavior: "smooth" });
        chrome.runtime.sendMessage(
          {
            type: "ASK_AI",
            question: "시작"
          },
          (response) => {
            if (response.success) {
              startGuide(response.steps);
            }
          }
        );
      });
      sendBtn?.addEventListener("click", sendMessage);
      input?.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          sendMessage();
        }
      });
      shadow.appendChild(button);
      chatPanelContainer.appendChild(chatPanel);
      document.body.appendChild(container);
      chrome.storage.local.get([STORAGE_KEY], (result2) => {
        if (result2[STORAGE_KEY]) {
          const { currentStep } = result2[STORAGE_KEY];
          console.log(`Resuming guide from step ${currentStep + 1}`);
          chatPanel.style.display = "flex";
          button.style.display = "none";
          chrome.runtime.sendMessage(
            { type: "ASK_AI", question: "가이드 재개" },
            (response) => {
              if (response.success) {
                const resumeMessageDiv = document.createElement("div");
                resumeMessageDiv.className = "message assistant";
                resumeMessageDiv.innerHTML = `<div class="message-content">가이드를 계속 진행합니다! (${currentStep + 1}/${response.steps.length}단계)</div>`;
                messagesContainer?.appendChild(resumeMessageDiv);
                startGuide(response.steps, currentStep);
              }
            }
          );
        }
      });
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === "START_GUIDE") {
          startGuide(message.steps);
          sendResponse({ success: true });
        }
      });
      function startGuide(steps, startFromStep = 0) {
        let currentStepIndex = startFromStep;
        let currentDriver = null;
        let clickListener = null;
        const saveProgress = (stepIndex) => {
          chrome.storage.local.set({
            [STORAGE_KEY]: {
              currentStep: stepIndex
            }
          });
        };
        const clearProgress = () => {
          chrome.storage.local.remove([STORAGE_KEY]);
        };
        const moveToNextStep = () => {
          if (currentDriver) {
            currentDriver.destroy();
            currentDriver = null;
          }
          if (clickListener) {
            const currentStep = steps[currentStepIndex];
            const currentElement = document.querySelector(currentStep.selector);
            if (currentElement) {
              currentElement.removeEventListener("click", clickListener);
            }
            clickListener = null;
          }
          currentStepIndex++;
          if (currentStepIndex < steps.length) {
            saveProgress(currentStepIndex);
            setTimeout(() => showStep(currentStepIndex), 300);
          } else {
            clearProgress();
            const completionMessageDiv = document.createElement("div");
            completionMessageDiv.className = "message assistant";
            completionMessageDiv.innerHTML = `<div class="message-content">🎉 가이드를 모두 완료했습니다!</div>`;
            messagesContainer?.appendChild(completionMessageDiv);
            messagesContainer?.scrollTo({ top: messagesContainer.scrollHeight, behavior: "smooth" });
          }
        };
        const showStep = (index, retryCount = 0) => {
          if (index >= steps.length) return;
          const step = steps[index];
          if (step.url && !window.location.href.includes(step.url.split("/").pop() || "")) {
            console.log(`Current page doesn't match step ${index + 1} URL. Expected: ${step.url}, Current: ${window.location.href}`);
            if (retryCount < 10) {
              setTimeout(() => showStep(index, retryCount + 1), 500);
              return;
            } else {
              const errorMessageDiv = document.createElement("div");
              errorMessageDiv.className = "message assistant";
              errorMessageDiv.innerHTML = `<div class="message-content">⚠️ 올바른 페이지로 이동하지 않았습니다.<br><br>예상 페이지: ${step.url}<br>현재 페이지: ${window.location.href}<br><br>페이지를 확인해주세요.</div>`;
              messagesContainer?.appendChild(errorMessageDiv);
              messagesContainer?.scrollTo({ top: messagesContainer.scrollHeight, behavior: "smooth" });
              const skipButtonDiv = document.createElement("div");
              skipButtonDiv.style.cssText = "padding: 0 20px 20px; display: flex; gap: 10px;";
              skipButtonDiv.innerHTML = `
              <button style="flex: 1; background: #ef4444; color: white; border: none; border-radius: 8px; padding: 12px; font-weight: 600; cursor: pointer;">가이드 종료</button>
              <button style="flex: 1; background: #667eea; color: white; border: none; border-radius: 8px; padding: 12px; font-weight: 600; cursor: pointer;">다시 시도</button>
            `;
              const endBtn = skipButtonDiv.querySelector("button:first-child");
              const retryBtn = skipButtonDiv.querySelector("button:last-child");
              endBtn?.addEventListener("click", () => {
                clearProgress();
                skipButtonDiv.remove();
                const endMessageDiv = document.createElement("div");
                endMessageDiv.className = "message assistant";
                endMessageDiv.innerHTML = `<div class="message-content">가이드를 종료했습니다.</div>`;
                messagesContainer?.appendChild(endMessageDiv);
              });
              retryBtn?.addEventListener("click", () => {
                skipButtonDiv.remove();
                showStep(index, 0);
              });
              chatPanel.appendChild(skipButtonDiv);
              return;
            }
          }
          const element = document.querySelector(step.selector);
          if (!element) {
            console.warn(`Element not found: ${step.selector}, retry ${retryCount + 1}/10`);
            if (retryCount < 10) {
              setTimeout(() => showStep(index, retryCount + 1), 500);
              return;
            } else {
              const errorMessageDiv = document.createElement("div");
              errorMessageDiv.className = "message assistant";
              errorMessageDiv.innerHTML = `<div class="message-content">⚠️ 이 페이지에서 다음 단계를 찾을 수 없습니다.<br><br>올바른 페이지로 이동했는지 확인해주세요.<br><br>진행을 계속하려면 아래 버튼을 눌러주세요.</div>`;
              messagesContainer?.appendChild(errorMessageDiv);
              messagesContainer?.scrollTo({ top: messagesContainer.scrollHeight, behavior: "smooth" });
              const skipButtonDiv = document.createElement("div");
              skipButtonDiv.style.cssText = "padding: 0 20px 20px; display: flex; gap: 10px;";
              skipButtonDiv.innerHTML = `
              <button style="flex: 1; background: #ef4444; color: white; border: none; border-radius: 8px; padding: 12px; font-weight: 600; cursor: pointer;">가이드 종료</button>
              <button style="flex: 1; background: #667eea; color: white; border: none; border-radius: 8px; padding: 12px; font-weight: 600; cursor: pointer;">다시 시도</button>
            `;
              const endBtn = skipButtonDiv.querySelector("button:first-child");
              const retryBtn = skipButtonDiv.querySelector("button:last-child");
              endBtn?.addEventListener("click", () => {
                clearProgress();
                skipButtonDiv.remove();
                const endMessageDiv = document.createElement("div");
                endMessageDiv.className = "message assistant";
                endMessageDiv.innerHTML = `<div class="message-content">가이드를 종료했습니다.</div>`;
                messagesContainer?.appendChild(endMessageDiv);
              });
              retryBtn?.addEventListener("click", () => {
                skipButtonDiv.remove();
                showStep(index, 0);
              });
              chatPanel.appendChild(skipButtonDiv);
              return;
            }
          }
          let description = step.description;
          if (step.externalLink) {
            description += `<br><br><a href="${step.externalLink}" target="_blank" style="color: #667eea; font-weight: bold;">🔗 ${step.externalLink}</a>`;
          }
          if (step.autoAdvance !== false) {
            description += `<br><br><small style="color: #9ca3af;">💡 이 요소를 직접 클릭하면 자동으로 다음 단계로 넘어갑니다.</small>`;
            currentDriver = Ae({
              showProgress: true,
              showButtons: ["next", "previous", "close"],
              steps: [{
                element: step.selector,
                popover: {
                  title: step.title,
                  description,
                  side: "left",
                  align: "start",
                  onNextClick: () => {
                    moveToNextStep();
                  },
                  onPrevClick: () => {
                    if (currentDriver) {
                      currentDriver.destroy();
                      currentDriver = null;
                    }
                    if (index > 0) {
                      currentStepIndex = index - 1;
                      saveProgress(currentStepIndex);
                      showStep(currentStepIndex);
                    }
                  },
                  onCloseClick: () => {
                    if (currentDriver) {
                      currentDriver.destroy();
                      currentDriver = null;
                    }
                    clearProgress();
                  }
                }
              }]
            });
            clickListener = (e) => {
              console.log("Element clicked! Moving to next step...");
              const nextStepIndex = currentStepIndex + 1;
              if (nextStepIndex < steps.length) {
                saveProgress(nextStepIndex);
                console.log(`Saved progress: step ${nextStepIndex}`);
              }
              setTimeout(() => {
                moveToNextStep();
              }, 100);
            };
            element.addEventListener("click", clickListener, { capture: true, once: true });
            element.scrollIntoView({ behavior: "smooth", block: "center" });
            currentDriver.drive();
          } else {
            const stepMessageDiv = document.createElement("div");
            stepMessageDiv.className = "message assistant";
            stepMessageDiv.innerHTML = `<div class="message-content"><strong>${step.title}</strong><br><br>${step.description}${step.externalLink ? `<br><br><a href="${step.externalLink}" target="_blank" style="color: #667eea; font-weight: bold;">🔗 ${step.externalLink}</a>` : ""}</div>`;
            messagesContainer?.appendChild(stepMessageDiv);
            const completeButtonDiv = document.createElement("div");
            completeButtonDiv.style.cssText = "padding: 0 20px 20px; display: flex; gap: 10px;";
            completeButtonDiv.innerHTML = `
            <button style="flex: 1; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; border: none; border-radius: 12px; padding: 14px 28px; font-size: 16px; font-weight: 600; cursor: pointer; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">✅ 완료했어요!</button>
          `;
            const completeBtn = completeButtonDiv.querySelector("button");
            completeBtn?.addEventListener("click", () => {
              completeButtonDiv.remove();
              const completedMessageDiv = document.createElement("div");
              completedMessageDiv.className = "message user";
              completedMessageDiv.innerHTML = `<div class="message-content">완료했어요!</div>`;
              messagesContainer?.appendChild(completedMessageDiv);
              moveToNextStep();
            });
            chatPanel.appendChild(completeButtonDiv);
            messagesContainer?.scrollTo({ top: messagesContainer.scrollHeight, behavior: "smooth" });
          }
          setTimeout(() => {
            const highlightedElement = document.querySelector(".driver-active-element");
            if (highlightedElement) {
              highlightedElement.style.pointerEvents = "auto";
              highlightedElement.style.cursor = "pointer";
            }
          }, 100);
        };
        showStep(startFromStep);
      }
    }
  });
  const browser$1 = globalThis.browser?.runtime?.id ? globalThis.browser : globalThis.chrome;
  const browser = browser$1;
  function print$1(method, ...args) {
    if (typeof args[0] === "string") {
      const message = args.shift();
      method(`[wxt] ${message}`, ...args);
    } else {
      method("[wxt]", ...args);
    }
  }
  const logger$1 = {
    debug: (...args) => print$1(console.debug, ...args),
    log: (...args) => print$1(console.log, ...args),
    warn: (...args) => print$1(console.warn, ...args),
    error: (...args) => print$1(console.error, ...args)
  };
  class WxtLocationChangeEvent extends Event {
    constructor(newUrl, oldUrl) {
      super(WxtLocationChangeEvent.EVENT_NAME, {});
      this.newUrl = newUrl;
      this.oldUrl = oldUrl;
    }
    static EVENT_NAME = getUniqueEventName("wxt:locationchange");
  }
  function getUniqueEventName(eventName) {
    return `${browser?.runtime?.id}:${"content"}:${eventName}`;
  }
  function createLocationWatcher(ctx) {
    let interval;
    let oldUrl;
    return {
      /**
       * Ensure the location watcher is actively looking for URL changes. If it's already watching,
       * this is a noop.
       */
      run() {
        if (interval != null) return;
        oldUrl = new URL(location.href);
        interval = ctx.setInterval(() => {
          let newUrl = new URL(location.href);
          if (newUrl.href !== oldUrl.href) {
            window.dispatchEvent(new WxtLocationChangeEvent(newUrl, oldUrl));
            oldUrl = newUrl;
          }
        }, 1e3);
      }
    };
  }
  class ContentScriptContext {
    constructor(contentScriptName, options) {
      this.contentScriptName = contentScriptName;
      this.options = options;
      this.abortController = new AbortController();
      if (this.isTopFrame) {
        this.listenForNewerScripts({ ignoreFirstEvent: true });
        this.stopOldScripts();
      } else {
        this.listenForNewerScripts();
      }
    }
    static SCRIPT_STARTED_MESSAGE_TYPE = getUniqueEventName(
      "wxt:content-script-started"
    );
    isTopFrame = window.self === window.top;
    abortController;
    locationWatcher = createLocationWatcher(this);
    receivedMessageIds = /* @__PURE__ */ new Set();
    get signal() {
      return this.abortController.signal;
    }
    abort(reason) {
      return this.abortController.abort(reason);
    }
    get isInvalid() {
      if (browser.runtime.id == null) {
        this.notifyInvalidated();
      }
      return this.signal.aborted;
    }
    get isValid() {
      return !this.isInvalid;
    }
    /**
     * Add a listener that is called when the content script's context is invalidated.
     *
     * @returns A function to remove the listener.
     *
     * @example
     * browser.runtime.onMessage.addListener(cb);
     * const removeInvalidatedListener = ctx.onInvalidated(() => {
     *   browser.runtime.onMessage.removeListener(cb);
     * })
     * // ...
     * removeInvalidatedListener();
     */
    onInvalidated(cb) {
      this.signal.addEventListener("abort", cb);
      return () => this.signal.removeEventListener("abort", cb);
    }
    /**
     * Return a promise that never resolves. Useful if you have an async function that shouldn't run
     * after the context is expired.
     *
     * @example
     * const getValueFromStorage = async () => {
     *   if (ctx.isInvalid) return ctx.block();
     *
     *   // ...
     * }
     */
    block() {
      return new Promise(() => {
      });
    }
    /**
     * Wrapper around `window.setInterval` that automatically clears the interval when invalidated.
     *
     * Intervals can be cleared by calling the normal `clearInterval` function.
     */
    setInterval(handler, timeout) {
      const id = setInterval(() => {
        if (this.isValid) handler();
      }, timeout);
      this.onInvalidated(() => clearInterval(id));
      return id;
    }
    /**
     * Wrapper around `window.setTimeout` that automatically clears the interval when invalidated.
     *
     * Timeouts can be cleared by calling the normal `setTimeout` function.
     */
    setTimeout(handler, timeout) {
      const id = setTimeout(() => {
        if (this.isValid) handler();
      }, timeout);
      this.onInvalidated(() => clearTimeout(id));
      return id;
    }
    /**
     * Wrapper around `window.requestAnimationFrame` that automatically cancels the request when
     * invalidated.
     *
     * Callbacks can be canceled by calling the normal `cancelAnimationFrame` function.
     */
    requestAnimationFrame(callback) {
      const id = requestAnimationFrame((...args) => {
        if (this.isValid) callback(...args);
      });
      this.onInvalidated(() => cancelAnimationFrame(id));
      return id;
    }
    /**
     * Wrapper around `window.requestIdleCallback` that automatically cancels the request when
     * invalidated.
     *
     * Callbacks can be canceled by calling the normal `cancelIdleCallback` function.
     */
    requestIdleCallback(callback, options) {
      const id = requestIdleCallback((...args) => {
        if (!this.signal.aborted) callback(...args);
      }, options);
      this.onInvalidated(() => cancelIdleCallback(id));
      return id;
    }
    addEventListener(target, type, handler, options) {
      if (type === "wxt:locationchange") {
        if (this.isValid) this.locationWatcher.run();
      }
      target.addEventListener?.(
        type.startsWith("wxt:") ? getUniqueEventName(type) : type,
        handler,
        {
          ...options,
          signal: this.signal
        }
      );
    }
    /**
     * @internal
     * Abort the abort controller and execute all `onInvalidated` listeners.
     */
    notifyInvalidated() {
      this.abort("Content script context invalidated");
      logger$1.debug(
        `Content script "${this.contentScriptName}" context invalidated`
      );
    }
    stopOldScripts() {
      window.postMessage(
        {
          type: ContentScriptContext.SCRIPT_STARTED_MESSAGE_TYPE,
          contentScriptName: this.contentScriptName,
          messageId: Math.random().toString(36).slice(2)
        },
        "*"
      );
    }
    verifyScriptStartedEvent(event) {
      const isScriptStartedEvent = event.data?.type === ContentScriptContext.SCRIPT_STARTED_MESSAGE_TYPE;
      const isSameContentScript = event.data?.contentScriptName === this.contentScriptName;
      const isNotDuplicate = !this.receivedMessageIds.has(event.data?.messageId);
      return isScriptStartedEvent && isSameContentScript && isNotDuplicate;
    }
    listenForNewerScripts(options) {
      let isFirst = true;
      const cb = (event) => {
        if (this.verifyScriptStartedEvent(event)) {
          this.receivedMessageIds.add(event.data.messageId);
          const wasFirst = isFirst;
          isFirst = false;
          if (wasFirst && options?.ignoreFirstEvent) return;
          this.notifyInvalidated();
        }
      };
      addEventListener("message", cb);
      this.onInvalidated(() => removeEventListener("message", cb));
    }
  }
  function initPlugins() {
  }
  function print(method, ...args) {
    if (typeof args[0] === "string") {
      const message = args.shift();
      method(`[wxt] ${message}`, ...args);
    } else {
      method("[wxt]", ...args);
    }
  }
  const logger = {
    debug: (...args) => print(console.debug, ...args),
    log: (...args) => print(console.log, ...args),
    warn: (...args) => print(console.warn, ...args),
    error: (...args) => print(console.error, ...args)
  };
  const result = (async () => {
    try {
      initPlugins();
      const { main, ...options } = definition;
      const ctx = new ContentScriptContext("content", options);
      return await main(ctx);
    } catch (err) {
      logger.error(
        `The content script "${"content"}" crashed on startup!`,
        err
      );
      throw err;
    }
  })();
  return result;
})();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGVudC5qcyIsInNvdXJjZXMiOlsiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3d4dC9kaXN0L3V0aWxzL2RlZmluZS1jb250ZW50LXNjcmlwdC5tanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvZHJpdmVyLmpzL2Rpc3QvZHJpdmVyLmpzLm1qcyIsIi4uLy4uLy4uL2VudHJ5cG9pbnRzL2NvbnRlbnQudHMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvQHd4dC1kZXYvYnJvd3Nlci9zcmMvaW5kZXgubWpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3d4dC9kaXN0L2Jyb3dzZXIubWpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3d4dC9kaXN0L3V0aWxzL2ludGVybmFsL2xvZ2dlci5tanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvd3h0L2Rpc3QvdXRpbHMvaW50ZXJuYWwvY3VzdG9tLWV2ZW50cy5tanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvd3h0L2Rpc3QvdXRpbHMvaW50ZXJuYWwvbG9jYXRpb24td2F0Y2hlci5tanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvd3h0L2Rpc3QvdXRpbHMvY29udGVudC1zY3JpcHQtY29udGV4dC5tanMiXSwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0IGZ1bmN0aW9uIGRlZmluZUNvbnRlbnRTY3JpcHQoZGVmaW5pdGlvbikge1xuICByZXR1cm4gZGVmaW5pdGlvbjtcbn1cbiIsImxldCB6ID0ge30sIEo7XG5mdW5jdGlvbiBGKGUgPSB7fSkge1xuICB6ID0ge1xuICAgIGFuaW1hdGU6ICEwLFxuICAgIGFsbG93Q2xvc2U6ICEwLFxuICAgIG92ZXJsYXlDbGlja0JlaGF2aW9yOiBcImNsb3NlXCIsXG4gICAgb3ZlcmxheU9wYWNpdHk6IDAuNyxcbiAgICBzbW9vdGhTY3JvbGw6ICExLFxuICAgIGRpc2FibGVBY3RpdmVJbnRlcmFjdGlvbjogITEsXG4gICAgc2hvd1Byb2dyZXNzOiAhMSxcbiAgICBzdGFnZVBhZGRpbmc6IDEwLFxuICAgIHN0YWdlUmFkaXVzOiA1LFxuICAgIHBvcG92ZXJPZmZzZXQ6IDEwLFxuICAgIHNob3dCdXR0b25zOiBbXCJuZXh0XCIsIFwicHJldmlvdXNcIiwgXCJjbG9zZVwiXSxcbiAgICBkaXNhYmxlQnV0dG9uczogW10sXG4gICAgb3ZlcmxheUNvbG9yOiBcIiMwMDBcIixcbiAgICAuLi5lXG4gIH07XG59XG5mdW5jdGlvbiBzKGUpIHtcbiAgcmV0dXJuIGUgPyB6W2VdIDogejtcbn1cbmZ1bmN0aW9uIGxlKGUpIHtcbiAgSiA9IGU7XG59XG5mdW5jdGlvbiBfKCkge1xuICByZXR1cm4gSjtcbn1cbmxldCBJID0ge307XG5mdW5jdGlvbiBOKGUsIG8pIHtcbiAgSVtlXSA9IG87XG59XG5mdW5jdGlvbiBMKGUpIHtcbiAgdmFyIG87XG4gIChvID0gSVtlXSkgPT0gbnVsbCB8fCBvLmNhbGwoSSk7XG59XG5mdW5jdGlvbiBkZSgpIHtcbiAgSSA9IHt9O1xufVxuZnVuY3Rpb24gTyhlLCBvLCB0LCBpKSB7XG4gIHJldHVybiAoZSAvPSBpIC8gMikgPCAxID8gdCAvIDIgKiBlICogZSArIG8gOiAtdCAvIDIgKiAoLS1lICogKGUgLSAyKSAtIDEpICsgbztcbn1cbmZ1bmN0aW9uIFUoZSkge1xuICBjb25zdCBvID0gJ2FbaHJlZl06bm90KFtkaXNhYmxlZF0pLCBidXR0b246bm90KFtkaXNhYmxlZF0pLCB0ZXh0YXJlYTpub3QoW2Rpc2FibGVkXSksIGlucHV0W3R5cGU9XCJ0ZXh0XCJdOm5vdChbZGlzYWJsZWRdKSwgaW5wdXRbdHlwZT1cInJhZGlvXCJdOm5vdChbZGlzYWJsZWRdKSwgaW5wdXRbdHlwZT1cImNoZWNrYm94XCJdOm5vdChbZGlzYWJsZWRdKSwgc2VsZWN0Om5vdChbZGlzYWJsZWRdKSc7XG4gIHJldHVybiBlLmZsYXRNYXAoKHQpID0+IHtcbiAgICBjb25zdCBpID0gdC5tYXRjaGVzKG8pLCBkID0gQXJyYXkuZnJvbSh0LnF1ZXJ5U2VsZWN0b3JBbGwobykpO1xuICAgIHJldHVybiBbLi4uaSA/IFt0XSA6IFtdLCAuLi5kXTtcbiAgfSkuZmlsdGVyKCh0KSA9PiBnZXRDb21wdXRlZFN0eWxlKHQpLnBvaW50ZXJFdmVudHMgIT09IFwibm9uZVwiICYmIHZlKHQpKTtcbn1cbmZ1bmN0aW9uIGVlKGUpIHtcbiAgaWYgKCFlIHx8IHVlKGUpKVxuICAgIHJldHVybjtcbiAgY29uc3QgbyA9IHMoXCJzbW9vdGhTY3JvbGxcIiksIHQgPSBlLm9mZnNldEhlaWdodCA+IHdpbmRvdy5pbm5lckhlaWdodDtcbiAgZS5zY3JvbGxJbnRvVmlldyh7XG4gICAgLy8gUmVtb3ZpbmcgdGhlIHNtb290aCBzY3JvbGxpbmcgZm9yIGVsZW1lbnRzIHdoaWNoIGV4aXN0IGluc2lkZSB0aGUgc2Nyb2xsYWJsZSBwYXJlbnRcbiAgICAvLyBUaGlzIHdhcyBjYXVzaW5nIHRoZSBoaWdobGlnaHQgdG8gbm90IHByb3Blcmx5IHJlbmRlclxuICAgIGJlaGF2aW9yOiAhbyB8fCBwZShlKSA/IFwiYXV0b1wiIDogXCJzbW9vdGhcIixcbiAgICBpbmxpbmU6IFwiY2VudGVyXCIsXG4gICAgYmxvY2s6IHQgPyBcInN0YXJ0XCIgOiBcImNlbnRlclwiXG4gIH0pO1xufVxuZnVuY3Rpb24gcGUoZSkge1xuICBpZiAoIWUgfHwgIWUucGFyZW50RWxlbWVudClcbiAgICByZXR1cm47XG4gIGNvbnN0IG8gPSBlLnBhcmVudEVsZW1lbnQ7XG4gIHJldHVybiBvLnNjcm9sbEhlaWdodCA+IG8uY2xpZW50SGVpZ2h0O1xufVxuZnVuY3Rpb24gdWUoZSkge1xuICBjb25zdCBvID0gZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgcmV0dXJuIG8udG9wID49IDAgJiYgby5sZWZ0ID49IDAgJiYgby5ib3R0b20gPD0gKHdpbmRvdy5pbm5lckhlaWdodCB8fCBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50SGVpZ2h0KSAmJiBvLnJpZ2h0IDw9ICh3aW5kb3cuaW5uZXJXaWR0aCB8fCBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50V2lkdGgpO1xufVxuZnVuY3Rpb24gdmUoZSkge1xuICByZXR1cm4gISEoZS5vZmZzZXRXaWR0aCB8fCBlLm9mZnNldEhlaWdodCB8fCBlLmdldENsaWVudFJlY3RzKCkubGVuZ3RoKTtcbn1cbmxldCBEID0ge307XG5mdW5jdGlvbiBrKGUsIG8pIHtcbiAgRFtlXSA9IG87XG59XG5mdW5jdGlvbiBsKGUpIHtcbiAgcmV0dXJuIGUgPyBEW2VdIDogRDtcbn1cbmZ1bmN0aW9uIFgoKSB7XG4gIEQgPSB7fTtcbn1cbmZ1bmN0aW9uIGZlKGUsIG8sIHQsIGkpIHtcbiAgbGV0IGQgPSBsKFwiX19hY3RpdmVTdGFnZVBvc2l0aW9uXCIpO1xuICBjb25zdCBuID0gZCB8fCB0LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLCBmID0gaS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKSwgdyA9IE8oZSwgbi54LCBmLnggLSBuLngsIG8pLCByID0gTyhlLCBuLnksIGYueSAtIG4ueSwgbyksIHYgPSBPKGUsIG4ud2lkdGgsIGYud2lkdGggLSBuLndpZHRoLCBvKSwgZyA9IE8oZSwgbi5oZWlnaHQsIGYuaGVpZ2h0IC0gbi5oZWlnaHQsIG8pO1xuICBkID0ge1xuICAgIHg6IHcsXG4gICAgeTogcixcbiAgICB3aWR0aDogdixcbiAgICBoZWlnaHQ6IGdcbiAgfSwgb2UoZCksIGsoXCJfX2FjdGl2ZVN0YWdlUG9zaXRpb25cIiwgZCk7XG59XG5mdW5jdGlvbiB0ZShlKSB7XG4gIGlmICghZSlcbiAgICByZXR1cm47XG4gIGNvbnN0IG8gPSBlLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLCB0ID0ge1xuICAgIHg6IG8ueCxcbiAgICB5OiBvLnksXG4gICAgd2lkdGg6IG8ud2lkdGgsXG4gICAgaGVpZ2h0OiBvLmhlaWdodFxuICB9O1xuICBrKFwiX19hY3RpdmVTdGFnZVBvc2l0aW9uXCIsIHQpLCBvZSh0KTtcbn1cbmZ1bmN0aW9uIGhlKCkge1xuICBjb25zdCBlID0gbChcIl9fYWN0aXZlU3RhZ2VQb3NpdGlvblwiKSwgbyA9IGwoXCJfX292ZXJsYXlTdmdcIik7XG4gIGlmICghZSlcbiAgICByZXR1cm47XG4gIGlmICghbykge1xuICAgIGNvbnNvbGUud2FybihcIk5vIHN0YWdlIHN2ZyBmb3VuZC5cIik7XG4gICAgcmV0dXJuO1xuICB9XG4gIGNvbnN0IHQgPSB3aW5kb3cuaW5uZXJXaWR0aCwgaSA9IHdpbmRvdy5pbm5lckhlaWdodDtcbiAgby5zZXRBdHRyaWJ1dGUoXCJ2aWV3Qm94XCIsIGAwIDAgJHt0fSAke2l9YCk7XG59XG5mdW5jdGlvbiBnZShlKSB7XG4gIGNvbnN0IG8gPSB3ZShlKTtcbiAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChvKSwgcmUobywgKHQpID0+IHtcbiAgICB0LnRhcmdldC50YWdOYW1lID09PSBcInBhdGhcIiAmJiBMKFwib3ZlcmxheUNsaWNrXCIpO1xuICB9KSwgayhcIl9fb3ZlcmxheVN2Z1wiLCBvKTtcbn1cbmZ1bmN0aW9uIG9lKGUpIHtcbiAgY29uc3QgbyA9IGwoXCJfX292ZXJsYXlTdmdcIik7XG4gIGlmICghbykge1xuICAgIGdlKGUpO1xuICAgIHJldHVybjtcbiAgfVxuICBjb25zdCB0ID0gby5maXJzdEVsZW1lbnRDaGlsZDtcbiAgaWYgKCh0ID09IG51bGwgPyB2b2lkIDAgOiB0LnRhZ05hbWUpICE9PSBcInBhdGhcIilcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJubyBwYXRoIGVsZW1lbnQgZm91bmQgaW4gc3RhZ2Ugc3ZnXCIpO1xuICB0LnNldEF0dHJpYnV0ZShcImRcIiwgaWUoZSkpO1xufVxuZnVuY3Rpb24gd2UoZSkge1xuICBjb25zdCBvID0gd2luZG93LmlubmVyV2lkdGgsIHQgPSB3aW5kb3cuaW5uZXJIZWlnaHQsIGkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoXCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiLCBcInN2Z1wiKTtcbiAgaS5jbGFzc0xpc3QuYWRkKFwiZHJpdmVyLW92ZXJsYXlcIiwgXCJkcml2ZXItb3ZlcmxheS1hbmltYXRlZFwiKSwgaS5zZXRBdHRyaWJ1dGUoXCJ2aWV3Qm94XCIsIGAwIDAgJHtvfSAke3R9YCksIGkuc2V0QXR0cmlidXRlKFwieG1sU3BhY2VcIiwgXCJwcmVzZXJ2ZVwiKSwgaS5zZXRBdHRyaWJ1dGUoXCJ4bWxuc1hsaW5rXCIsIFwiaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGlua1wiKSwgaS5zZXRBdHRyaWJ1dGUoXCJ2ZXJzaW9uXCIsIFwiMS4xXCIpLCBpLnNldEF0dHJpYnV0ZShcInByZXNlcnZlQXNwZWN0UmF0aW9cIiwgXCJ4TWluWU1pbiBzbGljZVwiKSwgaS5zdHlsZS5maWxsUnVsZSA9IFwiZXZlbm9kZFwiLCBpLnN0eWxlLmNsaXBSdWxlID0gXCJldmVub2RkXCIsIGkuc3R5bGUuc3Ryb2tlTGluZWpvaW4gPSBcInJvdW5kXCIsIGkuc3R5bGUuc3Ryb2tlTWl0ZXJsaW1pdCA9IFwiMlwiLCBpLnN0eWxlLnpJbmRleCA9IFwiMTAwMDBcIiwgaS5zdHlsZS5wb3NpdGlvbiA9IFwiZml4ZWRcIiwgaS5zdHlsZS50b3AgPSBcIjBcIiwgaS5zdHlsZS5sZWZ0ID0gXCIwXCIsIGkuc3R5bGUud2lkdGggPSBcIjEwMCVcIiwgaS5zdHlsZS5oZWlnaHQgPSBcIjEwMCVcIjtcbiAgY29uc3QgZCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyhcImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIsIFwicGF0aFwiKTtcbiAgcmV0dXJuIGQuc2V0QXR0cmlidXRlKFwiZFwiLCBpZShlKSksIGQuc3R5bGUuZmlsbCA9IHMoXCJvdmVybGF5Q29sb3JcIikgfHwgXCJyZ2IoMCwwLDApXCIsIGQuc3R5bGUub3BhY2l0eSA9IGAke3MoXCJvdmVybGF5T3BhY2l0eVwiKX1gLCBkLnN0eWxlLnBvaW50ZXJFdmVudHMgPSBcImF1dG9cIiwgZC5zdHlsZS5jdXJzb3IgPSBcImF1dG9cIiwgaS5hcHBlbmRDaGlsZChkKSwgaTtcbn1cbmZ1bmN0aW9uIGllKGUpIHtcbiAgY29uc3QgbyA9IHdpbmRvdy5pbm5lcldpZHRoLCB0ID0gd2luZG93LmlubmVySGVpZ2h0LCBpID0gcyhcInN0YWdlUGFkZGluZ1wiKSB8fCAwLCBkID0gcyhcInN0YWdlUmFkaXVzXCIpIHx8IDAsIG4gPSBlLndpZHRoICsgaSAqIDIsIGYgPSBlLmhlaWdodCArIGkgKiAyLCB3ID0gTWF0aC5taW4oZCwgbiAvIDIsIGYgLyAyKSwgciA9IE1hdGguZmxvb3IoTWF0aC5tYXgodywgMCkpLCB2ID0gZS54IC0gaSArIHIsIGcgPSBlLnkgLSBpLCB5ID0gbiAtIHIgKiAyLCBhID0gZiAtIHIgKiAyO1xuICByZXR1cm4gYE0ke299LDBMMCwwTDAsJHt0fUwke299LCR7dH1MJHtvfSwwWlxuICAgIE0ke3Z9LCR7Z30gaCR7eX0gYSR7cn0sJHtyfSAwIDAgMSAke3J9LCR7cn0gdiR7YX0gYSR7cn0sJHtyfSAwIDAgMSAtJHtyfSwke3J9IGgtJHt5fSBhJHtyfSwke3J9IDAgMCAxIC0ke3J9LC0ke3J9IHYtJHthfSBhJHtyfSwke3J9IDAgMCAxICR7cn0sLSR7cn0gemA7XG59XG5mdW5jdGlvbiBtZSgpIHtcbiAgY29uc3QgZSA9IGwoXCJfX292ZXJsYXlTdmdcIik7XG4gIGUgJiYgZS5yZW1vdmUoKTtcbn1cbmZ1bmN0aW9uIHllKCkge1xuICBjb25zdCBlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJkcml2ZXItZHVtbXktZWxlbWVudFwiKTtcbiAgaWYgKGUpXG4gICAgcmV0dXJuIGU7XG4gIGxldCBvID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgcmV0dXJuIG8uaWQgPSBcImRyaXZlci1kdW1teS1lbGVtZW50XCIsIG8uc3R5bGUud2lkdGggPSBcIjBcIiwgby5zdHlsZS5oZWlnaHQgPSBcIjBcIiwgby5zdHlsZS5wb2ludGVyRXZlbnRzID0gXCJub25lXCIsIG8uc3R5bGUub3BhY2l0eSA9IFwiMFwiLCBvLnN0eWxlLnBvc2l0aW9uID0gXCJmaXhlZFwiLCBvLnN0eWxlLnRvcCA9IFwiNTAlXCIsIG8uc3R5bGUubGVmdCA9IFwiNTAlXCIsIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQobyksIG87XG59XG5mdW5jdGlvbiBqKGUpIHtcbiAgY29uc3QgeyBlbGVtZW50OiBvIH0gPSBlO1xuICBsZXQgdCA9IHR5cGVvZiBvID09IFwiZnVuY3Rpb25cIiA/IG8oKSA6IHR5cGVvZiBvID09IFwic3RyaW5nXCIgPyBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKG8pIDogbztcbiAgdCB8fCAodCA9IHllKCkpLCBiZSh0LCBlKTtcbn1cbmZ1bmN0aW9uIHhlKCkge1xuICBjb25zdCBlID0gbChcIl9fYWN0aXZlRWxlbWVudFwiKSwgbyA9IGwoXCJfX2FjdGl2ZVN0ZXBcIik7XG4gIGUgJiYgKHRlKGUpLCBoZSgpLCBhZShlLCBvKSk7XG59XG5mdW5jdGlvbiBiZShlLCBvKSB7XG4gIHZhciBDO1xuICBjb25zdCBpID0gRGF0ZS5ub3coKSwgZCA9IGwoXCJfX2FjdGl2ZVN0ZXBcIiksIG4gPSBsKFwiX19hY3RpdmVFbGVtZW50XCIpIHx8IGUsIGYgPSAhbiB8fCBuID09PSBlLCB3ID0gZS5pZCA9PT0gXCJkcml2ZXItZHVtbXktZWxlbWVudFwiLCByID0gbi5pZCA9PT0gXCJkcml2ZXItZHVtbXktZWxlbWVudFwiLCB2ID0gcyhcImFuaW1hdGVcIiksIGcgPSBvLm9uSGlnaGxpZ2h0U3RhcnRlZCB8fCBzKFwib25IaWdobGlnaHRTdGFydGVkXCIpLCB5ID0gKG8gPT0gbnVsbCA/IHZvaWQgMCA6IG8ub25IaWdobGlnaHRlZCkgfHwgcyhcIm9uSGlnaGxpZ2h0ZWRcIiksIGEgPSAoZCA9PSBudWxsID8gdm9pZCAwIDogZC5vbkRlc2VsZWN0ZWQpIHx8IHMoXCJvbkRlc2VsZWN0ZWRcIiksIHAgPSBzKCksIGMgPSBsKCk7XG4gICFmICYmIGEgJiYgYShyID8gdm9pZCAwIDogbiwgZCwge1xuICAgIGNvbmZpZzogcCxcbiAgICBzdGF0ZTogYyxcbiAgICBkcml2ZXI6IF8oKVxuICB9KSwgZyAmJiBnKHcgPyB2b2lkIDAgOiBlLCBvLCB7XG4gICAgY29uZmlnOiBwLFxuICAgIHN0YXRlOiBjLFxuICAgIGRyaXZlcjogXygpXG4gIH0pO1xuICBjb25zdCB1ID0gIWYgJiYgdjtcbiAgbGV0IGggPSAhMTtcbiAgU2UoKSwgayhcInByZXZpb3VzU3RlcFwiLCBkKSwgayhcInByZXZpb3VzRWxlbWVudFwiLCBuKSwgayhcImFjdGl2ZVN0ZXBcIiwgbyksIGsoXCJhY3RpdmVFbGVtZW50XCIsIGUpO1xuICBjb25zdCBtID0gKCkgPT4ge1xuICAgIGlmIChsKFwiX190cmFuc2l0aW9uQ2FsbGJhY2tcIikgIT09IG0pXG4gICAgICByZXR1cm47XG4gICAgY29uc3QgYiA9IERhdGUubm93KCkgLSBpLCBFID0gNDAwIC0gYiA8PSA0MDAgLyAyO1xuICAgIG8ucG9wb3ZlciAmJiBFICYmICFoICYmIHUgJiYgKFEoZSwgbyksIGggPSAhMCksIHMoXCJhbmltYXRlXCIpICYmIGIgPCA0MDAgPyBmZShiLCA0MDAsIG4sIGUpIDogKHRlKGUpLCB5ICYmIHkodyA/IHZvaWQgMCA6IGUsIG8sIHtcbiAgICAgIGNvbmZpZzogcygpLFxuICAgICAgc3RhdGU6IGwoKSxcbiAgICAgIGRyaXZlcjogXygpXG4gICAgfSksIGsoXCJfX3RyYW5zaXRpb25DYWxsYmFja1wiLCB2b2lkIDApLCBrKFwiX19wcmV2aW91c1N0ZXBcIiwgZCksIGsoXCJfX3ByZXZpb3VzRWxlbWVudFwiLCBuKSwgayhcIl9fYWN0aXZlU3RlcFwiLCBvKSwgayhcIl9fYWN0aXZlRWxlbWVudFwiLCBlKSksIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUobSk7XG4gIH07XG4gIGsoXCJfX3RyYW5zaXRpb25DYWxsYmFja1wiLCBtKSwgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZShtKSwgZWUoZSksICF1ICYmIG8ucG9wb3ZlciAmJiBRKGUsIG8pLCBuLmNsYXNzTGlzdC5yZW1vdmUoXCJkcml2ZXItYWN0aXZlLWVsZW1lbnRcIiwgXCJkcml2ZXItbm8taW50ZXJhY3Rpb25cIiksIG4ucmVtb3ZlQXR0cmlidXRlKFwiYXJpYS1oYXNwb3B1cFwiKSwgbi5yZW1vdmVBdHRyaWJ1dGUoXCJhcmlhLWV4cGFuZGVkXCIpLCBuLnJlbW92ZUF0dHJpYnV0ZShcImFyaWEtY29udHJvbHNcIiksICgoQyA9IG8uZGlzYWJsZUFjdGl2ZUludGVyYWN0aW9uKSAhPSBudWxsID8gQyA6IHMoXCJkaXNhYmxlQWN0aXZlSW50ZXJhY3Rpb25cIikpICYmIGUuY2xhc3NMaXN0LmFkZChcImRyaXZlci1uby1pbnRlcmFjdGlvblwiKSwgZS5jbGFzc0xpc3QuYWRkKFwiZHJpdmVyLWFjdGl2ZS1lbGVtZW50XCIpLCBlLnNldEF0dHJpYnV0ZShcImFyaWEtaGFzcG9wdXBcIiwgXCJkaWFsb2dcIiksIGUuc2V0QXR0cmlidXRlKFwiYXJpYS1leHBhbmRlZFwiLCBcInRydWVcIiksIGUuc2V0QXR0cmlidXRlKFwiYXJpYS1jb250cm9sc1wiLCBcImRyaXZlci1wb3BvdmVyLWNvbnRlbnRcIik7XG59XG5mdW5jdGlvbiBDZSgpIHtcbiAgdmFyIGU7XG4gIChlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJkcml2ZXItZHVtbXktZWxlbWVudFwiKSkgPT0gbnVsbCB8fCBlLnJlbW92ZSgpLCBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKFwiLmRyaXZlci1hY3RpdmUtZWxlbWVudFwiKS5mb3JFYWNoKChvKSA9PiB7XG4gICAgby5jbGFzc0xpc3QucmVtb3ZlKFwiZHJpdmVyLWFjdGl2ZS1lbGVtZW50XCIsIFwiZHJpdmVyLW5vLWludGVyYWN0aW9uXCIpLCBvLnJlbW92ZUF0dHJpYnV0ZShcImFyaWEtaGFzcG9wdXBcIiksIG8ucmVtb3ZlQXR0cmlidXRlKFwiYXJpYS1leHBhbmRlZFwiKSwgby5yZW1vdmVBdHRyaWJ1dGUoXCJhcmlhLWNvbnRyb2xzXCIpO1xuICB9KTtcbn1cbmZ1bmN0aW9uIE0oKSB7XG4gIGNvbnN0IGUgPSBsKFwiX19yZXNpemVUaW1lb3V0XCIpO1xuICBlICYmIHdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZShlKSwgayhcIl9fcmVzaXplVGltZW91dFwiLCB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKHhlKSk7XG59XG5mdW5jdGlvbiBQZShlKSB7XG4gIHZhciByO1xuICBpZiAoIWwoXCJpc0luaXRpYWxpemVkXCIpIHx8ICEoZS5rZXkgPT09IFwiVGFiXCIgfHwgZS5rZXlDb2RlID09PSA5KSlcbiAgICByZXR1cm47XG4gIGNvbnN0IGkgPSBsKFwiX19hY3RpdmVFbGVtZW50XCIpLCBkID0gKHIgPSBsKFwicG9wb3ZlclwiKSkgPT0gbnVsbCA/IHZvaWQgMCA6IHIud3JhcHBlciwgbiA9IFUoW1xuICAgIC4uLmQgPyBbZF0gOiBbXSxcbiAgICAuLi5pID8gW2ldIDogW11cbiAgXSksIGYgPSBuWzBdLCB3ID0gbltuLmxlbmd0aCAtIDFdO1xuICBpZiAoZS5wcmV2ZW50RGVmYXVsdCgpLCBlLnNoaWZ0S2V5KSB7XG4gICAgY29uc3QgdiA9IG5bbi5pbmRleE9mKGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQpIC0gMV0gfHwgdztcbiAgICB2ID09IG51bGwgfHwgdi5mb2N1cygpO1xuICB9IGVsc2Uge1xuICAgIGNvbnN0IHYgPSBuW24uaW5kZXhPZihkb2N1bWVudC5hY3RpdmVFbGVtZW50KSArIDFdIHx8IGY7XG4gICAgdiA9PSBudWxsIHx8IHYuZm9jdXMoKTtcbiAgfVxufVxuZnVuY3Rpb24gbmUoZSkge1xuICB2YXIgdDtcbiAgKCh0ID0gcyhcImFsbG93S2V5Ym9hcmRDb250cm9sXCIpKSA9PSBudWxsIHx8IHQpICYmIChlLmtleSA9PT0gXCJFc2NhcGVcIiA/IEwoXCJlc2NhcGVQcmVzc1wiKSA6IGUua2V5ID09PSBcIkFycm93UmlnaHRcIiA/IEwoXCJhcnJvd1JpZ2h0UHJlc3NcIikgOiBlLmtleSA9PT0gXCJBcnJvd0xlZnRcIiAmJiBMKFwiYXJyb3dMZWZ0UHJlc3NcIikpO1xufVxuZnVuY3Rpb24gcmUoZSwgbywgdCkge1xuICBjb25zdCBpID0gKG4sIGYpID0+IHtcbiAgICBjb25zdCB3ID0gbi50YXJnZXQ7XG4gICAgZS5jb250YWlucyh3KSAmJiAoKCF0IHx8IHQodykpICYmIChuLnByZXZlbnREZWZhdWx0KCksIG4uc3RvcFByb3BhZ2F0aW9uKCksIG4uc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKCkpLCBmID09IG51bGwgfHwgZihuKSk7XG4gIH07XG4gIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJwb2ludGVyZG93blwiLCBpLCAhMCksIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZWRvd25cIiwgaSwgITApLCBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwicG9pbnRlcnVwXCIsIGksICEwKSwgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNldXBcIiwgaSwgITApLCBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFxuICAgIFwiY2xpY2tcIixcbiAgICAobikgPT4ge1xuICAgICAgaShuLCBvKTtcbiAgICB9LFxuICAgICEwXG4gICk7XG59XG5mdW5jdGlvbiBrZSgpIHtcbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXl1cFwiLCBuZSwgITEpLCB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgUGUsICExKSwgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJyZXNpemVcIiwgTSksIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwic2Nyb2xsXCIsIE0pO1xufVxuZnVuY3Rpb24gX2UoKSB7XG4gIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKFwia2V5dXBcIiwgbmUpLCB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcihcInJlc2l6ZVwiLCBNKSwgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJzY3JvbGxcIiwgTSk7XG59XG5mdW5jdGlvbiBTZSgpIHtcbiAgY29uc3QgZSA9IGwoXCJwb3BvdmVyXCIpO1xuICBlICYmIChlLndyYXBwZXIuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiKTtcbn1cbmZ1bmN0aW9uIFEoZSwgbykge1xuICB2YXIgYiwgUDtcbiAgbGV0IHQgPSBsKFwicG9wb3ZlclwiKTtcbiAgdCAmJiBkb2N1bWVudC5ib2R5LnJlbW92ZUNoaWxkKHQud3JhcHBlciksIHQgPSBMZSgpLCBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHQud3JhcHBlcik7XG4gIGNvbnN0IHtcbiAgICB0aXRsZTogaSxcbiAgICBkZXNjcmlwdGlvbjogZCxcbiAgICBzaG93QnV0dG9uczogbixcbiAgICBkaXNhYmxlQnV0dG9uczogZixcbiAgICBzaG93UHJvZ3Jlc3M6IHcsXG4gICAgbmV4dEJ0blRleHQ6IHIgPSBzKFwibmV4dEJ0blRleHRcIikgfHwgXCJOZXh0ICZyYXJyO1wiLFxuICAgIHByZXZCdG5UZXh0OiB2ID0gcyhcInByZXZCdG5UZXh0XCIpIHx8IFwiJmxhcnI7IFByZXZpb3VzXCIsXG4gICAgcHJvZ3Jlc3NUZXh0OiBnID0gcyhcInByb2dyZXNzVGV4dFwiKSB8fCBcIntjdXJyZW50fSBvZiB7dG90YWx9XCJcbiAgfSA9IG8ucG9wb3ZlciB8fCB7fTtcbiAgdC5uZXh0QnV0dG9uLmlubmVySFRNTCA9IHIsIHQucHJldmlvdXNCdXR0b24uaW5uZXJIVE1MID0gdiwgdC5wcm9ncmVzcy5pbm5lckhUTUwgPSBnLCBpID8gKHQudGl0bGUuaW5uZXJIVE1MID0gaSwgdC50aXRsZS5zdHlsZS5kaXNwbGF5ID0gXCJibG9ja1wiKSA6IHQudGl0bGUuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiLCBkID8gKHQuZGVzY3JpcHRpb24uaW5uZXJIVE1MID0gZCwgdC5kZXNjcmlwdGlvbi5zdHlsZS5kaXNwbGF5ID0gXCJibG9ja1wiKSA6IHQuZGVzY3JpcHRpb24uc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICBjb25zdCB5ID0gbiB8fCBzKFwic2hvd0J1dHRvbnNcIiksIGEgPSB3IHx8IHMoXCJzaG93UHJvZ3Jlc3NcIikgfHwgITEsIHAgPSAoeSA9PSBudWxsID8gdm9pZCAwIDogeS5pbmNsdWRlcyhcIm5leHRcIikpIHx8ICh5ID09IG51bGwgPyB2b2lkIDAgOiB5LmluY2x1ZGVzKFwicHJldmlvdXNcIikpIHx8IGE7XG4gIHQuY2xvc2VCdXR0b24uc3R5bGUuZGlzcGxheSA9IHkuaW5jbHVkZXMoXCJjbG9zZVwiKSA/IFwiYmxvY2tcIiA6IFwibm9uZVwiLCBwID8gKHQuZm9vdGVyLnN0eWxlLmRpc3BsYXkgPSBcImZsZXhcIiwgdC5wcm9ncmVzcy5zdHlsZS5kaXNwbGF5ID0gYSA/IFwiYmxvY2tcIiA6IFwibm9uZVwiLCB0Lm5leHRCdXR0b24uc3R5bGUuZGlzcGxheSA9IHkuaW5jbHVkZXMoXCJuZXh0XCIpID8gXCJibG9ja1wiIDogXCJub25lXCIsIHQucHJldmlvdXNCdXR0b24uc3R5bGUuZGlzcGxheSA9IHkuaW5jbHVkZXMoXCJwcmV2aW91c1wiKSA/IFwiYmxvY2tcIiA6IFwibm9uZVwiKSA6IHQuZm9vdGVyLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgY29uc3QgYyA9IGYgfHwgcyhcImRpc2FibGVCdXR0b25zXCIpIHx8IFtdO1xuICBjICE9IG51bGwgJiYgYy5pbmNsdWRlcyhcIm5leHRcIikgJiYgKHQubmV4dEJ1dHRvbi5kaXNhYmxlZCA9ICEwLCB0Lm5leHRCdXR0b24uY2xhc3NMaXN0LmFkZChcImRyaXZlci1wb3BvdmVyLWJ0bi1kaXNhYmxlZFwiKSksIGMgIT0gbnVsbCAmJiBjLmluY2x1ZGVzKFwicHJldmlvdXNcIikgJiYgKHQucHJldmlvdXNCdXR0b24uZGlzYWJsZWQgPSAhMCwgdC5wcmV2aW91c0J1dHRvbi5jbGFzc0xpc3QuYWRkKFwiZHJpdmVyLXBvcG92ZXItYnRuLWRpc2FibGVkXCIpKSwgYyAhPSBudWxsICYmIGMuaW5jbHVkZXMoXCJjbG9zZVwiKSAmJiAodC5jbG9zZUJ1dHRvbi5kaXNhYmxlZCA9ICEwLCB0LmNsb3NlQnV0dG9uLmNsYXNzTGlzdC5hZGQoXCJkcml2ZXItcG9wb3Zlci1idG4tZGlzYWJsZWRcIikpO1xuICBjb25zdCB1ID0gdC53cmFwcGVyO1xuICB1LnN0eWxlLmRpc3BsYXkgPSBcImJsb2NrXCIsIHUuc3R5bGUubGVmdCA9IFwiXCIsIHUuc3R5bGUudG9wID0gXCJcIiwgdS5zdHlsZS5ib3R0b20gPSBcIlwiLCB1LnN0eWxlLnJpZ2h0ID0gXCJcIiwgdS5pZCA9IFwiZHJpdmVyLXBvcG92ZXItY29udGVudFwiLCB1LnNldEF0dHJpYnV0ZShcInJvbGVcIiwgXCJkaWFsb2dcIiksIHUuc2V0QXR0cmlidXRlKFwiYXJpYS1sYWJlbGxlZGJ5XCIsIFwiZHJpdmVyLXBvcG92ZXItdGl0bGVcIiksIHUuc2V0QXR0cmlidXRlKFwiYXJpYS1kZXNjcmliZWRieVwiLCBcImRyaXZlci1wb3BvdmVyLWRlc2NyaXB0aW9uXCIpO1xuICBjb25zdCBoID0gdC5hcnJvdztcbiAgaC5jbGFzc05hbWUgPSBcImRyaXZlci1wb3BvdmVyLWFycm93XCI7XG4gIGNvbnN0IG0gPSAoKGIgPSBvLnBvcG92ZXIpID09IG51bGwgPyB2b2lkIDAgOiBiLnBvcG92ZXJDbGFzcykgfHwgcyhcInBvcG92ZXJDbGFzc1wiKSB8fCBcIlwiO1xuICB1LmNsYXNzTmFtZSA9IGBkcml2ZXItcG9wb3ZlciAke219YC50cmltKCksIHJlKFxuICAgIHQud3JhcHBlcixcbiAgICAoRSkgPT4ge1xuICAgICAgdmFyIEIsIFIsIFc7XG4gICAgICBjb25zdCBUID0gRS50YXJnZXQsIEEgPSAoKEIgPSBvLnBvcG92ZXIpID09IG51bGwgPyB2b2lkIDAgOiBCLm9uTmV4dENsaWNrKSB8fCBzKFwib25OZXh0Q2xpY2tcIiksIEggPSAoKFIgPSBvLnBvcG92ZXIpID09IG51bGwgPyB2b2lkIDAgOiBSLm9uUHJldkNsaWNrKSB8fCBzKFwib25QcmV2Q2xpY2tcIiksICQgPSAoKFcgPSBvLnBvcG92ZXIpID09IG51bGwgPyB2b2lkIDAgOiBXLm9uQ2xvc2VDbGljaykgfHwgcyhcIm9uQ2xvc2VDbGlja1wiKTtcbiAgICAgIGlmIChULmNsb3Nlc3QoXCIuZHJpdmVyLXBvcG92ZXItbmV4dC1idG5cIikpXG4gICAgICAgIHJldHVybiBBID8gQShlLCBvLCB7XG4gICAgICAgICAgY29uZmlnOiBzKCksXG4gICAgICAgICAgc3RhdGU6IGwoKSxcbiAgICAgICAgICBkcml2ZXI6IF8oKVxuICAgICAgICB9KSA6IEwoXCJuZXh0Q2xpY2tcIik7XG4gICAgICBpZiAoVC5jbG9zZXN0KFwiLmRyaXZlci1wb3BvdmVyLXByZXYtYnRuXCIpKVxuICAgICAgICByZXR1cm4gSCA/IEgoZSwgbywge1xuICAgICAgICAgIGNvbmZpZzogcygpLFxuICAgICAgICAgIHN0YXRlOiBsKCksXG4gICAgICAgICAgZHJpdmVyOiBfKClcbiAgICAgICAgfSkgOiBMKFwicHJldkNsaWNrXCIpO1xuICAgICAgaWYgKFQuY2xvc2VzdChcIi5kcml2ZXItcG9wb3Zlci1jbG9zZS1idG5cIikpXG4gICAgICAgIHJldHVybiAkID8gJChlLCBvLCB7XG4gICAgICAgICAgY29uZmlnOiBzKCksXG4gICAgICAgICAgc3RhdGU6IGwoKSxcbiAgICAgICAgICBkcml2ZXI6IF8oKVxuICAgICAgICB9KSA6IEwoXCJjbG9zZUNsaWNrXCIpO1xuICAgIH0sXG4gICAgKEUpID0+ICEodCAhPSBudWxsICYmIHQuZGVzY3JpcHRpb24uY29udGFpbnMoRSkpICYmICEodCAhPSBudWxsICYmIHQudGl0bGUuY29udGFpbnMoRSkpICYmIHR5cGVvZiBFLmNsYXNzTmFtZSA9PSBcInN0cmluZ1wiICYmIEUuY2xhc3NOYW1lLmluY2x1ZGVzKFwiZHJpdmVyLXBvcG92ZXJcIilcbiAgKSwgayhcInBvcG92ZXJcIiwgdCk7XG4gIGNvbnN0IHggPSAoKFAgPSBvLnBvcG92ZXIpID09IG51bGwgPyB2b2lkIDAgOiBQLm9uUG9wb3ZlclJlbmRlcikgfHwgcyhcIm9uUG9wb3ZlclJlbmRlclwiKTtcbiAgeCAmJiB4KHQsIHtcbiAgICBjb25maWc6IHMoKSxcbiAgICBzdGF0ZTogbCgpLFxuICAgIGRyaXZlcjogXygpXG4gIH0pLCBhZShlLCBvKSwgZWUodSk7XG4gIGNvbnN0IEMgPSBlLmNsYXNzTGlzdC5jb250YWlucyhcImRyaXZlci1kdW1teS1lbGVtZW50XCIpLCBTID0gVShbdSwgLi4uQyA/IFtdIDogW2VdXSk7XG4gIFMubGVuZ3RoID4gMCAmJiBTWzBdLmZvY3VzKCk7XG59XG5mdW5jdGlvbiBzZSgpIHtcbiAgY29uc3QgZSA9IGwoXCJwb3BvdmVyXCIpO1xuICBpZiAoIShlICE9IG51bGwgJiYgZS53cmFwcGVyKSlcbiAgICByZXR1cm47XG4gIGNvbnN0IG8gPSBlLndyYXBwZXIuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCksIHQgPSBzKFwic3RhZ2VQYWRkaW5nXCIpIHx8IDAsIGkgPSBzKFwicG9wb3Zlck9mZnNldFwiKSB8fCAwO1xuICByZXR1cm4ge1xuICAgIHdpZHRoOiBvLndpZHRoICsgdCArIGksXG4gICAgaGVpZ2h0OiBvLmhlaWdodCArIHQgKyBpLFxuICAgIHJlYWxXaWR0aDogby53aWR0aCxcbiAgICByZWFsSGVpZ2h0OiBvLmhlaWdodFxuICB9O1xufVxuZnVuY3Rpb24gWihlLCBvKSB7XG4gIGNvbnN0IHsgZWxlbWVudERpbWVuc2lvbnM6IHQsIHBvcG92ZXJEaW1lbnNpb25zOiBpLCBwb3BvdmVyUGFkZGluZzogZCwgcG9wb3ZlckFycm93RGltZW5zaW9uczogbiB9ID0gbztcbiAgcmV0dXJuIGUgPT09IFwic3RhcnRcIiA/IE1hdGgubWF4KFxuICAgIE1hdGgubWluKFxuICAgICAgdC50b3AgLSBkLFxuICAgICAgd2luZG93LmlubmVySGVpZ2h0IC0gaS5yZWFsSGVpZ2h0IC0gbi53aWR0aFxuICAgICksXG4gICAgbi53aWR0aFxuICApIDogZSA9PT0gXCJlbmRcIiA/IE1hdGgubWF4KFxuICAgIE1hdGgubWluKFxuICAgICAgdC50b3AgLSAoaSA9PSBudWxsID8gdm9pZCAwIDogaS5yZWFsSGVpZ2h0KSArIHQuaGVpZ2h0ICsgZCxcbiAgICAgIHdpbmRvdy5pbm5lckhlaWdodCAtIChpID09IG51bGwgPyB2b2lkIDAgOiBpLnJlYWxIZWlnaHQpIC0gbi53aWR0aFxuICAgICksXG4gICAgbi53aWR0aFxuICApIDogZSA9PT0gXCJjZW50ZXJcIiA/IE1hdGgubWF4KFxuICAgIE1hdGgubWluKFxuICAgICAgdC50b3AgKyB0LmhlaWdodCAvIDIgLSAoaSA9PSBudWxsID8gdm9pZCAwIDogaS5yZWFsSGVpZ2h0KSAvIDIsXG4gICAgICB3aW5kb3cuaW5uZXJIZWlnaHQgLSAoaSA9PSBudWxsID8gdm9pZCAwIDogaS5yZWFsSGVpZ2h0KSAtIG4ud2lkdGhcbiAgICApLFxuICAgIG4ud2lkdGhcbiAgKSA6IDA7XG59XG5mdW5jdGlvbiBHKGUsIG8pIHtcbiAgY29uc3QgeyBlbGVtZW50RGltZW5zaW9uczogdCwgcG9wb3ZlckRpbWVuc2lvbnM6IGksIHBvcG92ZXJQYWRkaW5nOiBkLCBwb3BvdmVyQXJyb3dEaW1lbnNpb25zOiBuIH0gPSBvO1xuICByZXR1cm4gZSA9PT0gXCJzdGFydFwiID8gTWF0aC5tYXgoXG4gICAgTWF0aC5taW4oXG4gICAgICB0LmxlZnQgLSBkLFxuICAgICAgd2luZG93LmlubmVyV2lkdGggLSBpLnJlYWxXaWR0aCAtIG4ud2lkdGhcbiAgICApLFxuICAgIG4ud2lkdGhcbiAgKSA6IGUgPT09IFwiZW5kXCIgPyBNYXRoLm1heChcbiAgICBNYXRoLm1pbihcbiAgICAgIHQubGVmdCAtIChpID09IG51bGwgPyB2b2lkIDAgOiBpLnJlYWxXaWR0aCkgKyB0LndpZHRoICsgZCxcbiAgICAgIHdpbmRvdy5pbm5lcldpZHRoIC0gKGkgPT0gbnVsbCA/IHZvaWQgMCA6IGkucmVhbFdpZHRoKSAtIG4ud2lkdGhcbiAgICApLFxuICAgIG4ud2lkdGhcbiAgKSA6IGUgPT09IFwiY2VudGVyXCIgPyBNYXRoLm1heChcbiAgICBNYXRoLm1pbihcbiAgICAgIHQubGVmdCArIHQud2lkdGggLyAyIC0gKGkgPT0gbnVsbCA/IHZvaWQgMCA6IGkucmVhbFdpZHRoKSAvIDIsXG4gICAgICB3aW5kb3cuaW5uZXJXaWR0aCAtIChpID09IG51bGwgPyB2b2lkIDAgOiBpLnJlYWxXaWR0aCkgLSBuLndpZHRoXG4gICAgKSxcbiAgICBuLndpZHRoXG4gICkgOiAwO1xufVxuZnVuY3Rpb24gYWUoZSwgbykge1xuICBjb25zdCB0ID0gbChcInBvcG92ZXJcIik7XG4gIGlmICghdClcbiAgICByZXR1cm47XG4gIGNvbnN0IHsgYWxpZ246IGkgPSBcInN0YXJ0XCIsIHNpZGU6IGQgPSBcImxlZnRcIiB9ID0gKG8gPT0gbnVsbCA/IHZvaWQgMCA6IG8ucG9wb3ZlcikgfHwge30sIG4gPSBpLCBmID0gZS5pZCA9PT0gXCJkcml2ZXItZHVtbXktZWxlbWVudFwiID8gXCJvdmVyXCIgOiBkLCB3ID0gcyhcInN0YWdlUGFkZGluZ1wiKSB8fCAwLCByID0gc2UoKSwgdiA9IHQuYXJyb3cuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCksIGcgPSBlLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLCB5ID0gZy50b3AgLSByLmhlaWdodDtcbiAgbGV0IGEgPSB5ID49IDA7XG4gIGNvbnN0IHAgPSB3aW5kb3cuaW5uZXJIZWlnaHQgLSAoZy5ib3R0b20gKyByLmhlaWdodCk7XG4gIGxldCBjID0gcCA+PSAwO1xuICBjb25zdCB1ID0gZy5sZWZ0IC0gci53aWR0aDtcbiAgbGV0IGggPSB1ID49IDA7XG4gIGNvbnN0IG0gPSB3aW5kb3cuaW5uZXJXaWR0aCAtIChnLnJpZ2h0ICsgci53aWR0aCk7XG4gIGxldCB4ID0gbSA+PSAwO1xuICBjb25zdCBDID0gIWEgJiYgIWMgJiYgIWggJiYgIXg7XG4gIGxldCBTID0gZjtcbiAgaWYgKGYgPT09IFwidG9wXCIgJiYgYSA/IHggPSBoID0gYyA9ICExIDogZiA9PT0gXCJib3R0b21cIiAmJiBjID8geCA9IGggPSBhID0gITEgOiBmID09PSBcImxlZnRcIiAmJiBoID8geCA9IGEgPSBjID0gITEgOiBmID09PSBcInJpZ2h0XCIgJiYgeCAmJiAoaCA9IGEgPSBjID0gITEpLCBmID09PSBcIm92ZXJcIikge1xuICAgIGNvbnN0IGIgPSB3aW5kb3cuaW5uZXJXaWR0aCAvIDIgLSByLnJlYWxXaWR0aCAvIDIsIFAgPSB3aW5kb3cuaW5uZXJIZWlnaHQgLyAyIC0gci5yZWFsSGVpZ2h0IC8gMjtcbiAgICB0LndyYXBwZXIuc3R5bGUubGVmdCA9IGAke2J9cHhgLCB0LndyYXBwZXIuc3R5bGUucmlnaHQgPSBcImF1dG9cIiwgdC53cmFwcGVyLnN0eWxlLnRvcCA9IGAke1B9cHhgLCB0LndyYXBwZXIuc3R5bGUuYm90dG9tID0gXCJhdXRvXCI7XG4gIH0gZWxzZSBpZiAoQykge1xuICAgIGNvbnN0IGIgPSB3aW5kb3cuaW5uZXJXaWR0aCAvIDIgLSAociA9PSBudWxsID8gdm9pZCAwIDogci5yZWFsV2lkdGgpIC8gMiwgUCA9IDEwO1xuICAgIHQud3JhcHBlci5zdHlsZS5sZWZ0ID0gYCR7Yn1weGAsIHQud3JhcHBlci5zdHlsZS5yaWdodCA9IFwiYXV0b1wiLCB0LndyYXBwZXIuc3R5bGUuYm90dG9tID0gYCR7UH1weGAsIHQud3JhcHBlci5zdHlsZS50b3AgPSBcImF1dG9cIjtcbiAgfSBlbHNlIGlmIChoKSB7XG4gICAgY29uc3QgYiA9IE1hdGgubWluKFxuICAgICAgdSxcbiAgICAgIHdpbmRvdy5pbm5lcldpZHRoIC0gKHIgPT0gbnVsbCA/IHZvaWQgMCA6IHIucmVhbFdpZHRoKSAtIHYud2lkdGhcbiAgICApLCBQID0gWihuLCB7XG4gICAgICBlbGVtZW50RGltZW5zaW9uczogZyxcbiAgICAgIHBvcG92ZXJEaW1lbnNpb25zOiByLFxuICAgICAgcG9wb3ZlclBhZGRpbmc6IHcsXG4gICAgICBwb3BvdmVyQXJyb3dEaW1lbnNpb25zOiB2XG4gICAgfSk7XG4gICAgdC53cmFwcGVyLnN0eWxlLmxlZnQgPSBgJHtifXB4YCwgdC53cmFwcGVyLnN0eWxlLnRvcCA9IGAke1B9cHhgLCB0LndyYXBwZXIuc3R5bGUuYm90dG9tID0gXCJhdXRvXCIsIHQud3JhcHBlci5zdHlsZS5yaWdodCA9IFwiYXV0b1wiLCBTID0gXCJsZWZ0XCI7XG4gIH0gZWxzZSBpZiAoeCkge1xuICAgIGNvbnN0IGIgPSBNYXRoLm1pbihcbiAgICAgIG0sXG4gICAgICB3aW5kb3cuaW5uZXJXaWR0aCAtIChyID09IG51bGwgPyB2b2lkIDAgOiByLnJlYWxXaWR0aCkgLSB2LndpZHRoXG4gICAgKSwgUCA9IFoobiwge1xuICAgICAgZWxlbWVudERpbWVuc2lvbnM6IGcsXG4gICAgICBwb3BvdmVyRGltZW5zaW9uczogcixcbiAgICAgIHBvcG92ZXJQYWRkaW5nOiB3LFxuICAgICAgcG9wb3ZlckFycm93RGltZW5zaW9uczogdlxuICAgIH0pO1xuICAgIHQud3JhcHBlci5zdHlsZS5yaWdodCA9IGAke2J9cHhgLCB0LndyYXBwZXIuc3R5bGUudG9wID0gYCR7UH1weGAsIHQud3JhcHBlci5zdHlsZS5ib3R0b20gPSBcImF1dG9cIiwgdC53cmFwcGVyLnN0eWxlLmxlZnQgPSBcImF1dG9cIiwgUyA9IFwicmlnaHRcIjtcbiAgfSBlbHNlIGlmIChhKSB7XG4gICAgY29uc3QgYiA9IE1hdGgubWluKFxuICAgICAgeSxcbiAgICAgIHdpbmRvdy5pbm5lckhlaWdodCAtIHIucmVhbEhlaWdodCAtIHYud2lkdGhcbiAgICApO1xuICAgIGxldCBQID0gRyhuLCB7XG4gICAgICBlbGVtZW50RGltZW5zaW9uczogZyxcbiAgICAgIHBvcG92ZXJEaW1lbnNpb25zOiByLFxuICAgICAgcG9wb3ZlclBhZGRpbmc6IHcsXG4gICAgICBwb3BvdmVyQXJyb3dEaW1lbnNpb25zOiB2XG4gICAgfSk7XG4gICAgdC53cmFwcGVyLnN0eWxlLnRvcCA9IGAke2J9cHhgLCB0LndyYXBwZXIuc3R5bGUubGVmdCA9IGAke1B9cHhgLCB0LndyYXBwZXIuc3R5bGUuYm90dG9tID0gXCJhdXRvXCIsIHQud3JhcHBlci5zdHlsZS5yaWdodCA9IFwiYXV0b1wiLCBTID0gXCJ0b3BcIjtcbiAgfSBlbHNlIGlmIChjKSB7XG4gICAgY29uc3QgYiA9IE1hdGgubWluKFxuICAgICAgcCxcbiAgICAgIHdpbmRvdy5pbm5lckhlaWdodCAtIChyID09IG51bGwgPyB2b2lkIDAgOiByLnJlYWxIZWlnaHQpIC0gdi53aWR0aFxuICAgICk7XG4gICAgbGV0IFAgPSBHKG4sIHtcbiAgICAgIGVsZW1lbnREaW1lbnNpb25zOiBnLFxuICAgICAgcG9wb3ZlckRpbWVuc2lvbnM6IHIsXG4gICAgICBwb3BvdmVyUGFkZGluZzogdyxcbiAgICAgIHBvcG92ZXJBcnJvd0RpbWVuc2lvbnM6IHZcbiAgICB9KTtcbiAgICB0LndyYXBwZXIuc3R5bGUubGVmdCA9IGAke1B9cHhgLCB0LndyYXBwZXIuc3R5bGUuYm90dG9tID0gYCR7Yn1weGAsIHQud3JhcHBlci5zdHlsZS50b3AgPSBcImF1dG9cIiwgdC53cmFwcGVyLnN0eWxlLnJpZ2h0ID0gXCJhdXRvXCIsIFMgPSBcImJvdHRvbVwiO1xuICB9XG4gIEMgPyB0LmFycm93LmNsYXNzTGlzdC5hZGQoXCJkcml2ZXItcG9wb3Zlci1hcnJvdy1ub25lXCIpIDogRWUobiwgUywgZSk7XG59XG5mdW5jdGlvbiBFZShlLCBvLCB0KSB7XG4gIGNvbnN0IGkgPSBsKFwicG9wb3ZlclwiKTtcbiAgaWYgKCFpKVxuICAgIHJldHVybjtcbiAgY29uc3QgZCA9IHQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCksIG4gPSBzZSgpLCBmID0gaS5hcnJvdywgdyA9IG4ud2lkdGgsIHIgPSB3aW5kb3cuaW5uZXJXaWR0aCwgdiA9IGQud2lkdGgsIGcgPSBkLmxlZnQsIHkgPSBuLmhlaWdodCwgYSA9IHdpbmRvdy5pbm5lckhlaWdodCwgcCA9IGQudG9wLCBjID0gZC5oZWlnaHQ7XG4gIGYuY2xhc3NOYW1lID0gXCJkcml2ZXItcG9wb3Zlci1hcnJvd1wiO1xuICBsZXQgdSA9IG8sIGggPSBlO1xuICBpZiAobyA9PT0gXCJ0b3BcIiA/IChnICsgdiA8PSAwID8gKHUgPSBcInJpZ2h0XCIsIGggPSBcImVuZFwiKSA6IGcgKyB2IC0gdyA8PSAwICYmICh1ID0gXCJ0b3BcIiwgaCA9IFwic3RhcnRcIiksIGcgPj0gciA/ICh1ID0gXCJsZWZ0XCIsIGggPSBcImVuZFwiKSA6IGcgKyB3ID49IHIgJiYgKHUgPSBcInRvcFwiLCBoID0gXCJlbmRcIikpIDogbyA9PT0gXCJib3R0b21cIiA/IChnICsgdiA8PSAwID8gKHUgPSBcInJpZ2h0XCIsIGggPSBcInN0YXJ0XCIpIDogZyArIHYgLSB3IDw9IDAgJiYgKHUgPSBcImJvdHRvbVwiLCBoID0gXCJzdGFydFwiKSwgZyA+PSByID8gKHUgPSBcImxlZnRcIiwgaCA9IFwic3RhcnRcIikgOiBnICsgdyA+PSByICYmICh1ID0gXCJib3R0b21cIiwgaCA9IFwiZW5kXCIpKSA6IG8gPT09IFwibGVmdFwiID8gKHAgKyBjIDw9IDAgPyAodSA9IFwiYm90dG9tXCIsIGggPSBcImVuZFwiKSA6IHAgKyBjIC0geSA8PSAwICYmICh1ID0gXCJsZWZ0XCIsIGggPSBcInN0YXJ0XCIpLCBwID49IGEgPyAodSA9IFwidG9wXCIsIGggPSBcImVuZFwiKSA6IHAgKyB5ID49IGEgJiYgKHUgPSBcImxlZnRcIiwgaCA9IFwiZW5kXCIpKSA6IG8gPT09IFwicmlnaHRcIiAmJiAocCArIGMgPD0gMCA/ICh1ID0gXCJib3R0b21cIiwgaCA9IFwic3RhcnRcIikgOiBwICsgYyAtIHkgPD0gMCAmJiAodSA9IFwicmlnaHRcIiwgaCA9IFwic3RhcnRcIiksIHAgPj0gYSA/ICh1ID0gXCJ0b3BcIiwgaCA9IFwic3RhcnRcIikgOiBwICsgeSA+PSBhICYmICh1ID0gXCJyaWdodFwiLCBoID0gXCJlbmRcIikpLCAhdSlcbiAgICBmLmNsYXNzTGlzdC5hZGQoXCJkcml2ZXItcG9wb3Zlci1hcnJvdy1ub25lXCIpO1xuICBlbHNlIHtcbiAgICBmLmNsYXNzTGlzdC5hZGQoYGRyaXZlci1wb3BvdmVyLWFycm93LXNpZGUtJHt1fWApLCBmLmNsYXNzTGlzdC5hZGQoYGRyaXZlci1wb3BvdmVyLWFycm93LWFsaWduLSR7aH1gKTtcbiAgICBjb25zdCBtID0gdC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKSwgeCA9IGYuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCksIEMgPSBzKFwic3RhZ2VQYWRkaW5nXCIpIHx8IDAsIFMgPSBtLmxlZnQgLSBDIDwgd2luZG93LmlubmVyV2lkdGggJiYgbS5yaWdodCArIEMgPiAwICYmIG0udG9wIC0gQyA8IHdpbmRvdy5pbm5lckhlaWdodCAmJiBtLmJvdHRvbSArIEMgPiAwO1xuICAgIG8gPT09IFwiYm90dG9tXCIgJiYgUyAmJiAoeC54ID4gbS54ICYmIHgueCArIHgud2lkdGggPCBtLnggKyBtLndpZHRoID8gaS53cmFwcGVyLnN0eWxlLnRyYW5zZm9ybSA9IFwidHJhbnNsYXRlWSgwKVwiIDogKGYuY2xhc3NMaXN0LnJlbW92ZShgZHJpdmVyLXBvcG92ZXItYXJyb3ctYWxpZ24tJHtofWApLCBmLmNsYXNzTGlzdC5hZGQoXCJkcml2ZXItcG9wb3Zlci1hcnJvdy1ub25lXCIpLCBpLndyYXBwZXIuc3R5bGUudHJhbnNmb3JtID0gYHRyYW5zbGF0ZVkoLSR7QyAvIDJ9cHgpYCkpO1xuICB9XG59XG5mdW5jdGlvbiBMZSgpIHtcbiAgY29uc3QgZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIGUuY2xhc3NMaXN0LmFkZChcImRyaXZlci1wb3BvdmVyXCIpO1xuICBjb25zdCBvID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgby5jbGFzc0xpc3QuYWRkKFwiZHJpdmVyLXBvcG92ZXItYXJyb3dcIik7XG4gIGNvbnN0IHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiaGVhZGVyXCIpO1xuICB0LmlkID0gXCJkcml2ZXItcG9wb3Zlci10aXRsZVwiLCB0LmNsYXNzTGlzdC5hZGQoXCJkcml2ZXItcG9wb3Zlci10aXRsZVwiKSwgdC5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCIsIHQuaW5uZXJUZXh0ID0gXCJQb3BvdmVyIFRpdGxlXCI7XG4gIGNvbnN0IGkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICBpLmlkID0gXCJkcml2ZXItcG9wb3Zlci1kZXNjcmlwdGlvblwiLCBpLmNsYXNzTGlzdC5hZGQoXCJkcml2ZXItcG9wb3Zlci1kZXNjcmlwdGlvblwiKSwgaS5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCIsIGkuaW5uZXJUZXh0ID0gXCJQb3BvdmVyIGRlc2NyaXB0aW9uIGlzIGhlcmVcIjtcbiAgY29uc3QgZCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJidXR0b25cIik7XG4gIGQudHlwZSA9IFwiYnV0dG9uXCIsIGQuY2xhc3NMaXN0LmFkZChcImRyaXZlci1wb3BvdmVyLWNsb3NlLWJ0blwiKSwgZC5zZXRBdHRyaWJ1dGUoXCJhcmlhLWxhYmVsXCIsIFwiQ2xvc2VcIiksIGQuaW5uZXJIVE1MID0gXCImdGltZXM7XCI7XG4gIGNvbnN0IG4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZm9vdGVyXCIpO1xuICBuLmNsYXNzTGlzdC5hZGQoXCJkcml2ZXItcG9wb3Zlci1mb290ZXJcIik7XG4gIGNvbnN0IGYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgZi5jbGFzc0xpc3QuYWRkKFwiZHJpdmVyLXBvcG92ZXItcHJvZ3Jlc3MtdGV4dFwiKSwgZi5pbm5lclRleHQgPSBcIlwiO1xuICBjb25zdCB3ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gIHcuY2xhc3NMaXN0LmFkZChcImRyaXZlci1wb3BvdmVyLW5hdmlnYXRpb24tYnRuc1wiKTtcbiAgY29uc3QgciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJidXR0b25cIik7XG4gIHIudHlwZSA9IFwiYnV0dG9uXCIsIHIuY2xhc3NMaXN0LmFkZChcImRyaXZlci1wb3BvdmVyLXByZXYtYnRuXCIpLCByLmlubmVySFRNTCA9IFwiJmxhcnI7IFByZXZpb3VzXCI7XG4gIGNvbnN0IHYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYnV0dG9uXCIpO1xuICByZXR1cm4gdi50eXBlID0gXCJidXR0b25cIiwgdi5jbGFzc0xpc3QuYWRkKFwiZHJpdmVyLXBvcG92ZXItbmV4dC1idG5cIiksIHYuaW5uZXJIVE1MID0gXCJOZXh0ICZyYXJyO1wiLCB3LmFwcGVuZENoaWxkKHIpLCB3LmFwcGVuZENoaWxkKHYpLCBuLmFwcGVuZENoaWxkKGYpLCBuLmFwcGVuZENoaWxkKHcpLCBlLmFwcGVuZENoaWxkKGQpLCBlLmFwcGVuZENoaWxkKG8pLCBlLmFwcGVuZENoaWxkKHQpLCBlLmFwcGVuZENoaWxkKGkpLCBlLmFwcGVuZENoaWxkKG4pLCB7XG4gICAgd3JhcHBlcjogZSxcbiAgICBhcnJvdzogbyxcbiAgICB0aXRsZTogdCxcbiAgICBkZXNjcmlwdGlvbjogaSxcbiAgICBmb290ZXI6IG4sXG4gICAgcHJldmlvdXNCdXR0b246IHIsXG4gICAgbmV4dEJ1dHRvbjogdixcbiAgICBjbG9zZUJ1dHRvbjogZCxcbiAgICBmb290ZXJCdXR0b25zOiB3LFxuICAgIHByb2dyZXNzOiBmXG4gIH07XG59XG5mdW5jdGlvbiBUZSgpIHtcbiAgdmFyIG87XG4gIGNvbnN0IGUgPSBsKFwicG9wb3ZlclwiKTtcbiAgZSAmJiAoKG8gPSBlLndyYXBwZXIucGFyZW50RWxlbWVudCkgPT0gbnVsbCB8fCBvLnJlbW92ZUNoaWxkKGUud3JhcHBlcikpO1xufVxuZnVuY3Rpb24gQWUoZSA9IHt9KSB7XG4gIEYoZSk7XG4gIGZ1bmN0aW9uIG8oKSB7XG4gICAgcyhcImFsbG93Q2xvc2VcIikgJiYgZygpO1xuICB9XG4gIGZ1bmN0aW9uIHQoKSB7XG4gICAgY29uc3QgYSA9IHMoXCJvdmVybGF5Q2xpY2tCZWhhdmlvclwiKTtcbiAgICBpZiAocyhcImFsbG93Q2xvc2VcIikgJiYgYSA9PT0gXCJjbG9zZVwiKSB7XG4gICAgICBnKCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmICh0eXBlb2YgYSA9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgIGNvbnN0IHAgPSBsKFwiX19hY3RpdmVTdGVwXCIpLCBjID0gbChcIl9fYWN0aXZlRWxlbWVudFwiKTtcbiAgICAgIGEoYywgcCwge1xuICAgICAgICBjb25maWc6IHMoKSxcbiAgICAgICAgc3RhdGU6IGwoKSxcbiAgICAgICAgZHJpdmVyOiBfKClcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBhID09PSBcIm5leHRTdGVwXCIgJiYgaSgpO1xuICB9XG4gIGZ1bmN0aW9uIGkoKSB7XG4gICAgY29uc3QgYSA9IGwoXCJhY3RpdmVJbmRleFwiKSwgcCA9IHMoXCJzdGVwc1wiKSB8fCBbXTtcbiAgICBpZiAodHlwZW9mIGEgPT0gXCJ1bmRlZmluZWRcIilcbiAgICAgIHJldHVybjtcbiAgICBjb25zdCBjID0gYSArIDE7XG4gICAgcFtjXSA/IHYoYykgOiBnKCk7XG4gIH1cbiAgZnVuY3Rpb24gZCgpIHtcbiAgICBjb25zdCBhID0gbChcImFjdGl2ZUluZGV4XCIpLCBwID0gcyhcInN0ZXBzXCIpIHx8IFtdO1xuICAgIGlmICh0eXBlb2YgYSA9PSBcInVuZGVmaW5lZFwiKVxuICAgICAgcmV0dXJuO1xuICAgIGNvbnN0IGMgPSBhIC0gMTtcbiAgICBwW2NdID8gdihjKSA6IGcoKTtcbiAgfVxuICBmdW5jdGlvbiBuKGEpIHtcbiAgICAocyhcInN0ZXBzXCIpIHx8IFtdKVthXSA/IHYoYSkgOiBnKCk7XG4gIH1cbiAgZnVuY3Rpb24gZigpIHtcbiAgICB2YXIgeDtcbiAgICBpZiAobChcIl9fdHJhbnNpdGlvbkNhbGxiYWNrXCIpKVxuICAgICAgcmV0dXJuO1xuICAgIGNvbnN0IHAgPSBsKFwiYWN0aXZlSW5kZXhcIiksIGMgPSBsKFwiX19hY3RpdmVTdGVwXCIpLCB1ID0gbChcIl9fYWN0aXZlRWxlbWVudFwiKTtcbiAgICBpZiAodHlwZW9mIHAgPT0gXCJ1bmRlZmluZWRcIiB8fCB0eXBlb2YgYyA9PSBcInVuZGVmaW5lZFwiIHx8IHR5cGVvZiBsKFwiYWN0aXZlSW5kZXhcIikgPT0gXCJ1bmRlZmluZWRcIilcbiAgICAgIHJldHVybjtcbiAgICBjb25zdCBtID0gKCh4ID0gYy5wb3BvdmVyKSA9PSBudWxsID8gdm9pZCAwIDogeC5vblByZXZDbGljaykgfHwgcyhcIm9uUHJldkNsaWNrXCIpO1xuICAgIGlmIChtKVxuICAgICAgcmV0dXJuIG0odSwgYywge1xuICAgICAgICBjb25maWc6IHMoKSxcbiAgICAgICAgc3RhdGU6IGwoKSxcbiAgICAgICAgZHJpdmVyOiBfKClcbiAgICAgIH0pO1xuICAgIGQoKTtcbiAgfVxuICBmdW5jdGlvbiB3KCkge1xuICAgIHZhciBtO1xuICAgIGlmIChsKFwiX190cmFuc2l0aW9uQ2FsbGJhY2tcIikpXG4gICAgICByZXR1cm47XG4gICAgY29uc3QgcCA9IGwoXCJhY3RpdmVJbmRleFwiKSwgYyA9IGwoXCJfX2FjdGl2ZVN0ZXBcIiksIHUgPSBsKFwiX19hY3RpdmVFbGVtZW50XCIpO1xuICAgIGlmICh0eXBlb2YgcCA9PSBcInVuZGVmaW5lZFwiIHx8IHR5cGVvZiBjID09IFwidW5kZWZpbmVkXCIpXG4gICAgICByZXR1cm47XG4gICAgY29uc3QgaCA9ICgobSA9IGMucG9wb3ZlcikgPT0gbnVsbCA/IHZvaWQgMCA6IG0ub25OZXh0Q2xpY2spIHx8IHMoXCJvbk5leHRDbGlja1wiKTtcbiAgICBpZiAoaClcbiAgICAgIHJldHVybiBoKHUsIGMsIHtcbiAgICAgICAgY29uZmlnOiBzKCksXG4gICAgICAgIHN0YXRlOiBsKCksXG4gICAgICAgIGRyaXZlcjogXygpXG4gICAgICB9KTtcbiAgICBpKCk7XG4gIH1cbiAgZnVuY3Rpb24gcigpIHtcbiAgICBsKFwiaXNJbml0aWFsaXplZFwiKSB8fCAoayhcImlzSW5pdGlhbGl6ZWRcIiwgITApLCBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5hZGQoXCJkcml2ZXItYWN0aXZlXCIsIHMoXCJhbmltYXRlXCIpID8gXCJkcml2ZXItZmFkZVwiIDogXCJkcml2ZXItc2ltcGxlXCIpLCBrZSgpLCBOKFwib3ZlcmxheUNsaWNrXCIsIHQpLCBOKFwiZXNjYXBlUHJlc3NcIiwgbyksIE4oXCJhcnJvd0xlZnRQcmVzc1wiLCBmKSwgTihcImFycm93UmlnaHRQcmVzc1wiLCB3KSk7XG4gIH1cbiAgZnVuY3Rpb24gdihhID0gMCkge1xuICAgIHZhciAkLCBCLCBSLCBXLCBWLCBxLCBLLCBZO1xuICAgIGNvbnN0IHAgPSBzKFwic3RlcHNcIik7XG4gICAgaWYgKCFwKSB7XG4gICAgICBjb25zb2xlLmVycm9yKFwiTm8gc3RlcHMgdG8gZHJpdmUgdGhyb3VnaFwiKSwgZygpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAoIXBbYV0pIHtcbiAgICAgIGcoKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgayhcIl9fYWN0aXZlT25EZXN0cm95ZWRcIiwgZG9jdW1lbnQuYWN0aXZlRWxlbWVudCksIGsoXCJhY3RpdmVJbmRleFwiLCBhKTtcbiAgICBjb25zdCBjID0gcFthXSwgdSA9IHBbYSArIDFdLCBoID0gcFthIC0gMV0sIG0gPSAoKCQgPSBjLnBvcG92ZXIpID09IG51bGwgPyB2b2lkIDAgOiAkLmRvbmVCdG5UZXh0KSB8fCBzKFwiZG9uZUJ0blRleHRcIikgfHwgXCJEb25lXCIsIHggPSBzKFwiYWxsb3dDbG9zZVwiKSwgQyA9IHR5cGVvZiAoKEIgPSBjLnBvcG92ZXIpID09IG51bGwgPyB2b2lkIDAgOiBCLnNob3dQcm9ncmVzcykgIT0gXCJ1bmRlZmluZWRcIiA/IChSID0gYy5wb3BvdmVyKSA9PSBudWxsID8gdm9pZCAwIDogUi5zaG93UHJvZ3Jlc3MgOiBzKFwic2hvd1Byb2dyZXNzXCIpLCBiID0gKCgoVyA9IGMucG9wb3ZlcikgPT0gbnVsbCA/IHZvaWQgMCA6IFcucHJvZ3Jlc3NUZXh0KSB8fCBzKFwicHJvZ3Jlc3NUZXh0XCIpIHx8IFwie3tjdXJyZW50fX0gb2Yge3t0b3RhbH19XCIpLnJlcGxhY2UoXCJ7e2N1cnJlbnR9fVwiLCBgJHthICsgMX1gKS5yZXBsYWNlKFwie3t0b3RhbH19XCIsIGAke3AubGVuZ3RofWApLCBQID0gKChWID0gYy5wb3BvdmVyKSA9PSBudWxsID8gdm9pZCAwIDogVi5zaG93QnV0dG9ucykgfHwgcyhcInNob3dCdXR0b25zXCIpLCBFID0gW1xuICAgICAgXCJuZXh0XCIsXG4gICAgICBcInByZXZpb3VzXCIsXG4gICAgICAuLi54ID8gW1wiY2xvc2VcIl0gOiBbXVxuICAgIF0uZmlsdGVyKChjZSkgPT4gIShQICE9IG51bGwgJiYgUC5sZW5ndGgpIHx8IFAuaW5jbHVkZXMoY2UpKSwgVCA9ICgocSA9IGMucG9wb3ZlcikgPT0gbnVsbCA/IHZvaWQgMCA6IHEub25OZXh0Q2xpY2spIHx8IHMoXCJvbk5leHRDbGlja1wiKSwgQSA9ICgoSyA9IGMucG9wb3ZlcikgPT0gbnVsbCA/IHZvaWQgMCA6IEsub25QcmV2Q2xpY2spIHx8IHMoXCJvblByZXZDbGlja1wiKSwgSCA9ICgoWSA9IGMucG9wb3ZlcikgPT0gbnVsbCA/IHZvaWQgMCA6IFkub25DbG9zZUNsaWNrKSB8fCBzKFwib25DbG9zZUNsaWNrXCIpO1xuICAgIGooe1xuICAgICAgLi4uYyxcbiAgICAgIHBvcG92ZXI6IHtcbiAgICAgICAgc2hvd0J1dHRvbnM6IEUsXG4gICAgICAgIG5leHRCdG5UZXh0OiB1ID8gdm9pZCAwIDogbSxcbiAgICAgICAgZGlzYWJsZUJ1dHRvbnM6IFsuLi5oID8gW10gOiBbXCJwcmV2aW91c1wiXV0sXG4gICAgICAgIHNob3dQcm9ncmVzczogQyxcbiAgICAgICAgcHJvZ3Jlc3NUZXh0OiBiLFxuICAgICAgICBvbk5leHRDbGljazogVCB8fCAoKCkgPT4ge1xuICAgICAgICAgIHUgPyB2KGEgKyAxKSA6IGcoKTtcbiAgICAgICAgfSksXG4gICAgICAgIG9uUHJldkNsaWNrOiBBIHx8ICgoKSA9PiB7XG4gICAgICAgICAgdihhIC0gMSk7XG4gICAgICAgIH0pLFxuICAgICAgICBvbkNsb3NlQ2xpY2s6IEggfHwgKCgpID0+IHtcbiAgICAgICAgICBnKCk7XG4gICAgICAgIH0pLFxuICAgICAgICAuLi4oYyA9PSBudWxsID8gdm9pZCAwIDogYy5wb3BvdmVyKSB8fCB7fVxuICAgICAgfVxuICAgIH0pO1xuICB9XG4gIGZ1bmN0aW9uIGcoYSA9ICEwKSB7XG4gICAgY29uc3QgcCA9IGwoXCJfX2FjdGl2ZUVsZW1lbnRcIiksIGMgPSBsKFwiX19hY3RpdmVTdGVwXCIpLCB1ID0gbChcIl9fYWN0aXZlT25EZXN0cm95ZWRcIiksIGggPSBzKFwib25EZXN0cm95U3RhcnRlZFwiKTtcbiAgICBpZiAoYSAmJiBoKSB7XG4gICAgICBjb25zdCBDID0gIXAgfHwgKHAgPT0gbnVsbCA/IHZvaWQgMCA6IHAuaWQpID09PSBcImRyaXZlci1kdW1teS1lbGVtZW50XCI7XG4gICAgICBoKEMgPyB2b2lkIDAgOiBwLCBjLCB7XG4gICAgICAgIGNvbmZpZzogcygpLFxuICAgICAgICBzdGF0ZTogbCgpLFxuICAgICAgICBkcml2ZXI6IF8oKVxuICAgICAgfSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IG0gPSAoYyA9PSBudWxsID8gdm9pZCAwIDogYy5vbkRlc2VsZWN0ZWQpIHx8IHMoXCJvbkRlc2VsZWN0ZWRcIiksIHggPSBzKFwib25EZXN0cm95ZWRcIik7XG4gICAgaWYgKGRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LnJlbW92ZShcImRyaXZlci1hY3RpdmVcIiwgXCJkcml2ZXItZmFkZVwiLCBcImRyaXZlci1zaW1wbGVcIiksIF9lKCksIFRlKCksIENlKCksIG1lKCksIGRlKCksIFgoKSwgcCAmJiBjKSB7XG4gICAgICBjb25zdCBDID0gcC5pZCA9PT0gXCJkcml2ZXItZHVtbXktZWxlbWVudFwiO1xuICAgICAgbSAmJiBtKEMgPyB2b2lkIDAgOiBwLCBjLCB7XG4gICAgICAgIGNvbmZpZzogcygpLFxuICAgICAgICBzdGF0ZTogbCgpLFxuICAgICAgICBkcml2ZXI6IF8oKVxuICAgICAgfSksIHggJiYgeChDID8gdm9pZCAwIDogcCwgYywge1xuICAgICAgICBjb25maWc6IHMoKSxcbiAgICAgICAgc3RhdGU6IGwoKSxcbiAgICAgICAgZHJpdmVyOiBfKClcbiAgICAgIH0pO1xuICAgIH1cbiAgICB1ICYmIHUuZm9jdXMoKTtcbiAgfVxuICBjb25zdCB5ID0ge1xuICAgIGlzQWN0aXZlOiAoKSA9PiBsKFwiaXNJbml0aWFsaXplZFwiKSB8fCAhMSxcbiAgICByZWZyZXNoOiBNLFxuICAgIGRyaXZlOiAoYSA9IDApID0+IHtcbiAgICAgIHIoKSwgdihhKTtcbiAgICB9LFxuICAgIHNldENvbmZpZzogRixcbiAgICBzZXRTdGVwczogKGEpID0+IHtcbiAgICAgIFgoKSwgRih7XG4gICAgICAgIC4uLnMoKSxcbiAgICAgICAgc3RlcHM6IGFcbiAgICAgIH0pO1xuICAgIH0sXG4gICAgZ2V0Q29uZmlnOiBzLFxuICAgIGdldFN0YXRlOiBsLFxuICAgIGdldEFjdGl2ZUluZGV4OiAoKSA9PiBsKFwiYWN0aXZlSW5kZXhcIiksXG4gICAgaXNGaXJzdFN0ZXA6ICgpID0+IGwoXCJhY3RpdmVJbmRleFwiKSA9PT0gMCxcbiAgICBpc0xhc3RTdGVwOiAoKSA9PiB7XG4gICAgICBjb25zdCBhID0gcyhcInN0ZXBzXCIpIHx8IFtdLCBwID0gbChcImFjdGl2ZUluZGV4XCIpO1xuICAgICAgcmV0dXJuIHAgIT09IHZvaWQgMCAmJiBwID09PSBhLmxlbmd0aCAtIDE7XG4gICAgfSxcbiAgICBnZXRBY3RpdmVTdGVwOiAoKSA9PiBsKFwiYWN0aXZlU3RlcFwiKSxcbiAgICBnZXRBY3RpdmVFbGVtZW50OiAoKSA9PiBsKFwiYWN0aXZlRWxlbWVudFwiKSxcbiAgICBnZXRQcmV2aW91c0VsZW1lbnQ6ICgpID0+IGwoXCJwcmV2aW91c0VsZW1lbnRcIiksXG4gICAgZ2V0UHJldmlvdXNTdGVwOiAoKSA9PiBsKFwicHJldmlvdXNTdGVwXCIpLFxuICAgIG1vdmVOZXh0OiBpLFxuICAgIG1vdmVQcmV2aW91czogZCxcbiAgICBtb3ZlVG86IG4sXG4gICAgaGFzTmV4dFN0ZXA6ICgpID0+IHtcbiAgICAgIGNvbnN0IGEgPSBzKFwic3RlcHNcIikgfHwgW10sIHAgPSBsKFwiYWN0aXZlSW5kZXhcIik7XG4gICAgICByZXR1cm4gcCAhPT0gdm9pZCAwICYmICEhYVtwICsgMV07XG4gICAgfSxcbiAgICBoYXNQcmV2aW91c1N0ZXA6ICgpID0+IHtcbiAgICAgIGNvbnN0IGEgPSBzKFwic3RlcHNcIikgfHwgW10sIHAgPSBsKFwiYWN0aXZlSW5kZXhcIik7XG4gICAgICByZXR1cm4gcCAhPT0gdm9pZCAwICYmICEhYVtwIC0gMV07XG4gICAgfSxcbiAgICBoaWdobGlnaHQ6IChhKSA9PiB7XG4gICAgICByKCksIGooe1xuICAgICAgICAuLi5hLFxuICAgICAgICBwb3BvdmVyOiBhLnBvcG92ZXIgPyB7XG4gICAgICAgICAgc2hvd0J1dHRvbnM6IFtdLFxuICAgICAgICAgIHNob3dQcm9ncmVzczogITEsXG4gICAgICAgICAgcHJvZ3Jlc3NUZXh0OiBcIlwiLFxuICAgICAgICAgIC4uLmEucG9wb3ZlclxuICAgICAgICB9IDogdm9pZCAwXG4gICAgICB9KTtcbiAgICB9LFxuICAgIGRlc3Ryb3k6ICgpID0+IHtcbiAgICAgIGcoITEpO1xuICAgIH1cbiAgfTtcbiAgcmV0dXJuIGxlKHkpLCB5O1xufVxuZXhwb3J0IHtcbiAgQWUgYXMgZHJpdmVyXG59O1xuIiwiaW1wb3J0IHsgZHJpdmVyIH0gZnJvbSAnZHJpdmVyLmpzJztcbmltcG9ydCAnZHJpdmVyLmpzL2Rpc3QvZHJpdmVyLmNzcyc7XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbnRlbnRTY3JpcHQoe1xuICBtYXRjaGVzOiBbJ2h0dHBzOi8vd3d3LnBhdGVudC5nby5rci8qJ10sXG4gIG1haW4oKSB7XG4gICAgY29uc29sZS5sb2coJ1BhdGVudCBHdWlkZSBBc3Npc3RhbnQgLSBDb250ZW50IFNjcmlwdCBMb2FkZWQnKTtcblxuICAgIGNvbnN0IFNUT1JBR0VfS0VZID0gJ3BhdGVudF9ndWlkZV9zdGF0ZSc7XG5cbiAgICBjb25zdCBjaGF0UGFuZWxDb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICBjaGF0UGFuZWxDb250YWluZXIuaWQgPSAncGF0ZW50LWNoYXQtcGFuZWwtY29udGFpbmVyJztcbiAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGNoYXRQYW5lbENvbnRhaW5lcik7XG5cbiAgICBjb25zdCBjb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICBjb250YWluZXIuaWQgPSAncGF0ZW50LWd1aWRlLWNvbnRhaW5lcic7XG4gICAgY29udGFpbmVyLnN0eWxlLmNzc1RleHQgPSBgXG4gICAgICBwb3NpdGlvbjogZml4ZWQ7XG4gICAgICBib3R0b206IDIwcHg7XG4gICAgICByaWdodDogMjBweDtcbiAgICAgIHotaW5kZXg6IDk5OTk5OTtcbiAgICBgO1xuXG4gICAgY29uc3Qgc2hhZG93ID0gY29udGFpbmVyLmF0dGFjaFNoYWRvdyh7IG1vZGU6ICdvcGVuJyB9KTtcblxuICAgIGNvbnN0IGJ1dHRvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2J1dHRvbicpO1xuICAgIGJ1dHRvbi50ZXh0Q29udGVudCA9ICfwn5KsIOqwgOydtOuTnCDrj4TsmrDrr7gnO1xuICAgIGJ1dHRvbi5zdHlsZS5jc3NUZXh0ID0gYFxuICAgICAgYmFja2dyb3VuZDogbGluZWFyLWdyYWRpZW50KDEzNWRlZywgIzY2N2VlYSAwJSwgIzc2NGJhMiAxMDAlKTtcbiAgICAgIGNvbG9yOiB3aGl0ZTtcbiAgICAgIGJvcmRlcjogbm9uZTtcbiAgICAgIGJvcmRlci1yYWRpdXM6IDUwcHg7XG4gICAgICBwYWRkaW5nOiAxMnB4IDI0cHg7XG4gICAgICBmb250LXNpemU6IDE0cHg7XG4gICAgICBmb250LXdlaWdodDogNjAwO1xuICAgICAgY3Vyc29yOiBwb2ludGVyO1xuICAgICAgYm94LXNoYWRvdzogMCA0cHggMTVweCByZ2JhKDEwMiwgMTI2LCAyMzQsIDAuNCk7XG4gICAgICB0cmFuc2l0aW9uOiBhbGwgMC4zcyBlYXNlO1xuICAgIGA7XG5cbiAgICBjb25zdCBjaGF0UGFuZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICBjaGF0UGFuZWwuc3R5bGUuY3NzVGV4dCA9IGBcbiAgICAgIGRpc3BsYXk6IG5vbmU7XG4gICAgICBwb3NpdGlvbjogZml4ZWQ7XG4gICAgICB0b3A6IDA7XG4gICAgICBsZWZ0OiAwO1xuICAgICAgd2lkdGg6IDMyMHB4O1xuICAgICAgaGVpZ2h0OiAxMDB2aDtcbiAgICAgIGJhY2tncm91bmQ6IHdoaXRlO1xuICAgICAgYm94LXNoYWRvdzogMnB4IDAgMTBweCByZ2JhKDAsIDAsIDAsIDAuMSk7XG4gICAgICB6LWluZGV4OiA5OTk5OTg7XG4gICAgICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICAgIGA7XG5cbiAgICBjaGF0UGFuZWwuaW5uZXJIVE1MID0gYFxuICAgICAgPHN0eWxlPlxuICAgICAgICAqIHtcbiAgICAgICAgICBtYXJnaW46IDA7XG4gICAgICAgICAgcGFkZGluZzogMDtcbiAgICAgICAgICBib3gtc2l6aW5nOiBib3JkZXItYm94O1xuICAgICAgICAgIGZvbnQtZmFtaWx5OiAtYXBwbGUtc3lzdGVtLCBCbGlua01hY1N5c3RlbUZvbnQsICdTZWdvZSBVSScsIFJvYm90bywgc2Fucy1zZXJpZjtcbiAgICAgICAgfVxuICAgICAgICAuY2hhdC1oZWFkZXIge1xuICAgICAgICAgIGJhY2tncm91bmQ6IGxpbmVhci1ncmFkaWVudCgxMzVkZWcsICM2NjdlZWEgMCUsICM3NjRiYTIgMTAwJSk7XG4gICAgICAgICAgY29sb3I6IHdoaXRlO1xuICAgICAgICAgIHBhZGRpbmc6IDIwcHg7XG4gICAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgICBqdXN0aWZ5LWNvbnRlbnQ6IHNwYWNlLWJldHdlZW47XG4gICAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAgICAgfVxuICAgICAgICAuY2hhdC1oZWFkZXIgaDEge1xuICAgICAgICAgIGZvbnQtc2l6ZTogMThweDtcbiAgICAgICAgICBmb250LXdlaWdodDogNjAwO1xuICAgICAgICB9XG4gICAgICAgIC5jbG9zZS1idG4ge1xuICAgICAgICAgIGJhY2tncm91bmQ6IG5vbmU7XG4gICAgICAgICAgYm9yZGVyOiBub25lO1xuICAgICAgICAgIGNvbG9yOiB3aGl0ZTtcbiAgICAgICAgICBmb250LXNpemU6IDI0cHg7XG4gICAgICAgICAgY3Vyc29yOiBwb2ludGVyO1xuICAgICAgICAgIHBhZGRpbmc6IDA7XG4gICAgICAgICAgd2lkdGg6IDMwcHg7XG4gICAgICAgICAgaGVpZ2h0OiAzMHB4O1xuICAgICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAgICAgICBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcbiAgICAgICAgfVxuICAgICAgICAuY2xvc2UtYnRuOmhvdmVyIHtcbiAgICAgICAgICBvcGFjaXR5OiAwLjg7XG4gICAgICAgIH1cbiAgICAgICAgLm1lc3NhZ2VzIHtcbiAgICAgICAgICBmbGV4OiAxO1xuICAgICAgICAgIG92ZXJmbG93LXk6IGF1dG87XG4gICAgICAgICAgcGFkZGluZzogMjBweDtcbiAgICAgICAgfVxuICAgICAgICAubWVzc2FnZSB7XG4gICAgICAgICAgbWFyZ2luLWJvdHRvbTogMTZweDtcbiAgICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICAgIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gICAgICAgIH1cbiAgICAgICAgLm1lc3NhZ2UudXNlciB7XG4gICAgICAgICAgYWxpZ24taXRlbXM6IGZsZXgtZW5kO1xuICAgICAgICB9XG4gICAgICAgIC5tZXNzYWdlLmFzc2lzdGFudCB7XG4gICAgICAgICAgYWxpZ24taXRlbXM6IGZsZXgtc3RhcnQ7XG4gICAgICAgIH1cbiAgICAgICAgLm1lc3NhZ2UtY29udGVudCB7XG4gICAgICAgICAgbWF4LXdpZHRoOiA4MCU7XG4gICAgICAgICAgcGFkZGluZzogMTJweCAxNnB4O1xuICAgICAgICAgIGJvcmRlci1yYWRpdXM6IDEycHg7XG4gICAgICAgICAgd29yZC13cmFwOiBicmVhay13b3JkO1xuICAgICAgICB9XG4gICAgICAgIC5tZXNzYWdlLnVzZXIgLm1lc3NhZ2UtY29udGVudCB7XG4gICAgICAgICAgYmFja2dyb3VuZDogbGluZWFyLWdyYWRpZW50KDEzNWRlZywgIzY2N2VlYSAwJSwgIzc2NGJhMiAxMDAlKTtcbiAgICAgICAgICBjb2xvcjogd2hpdGU7XG4gICAgICAgIH1cbiAgICAgICAgLm1lc3NhZ2UuYXNzaXN0YW50IC5tZXNzYWdlLWNvbnRlbnQge1xuICAgICAgICAgIGJhY2tncm91bmQ6ICNmM2Y0ZjY7XG4gICAgICAgICAgY29sb3I6ICMxZjI5Mzc7XG4gICAgICAgIH1cbiAgICAgICAgLmlucHV0LWNvbnRhaW5lciB7XG4gICAgICAgICAgcGFkZGluZzogMjBweDtcbiAgICAgICAgICBib3JkZXItdG9wOiAxcHggc29saWQgI2U1ZTdlYjtcbiAgICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICAgIGdhcDogMTBweDtcbiAgICAgICAgfVxuICAgICAgICAuaW5wdXQtY29udGFpbmVyIGlucHV0IHtcbiAgICAgICAgICBmbGV4OiAxO1xuICAgICAgICAgIHBhZGRpbmc6IDEycHg7XG4gICAgICAgICAgYm9yZGVyOiAxcHggc29saWQgI2U1ZTdlYjtcbiAgICAgICAgICBib3JkZXItcmFkaXVzOiA4cHg7XG4gICAgICAgICAgZm9udC1zaXplOiAxNHB4O1xuICAgICAgICB9XG4gICAgICAgIC5pbnB1dC1jb250YWluZXIgaW5wdXQ6Zm9jdXMge1xuICAgICAgICAgIG91dGxpbmU6IG5vbmU7XG4gICAgICAgICAgYm9yZGVyLWNvbG9yOiAjNjY3ZWVhO1xuICAgICAgICB9XG4gICAgICAgIC5pbnB1dC1jb250YWluZXIgYnV0dG9uIHtcbiAgICAgICAgICBiYWNrZ3JvdW5kOiBsaW5lYXItZ3JhZGllbnQoMTM1ZGVnLCAjNjY3ZWVhIDAlLCAjNzY0YmEyIDEwMCUpO1xuICAgICAgICAgIGNvbG9yOiB3aGl0ZTtcbiAgICAgICAgICBib3JkZXI6IG5vbmU7XG4gICAgICAgICAgYm9yZGVyLXJhZGl1czogOHB4O1xuICAgICAgICAgIHBhZGRpbmc6IDEycHggMjRweDtcbiAgICAgICAgICBmb250LXNpemU6IDE0cHg7XG4gICAgICAgICAgZm9udC13ZWlnaHQ6IDYwMDtcbiAgICAgICAgICBjdXJzb3I6IHBvaW50ZXI7XG4gICAgICAgIH1cbiAgICAgICAgLmlucHV0LWNvbnRhaW5lciBidXR0b246ZGlzYWJsZWQge1xuICAgICAgICAgIG9wYWNpdHk6IDAuNTtcbiAgICAgICAgICBjdXJzb3I6IG5vdC1hbGxvd2VkO1xuICAgICAgICB9XG4gICAgICAgIC5pbnB1dC1jb250YWluZXIgYnV0dG9uOmhvdmVyOm5vdCg6ZGlzYWJsZWQpIHtcbiAgICAgICAgICBvcGFjaXR5OiAwLjk7XG4gICAgICAgIH1cbiAgICAgICAgLnF1aWNrLWFjdGlvbnMge1xuICAgICAgICAgIHBhZGRpbmc6IDIwcHg7XG4gICAgICAgICAgYm9yZGVyLXRvcDogMXB4IHNvbGlkICNlNWU3ZWI7XG4gICAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgICBnYXA6IDEwcHg7XG4gICAgICAgICAganVzdGlmeS1jb250ZW50OiBjZW50ZXI7XG4gICAgICAgIH1cbiAgICAgICAgLnF1aWNrLWFjdGlvbnMgYnV0dG9uIHtcbiAgICAgICAgICBiYWNrZ3JvdW5kOiBsaW5lYXItZ3JhZGllbnQoMTM1ZGVnLCAjNjY3ZWVhIDAlLCAjNzY0YmEyIDEwMCUpO1xuICAgICAgICAgIGNvbG9yOiB3aGl0ZTtcbiAgICAgICAgICBib3JkZXI6IG5vbmU7XG4gICAgICAgICAgYm9yZGVyLXJhZGl1czogMTJweDtcbiAgICAgICAgICBwYWRkaW5nOiAxNHB4IDI4cHg7XG4gICAgICAgICAgZm9udC1zaXplOiAxNnB4O1xuICAgICAgICAgIGZvbnQtd2VpZ2h0OiA2MDA7XG4gICAgICAgICAgY3Vyc29yOiBwb2ludGVyO1xuICAgICAgICAgIHRyYW5zaXRpb246IGFsbCAwLjNzIGVhc2U7XG4gICAgICAgICAgYm94LXNoYWRvdzogMCA0cHggMTJweCByZ2JhKDEwMiwgMTI2LCAyMzQsIDAuMyk7XG4gICAgICAgIH1cbiAgICAgICAgLnF1aWNrLWFjdGlvbnMgYnV0dG9uOmhvdmVyIHtcbiAgICAgICAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZVkoLTJweCk7XG4gICAgICAgICAgYm94LXNoYWRvdzogMCA2cHggMTZweCByZ2JhKDEwMiwgMTI2LCAyMzQsIDAuNSk7XG4gICAgICAgIH1cbiAgICAgICAgLnF1aWNrLWFjdGlvbnMuaGlkZGVuIHtcbiAgICAgICAgICBkaXNwbGF5OiBub25lO1xuICAgICAgICB9XG4gICAgICAgIC5pbnB1dC1jb250YWluZXIuaGlkZGVuIHtcbiAgICAgICAgICBkaXNwbGF5OiBub25lO1xuICAgICAgICB9XG4gICAgICAgIC5yZXNldC1idG4ge1xuICAgICAgICAgIGJhY2tncm91bmQ6ICNlZjQ0NDQ7XG4gICAgICAgICAgY29sb3I6IHdoaXRlO1xuICAgICAgICAgIGJvcmRlcjogbm9uZTtcbiAgICAgICAgICBib3JkZXItcmFkaXVzOiA4cHg7XG4gICAgICAgICAgcGFkZGluZzogOHB4IDE2cHg7XG4gICAgICAgICAgZm9udC1zaXplOiAxMnB4O1xuICAgICAgICAgIGZvbnQtd2VpZ2h0OiA2MDA7XG4gICAgICAgICAgY3Vyc29yOiBwb2ludGVyO1xuICAgICAgICAgIHRyYW5zaXRpb246IGFsbCAwLjNzIGVhc2U7XG4gICAgICAgIH1cbiAgICAgICAgLnJlc2V0LWJ0bjpob3ZlciB7XG4gICAgICAgICAgYmFja2dyb3VuZDogI2RjMjYyNjtcbiAgICAgICAgfVxuICAgICAgPC9zdHlsZT5cbiAgICAgIDxkaXYgY2xhc3M9XCJjaGF0LWhlYWRlclwiPlxuICAgICAgICA8aDE+8J+SrCDtirntl4gg6rCA7J2065OcIOuPhOyasOuvuDwvaDE+XG4gICAgICAgIDxkaXYgc3R5bGU9XCJkaXNwbGF5OiBmbGV4OyBnYXA6IDhweDsgYWxpZ24taXRlbXM6IGNlbnRlcjtcIj5cbiAgICAgICAgICA8YnV0dG9uIGNsYXNzPVwicmVzZXQtYnRuXCI+7LKY7J2M67aA7YSwIOuLpOyLnDwvYnV0dG9uPlxuICAgICAgICAgIDxidXR0b24gY2xhc3M9XCJjbG9zZS1idG5cIj7DlzwvYnV0dG9uPlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cIm1lc3NhZ2VzXCI+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJtZXNzYWdlIGFzc2lzdGFudFwiPlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJtZXNzYWdlLWNvbnRlbnRcIj7slYjrhZXtlZjshLjsmpQhIO2Kue2XiCDqs6DqsJ0g65Ox66Gd7J2EIOuPhOyZgOuTnOumtOq5jOyalD8g8J+agDxicj48YnI+MTLri6jqs4TroZwg6rWs7ISx65CcIOqwgOydtOuTnOulvCDthrXtlbQg7Im96rKMIOuTseuhne2VmOyLpCDsiJgg7J6I7Iq164uI64ukLjwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cInF1aWNrLWFjdGlvbnNcIj5cbiAgICAgICAgPGJ1dHRvbiBjbGFzcz1cInN0YXJ0LWd1aWRlLWJ0blwiPuuEtSEg7Iuc7J6R7ZWg6rKM7JqUIPCfkY08L2J1dHRvbj5cbiAgICAgIDwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cImlucHV0LWNvbnRhaW5lciBoaWRkZW5cIj5cbiAgICAgICAgPGlucHV0IHR5cGU9XCJ0ZXh0XCIgcGxhY2Vob2xkZXI9XCLrqZTsi5zsp4Drpbwg7J6F66Cl7ZWY7IS47JqUXCIgLz5cbiAgICAgICAgPGJ1dHRvbj7soITshqE8L2J1dHRvbj5cbiAgICAgIDwvZGl2PlxuICAgIGA7XG5cbiAgICBidXR0b24uYWRkRXZlbnRMaXN0ZW5lcignbW91c2VlbnRlcicsICgpID0+IHtcbiAgICAgIGJ1dHRvbi5zdHlsZS50cmFuc2Zvcm0gPSAndHJhbnNsYXRlWSgtMnB4KSc7XG4gICAgICBidXR0b24uc3R5bGUuYm94U2hhZG93ID0gJzAgNnB4IDIwcHggcmdiYSgxMDIsIDEyNiwgMjM0LCAwLjYpJztcbiAgICB9KTtcblxuICAgIGJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWxlYXZlJywgKCkgPT4ge1xuICAgICAgYnV0dG9uLnN0eWxlLnRyYW5zZm9ybSA9ICd0cmFuc2xhdGVZKDApJztcbiAgICAgIGJ1dHRvbi5zdHlsZS5ib3hTaGFkb3cgPSAnMCA0cHggMTVweCByZ2JhKDEwMiwgMTI2LCAyMzQsIDAuNCknO1xuICAgIH0pO1xuXG4gICAgYnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuICAgICAgY29uc29sZS5sb2coJ0J1dHRvbiBjbGlja2VkIScpO1xuICAgICAgY2hhdFBhbmVsLnN0eWxlLmRpc3BsYXkgPSAnZmxleCc7XG4gICAgICBidXR0b24uc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICB9KTtcblxuICAgIGNvbnN0IGNsb3NlQnRuID0gY2hhdFBhbmVsLnF1ZXJ5U2VsZWN0b3IoJy5jbG9zZS1idG4nKTtcbiAgICBjbG9zZUJ0bj8uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG4gICAgICBjaGF0UGFuZWwuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgIGJ1dHRvbi5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcbiAgICB9KTtcblxuICAgIGNvbnN0IHJlc2V0QnRuID0gY2hhdFBhbmVsLnF1ZXJ5U2VsZWN0b3IoJy5yZXNldC1idG4nKTtcbiAgICByZXNldEJ0bj8uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG4gICAgICBjaHJvbWUuc3RvcmFnZS5sb2NhbC5yZW1vdmUoW1NUT1JBR0VfS0VZXSwgKCkgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZygnR3VpZGUgc3RhdGUgY2xlYXJlZCAtIHJlc3RhcnRpbmcgZnJvbSBiZWdpbm5pbmcnKTtcbiAgICAgICAgbG9jYXRpb24ucmVsb2FkKCk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGNvbnN0IGlucHV0ID0gY2hhdFBhbmVsLnF1ZXJ5U2VsZWN0b3IoJ2lucHV0Jyk7XG4gICAgY29uc3Qgc2VuZEJ0biA9IGNoYXRQYW5lbC5xdWVyeVNlbGVjdG9yKCcuaW5wdXQtY29udGFpbmVyIGJ1dHRvbicpO1xuICAgIGNvbnN0IG1lc3NhZ2VzQ29udGFpbmVyID0gY2hhdFBhbmVsLnF1ZXJ5U2VsZWN0b3IoJy5tZXNzYWdlcycpO1xuICAgIGNvbnN0IHF1aWNrQWN0aW9ucyA9IGNoYXRQYW5lbC5xdWVyeVNlbGVjdG9yKCcucXVpY2stYWN0aW9ucycpO1xuICAgIGNvbnN0IHN0YXJ0R3VpZGVCdG4gPSBjaGF0UGFuZWwucXVlcnlTZWxlY3RvcignLnN0YXJ0LWd1aWRlLWJ0bicpO1xuICAgIGNvbnN0IGlucHV0Q29udGFpbmVyID0gY2hhdFBhbmVsLnF1ZXJ5U2VsZWN0b3IoJy5pbnB1dC1jb250YWluZXInKTtcblxuICAgIGNvbnN0IHNlbmRNZXNzYWdlID0gYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgbWVzc2FnZSA9IChpbnB1dCBhcyBIVE1MSW5wdXRFbGVtZW50KS52YWx1ZS50cmltKCk7XG4gICAgICBpZiAoIW1lc3NhZ2UpIHJldHVybjtcblxuICAgICAgY29uc3QgdXNlck1lc3NhZ2VEaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgIHVzZXJNZXNzYWdlRGl2LmNsYXNzTmFtZSA9ICdtZXNzYWdlIHVzZXInO1xuICAgICAgdXNlck1lc3NhZ2VEaXYuaW5uZXJIVE1MID0gYDxkaXYgY2xhc3M9XCJtZXNzYWdlLWNvbnRlbnRcIj4ke21lc3NhZ2V9PC9kaXY+YDtcbiAgICAgIG1lc3NhZ2VzQ29udGFpbmVyPy5hcHBlbmRDaGlsZCh1c2VyTWVzc2FnZURpdik7XG5cbiAgICAgIChpbnB1dCBhcyBIVE1MSW5wdXRFbGVtZW50KS52YWx1ZSA9ICcnO1xuICAgICAgKHNlbmRCdG4gYXMgSFRNTEJ1dHRvbkVsZW1lbnQpLmRpc2FibGVkID0gdHJ1ZTtcblxuICAgICAgbWVzc2FnZXNDb250YWluZXI/LnNjcm9sbFRvKHsgdG9wOiBtZXNzYWdlc0NvbnRhaW5lci5zY3JvbGxIZWlnaHQsIGJlaGF2aW9yOiAnc21vb3RoJyB9KTtcblxuICAgICAgY29uc3Qgbm9ybWFsaXplZE1lc3NhZ2UgPSBtZXNzYWdlLnRvTG93ZXJDYXNlKCkudHJpbSgpO1xuICAgICAgY29uc3QgaXNTdGFydENvbW1hbmQgPSBub3JtYWxpemVkTWVzc2FnZSA9PT0gJ+uEpCcgfHwgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9ybWFsaXplZE1lc3NhZ2UgPT09ICfsmIgnIHx8IFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vcm1hbGl6ZWRNZXNzYWdlID09PSAn7Iuc7J6RJyB8fCBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBub3JtYWxpemVkTWVzc2FnZSA9PT0gJ+OFh+OFhycgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBub3JtYWxpemVkTWVzc2FnZSA9PT0gJ29rJyB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vcm1hbGl6ZWRNZXNzYWdlID09PSAneWVzJyB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vcm1hbGl6ZWRNZXNzYWdlLmluY2x1ZGVzKCfsi5zsnpEnKTtcblxuICAgICAgaWYgKGlzU3RhcnRDb21tYW5kKSB7XG4gICAgICAgIGNvbnN0IGFzc2lzdGFudE1lc3NhZ2VEaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgYXNzaXN0YW50TWVzc2FnZURpdi5jbGFzc05hbWUgPSAnbWVzc2FnZSBhc3Npc3RhbnQnO1xuICAgICAgICBhc3Npc3RhbnRNZXNzYWdlRGl2LmlubmVySFRNTCA9IGA8ZGl2IGNsYXNzPVwibWVzc2FnZS1jb250ZW50XCI+7KKL7Iq164uI64ukISDtirntl4gg6rOg6rCdIOuTseuhnSDqsIDsnbTrk5zrpbwg7Iuc7J6R7ZWY6rKg7Iq164uI64ukLiDwn46vPGJyPjxicj7tmZTrqbTsnZgg7ZWY7J2065287J207Yq466W8IOuUsOudvOqwgOupsCDri6jqs4Trs4TroZwg7KeE7ZaJ7ZW07KO87IS47JqUITwvZGl2PmA7XG4gICAgICAgIG1lc3NhZ2VzQ29udGFpbmVyPy5hcHBlbmRDaGlsZChhc3Npc3RhbnRNZXNzYWdlRGl2KTtcbiAgICAgICAgbWVzc2FnZXNDb250YWluZXI/LnNjcm9sbFRvKHsgdG9wOiBtZXNzYWdlc0NvbnRhaW5lci5zY3JvbGxIZWlnaHQsIGJlaGF2aW9yOiAnc21vb3RoJyB9KTtcblxuICAgICAgICAoc2VuZEJ0biBhcyBIVE1MQnV0dG9uRWxlbWVudCkuZGlzYWJsZWQgPSBmYWxzZTtcblxuICAgICAgICBjaHJvbWUucnVudGltZS5zZW5kTWVzc2FnZShcbiAgICAgICAgICB7XG4gICAgICAgICAgICB0eXBlOiAnQVNLX0FJJyxcbiAgICAgICAgICAgIHF1ZXN0aW9uOiBtZXNzYWdlLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgKHJlc3BvbnNlKSA9PiB7XG4gICAgICAgICAgICBpZiAocmVzcG9uc2Uuc3VjY2Vzcykge1xuICAgICAgICAgICAgICBzdGFydEd1aWRlKHJlc3BvbnNlLnN0ZXBzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjaHJvbWUucnVudGltZS5zZW5kTWVzc2FnZShcbiAgICAgICAgICB7XG4gICAgICAgICAgICB0eXBlOiAnQVNLX0FJJyxcbiAgICAgICAgICAgIHF1ZXN0aW9uOiBtZXNzYWdlLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgKHJlc3BvbnNlKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBhc3Npc3RhbnRNZXNzYWdlRGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgICAgICBhc3Npc3RhbnRNZXNzYWdlRGl2LmNsYXNzTmFtZSA9ICdtZXNzYWdlIGFzc2lzdGFudCc7XG4gICAgICAgICAgICBhc3Npc3RhbnRNZXNzYWdlRGl2LmlubmVySFRNTCA9IGA8ZGl2IGNsYXNzPVwibWVzc2FnZS1jb250ZW50XCI+6rCA7J2065Oc66W8IOyLnOyeke2VmOqyoOyKteuLiOuLpC4g7ZmU66m07J2EIO2ZleyduO2VtOyjvOyEuOyalCE8L2Rpdj5gO1xuICAgICAgICAgICAgbWVzc2FnZXNDb250YWluZXI/LmFwcGVuZENoaWxkKGFzc2lzdGFudE1lc3NhZ2VEaXYpO1xuICAgICAgICAgICAgbWVzc2FnZXNDb250YWluZXI/LnNjcm9sbFRvKHsgdG9wOiBtZXNzYWdlc0NvbnRhaW5lci5zY3JvbGxIZWlnaHQsIGJlaGF2aW9yOiAnc21vb3RoJyB9KTtcblxuICAgICAgICAgICAgKHNlbmRCdG4gYXMgSFRNTEJ1dHRvbkVsZW1lbnQpLmRpc2FibGVkID0gZmFsc2U7XG5cbiAgICAgICAgICAgIGlmIChyZXNwb25zZS5zdWNjZXNzKSB7XG4gICAgICAgICAgICAgIHN0YXJ0R3VpZGUocmVzcG9uc2Uuc3RlcHMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgc3RhcnRHdWlkZUJ0bj8uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG4gICAgICBjb25zdCB1c2VyTWVzc2FnZURpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgdXNlck1lc3NhZ2VEaXYuY2xhc3NOYW1lID0gJ21lc3NhZ2UgdXNlcic7XG4gICAgICB1c2VyTWVzc2FnZURpdi5pbm5lckhUTUwgPSBgPGRpdiBjbGFzcz1cIm1lc3NhZ2UtY29udGVudFwiPuuEtSEg7Iuc7J6R7ZWg6rKM7JqUIPCfkY08L2Rpdj5gO1xuICAgICAgbWVzc2FnZXNDb250YWluZXI/LmFwcGVuZENoaWxkKHVzZXJNZXNzYWdlRGl2KTtcblxuICAgICAgcXVpY2tBY3Rpb25zPy5jbGFzc0xpc3QuYWRkKCdoaWRkZW4nKTtcbiAgICAgIGlucHV0Q29udGFpbmVyPy5jbGFzc0xpc3QucmVtb3ZlKCdoaWRkZW4nKTtcblxuICAgICAgY29uc3QgYXNzaXN0YW50TWVzc2FnZURpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgYXNzaXN0YW50TWVzc2FnZURpdi5jbGFzc05hbWUgPSAnbWVzc2FnZSBhc3Npc3RhbnQnO1xuICAgICAgYXNzaXN0YW50TWVzc2FnZURpdi5pbm5lckhUTUwgPSBgPGRpdiBjbGFzcz1cIm1lc3NhZ2UtY29udGVudFwiPuyii+yKteuLiOuLpCEg7Yq57ZeIIOqzoOqwnSDrk7HroZ0g6rCA7J2065Oc66W8IOyLnOyeke2VmOqyoOyKteuLiOuLpC4g8J+Orzxicj48YnI+7ZmU66m07J2YIO2VmOydtOudvOydtO2KuOulvCDrlLDrnbzqsIDrqbAg64uo6rOE67OE66GcIOynhO2Wie2VtOyjvOyEuOyalCE8L2Rpdj5gO1xuICAgICAgbWVzc2FnZXNDb250YWluZXI/LmFwcGVuZENoaWxkKGFzc2lzdGFudE1lc3NhZ2VEaXYpO1xuICAgICAgbWVzc2FnZXNDb250YWluZXI/LnNjcm9sbFRvKHsgdG9wOiBtZXNzYWdlc0NvbnRhaW5lci5zY3JvbGxIZWlnaHQsIGJlaGF2aW9yOiAnc21vb3RoJyB9KTtcblxuICAgICAgY2hyb21lLnJ1bnRpbWUuc2VuZE1lc3NhZ2UoXG4gICAgICAgIHtcbiAgICAgICAgICB0eXBlOiAnQVNLX0FJJyxcbiAgICAgICAgICBxdWVzdGlvbjogJ+yLnOyekScsXG4gICAgICAgIH0sXG4gICAgICAgIChyZXNwb25zZSkgPT4ge1xuICAgICAgICAgIGlmIChyZXNwb25zZS5zdWNjZXNzKSB7XG4gICAgICAgICAgICBzdGFydEd1aWRlKHJlc3BvbnNlLnN0ZXBzKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICk7XG4gICAgfSk7XG5cbiAgICBzZW5kQnRuPy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHNlbmRNZXNzYWdlKTtcbiAgICBpbnB1dD8uYWRkRXZlbnRMaXN0ZW5lcigna2V5cHJlc3MnLCAoZSkgPT4ge1xuICAgICAgaWYgKGUua2V5ID09PSAnRW50ZXInKSB7XG4gICAgICAgIHNlbmRNZXNzYWdlKCk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBzaGFkb3cuYXBwZW5kQ2hpbGQoYnV0dG9uKTtcbiAgICBjaGF0UGFuZWxDb250YWluZXIuYXBwZW5kQ2hpbGQoY2hhdFBhbmVsKTtcbiAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGNvbnRhaW5lcik7XG5cbiAgICBjaHJvbWUuc3RvcmFnZS5sb2NhbC5nZXQoW1NUT1JBR0VfS0VZXSwgKHJlc3VsdCkgPT4ge1xuICAgICAgaWYgKHJlc3VsdFtTVE9SQUdFX0tFWV0pIHtcbiAgICAgICAgY29uc3QgeyBjdXJyZW50U3RlcCB9ID0gcmVzdWx0W1NUT1JBR0VfS0VZXTtcbiAgICAgICAgY29uc29sZS5sb2coYFJlc3VtaW5nIGd1aWRlIGZyb20gc3RlcCAke2N1cnJlbnRTdGVwICsgMX1gKTtcbiAgICAgICAgY2hhdFBhbmVsLnN0eWxlLmRpc3BsYXkgPSAnZmxleCc7XG4gICAgICAgIGJ1dHRvbi5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICBcbiAgICAgICAgY2hyb21lLnJ1bnRpbWUuc2VuZE1lc3NhZ2UoXG4gICAgICAgICAgeyB0eXBlOiAnQVNLX0FJJywgcXVlc3Rpb246ICfqsIDsnbTrk5wg7J6s6rCcJyB9LFxuICAgICAgICAgIChyZXNwb25zZSkgPT4ge1xuICAgICAgICAgICAgaWYgKHJlc3BvbnNlLnN1Y2Nlc3MpIHtcbiAgICAgICAgICAgICAgY29uc3QgcmVzdW1lTWVzc2FnZURpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICAgICAgICByZXN1bWVNZXNzYWdlRGl2LmNsYXNzTmFtZSA9ICdtZXNzYWdlIGFzc2lzdGFudCc7XG4gICAgICAgICAgICAgIHJlc3VtZU1lc3NhZ2VEaXYuaW5uZXJIVE1MID0gYDxkaXYgY2xhc3M9XCJtZXNzYWdlLWNvbnRlbnRcIj7qsIDsnbTrk5zrpbwg6rOE7IaNIOynhO2Wie2VqeuLiOuLpCEgKCR7Y3VycmVudFN0ZXAgKyAxfS8ke3Jlc3BvbnNlLnN0ZXBzLmxlbmd0aH3ri6jqs4QpPC9kaXY+YDtcbiAgICAgICAgICAgICAgbWVzc2FnZXNDb250YWluZXI/LmFwcGVuZENoaWxkKHJlc3VtZU1lc3NhZ2VEaXYpO1xuICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgc3RhcnRHdWlkZShyZXNwb25zZS5zdGVwcywgY3VycmVudFN0ZXApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGNocm9tZS5ydW50aW1lLm9uTWVzc2FnZS5hZGRMaXN0ZW5lcigobWVzc2FnZSwgc2VuZGVyLCBzZW5kUmVzcG9uc2UpID0+IHtcbiAgICAgIGlmIChtZXNzYWdlLnR5cGUgPT09ICdTVEFSVF9HVUlERScpIHtcbiAgICAgICAgc3RhcnRHdWlkZShtZXNzYWdlLnN0ZXBzKTtcbiAgICAgICAgc2VuZFJlc3BvbnNlKHsgc3VjY2VzczogdHJ1ZSB9KTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGZ1bmN0aW9uIHN0YXJ0R3VpZGUoc3RlcHM6IEFycmF5PHsgc2VsZWN0b3I6IHN0cmluZzsgdGl0bGU6IHN0cmluZzsgZGVzY3JpcHRpb246IHN0cmluZzsgdXJsPzogc3RyaW5nOyBleHRlcm5hbExpbms/OiBzdHJpbmc7IGF1dG9BZHZhbmNlPzogYm9vbGVhbiB9Piwgc3RhcnRGcm9tU3RlcDogbnVtYmVyID0gMCkge1xuICAgICAgbGV0IGN1cnJlbnRTdGVwSW5kZXggPSBzdGFydEZyb21TdGVwO1xuICAgICAgbGV0IGN1cnJlbnREcml2ZXI6IGFueSA9IG51bGw7XG4gICAgICBsZXQgY2xpY2tMaXN0ZW5lcjogKChlOiBFdmVudCkgPT4gdm9pZCkgfCBudWxsID0gbnVsbDtcblxuICAgICAgY29uc3Qgc2F2ZVByb2dyZXNzID0gKHN0ZXBJbmRleDogbnVtYmVyKSA9PiB7XG4gICAgICAgIGNocm9tZS5zdG9yYWdlLmxvY2FsLnNldCh7XG4gICAgICAgICAgW1NUT1JBR0VfS0VZXToge1xuICAgICAgICAgICAgY3VycmVudFN0ZXA6IHN0ZXBJbmRleCxcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfTtcblxuICAgICAgY29uc3QgY2xlYXJQcm9ncmVzcyA9ICgpID0+IHtcbiAgICAgICAgY2hyb21lLnN0b3JhZ2UubG9jYWwucmVtb3ZlKFtTVE9SQUdFX0tFWV0pO1xuICAgICAgfTtcblxuICAgICAgY29uc3QgbW92ZVRvTmV4dFN0ZXAgPSAoKSA9PiB7XG4gICAgICAgIGlmIChjdXJyZW50RHJpdmVyKSB7XG4gICAgICAgICAgY3VycmVudERyaXZlci5kZXN0cm95KCk7XG4gICAgICAgICAgY3VycmVudERyaXZlciA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmIChjbGlja0xpc3RlbmVyKSB7XG4gICAgICAgICAgY29uc3QgY3VycmVudFN0ZXAgPSBzdGVwc1tjdXJyZW50U3RlcEluZGV4XTtcbiAgICAgICAgICBjb25zdCBjdXJyZW50RWxlbWVudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoY3VycmVudFN0ZXAuc2VsZWN0b3IpO1xuICAgICAgICAgIGlmIChjdXJyZW50RWxlbWVudCkge1xuICAgICAgICAgICAgY3VycmVudEVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignY2xpY2snLCBjbGlja0xpc3RlbmVyKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgY2xpY2tMaXN0ZW5lciA9IG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICBjdXJyZW50U3RlcEluZGV4Kys7XG4gICAgICAgIGlmIChjdXJyZW50U3RlcEluZGV4IDwgc3RlcHMubGVuZ3RoKSB7XG4gICAgICAgICAgc2F2ZVByb2dyZXNzKGN1cnJlbnRTdGVwSW5kZXgpO1xuICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4gc2hvd1N0ZXAoY3VycmVudFN0ZXBJbmRleCksIDMwMCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY2xlYXJQcm9ncmVzcygpO1xuICAgICAgICAgIGNvbnN0IGNvbXBsZXRpb25NZXNzYWdlRGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgICAgY29tcGxldGlvbk1lc3NhZ2VEaXYuY2xhc3NOYW1lID0gJ21lc3NhZ2UgYXNzaXN0YW50JztcbiAgICAgICAgICBjb21wbGV0aW9uTWVzc2FnZURpdi5pbm5lckhUTUwgPSBgPGRpdiBjbGFzcz1cIm1lc3NhZ2UtY29udGVudFwiPvCfjokg6rCA7J2065Oc66W8IOuqqOuRkCDsmYTro4ztlojsirXri4jri6QhPC9kaXY+YDtcbiAgICAgICAgICBtZXNzYWdlc0NvbnRhaW5lcj8uYXBwZW5kQ2hpbGQoY29tcGxldGlvbk1lc3NhZ2VEaXYpO1xuICAgICAgICAgIG1lc3NhZ2VzQ29udGFpbmVyPy5zY3JvbGxUbyh7IHRvcDogbWVzc2FnZXNDb250YWluZXIuc2Nyb2xsSGVpZ2h0LCBiZWhhdmlvcjogJ3Ntb290aCcgfSk7XG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IHNob3dTdGVwID0gKGluZGV4OiBudW1iZXIsIHJldHJ5Q291bnQ6IG51bWJlciA9IDApID0+IHtcbiAgICAgICAgaWYgKGluZGV4ID49IHN0ZXBzLmxlbmd0aCkgcmV0dXJuO1xuXG4gICAgICAgIGNvbnN0IHN0ZXAgPSBzdGVwc1tpbmRleF07XG4gICAgICAgIFxuICAgICAgICBpZiAoc3RlcC51cmwgJiYgIXdpbmRvdy5sb2NhdGlvbi5ocmVmLmluY2x1ZGVzKHN0ZXAudXJsLnNwbGl0KCcvJykucG9wKCkgfHwgJycpKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coYEN1cnJlbnQgcGFnZSBkb2Vzbid0IG1hdGNoIHN0ZXAgJHtpbmRleCArIDF9IFVSTC4gRXhwZWN0ZWQ6ICR7c3RlcC51cmx9LCBDdXJyZW50OiAke3dpbmRvdy5sb2NhdGlvbi5ocmVmfWApO1xuICAgICAgICAgIFxuICAgICAgICAgIGlmIChyZXRyeUNvdW50IDwgMTApIHtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4gc2hvd1N0ZXAoaW5kZXgsIHJldHJ5Q291bnQgKyAxKSwgNTAwKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc3QgZXJyb3JNZXNzYWdlRGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgICAgICBlcnJvck1lc3NhZ2VEaXYuY2xhc3NOYW1lID0gJ21lc3NhZ2UgYXNzaXN0YW50JztcbiAgICAgICAgICAgIGVycm9yTWVzc2FnZURpdi5pbm5lckhUTUwgPSBgPGRpdiBjbGFzcz1cIm1lc3NhZ2UtY29udGVudFwiPuKaoO+4jyDsmKzrsJTrpbgg7Y6Y7J207KeA66GcIOydtOuPme2VmOyngCDslYrslZjsirXri4jri6QuPGJyPjxicj7smIjsg4Eg7Y6Y7J207KeAOiAke3N0ZXAudXJsfTxicj7tmITsnqwg7Y6Y7J207KeAOiAke3dpbmRvdy5sb2NhdGlvbi5ocmVmfTxicj48YnI+7Y6Y7J207KeA66W8IO2ZleyduO2VtOyjvOyEuOyalC48L2Rpdj5gO1xuICAgICAgICAgICAgbWVzc2FnZXNDb250YWluZXI/LmFwcGVuZENoaWxkKGVycm9yTWVzc2FnZURpdik7XG4gICAgICAgICAgICBtZXNzYWdlc0NvbnRhaW5lcj8uc2Nyb2xsVG8oeyB0b3A6IG1lc3NhZ2VzQ29udGFpbmVyLnNjcm9sbEhlaWdodCwgYmVoYXZpb3I6ICdzbW9vdGgnIH0pO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBjb25zdCBza2lwQnV0dG9uRGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgICAgICBza2lwQnV0dG9uRGl2LnN0eWxlLmNzc1RleHQgPSAncGFkZGluZzogMCAyMHB4IDIwcHg7IGRpc3BsYXk6IGZsZXg7IGdhcDogMTBweDsnO1xuICAgICAgICAgICAgc2tpcEJ1dHRvbkRpdi5pbm5lckhUTUwgPSBgXG4gICAgICAgICAgICAgIDxidXR0b24gc3R5bGU9XCJmbGV4OiAxOyBiYWNrZ3JvdW5kOiAjZWY0NDQ0OyBjb2xvcjogd2hpdGU7IGJvcmRlcjogbm9uZTsgYm9yZGVyLXJhZGl1czogOHB4OyBwYWRkaW5nOiAxMnB4OyBmb250LXdlaWdodDogNjAwOyBjdXJzb3I6IHBvaW50ZXI7XCI+6rCA7J2065OcIOyiheujjDwvYnV0dG9uPlxuICAgICAgICAgICAgICA8YnV0dG9uIHN0eWxlPVwiZmxleDogMTsgYmFja2dyb3VuZDogIzY2N2VlYTsgY29sb3I6IHdoaXRlOyBib3JkZXI6IG5vbmU7IGJvcmRlci1yYWRpdXM6IDhweDsgcGFkZGluZzogMTJweDsgZm9udC13ZWlnaHQ6IDYwMDsgY3Vyc29yOiBwb2ludGVyO1wiPuuLpOyLnCDsi5zrj4Q8L2J1dHRvbj5cbiAgICAgICAgICAgIGA7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGNvbnN0IGVuZEJ0biA9IHNraXBCdXR0b25EaXYucXVlcnlTZWxlY3RvcignYnV0dG9uOmZpcnN0LWNoaWxkJyk7XG4gICAgICAgICAgICBjb25zdCByZXRyeUJ0biA9IHNraXBCdXR0b25EaXYucXVlcnlTZWxlY3RvcignYnV0dG9uOmxhc3QtY2hpbGQnKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgZW5kQnRuPy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgICAgICAgICAgICAgY2xlYXJQcm9ncmVzcygpO1xuICAgICAgICAgICAgICBza2lwQnV0dG9uRGl2LnJlbW92ZSgpO1xuICAgICAgICAgICAgICBjb25zdCBlbmRNZXNzYWdlRGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgICAgICAgIGVuZE1lc3NhZ2VEaXYuY2xhc3NOYW1lID0gJ21lc3NhZ2UgYXNzaXN0YW50JztcbiAgICAgICAgICAgICAgZW5kTWVzc2FnZURpdi5pbm5lckhUTUwgPSBgPGRpdiBjbGFzcz1cIm1lc3NhZ2UtY29udGVudFwiPuqwgOydtOuTnOulvCDsooXro4ztlojsirXri4jri6QuPC9kaXY+YDtcbiAgICAgICAgICAgICAgbWVzc2FnZXNDb250YWluZXI/LmFwcGVuZENoaWxkKGVuZE1lc3NhZ2VEaXYpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHJldHJ5QnRuPy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgICAgICAgICAgICAgc2tpcEJ1dHRvbkRpdi5yZW1vdmUoKTtcbiAgICAgICAgICAgICAgc2hvd1N0ZXAoaW5kZXgsIDApO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGNoYXRQYW5lbC5hcHBlbmRDaGlsZChza2lwQnV0dG9uRGl2KTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGNvbnN0IGVsZW1lbnQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKHN0ZXAuc2VsZWN0b3IpO1xuXG4gICAgICAgIGlmICghZWxlbWVudCkge1xuICAgICAgICAgIGNvbnNvbGUud2FybihgRWxlbWVudCBub3QgZm91bmQ6ICR7c3RlcC5zZWxlY3Rvcn0sIHJldHJ5ICR7cmV0cnlDb3VudCArIDF9LzEwYCk7XG4gICAgICAgICAgXG4gICAgICAgICAgaWYgKHJldHJ5Q291bnQgPCAxMCkge1xuICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiBzaG93U3RlcChpbmRleCwgcmV0cnlDb3VudCArIDEpLCA1MDApO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBlcnJvck1lc3NhZ2VEaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgICAgIGVycm9yTWVzc2FnZURpdi5jbGFzc05hbWUgPSAnbWVzc2FnZSBhc3Npc3RhbnQnO1xuICAgICAgICAgICAgZXJyb3JNZXNzYWdlRGl2LmlubmVySFRNTCA9IGA8ZGl2IGNsYXNzPVwibWVzc2FnZS1jb250ZW50XCI+4pqg77iPIOydtCDtjpjsnbTsp4Dsl5DshJwg64uk7J2MIOuLqOqzhOulvCDssL7snYQg7IiYIOyXhuyKteuLiOuLpC48YnI+PGJyPuyYrOuwlOuluCDtjpjsnbTsp4DroZwg7J2064+Z7ZaI64qU7KeAIO2ZleyduO2VtOyjvOyEuOyalC48YnI+PGJyPuynhO2WieydhCDqs4Tsho3tlZjroKTrqbQg7JWE656YIOuyhO2KvOydhCDriIzrn6zso7zshLjsmpQuPC9kaXY+YDtcbiAgICAgICAgICAgIG1lc3NhZ2VzQ29udGFpbmVyPy5hcHBlbmRDaGlsZChlcnJvck1lc3NhZ2VEaXYpO1xuICAgICAgICAgICAgbWVzc2FnZXNDb250YWluZXI/LnNjcm9sbFRvKHsgdG9wOiBtZXNzYWdlc0NvbnRhaW5lci5zY3JvbGxIZWlnaHQsIGJlaGF2aW9yOiAnc21vb3RoJyB9KTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgY29uc3Qgc2tpcEJ1dHRvbkRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICAgICAgc2tpcEJ1dHRvbkRpdi5zdHlsZS5jc3NUZXh0ID0gJ3BhZGRpbmc6IDAgMjBweCAyMHB4OyBkaXNwbGF5OiBmbGV4OyBnYXA6IDEwcHg7JztcbiAgICAgICAgICAgIHNraXBCdXR0b25EaXYuaW5uZXJIVE1MID0gYFxuICAgICAgICAgICAgICA8YnV0dG9uIHN0eWxlPVwiZmxleDogMTsgYmFja2dyb3VuZDogI2VmNDQ0NDsgY29sb3I6IHdoaXRlOyBib3JkZXI6IG5vbmU7IGJvcmRlci1yYWRpdXM6IDhweDsgcGFkZGluZzogMTJweDsgZm9udC13ZWlnaHQ6IDYwMDsgY3Vyc29yOiBwb2ludGVyO1wiPuqwgOydtOuTnCDsooXro4w8L2J1dHRvbj5cbiAgICAgICAgICAgICAgPGJ1dHRvbiBzdHlsZT1cImZsZXg6IDE7IGJhY2tncm91bmQ6ICM2NjdlZWE7IGNvbG9yOiB3aGl0ZTsgYm9yZGVyOiBub25lOyBib3JkZXItcmFkaXVzOiA4cHg7IHBhZGRpbmc6IDEycHg7IGZvbnQtd2VpZ2h0OiA2MDA7IGN1cnNvcjogcG9pbnRlcjtcIj7ri6Tsi5wg7Iuc64+EPC9idXR0b24+XG4gICAgICAgICAgICBgO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBjb25zdCBlbmRCdG4gPSBza2lwQnV0dG9uRGl2LnF1ZXJ5U2VsZWN0b3IoJ2J1dHRvbjpmaXJzdC1jaGlsZCcpO1xuICAgICAgICAgICAgY29uc3QgcmV0cnlCdG4gPSBza2lwQnV0dG9uRGl2LnF1ZXJ5U2VsZWN0b3IoJ2J1dHRvbjpsYXN0LWNoaWxkJyk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGVuZEJ0bj8uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG4gICAgICAgICAgICAgIGNsZWFyUHJvZ3Jlc3MoKTtcbiAgICAgICAgICAgICAgc2tpcEJ1dHRvbkRpdi5yZW1vdmUoKTtcbiAgICAgICAgICAgICAgY29uc3QgZW5kTWVzc2FnZURpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICAgICAgICBlbmRNZXNzYWdlRGl2LmNsYXNzTmFtZSA9ICdtZXNzYWdlIGFzc2lzdGFudCc7XG4gICAgICAgICAgICAgIGVuZE1lc3NhZ2VEaXYuaW5uZXJIVE1MID0gYDxkaXYgY2xhc3M9XCJtZXNzYWdlLWNvbnRlbnRcIj7qsIDsnbTrk5zrpbwg7KKF66OM7ZaI7Iq164uI64ukLjwvZGl2PmA7XG4gICAgICAgICAgICAgIG1lc3NhZ2VzQ29udGFpbmVyPy5hcHBlbmRDaGlsZChlbmRNZXNzYWdlRGl2KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICByZXRyeUJ0bj8uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG4gICAgICAgICAgICAgIHNraXBCdXR0b25EaXYucmVtb3ZlKCk7XG4gICAgICAgICAgICAgIHNob3dTdGVwKGluZGV4LCAwKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBjaGF0UGFuZWwuYXBwZW5kQ2hpbGQoc2tpcEJ1dHRvbkRpdik7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgbGV0IGRlc2NyaXB0aW9uID0gc3RlcC5kZXNjcmlwdGlvbjtcbiAgICAgICAgaWYgKHN0ZXAuZXh0ZXJuYWxMaW5rKSB7XG4gICAgICAgICAgZGVzY3JpcHRpb24gKz0gYDxicj48YnI+PGEgaHJlZj1cIiR7c3RlcC5leHRlcm5hbExpbmt9XCIgdGFyZ2V0PVwiX2JsYW5rXCIgc3R5bGU9XCJjb2xvcjogIzY2N2VlYTsgZm9udC13ZWlnaHQ6IGJvbGQ7XCI+8J+UlyAke3N0ZXAuZXh0ZXJuYWxMaW5rfTwvYT5gO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHN0ZXAuYXV0b0FkdmFuY2UgIT09IGZhbHNlKSB7XG4gICAgICAgICAgZGVzY3JpcHRpb24gKz0gYDxicj48YnI+PHNtYWxsIHN0eWxlPVwiY29sb3I6ICM5Y2EzYWY7XCI+8J+SoSDsnbQg7JqU7IaM66W8IOyngeygkSDtgbTrpq3tlZjrqbQg7J6Q64+Z7Jy866GcIOuLpOydjCDri6jqs4TroZwg64SY7Ja06rCR64uI64ukLjwvc21hbGw+YDtcbiAgICAgICAgICBcbiAgICAgICAgICBjdXJyZW50RHJpdmVyID0gZHJpdmVyKHtcbiAgICAgICAgICAgIHNob3dQcm9ncmVzczogdHJ1ZSxcbiAgICAgICAgICAgIHNob3dCdXR0b25zOiBbJ25leHQnLCAncHJldmlvdXMnLCAnY2xvc2UnXSxcbiAgICAgICAgICAgIHN0ZXBzOiBbe1xuICAgICAgICAgICAgICBlbGVtZW50OiBzdGVwLnNlbGVjdG9yLFxuICAgICAgICAgICAgICBwb3BvdmVyOiB7XG4gICAgICAgICAgICAgICAgdGl0bGU6IHN0ZXAudGl0bGUsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IGRlc2NyaXB0aW9uLFxuICAgICAgICAgICAgICAgIHNpZGU6ICdsZWZ0JyxcbiAgICAgICAgICAgICAgICBhbGlnbjogJ3N0YXJ0JyxcbiAgICAgICAgICAgICAgICBvbk5leHRDbGljazogKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgbW92ZVRvTmV4dFN0ZXAoKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIG9uUHJldkNsaWNrOiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICBpZiAoY3VycmVudERyaXZlcikge1xuICAgICAgICAgICAgICAgICAgICBjdXJyZW50RHJpdmVyLmRlc3Ryb3koKTtcbiAgICAgICAgICAgICAgICAgICAgY3VycmVudERyaXZlciA9IG51bGw7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICBpZiAoaW5kZXggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnRTdGVwSW5kZXggPSBpbmRleCAtIDE7XG4gICAgICAgICAgICAgICAgICAgIHNhdmVQcm9ncmVzcyhjdXJyZW50U3RlcEluZGV4KTtcbiAgICAgICAgICAgICAgICAgICAgc2hvd1N0ZXAoY3VycmVudFN0ZXBJbmRleCk7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBvbkNsb3NlQ2xpY2s6ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgIGlmIChjdXJyZW50RHJpdmVyKSB7XG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnREcml2ZXIuZGVzdHJveSgpO1xuICAgICAgICAgICAgICAgICAgICBjdXJyZW50RHJpdmVyID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIGNsZWFyUHJvZ3Jlc3MoKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfV0sXG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgICBjbGlja0xpc3RlbmVyID0gKGU6IEV2ZW50KSA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnRWxlbWVudCBjbGlja2VkISBNb3ZpbmcgdG8gbmV4dCBzdGVwLi4uJyk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGNvbnN0IG5leHRTdGVwSW5kZXggPSBjdXJyZW50U3RlcEluZGV4ICsgMTtcbiAgICAgICAgICAgIGlmIChuZXh0U3RlcEluZGV4IDwgc3RlcHMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgIHNhdmVQcm9ncmVzcyhuZXh0U3RlcEluZGV4KTtcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coYFNhdmVkIHByb2dyZXNzOiBzdGVwICR7bmV4dFN0ZXBJbmRleH1gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgIG1vdmVUb05leHRTdGVwKCk7XG4gICAgICAgICAgICB9LCAxMDApO1xuICAgICAgICAgIH07XG5cbiAgICAgICAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgY2xpY2tMaXN0ZW5lciwgeyBjYXB0dXJlOiB0cnVlLCBvbmNlOiB0cnVlIH0pO1xuICAgICAgICAgIFxuICAgICAgICAgIGVsZW1lbnQuc2Nyb2xsSW50b1ZpZXcoeyBiZWhhdmlvcjogJ3Ntb290aCcsIGJsb2NrOiAnY2VudGVyJyB9KTtcbiAgICAgICAgICBjdXJyZW50RHJpdmVyLmRyaXZlKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY29uc3Qgc3RlcE1lc3NhZ2VEaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgICBzdGVwTWVzc2FnZURpdi5jbGFzc05hbWUgPSAnbWVzc2FnZSBhc3Npc3RhbnQnO1xuICAgICAgICAgIHN0ZXBNZXNzYWdlRGl2LmlubmVySFRNTCA9IGA8ZGl2IGNsYXNzPVwibWVzc2FnZS1jb250ZW50XCI+PHN0cm9uZz4ke3N0ZXAudGl0bGV9PC9zdHJvbmc+PGJyPjxicj4ke3N0ZXAuZGVzY3JpcHRpb259JHtzdGVwLmV4dGVybmFsTGluayA/IGA8YnI+PGJyPjxhIGhyZWY9XCIke3N0ZXAuZXh0ZXJuYWxMaW5rfVwiIHRhcmdldD1cIl9ibGFua1wiIHN0eWxlPVwiY29sb3I6ICM2NjdlZWE7IGZvbnQtd2VpZ2h0OiBib2xkO1wiPvCflJcgJHtzdGVwLmV4dGVybmFsTGlua308L2E+YCA6ICcnfTwvZGl2PmA7XG4gICAgICAgICAgbWVzc2FnZXNDb250YWluZXI/LmFwcGVuZENoaWxkKHN0ZXBNZXNzYWdlRGl2KTtcbiAgICAgICAgICBcbiAgICAgICAgICBjb25zdCBjb21wbGV0ZUJ1dHRvbkRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICAgIGNvbXBsZXRlQnV0dG9uRGl2LnN0eWxlLmNzc1RleHQgPSAncGFkZGluZzogMCAyMHB4IDIwcHg7IGRpc3BsYXk6IGZsZXg7IGdhcDogMTBweDsnO1xuICAgICAgICAgIGNvbXBsZXRlQnV0dG9uRGl2LmlubmVySFRNTCA9IGBcbiAgICAgICAgICAgIDxidXR0b24gc3R5bGU9XCJmbGV4OiAxOyBiYWNrZ3JvdW5kOiBsaW5lYXItZ3JhZGllbnQoMTM1ZGVnLCAjMTBiOTgxIDAlLCAjMDU5NjY5IDEwMCUpOyBjb2xvcjogd2hpdGU7IGJvcmRlcjogbm9uZTsgYm9yZGVyLXJhZGl1czogMTJweDsgcGFkZGluZzogMTRweCAyOHB4OyBmb250LXNpemU6IDE2cHg7IGZvbnQtd2VpZ2h0OiA2MDA7IGN1cnNvcjogcG9pbnRlcjsgYm94LXNoYWRvdzogMCA0cHggMTJweCByZ2JhKDE2LCAxODUsIDEyOSwgMC4zKTtcIj7inIUg7JmE66OM7ZaI7Ja07JqUITwvYnV0dG9uPlxuICAgICAgICAgIGA7XG4gICAgICAgICAgXG4gICAgICAgICAgY29uc3QgY29tcGxldGVCdG4gPSBjb21wbGV0ZUJ1dHRvbkRpdi5xdWVyeVNlbGVjdG9yKCdidXR0b24nKTtcbiAgICAgICAgICBjb21wbGV0ZUJ0bj8uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG4gICAgICAgICAgICBjb21wbGV0ZUJ1dHRvbkRpdi5yZW1vdmUoKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgY29uc3QgY29tcGxldGVkTWVzc2FnZURpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICAgICAgY29tcGxldGVkTWVzc2FnZURpdi5jbGFzc05hbWUgPSAnbWVzc2FnZSB1c2VyJztcbiAgICAgICAgICAgIGNvbXBsZXRlZE1lc3NhZ2VEaXYuaW5uZXJIVE1MID0gYDxkaXYgY2xhc3M9XCJtZXNzYWdlLWNvbnRlbnRcIj7smYTro4ztlojslrTsmpQhPC9kaXY+YDtcbiAgICAgICAgICAgIG1lc3NhZ2VzQ29udGFpbmVyPy5hcHBlbmRDaGlsZChjb21wbGV0ZWRNZXNzYWdlRGl2KTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgbW92ZVRvTmV4dFN0ZXAoKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgICBcbiAgICAgICAgICBjaGF0UGFuZWwuYXBwZW5kQ2hpbGQoY29tcGxldGVCdXR0b25EaXYpO1xuICAgICAgICAgIG1lc3NhZ2VzQ29udGFpbmVyPy5zY3JvbGxUbyh7IHRvcDogbWVzc2FnZXNDb250YWluZXIuc2Nyb2xsSGVpZ2h0LCBiZWhhdmlvcjogJ3Ntb290aCcgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICBjb25zdCBoaWdobGlnaHRlZEVsZW1lbnQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuZHJpdmVyLWFjdGl2ZS1lbGVtZW50Jyk7XG4gICAgICAgICAgaWYgKGhpZ2hsaWdodGVkRWxlbWVudCkge1xuICAgICAgICAgICAgKGhpZ2hsaWdodGVkRWxlbWVudCBhcyBIVE1MRWxlbWVudCkuc3R5bGUucG9pbnRlckV2ZW50cyA9ICdhdXRvJztcbiAgICAgICAgICAgIChoaWdobGlnaHRlZEVsZW1lbnQgYXMgSFRNTEVsZW1lbnQpLnN0eWxlLmN1cnNvciA9ICdwb2ludGVyJztcbiAgICAgICAgICB9XG4gICAgICAgIH0sIDEwMCk7XG4gICAgICB9O1xuXG4gICAgICBzaG93U3RlcChzdGFydEZyb21TdGVwKTtcbiAgICB9XG4gIH0sXG59KTtcbiIsIi8vICNyZWdpb24gc25pcHBldFxuZXhwb3J0IGNvbnN0IGJyb3dzZXIgPSBnbG9iYWxUaGlzLmJyb3dzZXI/LnJ1bnRpbWU/LmlkXG4gID8gZ2xvYmFsVGhpcy5icm93c2VyXG4gIDogZ2xvYmFsVGhpcy5jaHJvbWU7XG4vLyAjZW5kcmVnaW9uIHNuaXBwZXRcbiIsImltcG9ydCB7IGJyb3dzZXIgYXMgX2Jyb3dzZXIgfSBmcm9tIFwiQHd4dC1kZXYvYnJvd3NlclwiO1xuZXhwb3J0IGNvbnN0IGJyb3dzZXIgPSBfYnJvd3NlcjtcbmV4cG9ydCB7fTtcbiIsImZ1bmN0aW9uIHByaW50KG1ldGhvZCwgLi4uYXJncykge1xuICBpZiAoaW1wb3J0Lm1ldGEuZW52Lk1PREUgPT09IFwicHJvZHVjdGlvblwiKSByZXR1cm47XG4gIGlmICh0eXBlb2YgYXJnc1swXSA9PT0gXCJzdHJpbmdcIikge1xuICAgIGNvbnN0IG1lc3NhZ2UgPSBhcmdzLnNoaWZ0KCk7XG4gICAgbWV0aG9kKGBbd3h0XSAke21lc3NhZ2V9YCwgLi4uYXJncyk7XG4gIH0gZWxzZSB7XG4gICAgbWV0aG9kKFwiW3d4dF1cIiwgLi4uYXJncyk7XG4gIH1cbn1cbmV4cG9ydCBjb25zdCBsb2dnZXIgPSB7XG4gIGRlYnVnOiAoLi4uYXJncykgPT4gcHJpbnQoY29uc29sZS5kZWJ1ZywgLi4uYXJncyksXG4gIGxvZzogKC4uLmFyZ3MpID0+IHByaW50KGNvbnNvbGUubG9nLCAuLi5hcmdzKSxcbiAgd2FybjogKC4uLmFyZ3MpID0+IHByaW50KGNvbnNvbGUud2FybiwgLi4uYXJncyksXG4gIGVycm9yOiAoLi4uYXJncykgPT4gcHJpbnQoY29uc29sZS5lcnJvciwgLi4uYXJncylcbn07XG4iLCJpbXBvcnQgeyBicm93c2VyIH0gZnJvbSBcInd4dC9icm93c2VyXCI7XG5leHBvcnQgY2xhc3MgV3h0TG9jYXRpb25DaGFuZ2VFdmVudCBleHRlbmRzIEV2ZW50IHtcbiAgY29uc3RydWN0b3IobmV3VXJsLCBvbGRVcmwpIHtcbiAgICBzdXBlcihXeHRMb2NhdGlvbkNoYW5nZUV2ZW50LkVWRU5UX05BTUUsIHt9KTtcbiAgICB0aGlzLm5ld1VybCA9IG5ld1VybDtcbiAgICB0aGlzLm9sZFVybCA9IG9sZFVybDtcbiAgfVxuICBzdGF0aWMgRVZFTlRfTkFNRSA9IGdldFVuaXF1ZUV2ZW50TmFtZShcInd4dDpsb2NhdGlvbmNoYW5nZVwiKTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBnZXRVbmlxdWVFdmVudE5hbWUoZXZlbnROYW1lKSB7XG4gIHJldHVybiBgJHticm93c2VyPy5ydW50aW1lPy5pZH06JHtpbXBvcnQubWV0YS5lbnYuRU5UUllQT0lOVH06JHtldmVudE5hbWV9YDtcbn1cbiIsImltcG9ydCB7IFd4dExvY2F0aW9uQ2hhbmdlRXZlbnQgfSBmcm9tIFwiLi9jdXN0b20tZXZlbnRzLm1qc1wiO1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUxvY2F0aW9uV2F0Y2hlcihjdHgpIHtcbiAgbGV0IGludGVydmFsO1xuICBsZXQgb2xkVXJsO1xuICByZXR1cm4ge1xuICAgIC8qKlxuICAgICAqIEVuc3VyZSB0aGUgbG9jYXRpb24gd2F0Y2hlciBpcyBhY3RpdmVseSBsb29raW5nIGZvciBVUkwgY2hhbmdlcy4gSWYgaXQncyBhbHJlYWR5IHdhdGNoaW5nLFxuICAgICAqIHRoaXMgaXMgYSBub29wLlxuICAgICAqL1xuICAgIHJ1bigpIHtcbiAgICAgIGlmIChpbnRlcnZhbCAhPSBudWxsKSByZXR1cm47XG4gICAgICBvbGRVcmwgPSBuZXcgVVJMKGxvY2F0aW9uLmhyZWYpO1xuICAgICAgaW50ZXJ2YWwgPSBjdHguc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICAgICAgICBsZXQgbmV3VXJsID0gbmV3IFVSTChsb2NhdGlvbi5ocmVmKTtcbiAgICAgICAgaWYgKG5ld1VybC5ocmVmICE9PSBvbGRVcmwuaHJlZikge1xuICAgICAgICAgIHdpbmRvdy5kaXNwYXRjaEV2ZW50KG5ldyBXeHRMb2NhdGlvbkNoYW5nZUV2ZW50KG5ld1VybCwgb2xkVXJsKSk7XG4gICAgICAgICAgb2xkVXJsID0gbmV3VXJsO1xuICAgICAgICB9XG4gICAgICB9LCAxZTMpO1xuICAgIH1cbiAgfTtcbn1cbiIsImltcG9ydCB7IGJyb3dzZXIgfSBmcm9tIFwid3h0L2Jyb3dzZXJcIjtcbmltcG9ydCB7IGxvZ2dlciB9IGZyb20gXCIuLi91dGlscy9pbnRlcm5hbC9sb2dnZXIubWpzXCI7XG5pbXBvcnQge1xuICBnZXRVbmlxdWVFdmVudE5hbWVcbn0gZnJvbSBcIi4vaW50ZXJuYWwvY3VzdG9tLWV2ZW50cy5tanNcIjtcbmltcG9ydCB7IGNyZWF0ZUxvY2F0aW9uV2F0Y2hlciB9IGZyb20gXCIuL2ludGVybmFsL2xvY2F0aW9uLXdhdGNoZXIubWpzXCI7XG5leHBvcnQgY2xhc3MgQ29udGVudFNjcmlwdENvbnRleHQge1xuICBjb25zdHJ1Y3Rvcihjb250ZW50U2NyaXB0TmFtZSwgb3B0aW9ucykge1xuICAgIHRoaXMuY29udGVudFNjcmlwdE5hbWUgPSBjb250ZW50U2NyaXB0TmFtZTtcbiAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xuICAgIHRoaXMuYWJvcnRDb250cm9sbGVyID0gbmV3IEFib3J0Q29udHJvbGxlcigpO1xuICAgIGlmICh0aGlzLmlzVG9wRnJhbWUpIHtcbiAgICAgIHRoaXMubGlzdGVuRm9yTmV3ZXJTY3JpcHRzKHsgaWdub3JlRmlyc3RFdmVudDogdHJ1ZSB9KTtcbiAgICAgIHRoaXMuc3RvcE9sZFNjcmlwdHMoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5saXN0ZW5Gb3JOZXdlclNjcmlwdHMoKTtcbiAgICB9XG4gIH1cbiAgc3RhdGljIFNDUklQVF9TVEFSVEVEX01FU1NBR0VfVFlQRSA9IGdldFVuaXF1ZUV2ZW50TmFtZShcbiAgICBcInd4dDpjb250ZW50LXNjcmlwdC1zdGFydGVkXCJcbiAgKTtcbiAgaXNUb3BGcmFtZSA9IHdpbmRvdy5zZWxmID09PSB3aW5kb3cudG9wO1xuICBhYm9ydENvbnRyb2xsZXI7XG4gIGxvY2F0aW9uV2F0Y2hlciA9IGNyZWF0ZUxvY2F0aW9uV2F0Y2hlcih0aGlzKTtcbiAgcmVjZWl2ZWRNZXNzYWdlSWRzID0gLyogQF9fUFVSRV9fICovIG5ldyBTZXQoKTtcbiAgZ2V0IHNpZ25hbCgpIHtcbiAgICByZXR1cm4gdGhpcy5hYm9ydENvbnRyb2xsZXIuc2lnbmFsO1xuICB9XG4gIGFib3J0KHJlYXNvbikge1xuICAgIHJldHVybiB0aGlzLmFib3J0Q29udHJvbGxlci5hYm9ydChyZWFzb24pO1xuICB9XG4gIGdldCBpc0ludmFsaWQoKSB7XG4gICAgaWYgKGJyb3dzZXIucnVudGltZS5pZCA9PSBudWxsKSB7XG4gICAgICB0aGlzLm5vdGlmeUludmFsaWRhdGVkKCk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLnNpZ25hbC5hYm9ydGVkO1xuICB9XG4gIGdldCBpc1ZhbGlkKCkge1xuICAgIHJldHVybiAhdGhpcy5pc0ludmFsaWQ7XG4gIH1cbiAgLyoqXG4gICAqIEFkZCBhIGxpc3RlbmVyIHRoYXQgaXMgY2FsbGVkIHdoZW4gdGhlIGNvbnRlbnQgc2NyaXB0J3MgY29udGV4dCBpcyBpbnZhbGlkYXRlZC5cbiAgICpcbiAgICogQHJldHVybnMgQSBmdW5jdGlvbiB0byByZW1vdmUgdGhlIGxpc3RlbmVyLlxuICAgKlxuICAgKiBAZXhhbXBsZVxuICAgKiBicm93c2VyLnJ1bnRpbWUub25NZXNzYWdlLmFkZExpc3RlbmVyKGNiKTtcbiAgICogY29uc3QgcmVtb3ZlSW52YWxpZGF0ZWRMaXN0ZW5lciA9IGN0eC5vbkludmFsaWRhdGVkKCgpID0+IHtcbiAgICogICBicm93c2VyLnJ1bnRpbWUub25NZXNzYWdlLnJlbW92ZUxpc3RlbmVyKGNiKTtcbiAgICogfSlcbiAgICogLy8gLi4uXG4gICAqIHJlbW92ZUludmFsaWRhdGVkTGlzdGVuZXIoKTtcbiAgICovXG4gIG9uSW52YWxpZGF0ZWQoY2IpIHtcbiAgICB0aGlzLnNpZ25hbC5hZGRFdmVudExpc3RlbmVyKFwiYWJvcnRcIiwgY2IpO1xuICAgIHJldHVybiAoKSA9PiB0aGlzLnNpZ25hbC5yZW1vdmVFdmVudExpc3RlbmVyKFwiYWJvcnRcIiwgY2IpO1xuICB9XG4gIC8qKlxuICAgKiBSZXR1cm4gYSBwcm9taXNlIHRoYXQgbmV2ZXIgcmVzb2x2ZXMuIFVzZWZ1bCBpZiB5b3UgaGF2ZSBhbiBhc3luYyBmdW5jdGlvbiB0aGF0IHNob3VsZG4ndCBydW5cbiAgICogYWZ0ZXIgdGhlIGNvbnRleHQgaXMgZXhwaXJlZC5cbiAgICpcbiAgICogQGV4YW1wbGVcbiAgICogY29uc3QgZ2V0VmFsdWVGcm9tU3RvcmFnZSA9IGFzeW5jICgpID0+IHtcbiAgICogICBpZiAoY3R4LmlzSW52YWxpZCkgcmV0dXJuIGN0eC5ibG9jaygpO1xuICAgKlxuICAgKiAgIC8vIC4uLlxuICAgKiB9XG4gICAqL1xuICBibG9jaygpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKCkgPT4ge1xuICAgIH0pO1xuICB9XG4gIC8qKlxuICAgKiBXcmFwcGVyIGFyb3VuZCBgd2luZG93LnNldEludGVydmFsYCB0aGF0IGF1dG9tYXRpY2FsbHkgY2xlYXJzIHRoZSBpbnRlcnZhbCB3aGVuIGludmFsaWRhdGVkLlxuICAgKlxuICAgKiBJbnRlcnZhbHMgY2FuIGJlIGNsZWFyZWQgYnkgY2FsbGluZyB0aGUgbm9ybWFsIGBjbGVhckludGVydmFsYCBmdW5jdGlvbi5cbiAgICovXG4gIHNldEludGVydmFsKGhhbmRsZXIsIHRpbWVvdXQpIHtcbiAgICBjb25zdCBpZCA9IHNldEludGVydmFsKCgpID0+IHtcbiAgICAgIGlmICh0aGlzLmlzVmFsaWQpIGhhbmRsZXIoKTtcbiAgICB9LCB0aW1lb3V0KTtcbiAgICB0aGlzLm9uSW52YWxpZGF0ZWQoKCkgPT4gY2xlYXJJbnRlcnZhbChpZCkpO1xuICAgIHJldHVybiBpZDtcbiAgfVxuICAvKipcbiAgICogV3JhcHBlciBhcm91bmQgYHdpbmRvdy5zZXRUaW1lb3V0YCB0aGF0IGF1dG9tYXRpY2FsbHkgY2xlYXJzIHRoZSBpbnRlcnZhbCB3aGVuIGludmFsaWRhdGVkLlxuICAgKlxuICAgKiBUaW1lb3V0cyBjYW4gYmUgY2xlYXJlZCBieSBjYWxsaW5nIHRoZSBub3JtYWwgYHNldFRpbWVvdXRgIGZ1bmN0aW9uLlxuICAgKi9cbiAgc2V0VGltZW91dChoYW5kbGVyLCB0aW1lb3V0KSB7XG4gICAgY29uc3QgaWQgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIGlmICh0aGlzLmlzVmFsaWQpIGhhbmRsZXIoKTtcbiAgICB9LCB0aW1lb3V0KTtcbiAgICB0aGlzLm9uSW52YWxpZGF0ZWQoKCkgPT4gY2xlYXJUaW1lb3V0KGlkKSk7XG4gICAgcmV0dXJuIGlkO1xuICB9XG4gIC8qKlxuICAgKiBXcmFwcGVyIGFyb3VuZCBgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZWAgdGhhdCBhdXRvbWF0aWNhbGx5IGNhbmNlbHMgdGhlIHJlcXVlc3Qgd2hlblxuICAgKiBpbnZhbGlkYXRlZC5cbiAgICpcbiAgICogQ2FsbGJhY2tzIGNhbiBiZSBjYW5jZWxlZCBieSBjYWxsaW5nIHRoZSBub3JtYWwgYGNhbmNlbEFuaW1hdGlvbkZyYW1lYCBmdW5jdGlvbi5cbiAgICovXG4gIHJlcXVlc3RBbmltYXRpb25GcmFtZShjYWxsYmFjaykge1xuICAgIGNvbnN0IGlkID0gcmVxdWVzdEFuaW1hdGlvbkZyYW1lKCguLi5hcmdzKSA9PiB7XG4gICAgICBpZiAodGhpcy5pc1ZhbGlkKSBjYWxsYmFjayguLi5hcmdzKTtcbiAgICB9KTtcbiAgICB0aGlzLm9uSW52YWxpZGF0ZWQoKCkgPT4gY2FuY2VsQW5pbWF0aW9uRnJhbWUoaWQpKTtcbiAgICByZXR1cm4gaWQ7XG4gIH1cbiAgLyoqXG4gICAqIFdyYXBwZXIgYXJvdW5kIGB3aW5kb3cucmVxdWVzdElkbGVDYWxsYmFja2AgdGhhdCBhdXRvbWF0aWNhbGx5IGNhbmNlbHMgdGhlIHJlcXVlc3Qgd2hlblxuICAgKiBpbnZhbGlkYXRlZC5cbiAgICpcbiAgICogQ2FsbGJhY2tzIGNhbiBiZSBjYW5jZWxlZCBieSBjYWxsaW5nIHRoZSBub3JtYWwgYGNhbmNlbElkbGVDYWxsYmFja2AgZnVuY3Rpb24uXG4gICAqL1xuICByZXF1ZXN0SWRsZUNhbGxiYWNrKGNhbGxiYWNrLCBvcHRpb25zKSB7XG4gICAgY29uc3QgaWQgPSByZXF1ZXN0SWRsZUNhbGxiYWNrKCguLi5hcmdzKSA9PiB7XG4gICAgICBpZiAoIXRoaXMuc2lnbmFsLmFib3J0ZWQpIGNhbGxiYWNrKC4uLmFyZ3MpO1xuICAgIH0sIG9wdGlvbnMpO1xuICAgIHRoaXMub25JbnZhbGlkYXRlZCgoKSA9PiBjYW5jZWxJZGxlQ2FsbGJhY2soaWQpKTtcbiAgICByZXR1cm4gaWQ7XG4gIH1cbiAgYWRkRXZlbnRMaXN0ZW5lcih0YXJnZXQsIHR5cGUsIGhhbmRsZXIsIG9wdGlvbnMpIHtcbiAgICBpZiAodHlwZSA9PT0gXCJ3eHQ6bG9jYXRpb25jaGFuZ2VcIikge1xuICAgICAgaWYgKHRoaXMuaXNWYWxpZCkgdGhpcy5sb2NhdGlvbldhdGNoZXIucnVuKCk7XG4gICAgfVxuICAgIHRhcmdldC5hZGRFdmVudExpc3RlbmVyPy4oXG4gICAgICB0eXBlLnN0YXJ0c1dpdGgoXCJ3eHQ6XCIpID8gZ2V0VW5pcXVlRXZlbnROYW1lKHR5cGUpIDogdHlwZSxcbiAgICAgIGhhbmRsZXIsXG4gICAgICB7XG4gICAgICAgIC4uLm9wdGlvbnMsXG4gICAgICAgIHNpZ25hbDogdGhpcy5zaWduYWxcbiAgICAgIH1cbiAgICApO1xuICB9XG4gIC8qKlxuICAgKiBAaW50ZXJuYWxcbiAgICogQWJvcnQgdGhlIGFib3J0IGNvbnRyb2xsZXIgYW5kIGV4ZWN1dGUgYWxsIGBvbkludmFsaWRhdGVkYCBsaXN0ZW5lcnMuXG4gICAqL1xuICBub3RpZnlJbnZhbGlkYXRlZCgpIHtcbiAgICB0aGlzLmFib3J0KFwiQ29udGVudCBzY3JpcHQgY29udGV4dCBpbnZhbGlkYXRlZFwiKTtcbiAgICBsb2dnZXIuZGVidWcoXG4gICAgICBgQ29udGVudCBzY3JpcHQgXCIke3RoaXMuY29udGVudFNjcmlwdE5hbWV9XCIgY29udGV4dCBpbnZhbGlkYXRlZGBcbiAgICApO1xuICB9XG4gIHN0b3BPbGRTY3JpcHRzKCkge1xuICAgIHdpbmRvdy5wb3N0TWVzc2FnZShcbiAgICAgIHtcbiAgICAgICAgdHlwZTogQ29udGVudFNjcmlwdENvbnRleHQuU0NSSVBUX1NUQVJURURfTUVTU0FHRV9UWVBFLFxuICAgICAgICBjb250ZW50U2NyaXB0TmFtZTogdGhpcy5jb250ZW50U2NyaXB0TmFtZSxcbiAgICAgICAgbWVzc2FnZUlkOiBNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDM2KS5zbGljZSgyKVxuICAgICAgfSxcbiAgICAgIFwiKlwiXG4gICAgKTtcbiAgfVxuICB2ZXJpZnlTY3JpcHRTdGFydGVkRXZlbnQoZXZlbnQpIHtcbiAgICBjb25zdCBpc1NjcmlwdFN0YXJ0ZWRFdmVudCA9IGV2ZW50LmRhdGE/LnR5cGUgPT09IENvbnRlbnRTY3JpcHRDb250ZXh0LlNDUklQVF9TVEFSVEVEX01FU1NBR0VfVFlQRTtcbiAgICBjb25zdCBpc1NhbWVDb250ZW50U2NyaXB0ID0gZXZlbnQuZGF0YT8uY29udGVudFNjcmlwdE5hbWUgPT09IHRoaXMuY29udGVudFNjcmlwdE5hbWU7XG4gICAgY29uc3QgaXNOb3REdXBsaWNhdGUgPSAhdGhpcy5yZWNlaXZlZE1lc3NhZ2VJZHMuaGFzKGV2ZW50LmRhdGE/Lm1lc3NhZ2VJZCk7XG4gICAgcmV0dXJuIGlzU2NyaXB0U3RhcnRlZEV2ZW50ICYmIGlzU2FtZUNvbnRlbnRTY3JpcHQgJiYgaXNOb3REdXBsaWNhdGU7XG4gIH1cbiAgbGlzdGVuRm9yTmV3ZXJTY3JpcHRzKG9wdGlvbnMpIHtcbiAgICBsZXQgaXNGaXJzdCA9IHRydWU7XG4gICAgY29uc3QgY2IgPSAoZXZlbnQpID0+IHtcbiAgICAgIGlmICh0aGlzLnZlcmlmeVNjcmlwdFN0YXJ0ZWRFdmVudChldmVudCkpIHtcbiAgICAgICAgdGhpcy5yZWNlaXZlZE1lc3NhZ2VJZHMuYWRkKGV2ZW50LmRhdGEubWVzc2FnZUlkKTtcbiAgICAgICAgY29uc3Qgd2FzRmlyc3QgPSBpc0ZpcnN0O1xuICAgICAgICBpc0ZpcnN0ID0gZmFsc2U7XG4gICAgICAgIGlmICh3YXNGaXJzdCAmJiBvcHRpb25zPy5pZ25vcmVGaXJzdEV2ZW50KSByZXR1cm47XG4gICAgICAgIHRoaXMubm90aWZ5SW52YWxpZGF0ZWQoKTtcbiAgICAgIH1cbiAgICB9O1xuICAgIGFkZEV2ZW50TGlzdGVuZXIoXCJtZXNzYWdlXCIsIGNiKTtcbiAgICB0aGlzLm9uSW52YWxpZGF0ZWQoKCkgPT4gcmVtb3ZlRXZlbnRMaXN0ZW5lcihcIm1lc3NhZ2VcIiwgY2IpKTtcbiAgfVxufVxuIl0sIm5hbWVzIjpbImRlZmluaXRpb24iLCJyZXN1bHQiLCJkcml2ZXIiLCJicm93c2VyIiwiX2Jyb3dzZXIiLCJwcmludCIsImxvZ2dlciJdLCJtYXBwaW5ncyI6Ijs7QUFBTyxXQUFTLG9CQUFvQkEsYUFBWTtBQUM5QyxXQUFPQTtBQUFBLEVBQ1Q7QUNGQSxNQUFJLElBQUksQ0FBQSxHQUFJO0FBQ1osV0FBUyxFQUFFLElBQUksSUFBSTtBQUNqQixRQUFJO0FBQUEsTUFDRixTQUFTO0FBQUEsTUFDVCxZQUFZO0FBQUEsTUFDWixzQkFBc0I7QUFBQSxNQUN0QixnQkFBZ0I7QUFBQSxNQUNoQixjQUFjO0FBQUEsTUFDZCwwQkFBMEI7QUFBQSxNQUMxQixjQUFjO0FBQUEsTUFDZCxjQUFjO0FBQUEsTUFDZCxhQUFhO0FB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
content;