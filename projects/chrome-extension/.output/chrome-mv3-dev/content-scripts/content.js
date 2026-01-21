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
      button.addEventListener("mouseenter", () => {
        button.style.transform = "translateY(-2px)";
        button.style.boxShadow = "0 6px 20px rgba(102, 126, 234, 0.6)";
      });
      button.addEventListener("mouseleave", () => {
        button.style.transform = "translateY(0)";
        button.style.boxShadow = "0 4px 15px rgba(102, 126, 234, 0.4)";
      });
      button.addEventListener("click", () => {
        chrome.runtime.sendMessage({ type: "OPEN_POPUP" });
      });
      shadow.appendChild(button);
      document.body.appendChild(container);
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === "START_GUIDE") {
          startGuide(message.steps);
          sendResponse({ success: true });
        }
      });
      function startGuide(steps) {
        const driverObj = Ae({
          showProgress: true,
          showButtons: ["next", "previous", "close"],
          steps: steps.map((step, index) => ({
            element: step.selector,
            popover: {
              title: step.title,
              description: step.description,
              side: "left",
              align: "start"
            }
          }))
        });
        driverObj.drive();
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGVudC5qcyIsInNvdXJjZXMiOlsiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3d4dC9kaXN0L3V0aWxzL2RlZmluZS1jb250ZW50LXNjcmlwdC5tanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvZHJpdmVyLmpzL2Rpc3QvZHJpdmVyLmpzLm1qcyIsIi4uLy4uLy4uL2VudHJ5cG9pbnRzL2NvbnRlbnQudHMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvQHd4dC1kZXYvYnJvd3Nlci9zcmMvaW5kZXgubWpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3d4dC9kaXN0L2Jyb3dzZXIubWpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3d4dC9kaXN0L3V0aWxzL2ludGVybmFsL2xvZ2dlci5tanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvd3h0L2Rpc3QvdXRpbHMvaW50ZXJuYWwvY3VzdG9tLWV2ZW50cy5tanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvd3h0L2Rpc3QvdXRpbHMvaW50ZXJuYWwvbG9jYXRpb24td2F0Y2hlci5tanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvd3h0L2Rpc3QvdXRpbHMvY29udGVudC1zY3JpcHQtY29udGV4dC5tanMiXSwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0IGZ1bmN0aW9uIGRlZmluZUNvbnRlbnRTY3JpcHQoZGVmaW5pdGlvbikge1xuICByZXR1cm4gZGVmaW5pdGlvbjtcbn1cbiIsImxldCB6ID0ge30sIEo7XG5mdW5jdGlvbiBGKGUgPSB7fSkge1xuICB6ID0ge1xuICAgIGFuaW1hdGU6ICEwLFxuICAgIGFsbG93Q2xvc2U6ICEwLFxuICAgIG92ZXJsYXlDbGlja0JlaGF2aW9yOiBcImNsb3NlXCIsXG4gICAgb3ZlcmxheU9wYWNpdHk6IDAuNyxcbiAgICBzbW9vdGhTY3JvbGw6ICExLFxuICAgIGRpc2FibGVBY3RpdmVJbnRlcmFjdGlvbjogITEsXG4gICAgc2hvd1Byb2dyZXNzOiAhMSxcbiAgICBzdGFnZVBhZGRpbmc6IDEwLFxuICAgIHN0YWdlUmFkaXVzOiA1LFxuICAgIHBvcG92ZXJPZmZzZXQ6IDEwLFxuICAgIHNob3dCdXR0b25zOiBbXCJuZXh0XCIsIFwicHJldmlvdXNcIiwgXCJjbG9zZVwiXSxcbiAgICBkaXNhYmxlQnV0dG9uczogW10sXG4gICAgb3ZlcmxheUNvbG9yOiBcIiMwMDBcIixcbiAgICAuLi5lXG4gIH07XG59XG5mdW5jdGlvbiBzKGUpIHtcbiAgcmV0dXJuIGUgPyB6W2VdIDogejtcbn1cbmZ1bmN0aW9uIGxlKGUpIHtcbiAgSiA9IGU7XG59XG5mdW5jdGlvbiBfKCkge1xuICByZXR1cm4gSjtcbn1cbmxldCBJID0ge307XG5mdW5jdGlvbiBOKGUsIG8pIHtcbiAgSVtlXSA9IG87XG59XG5mdW5jdGlvbiBMKGUpIHtcbiAgdmFyIG87XG4gIChvID0gSVtlXSkgPT0gbnVsbCB8fCBvLmNhbGwoSSk7XG59XG5mdW5jdGlvbiBkZSgpIHtcbiAgSSA9IHt9O1xufVxuZnVuY3Rpb24gTyhlLCBvLCB0LCBpKSB7XG4gIHJldHVybiAoZSAvPSBpIC8gMikgPCAxID8gdCAvIDIgKiBlICogZSArIG8gOiAtdCAvIDIgKiAoLS1lICogKGUgLSAyKSAtIDEpICsgbztcbn1cbmZ1bmN0aW9uIFUoZSkge1xuICBjb25zdCBvID0gJ2FbaHJlZl06bm90KFtkaXNhYmxlZF0pLCBidXR0b246bm90KFtkaXNhYmxlZF0pLCB0ZXh0YXJlYTpub3QoW2Rpc2FibGVkXSksIGlucHV0W3R5cGU9XCJ0ZXh0XCJdOm5vdChbZGlzYWJsZWRdKSwgaW5wdXRbdHlwZT1cInJhZGlvXCJdOm5vdChbZGlzYWJsZWRdKSwgaW5wdXRbdHlwZT1cImNoZWNrYm94XCJdOm5vdChbZGlzYWJsZWRdKSwgc2VsZWN0Om5vdChbZGlzYWJsZWRdKSc7XG4gIHJldHVybiBlLmZsYXRNYXAoKHQpID0+IHtcbiAgICBjb25zdCBpID0gdC5tYXRjaGVzKG8pLCBkID0gQXJyYXkuZnJvbSh0LnF1ZXJ5U2VsZWN0b3JBbGwobykpO1xuICAgIHJldHVybiBbLi4uaSA/IFt0XSA6IFtdLCAuLi5kXTtcbiAgfSkuZmlsdGVyKCh0KSA9PiBnZXRDb21wdXRlZFN0eWxlKHQpLnBvaW50ZXJFdmVudHMgIT09IFwibm9uZVwiICYmIHZlKHQpKTtcbn1cbmZ1bmN0aW9uIGVlKGUpIHtcbiAgaWYgKCFlIHx8IHVlKGUpKVxuICAgIHJldHVybjtcbiAgY29uc3QgbyA9IHMoXCJzbW9vdGhTY3JvbGxcIiksIHQgPSBlLm9mZnNldEhlaWdodCA+IHdpbmRvdy5pbm5lckhlaWdodDtcbiAgZS5zY3JvbGxJbnRvVmlldyh7XG4gICAgLy8gUmVtb3ZpbmcgdGhlIHNtb290aCBzY3JvbGxpbmcgZm9yIGVsZW1lbnRzIHdoaWNoIGV4aXN0IGluc2lkZSB0aGUgc2Nyb2xsYWJsZSBwYXJlbnRcbiAgICAvLyBUaGlzIHdhcyBjYXVzaW5nIHRoZSBoaWdobGlnaHQgdG8gbm90IHByb3Blcmx5IHJlbmRlclxuICAgIGJlaGF2aW9yOiAhbyB8fCBwZShlKSA/IFwiYXV0b1wiIDogXCJzbW9vdGhcIixcbiAgICBpbmxpbmU6IFwiY2VudGVyXCIsXG4gICAgYmxvY2s6IHQgPyBcInN0YXJ0XCIgOiBcImNlbnRlclwiXG4gIH0pO1xufVxuZnVuY3Rpb24gcGUoZSkge1xuICBpZiAoIWUgfHwgIWUucGFyZW50RWxlbWVudClcbiAgICByZXR1cm47XG4gIGNvbnN0IG8gPSBlLnBhcmVudEVsZW1lbnQ7XG4gIHJldHVybiBvLnNjcm9sbEhlaWdodCA+IG8uY2xpZW50SGVpZ2h0O1xufVxuZnVuY3Rpb24gdWUoZSkge1xuICBjb25zdCBvID0gZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgcmV0dXJuIG8udG9wID49IDAgJiYgby5sZWZ0ID49IDAgJiYgby5ib3R0b20gPD0gKHdpbmRvdy5pbm5lckhlaWdodCB8fCBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50SGVpZ2h0KSAmJiBvLnJpZ2h0IDw9ICh3aW5kb3cuaW5uZXJXaWR0aCB8fCBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50V2lkdGgpO1xufVxuZnVuY3Rpb24gdmUoZSkge1xuICByZXR1cm4gISEoZS5vZmZzZXRXaWR0aCB8fCBlLm9mZnNldEhlaWdodCB8fCBlLmdldENsaWVudFJlY3RzKCkubGVuZ3RoKTtcbn1cbmxldCBEID0ge307XG5mdW5jdGlvbiBrKGUsIG8pIHtcbiAgRFtlXSA9IG87XG59XG5mdW5jdGlvbiBsKGUpIHtcbiAgcmV0dXJuIGUgPyBEW2VdIDogRDtcbn1cbmZ1bmN0aW9uIFgoKSB7XG4gIEQgPSB7fTtcbn1cbmZ1bmN0aW9uIGZlKGUsIG8sIHQsIGkpIHtcbiAgbGV0IGQgPSBsKFwiX19hY3RpdmVTdGFnZVBvc2l0aW9uXCIpO1xuICBjb25zdCBuID0gZCB8fCB0LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLCBmID0gaS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKSwgdyA9IE8oZSwgbi54LCBmLnggLSBuLngsIG8pLCByID0gTyhlLCBuLnksIGYueSAtIG4ueSwgbyksIHYgPSBPKGUsIG4ud2lkdGgsIGYud2lkdGggLSBuLndpZHRoLCBvKSwgZyA9IE8oZSwgbi5oZWlnaHQsIGYuaGVpZ2h0IC0gbi5oZWlnaHQsIG8pO1xuICBkID0ge1xuICAgIHg6IHcsXG4gICAgeTogcixcbiAgICB3aWR0aDogdixcbiAgICBoZWlnaHQ6IGdcbiAgfSwgb2UoZCksIGsoXCJfX2FjdGl2ZVN0YWdlUG9zaXRpb25cIiwgZCk7XG59XG5mdW5jdGlvbiB0ZShlKSB7XG4gIGlmICghZSlcbiAgICByZXR1cm47XG4gIGNvbnN0IG8gPSBlLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLCB0ID0ge1xuICAgIHg6IG8ueCxcbiAgICB5OiBvLnksXG4gICAgd2lkdGg6IG8ud2lkdGgsXG4gICAgaGVpZ2h0OiBvLmhlaWdodFxuICB9O1xuICBrKFwiX19hY3RpdmVTdGFnZVBvc2l0aW9uXCIsIHQpLCBvZSh0KTtcbn1cbmZ1bmN0aW9uIGhlKCkge1xuICBjb25zdCBlID0gbChcIl9fYWN0aXZlU3RhZ2VQb3NpdGlvblwiKSwgbyA9IGwoXCJfX292ZXJsYXlTdmdcIik7XG4gIGlmICghZSlcbiAgICByZXR1cm47XG4gIGlmICghbykge1xuICAgIGNvbnNvbGUud2FybihcIk5vIHN0YWdlIHN2ZyBmb3VuZC5cIik7XG4gICAgcmV0dXJuO1xuICB9XG4gIGNvbnN0IHQgPSB3aW5kb3cuaW5uZXJXaWR0aCwgaSA9IHdpbmRvdy5pbm5lckhlaWdodDtcbiAgby5zZXRBdHRyaWJ1dGUoXCJ2aWV3Qm94XCIsIGAwIDAgJHt0fSAke2l9YCk7XG59XG5mdW5jdGlvbiBnZShlKSB7XG4gIGNvbnN0IG8gPSB3ZShlKTtcbiAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChvKSwgcmUobywgKHQpID0+IHtcbiAgICB0LnRhcmdldC50YWdOYW1lID09PSBcInBhdGhcIiAmJiBMKFwib3ZlcmxheUNsaWNrXCIpO1xuICB9KSwgayhcIl9fb3ZlcmxheVN2Z1wiLCBvKTtcbn1cbmZ1bmN0aW9uIG9lKGUpIHtcbiAgY29uc3QgbyA9IGwoXCJfX292ZXJsYXlTdmdcIik7XG4gIGlmICghbykge1xuICAgIGdlKGUpO1xuICAgIHJldHVybjtcbiAgfVxuICBjb25zdCB0ID0gby5maXJzdEVsZW1lbnRDaGlsZDtcbiAgaWYgKCh0ID09IG51bGwgPyB2b2lkIDAgOiB0LnRhZ05hbWUpICE9PSBcInBhdGhcIilcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJubyBwYXRoIGVsZW1lbnQgZm91bmQgaW4gc3RhZ2Ugc3ZnXCIpO1xuICB0LnNldEF0dHJpYnV0ZShcImRcIiwgaWUoZSkpO1xufVxuZnVuY3Rpb24gd2UoZSkge1xuICBjb25zdCBvID0gd2luZG93LmlubmVyV2lkdGgsIHQgPSB3aW5kb3cuaW5uZXJIZWlnaHQsIGkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoXCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiLCBcInN2Z1wiKTtcbiAgaS5jbGFzc0xpc3QuYWRkKFwiZHJpdmVyLW92ZXJsYXlcIiwgXCJkcml2ZXItb3ZlcmxheS1hbmltYXRlZFwiKSwgaS5zZXRBdHRyaWJ1dGUoXCJ2aWV3Qm94XCIsIGAwIDAgJHtvfSAke3R9YCksIGkuc2V0QXR0cmlidXRlKFwieG1sU3BhY2VcIiwgXCJwcmVzZXJ2ZVwiKSwgaS5zZXRBdHRyaWJ1dGUoXCJ4bWxuc1hsaW5rXCIsIFwiaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGlua1wiKSwgaS5zZXRBdHRyaWJ1dGUoXCJ2ZXJzaW9uXCIsIFwiMS4xXCIpLCBpLnNldEF0dHJpYnV0ZShcInByZXNlcnZlQXNwZWN0UmF0aW9cIiwgXCJ4TWluWU1pbiBzbGljZVwiKSwgaS5zdHlsZS5maWxsUnVsZSA9IFwiZXZlbm9kZFwiLCBpLnN0eWxlLmNsaXBSdWxlID0gXCJldmVub2RkXCIsIGkuc3R5bGUuc3Ryb2tlTGluZWpvaW4gPSBcInJvdW5kXCIsIGkuc3R5bGUuc3Ryb2tlTWl0ZXJsaW1pdCA9IFwiMlwiLCBpLnN0eWxlLnpJbmRleCA9IFwiMTAwMDBcIiwgaS5zdHlsZS5wb3NpdGlvbiA9IFwiZml4ZWRcIiwgaS5zdHlsZS50b3AgPSBcIjBcIiwgaS5zdHlsZS5sZWZ0ID0gXCIwXCIsIGkuc3R5bGUud2lkdGggPSBcIjEwMCVcIiwgaS5zdHlsZS5oZWlnaHQgPSBcIjEwMCVcIjtcbiAgY29uc3QgZCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyhcImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIsIFwicGF0aFwiKTtcbiAgcmV0dXJuIGQuc2V0QXR0cmlidXRlKFwiZFwiLCBpZShlKSksIGQuc3R5bGUuZmlsbCA9IHMoXCJvdmVybGF5Q29sb3JcIikgfHwgXCJyZ2IoMCwwLDApXCIsIGQuc3R5bGUub3BhY2l0eSA9IGAke3MoXCJvdmVybGF5T3BhY2l0eVwiKX1gLCBkLnN0eWxlLnBvaW50ZXJFdmVudHMgPSBcImF1dG9cIiwgZC5zdHlsZS5jdXJzb3IgPSBcImF1dG9cIiwgaS5hcHBlbmRDaGlsZChkKSwgaTtcbn1cbmZ1bmN0aW9uIGllKGUpIHtcbiAgY29uc3QgbyA9IHdpbmRvdy5pbm5lcldpZHRoLCB0ID0gd2luZG93LmlubmVySGVpZ2h0LCBpID0gcyhcInN0YWdlUGFkZGluZ1wiKSB8fCAwLCBkID0gcyhcInN0YWdlUmFkaXVzXCIpIHx8IDAsIG4gPSBlLndpZHRoICsgaSAqIDIsIGYgPSBlLmhlaWdodCArIGkgKiAyLCB3ID0gTWF0aC5taW4oZCwgbiAvIDIsIGYgLyAyKSwgciA9IE1hdGguZmxvb3IoTWF0aC5tYXgodywgMCkpLCB2ID0gZS54IC0gaSArIHIsIGcgPSBlLnkgLSBpLCB5ID0gbiAtIHIgKiAyLCBhID0gZiAtIHIgKiAyO1xuICByZXR1cm4gYE0ke299LDBMMCwwTDAsJHt0fUwke299LCR7dH1MJHtvfSwwWlxuICAgIE0ke3Z9LCR7Z30gaCR7eX0gYSR7cn0sJHtyfSAwIDAgMSAke3J9LCR7cn0gdiR7YX0gYSR7cn0sJHtyfSAwIDAgMSAtJHtyfSwke3J9IGgtJHt5fSBhJHtyfSwke3J9IDAgMCAxIC0ke3J9LC0ke3J9IHYtJHthfSBhJHtyfSwke3J9IDAgMCAxICR7cn0sLSR7cn0gemA7XG59XG5mdW5jdGlvbiBtZSgpIHtcbiAgY29uc3QgZSA9IGwoXCJfX292ZXJsYXlTdmdcIik7XG4gIGUgJiYgZS5yZW1vdmUoKTtcbn1cbmZ1bmN0aW9uIHllKCkge1xuICBjb25zdCBlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJkcml2ZXItZHVtbXktZWxlbWVudFwiKTtcbiAgaWYgKGUpXG4gICAgcmV0dXJuIGU7XG4gIGxldCBvID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgcmV0dXJuIG8uaWQgPSBcImRyaXZlci1kdW1teS1lbGVtZW50XCIsIG8uc3R5bGUud2lkdGggPSBcIjBcIiwgby5zdHlsZS5oZWlnaHQgPSBcIjBcIiwgby5zdHlsZS5wb2ludGVyRXZlbnRzID0gXCJub25lXCIsIG8uc3R5bGUub3BhY2l0eSA9IFwiMFwiLCBvLnN0eWxlLnBvc2l0aW9uID0gXCJmaXhlZFwiLCBvLnN0eWxlLnRvcCA9IFwiNTAlXCIsIG8uc3R5bGUubGVmdCA9IFwiNTAlXCIsIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQobyksIG87XG59XG5mdW5jdGlvbiBqKGUpIHtcbiAgY29uc3QgeyBlbGVtZW50OiBvIH0gPSBlO1xuICBsZXQgdCA9IHR5cGVvZiBvID09IFwiZnVuY3Rpb25cIiA/IG8oKSA6IHR5cGVvZiBvID09IFwic3RyaW5nXCIgPyBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKG8pIDogbztcbiAgdCB8fCAodCA9IHllKCkpLCBiZSh0LCBlKTtcbn1cbmZ1bmN0aW9uIHhlKCkge1xuICBjb25zdCBlID0gbChcIl9fYWN0aXZlRWxlbWVudFwiKSwgbyA9IGwoXCJfX2FjdGl2ZVN0ZXBcIik7XG4gIGUgJiYgKHRlKGUpLCBoZSgpLCBhZShlLCBvKSk7XG59XG5mdW5jdGlvbiBiZShlLCBvKSB7XG4gIHZhciBDO1xuICBjb25zdCBpID0gRGF0ZS5ub3coKSwgZCA9IGwoXCJfX2FjdGl2ZVN0ZXBcIiksIG4gPSBsKFwiX19hY3RpdmVFbGVtZW50XCIpIHx8IGUsIGYgPSAhbiB8fCBuID09PSBlLCB3ID0gZS5pZCA9PT0gXCJkcml2ZXItZHVtbXktZWxlbWVudFwiLCByID0gbi5pZCA9PT0gXCJkcml2ZXItZHVtbXktZWxlbWVudFwiLCB2ID0gcyhcImFuaW1hdGVcIiksIGcgPSBvLm9uSGlnaGxpZ2h0U3RhcnRlZCB8fCBzKFwib25IaWdobGlnaHRTdGFydGVkXCIpLCB5ID0gKG8gPT0gbnVsbCA/IHZvaWQgMCA6IG8ub25IaWdobGlnaHRlZCkgfHwgcyhcIm9uSGlnaGxpZ2h0ZWRcIiksIGEgPSAoZCA9PSBudWxsID8gdm9pZCAwIDogZC5vbkRlc2VsZWN0ZWQpIHx8IHMoXCJvbkRlc2VsZWN0ZWRcIiksIHAgPSBzKCksIGMgPSBsKCk7XG4gICFmICYmIGEgJiYgYShyID8gdm9pZCAwIDogbiwgZCwge1xuICAgIGNvbmZpZzogcCxcbiAgICBzdGF0ZTogYyxcbiAgICBkcml2ZXI6IF8oKVxuICB9KSwgZyAmJiBnKHcgPyB2b2lkIDAgOiBlLCBvLCB7XG4gICAgY29uZmlnOiBwLFxuICAgIHN0YXRlOiBjLFxuICAgIGRyaXZlcjogXygpXG4gIH0pO1xuICBjb25zdCB1ID0gIWYgJiYgdjtcbiAgbGV0IGggPSAhMTtcbiAgU2UoKSwgayhcInByZXZpb3VzU3RlcFwiLCBkKSwgayhcInByZXZpb3VzRWxlbWVudFwiLCBuKSwgayhcImFjdGl2ZVN0ZXBcIiwgbyksIGsoXCJhY3RpdmVFbGVtZW50XCIsIGUpO1xuICBjb25zdCBtID0gKCkgPT4ge1xuICAgIGlmIChsKFwiX190cmFuc2l0aW9uQ2FsbGJhY2tcIikgIT09IG0pXG4gICAgICByZXR1cm47XG4gICAgY29uc3QgYiA9IERhdGUubm93KCkgLSBpLCBFID0gNDAwIC0gYiA8PSA0MDAgLyAyO1xuICAgIG8ucG9wb3ZlciAmJiBFICYmICFoICYmIHUgJiYgKFEoZSwgbyksIGggPSAhMCksIHMoXCJhbmltYXRlXCIpICYmIGIgPCA0MDAgPyBmZShiLCA0MDAsIG4sIGUpIDogKHRlKGUpLCB5ICYmIHkodyA/IHZvaWQgMCA6IGUsIG8sIHtcbiAgICAgIGNvbmZpZzogcygpLFxuICAgICAgc3RhdGU6IGwoKSxcbiAgICAgIGRyaXZlcjogXygpXG4gICAgfSksIGsoXCJfX3RyYW5zaXRpb25DYWxsYmFja1wiLCB2b2lkIDApLCBrKFwiX19wcmV2aW91c1N0ZXBcIiwgZCksIGsoXCJfX3ByZXZpb3VzRWxlbWVudFwiLCBuKSwgayhcIl9fYWN0aXZlU3RlcFwiLCBvKSwgayhcIl9fYWN0aXZlRWxlbWVudFwiLCBlKSksIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUobSk7XG4gIH07XG4gIGsoXCJfX3RyYW5zaXRpb25DYWxsYmFja1wiLCBtKSwgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZShtKSwgZWUoZSksICF1ICYmIG8ucG9wb3ZlciAmJiBRKGUsIG8pLCBuLmNsYXNzTGlzdC5yZW1vdmUoXCJkcml2ZXItYWN0aXZlLWVsZW1lbnRcIiwgXCJkcml2ZXItbm8taW50ZXJhY3Rpb25cIiksIG4ucmVtb3ZlQXR0cmlidXRlKFwiYXJpYS1oYXNwb3B1cFwiKSwgbi5yZW1vdmVBdHRyaWJ1dGUoXCJhcmlhLWV4cGFuZGVkXCIpLCBuLnJlbW92ZUF0dHJpYnV0ZShcImFyaWEtY29udHJvbHNcIiksICgoQyA9IG8uZGlzYWJsZUFjdGl2ZUludGVyYWN0aW9uKSAhPSBudWxsID8gQyA6IHMoXCJkaXNhYmxlQWN0aXZlSW50ZXJhY3Rpb25cIikpICYmIGUuY2xhc3NMaXN0LmFkZChcImRyaXZlci1uby1pbnRlcmFjdGlvblwiKSwgZS5jbGFzc0xpc3QuYWRkKFwiZHJpdmVyLWFjdGl2ZS1lbGVtZW50XCIpLCBlLnNldEF0dHJpYnV0ZShcImFyaWEtaGFzcG9wdXBcIiwgXCJkaWFsb2dcIiksIGUuc2V0QXR0cmlidXRlKFwiYXJpYS1leHBhbmRlZFwiLCBcInRydWVcIiksIGUuc2V0QXR0cmlidXRlKFwiYXJpYS1jb250cm9sc1wiLCBcImRyaXZlci1wb3BvdmVyLWNvbnRlbnRcIik7XG59XG5mdW5jdGlvbiBDZSgpIHtcbiAgdmFyIGU7XG4gIChlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJkcml2ZXItZHVtbXktZWxlbWVudFwiKSkgPT0gbnVsbCB8fCBlLnJlbW92ZSgpLCBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKFwiLmRyaXZlci1hY3RpdmUtZWxlbWVudFwiKS5mb3JFYWNoKChvKSA9PiB7XG4gICAgby5jbGFzc0xpc3QucmVtb3ZlKFwiZHJpdmVyLWFjdGl2ZS1lbGVtZW50XCIsIFwiZHJpdmVyLW5vLWludGVyYWN0aW9uXCIpLCBvLnJlbW92ZUF0dHJpYnV0ZShcImFyaWEtaGFzcG9wdXBcIiksIG8ucmVtb3ZlQXR0cmlidXRlKFwiYXJpYS1leHBhbmRlZFwiKSwgby5yZW1vdmVBdHRyaWJ1dGUoXCJhcmlhLWNvbnRyb2xzXCIpO1xuICB9KTtcbn1cbmZ1bmN0aW9uIE0oKSB7XG4gIGNvbnN0IGUgPSBsKFwiX19yZXNpemVUaW1lb3V0XCIpO1xuICBlICYmIHdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZShlKSwgayhcIl9fcmVzaXplVGltZW91dFwiLCB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKHhlKSk7XG59XG5mdW5jdGlvbiBQZShlKSB7XG4gIHZhciByO1xuICBpZiAoIWwoXCJpc0luaXRpYWxpemVkXCIpIHx8ICEoZS5rZXkgPT09IFwiVGFiXCIgfHwgZS5rZXlDb2RlID09PSA5KSlcbiAgICByZXR1cm47XG4gIGNvbnN0IGkgPSBsKFwiX19hY3RpdmVFbGVtZW50XCIpLCBkID0gKHIgPSBsKFwicG9wb3ZlclwiKSkgPT0gbnVsbCA/IHZvaWQgMCA6IHIud3JhcHBlciwgbiA9IFUoW1xuICAgIC4uLmQgPyBbZF0gOiBbXSxcbiAgICAuLi5pID8gW2ldIDogW11cbiAgXSksIGYgPSBuWzBdLCB3ID0gbltuLmxlbmd0aCAtIDFdO1xuICBpZiAoZS5wcmV2ZW50RGVmYXVsdCgpLCBlLnNoaWZ0S2V5KSB7XG4gICAgY29uc3QgdiA9IG5bbi5pbmRleE9mKGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQpIC0gMV0gfHwgdztcbiAgICB2ID09IG51bGwgfHwgdi5mb2N1cygpO1xuICB9IGVsc2Uge1xuICAgIGNvbnN0IHYgPSBuW24uaW5kZXhPZihkb2N1bWVudC5hY3RpdmVFbGVtZW50KSArIDFdIHx8IGY7XG4gICAgdiA9PSBudWxsIHx8IHYuZm9jdXMoKTtcbiAgfVxufVxuZnVuY3Rpb24gbmUoZSkge1xuICB2YXIgdDtcbiAgKCh0ID0gcyhcImFsbG93S2V5Ym9hcmRDb250cm9sXCIpKSA9PSBudWxsIHx8IHQpICYmIChlLmtleSA9PT0gXCJFc2NhcGVcIiA/IEwoXCJlc2NhcGVQcmVzc1wiKSA6IGUua2V5ID09PSBcIkFycm93UmlnaHRcIiA/IEwoXCJhcnJvd1JpZ2h0UHJlc3NcIikgOiBlLmtleSA9PT0gXCJBcnJvd0xlZnRcIiAmJiBMKFwiYXJyb3dMZWZ0UHJlc3NcIikpO1xufVxuZnVuY3Rpb24gcmUoZSwgbywgdCkge1xuICBjb25zdCBpID0gKG4sIGYpID0+IHtcbiAgICBjb25zdCB3ID0gbi50YXJnZXQ7XG4gICAgZS5jb250YWlucyh3KSAmJiAoKCF0IHx8IHQodykpICYmIChuLnByZXZlbnREZWZhdWx0KCksIG4uc3RvcFByb3BhZ2F0aW9uKCksIG4uc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKCkpLCBmID09IG51bGwgfHwgZihuKSk7XG4gIH07XG4gIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJwb2ludGVyZG93blwiLCBpLCAhMCksIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZWRvd25cIiwgaSwgITApLCBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwicG9pbnRlcnVwXCIsIGksICEwKSwgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNldXBcIiwgaSwgITApLCBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFxuICAgIFwiY2xpY2tcIixcbiAgICAobikgPT4ge1xuICAgICAgaShuLCBvKTtcbiAgICB9LFxuICAgICEwXG4gICk7XG59XG5mdW5jdGlvbiBrZSgpIHtcbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXl1cFwiLCBuZSwgITEpLCB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgUGUsICExKSwgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJyZXNpemVcIiwgTSksIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwic2Nyb2xsXCIsIE0pO1xufVxuZnVuY3Rpb24gX2UoKSB7XG4gIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKFwia2V5dXBcIiwgbmUpLCB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcihcInJlc2l6ZVwiLCBNKSwgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJzY3JvbGxcIiwgTSk7XG59XG5mdW5jdGlvbiBTZSgpIHtcbiAgY29uc3QgZSA9IGwoXCJwb3BvdmVyXCIpO1xuICBlICYmIChlLndyYXBwZXIuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiKTtcbn1cbmZ1bmN0aW9uIFEoZSwgbykge1xuICB2YXIgYiwgUDtcbiAgbGV0IHQgPSBsKFwicG9wb3ZlclwiKTtcbiAgdCAmJiBkb2N1bWVudC5ib2R5LnJlbW92ZUNoaWxkKHQud3JhcHBlciksIHQgPSBMZSgpLCBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHQud3JhcHBlcik7XG4gIGNvbnN0IHtcbiAgICB0aXRsZTogaSxcbiAgICBkZXNjcmlwdGlvbjogZCxcbiAgICBzaG93QnV0dG9uczogbixcbiAgICBkaXNhYmxlQnV0dG9uczogZixcbiAgICBzaG93UHJvZ3Jlc3M6IHcsXG4gICAgbmV4dEJ0blRleHQ6IHIgPSBzKFwibmV4dEJ0blRleHRcIikgfHwgXCJOZXh0ICZyYXJyO1wiLFxuICAgIHByZXZCdG5UZXh0OiB2ID0gcyhcInByZXZCdG5UZXh0XCIpIHx8IFwiJmxhcnI7IFByZXZpb3VzXCIsXG4gICAgcHJvZ3Jlc3NUZXh0OiBnID0gcyhcInByb2dyZXNzVGV4dFwiKSB8fCBcIntjdXJyZW50fSBvZiB7dG90YWx9XCJcbiAgfSA9IG8ucG9wb3ZlciB8fCB7fTtcbiAgdC5uZXh0QnV0dG9uLmlubmVySFRNTCA9IHIsIHQucHJldmlvdXNCdXR0b24uaW5uZXJIVE1MID0gdiwgdC5wcm9ncmVzcy5pbm5lckhUTUwgPSBnLCBpID8gKHQudGl0bGUuaW5uZXJIVE1MID0gaSwgdC50aXRsZS5zdHlsZS5kaXNwbGF5ID0gXCJibG9ja1wiKSA6IHQudGl0bGUuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiLCBkID8gKHQuZGVzY3JpcHRpb24uaW5uZXJIVE1MID0gZCwgdC5kZXNjcmlwdGlvbi5zdHlsZS5kaXNwbGF5ID0gXCJibG9ja1wiKSA6IHQuZGVzY3JpcHRpb24uc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICBjb25zdCB5ID0gbiB8fCBzKFwic2hvd0J1dHRvbnNcIiksIGEgPSB3IHx8IHMoXCJzaG93UHJvZ3Jlc3NcIikgfHwgITEsIHAgPSAoeSA9PSBudWxsID8gdm9pZCAwIDogeS5pbmNsdWRlcyhcIm5leHRcIikpIHx8ICh5ID09IG51bGwgPyB2b2lkIDAgOiB5LmluY2x1ZGVzKFwicHJldmlvdXNcIikpIHx8IGE7XG4gIHQuY2xvc2VCdXR0b24uc3R5bGUuZGlzcGxheSA9IHkuaW5jbHVkZXMoXCJjbG9zZVwiKSA/IFwiYmxvY2tcIiA6IFwibm9uZVwiLCBwID8gKHQuZm9vdGVyLnN0eWxlLmRpc3BsYXkgPSBcImZsZXhcIiwgdC5wcm9ncmVzcy5zdHlsZS5kaXNwbGF5ID0gYSA/IFwiYmxvY2tcIiA6IFwibm9uZVwiLCB0Lm5leHRCdXR0b24uc3R5bGUuZGlzcGxheSA9IHkuaW5jbHVkZXMoXCJuZXh0XCIpID8gXCJibG9ja1wiIDogXCJub25lXCIsIHQucHJldmlvdXNCdXR0b24uc3R5bGUuZGlzcGxheSA9IHkuaW5jbHVkZXMoXCJwcmV2aW91c1wiKSA/IFwiYmxvY2tcIiA6IFwibm9uZVwiKSA6IHQuZm9vdGVyLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgY29uc3QgYyA9IGYgfHwgcyhcImRpc2FibGVCdXR0b25zXCIpIHx8IFtdO1xuICBjICE9IG51bGwgJiYgYy5pbmNsdWRlcyhcIm5leHRcIikgJiYgKHQubmV4dEJ1dHRvbi5kaXNhYmxlZCA9ICEwLCB0Lm5leHRCdXR0b24uY2xhc3NMaXN0LmFkZChcImRyaXZlci1wb3BvdmVyLWJ0bi1kaXNhYmxlZFwiKSksIGMgIT0gbnVsbCAmJiBjLmluY2x1ZGVzKFwicHJldmlvdXNcIikgJiYgKHQucHJldmlvdXNCdXR0b24uZGlzYWJsZWQgPSAhMCwgdC5wcmV2aW91c0J1dHRvbi5jbGFzc0xpc3QuYWRkKFwiZHJpdmVyLXBvcG92ZXItYnRuLWRpc2FibGVkXCIpKSwgYyAhPSBudWxsICYmIGMuaW5jbHVkZXMoXCJjbG9zZVwiKSAmJiAodC5jbG9zZUJ1dHRvbi5kaXNhYmxlZCA9ICEwLCB0LmNsb3NlQnV0dG9uLmNsYXNzTGlzdC5hZGQoXCJkcml2ZXItcG9wb3Zlci1idG4tZGlzYWJsZWRcIikpO1xuICBjb25zdCB1ID0gdC53cmFwcGVyO1xuICB1LnN0eWxlLmRpc3BsYXkgPSBcImJsb2NrXCIsIHUuc3R5bGUubGVmdCA9IFwiXCIsIHUuc3R5bGUudG9wID0gXCJcIiwgdS5zdHlsZS5ib3R0b20gPSBcIlwiLCB1LnN0eWxlLnJpZ2h0ID0gXCJcIiwgdS5pZCA9IFwiZHJpdmVyLXBvcG92ZXItY29udGVudFwiLCB1LnNldEF0dHJpYnV0ZShcInJvbGVcIiwgXCJkaWFsb2dcIiksIHUuc2V0QXR0cmlidXRlKFwiYXJpYS1sYWJlbGxlZGJ5XCIsIFwiZHJpdmVyLXBvcG92ZXItdGl0bGVcIiksIHUuc2V0QXR0cmlidXRlKFwiYXJpYS1kZXNjcmliZWRieVwiLCBcImRyaXZlci1wb3BvdmVyLWRlc2NyaXB0aW9uXCIpO1xuICBjb25zdCBoID0gdC5hcnJvdztcbiAgaC5jbGFzc05hbWUgPSBcImRyaXZlci1wb3BvdmVyLWFycm93XCI7XG4gIGNvbnN0IG0gPSAoKGIgPSBvLnBvcG92ZXIpID09IG51bGwgPyB2b2lkIDAgOiBiLnBvcG92ZXJDbGFzcykgfHwgcyhcInBvcG92ZXJDbGFzc1wiKSB8fCBcIlwiO1xuICB1LmNsYXNzTmFtZSA9IGBkcml2ZXItcG9wb3ZlciAke219YC50cmltKCksIHJlKFxuICAgIHQud3JhcHBlcixcbiAgICAoRSkgPT4ge1xuICAgICAgdmFyIEIsIFIsIFc7XG4gICAgICBjb25zdCBUID0gRS50YXJnZXQsIEEgPSAoKEIgPSBvLnBvcG92ZXIpID09IG51bGwgPyB2b2lkIDAgOiBCLm9uTmV4dENsaWNrKSB8fCBzKFwib25OZXh0Q2xpY2tcIiksIEggPSAoKFIgPSBvLnBvcG92ZXIpID09IG51bGwgPyB2b2lkIDAgOiBSLm9uUHJldkNsaWNrKSB8fCBzKFwib25QcmV2Q2xpY2tcIiksICQgPSAoKFcgPSBvLnBvcG92ZXIpID09IG51bGwgPyB2b2lkIDAgOiBXLm9uQ2xvc2VDbGljaykgfHwgcyhcIm9uQ2xvc2VDbGlja1wiKTtcbiAgICAgIGlmIChULmNsb3Nlc3QoXCIuZHJpdmVyLXBvcG92ZXItbmV4dC1idG5cIikpXG4gICAgICAgIHJldHVybiBBID8gQShlLCBvLCB7XG4gICAgICAgICAgY29uZmlnOiBzKCksXG4gICAgICAgICAgc3RhdGU6IGwoKSxcbiAgICAgICAgICBkcml2ZXI6IF8oKVxuICAgICAgICB9KSA6IEwoXCJuZXh0Q2xpY2tcIik7XG4gICAgICBpZiAoVC5jbG9zZXN0KFwiLmRyaXZlci1wb3BvdmVyLXByZXYtYnRuXCIpKVxuICAgICAgICByZXR1cm4gSCA/IEgoZSwgbywge1xuICAgICAgICAgIGNvbmZpZzogcygpLFxuICAgICAgICAgIHN0YXRlOiBsKCksXG4gICAgICAgICAgZHJpdmVyOiBfKClcbiAgICAgICAgfSkgOiBMKFwicHJldkNsaWNrXCIpO1xuICAgICAgaWYgKFQuY2xvc2VzdChcIi5kcml2ZXItcG9wb3Zlci1jbG9zZS1idG5cIikpXG4gICAgICAgIHJldHVybiAkID8gJChlLCBvLCB7XG4gICAgICAgICAgY29uZmlnOiBzKCksXG4gICAgICAgICAgc3RhdGU6IGwoKSxcbiAgICAgICAgICBkcml2ZXI6IF8oKVxuICAgICAgICB9KSA6IEwoXCJjbG9zZUNsaWNrXCIpO1xuICAgIH0sXG4gICAgKEUpID0+ICEodCAhPSBudWxsICYmIHQuZGVzY3JpcHRpb24uY29udGFpbnMoRSkpICYmICEodCAhPSBudWxsICYmIHQudGl0bGUuY29udGFpbnMoRSkpICYmIHR5cGVvZiBFLmNsYXNzTmFtZSA9PSBcInN0cmluZ1wiICYmIEUuY2xhc3NOYW1lLmluY2x1ZGVzKFwiZHJpdmVyLXBvcG92ZXJcIilcbiAgKSwgayhcInBvcG92ZXJcIiwgdCk7XG4gIGNvbnN0IHggPSAoKFAgPSBvLnBvcG92ZXIpID09IG51bGwgPyB2b2lkIDAgOiBQLm9uUG9wb3ZlclJlbmRlcikgfHwgcyhcIm9uUG9wb3ZlclJlbmRlclwiKTtcbiAgeCAmJiB4KHQsIHtcbiAgICBjb25maWc6IHMoKSxcbiAgICBzdGF0ZTogbCgpLFxuICAgIGRyaXZlcjogXygpXG4gIH0pLCBhZShlLCBvKSwgZWUodSk7XG4gIGNvbnN0IEMgPSBlLmNsYXNzTGlzdC5jb250YWlucyhcImRyaXZlci1kdW1teS1lbGVtZW50XCIpLCBTID0gVShbdSwgLi4uQyA/IFtdIDogW2VdXSk7XG4gIFMubGVuZ3RoID4gMCAmJiBTWzBdLmZvY3VzKCk7XG59XG5mdW5jdGlvbiBzZSgpIHtcbiAgY29uc3QgZSA9IGwoXCJwb3BvdmVyXCIpO1xuICBpZiAoIShlICE9IG51bGwgJiYgZS53cmFwcGVyKSlcbiAgICByZXR1cm47XG4gIGNvbnN0IG8gPSBlLndyYXBwZXIuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCksIHQgPSBzKFwic3RhZ2VQYWRkaW5nXCIpIHx8IDAsIGkgPSBzKFwicG9wb3Zlck9mZnNldFwiKSB8fCAwO1xuICByZXR1cm4ge1xuICAgIHdpZHRoOiBvLndpZHRoICsgdCArIGksXG4gICAgaGVpZ2h0OiBvLmhlaWdodCArIHQgKyBpLFxuICAgIHJlYWxXaWR0aDogby53aWR0aCxcbiAgICByZWFsSGVpZ2h0OiBvLmhlaWdodFxuICB9O1xufVxuZnVuY3Rpb24gWihlLCBvKSB7XG4gIGNvbnN0IHsgZWxlbWVudERpbWVuc2lvbnM6IHQsIHBvcG92ZXJEaW1lbnNpb25zOiBpLCBwb3BvdmVyUGFkZGluZzogZCwgcG9wb3ZlckFycm93RGltZW5zaW9uczogbiB9ID0gbztcbiAgcmV0dXJuIGUgPT09IFwic3RhcnRcIiA/IE1hdGgubWF4KFxuICAgIE1hdGgubWluKFxuICAgICAgdC50b3AgLSBkLFxuICAgICAgd2luZG93LmlubmVySGVpZ2h0IC0gaS5yZWFsSGVpZ2h0IC0gbi53aWR0aFxuICAgICksXG4gICAgbi53aWR0aFxuICApIDogZSA9PT0gXCJlbmRcIiA/IE1hdGgubWF4KFxuICAgIE1hdGgubWluKFxuICAgICAgdC50b3AgLSAoaSA9PSBudWxsID8gdm9pZCAwIDogaS5yZWFsSGVpZ2h0KSArIHQuaGVpZ2h0ICsgZCxcbiAgICAgIHdpbmRvdy5pbm5lckhlaWdodCAtIChpID09IG51bGwgPyB2b2lkIDAgOiBpLnJlYWxIZWlnaHQpIC0gbi53aWR0aFxuICAgICksXG4gICAgbi53aWR0aFxuICApIDogZSA9PT0gXCJjZW50ZXJcIiA/IE1hdGgubWF4KFxuICAgIE1hdGgubWluKFxuICAgICAgdC50b3AgKyB0LmhlaWdodCAvIDIgLSAoaSA9PSBudWxsID8gdm9pZCAwIDogaS5yZWFsSGVpZ2h0KSAvIDIsXG4gICAgICB3aW5kb3cuaW5uZXJIZWlnaHQgLSAoaSA9PSBudWxsID8gdm9pZCAwIDogaS5yZWFsSGVpZ2h0KSAtIG4ud2lkdGhcbiAgICApLFxuICAgIG4ud2lkdGhcbiAgKSA6IDA7XG59XG5mdW5jdGlvbiBHKGUsIG8pIHtcbiAgY29uc3QgeyBlbGVtZW50RGltZW5zaW9uczogdCwgcG9wb3ZlckRpbWVuc2lvbnM6IGksIHBvcG92ZXJQYWRkaW5nOiBkLCBwb3BvdmVyQXJyb3dEaW1lbnNpb25zOiBuIH0gPSBvO1xuICByZXR1cm4gZSA9PT0gXCJzdGFydFwiID8gTWF0aC5tYXgoXG4gICAgTWF0aC5taW4oXG4gICAgICB0LmxlZnQgLSBkLFxuICAgICAgd2luZG93LmlubmVyV2lkdGggLSBpLnJlYWxXaWR0aCAtIG4ud2lkdGhcbiAgICApLFxuICAgIG4ud2lkdGhcbiAgKSA6IGUgPT09IFwiZW5kXCIgPyBNYXRoLm1heChcbiAgICBNYXRoLm1pbihcbiAgICAgIHQubGVmdCAtIChpID09IG51bGwgPyB2b2lkIDAgOiBpLnJlYWxXaWR0aCkgKyB0LndpZHRoICsgZCxcbiAgICAgIHdpbmRvdy5pbm5lcldpZHRoIC0gKGkgPT0gbnVsbCA/IHZvaWQgMCA6IGkucmVhbFdpZHRoKSAtIG4ud2lkdGhcbiAgICApLFxuICAgIG4ud2lkdGhcbiAgKSA6IGUgPT09IFwiY2VudGVyXCIgPyBNYXRoLm1heChcbiAgICBNYXRoLm1pbihcbiAgICAgIHQubGVmdCArIHQud2lkdGggLyAyIC0gKGkgPT0gbnVsbCA/IHZvaWQgMCA6IGkucmVhbFdpZHRoKSAvIDIsXG4gICAgICB3aW5kb3cuaW5uZXJXaWR0aCAtIChpID09IG51bGwgPyB2b2lkIDAgOiBpLnJlYWxXaWR0aCkgLSBuLndpZHRoXG4gICAgKSxcbiAgICBuLndpZHRoXG4gICkgOiAwO1xufVxuZnVuY3Rpb24gYWUoZSwgbykge1xuICBjb25zdCB0ID0gbChcInBvcG92ZXJcIik7XG4gIGlmICghdClcbiAgICByZXR1cm47XG4gIGNvbnN0IHsgYWxpZ246IGkgPSBcInN0YXJ0XCIsIHNpZGU6IGQgPSBcImxlZnRcIiB9ID0gKG8gPT0gbnVsbCA/IHZvaWQgMCA6IG8ucG9wb3ZlcikgfHwge30sIG4gPSBpLCBmID0gZS5pZCA9PT0gXCJkcml2ZXItZHVtbXktZWxlbWVudFwiID8gXCJvdmVyXCIgOiBkLCB3ID0gcyhcInN0YWdlUGFkZGluZ1wiKSB8fCAwLCByID0gc2UoKSwgdiA9IHQuYXJyb3cuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCksIGcgPSBlLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLCB5ID0gZy50b3AgLSByLmhlaWdodDtcbiAgbGV0IGEgPSB5ID49IDA7XG4gIGNvbnN0IHAgPSB3aW5kb3cuaW5uZXJIZWlnaHQgLSAoZy5ib3R0b20gKyByLmhlaWdodCk7XG4gIGxldCBjID0gcCA+PSAwO1xuICBjb25zdCB1ID0gZy5sZWZ0IC0gci53aWR0aDtcbiAgbGV0IGggPSB1ID49IDA7XG4gIGNvbnN0IG0gPSB3aW5kb3cuaW5uZXJXaWR0aCAtIChnLnJpZ2h0ICsgci53aWR0aCk7XG4gIGxldCB4ID0gbSA+PSAwO1xuICBjb25zdCBDID0gIWEgJiYgIWMgJiYgIWggJiYgIXg7XG4gIGxldCBTID0gZjtcbiAgaWYgKGYgPT09IFwidG9wXCIgJiYgYSA/IHggPSBoID0gYyA9ICExIDogZiA9PT0gXCJib3R0b21cIiAmJiBjID8geCA9IGggPSBhID0gITEgOiBmID09PSBcImxlZnRcIiAmJiBoID8geCA9IGEgPSBjID0gITEgOiBmID09PSBcInJpZ2h0XCIgJiYgeCAmJiAoaCA9IGEgPSBjID0gITEpLCBmID09PSBcIm92ZXJcIikge1xuICAgIGNvbnN0IGIgPSB3aW5kb3cuaW5uZXJXaWR0aCAvIDIgLSByLnJlYWxXaWR0aCAvIDIsIFAgPSB3aW5kb3cuaW5uZXJIZWlnaHQgLyAyIC0gci5yZWFsSGVpZ2h0IC8gMjtcbiAgICB0LndyYXBwZXIuc3R5bGUubGVmdCA9IGAke2J9cHhgLCB0LndyYXBwZXIuc3R5bGUucmlnaHQgPSBcImF1dG9cIiwgdC53cmFwcGVyLnN0eWxlLnRvcCA9IGAke1B9cHhgLCB0LndyYXBwZXIuc3R5bGUuYm90dG9tID0gXCJhdXRvXCI7XG4gIH0gZWxzZSBpZiAoQykge1xuICAgIGNvbnN0IGIgPSB3aW5kb3cuaW5uZXJXaWR0aCAvIDIgLSAociA9PSBudWxsID8gdm9pZCAwIDogci5yZWFsV2lkdGgpIC8gMiwgUCA9IDEwO1xuICAgIHQud3JhcHBlci5zdHlsZS5sZWZ0ID0gYCR7Yn1weGAsIHQud3JhcHBlci5zdHlsZS5yaWdodCA9IFwiYXV0b1wiLCB0LndyYXBwZXIuc3R5bGUuYm90dG9tID0gYCR7UH1weGAsIHQud3JhcHBlci5zdHlsZS50b3AgPSBcImF1dG9cIjtcbiAgfSBlbHNlIGlmIChoKSB7XG4gICAgY29uc3QgYiA9IE1hdGgubWluKFxuICAgICAgdSxcbiAgICAgIHdpbmRvdy5pbm5lcldpZHRoIC0gKHIgPT0gbnVsbCA/IHZvaWQgMCA6IHIucmVhbFdpZHRoKSAtIHYud2lkdGhcbiAgICApLCBQID0gWihuLCB7XG4gICAgICBlbGVtZW50RGltZW5zaW9uczogZyxcbiAgICAgIHBvcG92ZXJEaW1lbnNpb25zOiByLFxuICAgICAgcG9wb3ZlclBhZGRpbmc6IHcsXG4gICAgICBwb3BvdmVyQXJyb3dEaW1lbnNpb25zOiB2XG4gICAgfSk7XG4gICAgdC53cmFwcGVyLnN0eWxlLmxlZnQgPSBgJHtifXB4YCwgdC53cmFwcGVyLnN0eWxlLnRvcCA9IGAke1B9cHhgLCB0LndyYXBwZXIuc3R5bGUuYm90dG9tID0gXCJhdXRvXCIsIHQud3JhcHBlci5zdHlsZS5yaWdodCA9IFwiYXV0b1wiLCBTID0gXCJsZWZ0XCI7XG4gIH0gZWxzZSBpZiAoeCkge1xuICAgIGNvbnN0IGIgPSBNYXRoLm1pbihcbiAgICAgIG0sXG4gICAgICB3aW5kb3cuaW5uZXJXaWR0aCAtIChyID09IG51bGwgPyB2b2lkIDAgOiByLnJlYWxXaWR0aCkgLSB2LndpZHRoXG4gICAgKSwgUCA9IFoobiwge1xuICAgICAgZWxlbWVudERpbWVuc2lvbnM6IGcsXG4gICAgICBwb3BvdmVyRGltZW5zaW9uczogcixcbiAgICAgIHBvcG92ZXJQYWRkaW5nOiB3LFxuICAgICAgcG9wb3ZlckFycm93RGltZW5zaW9uczogdlxuICAgIH0pO1xuICAgIHQud3JhcHBlci5zdHlsZS5yaWdodCA9IGAke2J9cHhgLCB0LndyYXBwZXIuc3R5bGUudG9wID0gYCR7UH1weGAsIHQud3JhcHBlci5zdHlsZS5ib3R0b20gPSBcImF1dG9cIiwgdC53cmFwcGVyLnN0eWxlLmxlZnQgPSBcImF1dG9cIiwgUyA9IFwicmlnaHRcIjtcbiAgfSBlbHNlIGlmIChhKSB7XG4gICAgY29uc3QgYiA9IE1hdGgubWluKFxuICAgICAgeSxcbiAgICAgIHdpbmRvdy5pbm5lckhlaWdodCAtIHIucmVhbEhlaWdodCAtIHYud2lkdGhcbiAgICApO1xuICAgIGxldCBQID0gRyhuLCB7XG4gICAgICBlbGVtZW50RGltZW5zaW9uczogZyxcbiAgICAgIHBvcG92ZXJEaW1lbnNpb25zOiByLFxuICAgICAgcG9wb3ZlclBhZGRpbmc6IHcsXG4gICAgICBwb3BvdmVyQXJyb3dEaW1lbnNpb25zOiB2XG4gICAgfSk7XG4gICAgdC53cmFwcGVyLnN0eWxlLnRvcCA9IGAke2J9cHhgLCB0LndyYXBwZXIuc3R5bGUubGVmdCA9IGAke1B9cHhgLCB0LndyYXBwZXIuc3R5bGUuYm90dG9tID0gXCJhdXRvXCIsIHQud3JhcHBlci5zdHlsZS5yaWdodCA9IFwiYXV0b1wiLCBTID0gXCJ0b3BcIjtcbiAgfSBlbHNlIGlmIChjKSB7XG4gICAgY29uc3QgYiA9IE1hdGgubWluKFxuICAgICAgcCxcbiAgICAgIHdpbmRvdy5pbm5lckhlaWdodCAtIChyID09IG51bGwgPyB2b2lkIDAgOiByLnJlYWxIZWlnaHQpIC0gdi53aWR0aFxuICAgICk7XG4gICAgbGV0IFAgPSBHKG4sIHtcbiAgICAgIGVsZW1lbnREaW1lbnNpb25zOiBnLFxuICAgICAgcG9wb3ZlckRpbWVuc2lvbnM6IHIsXG4gICAgICBwb3BvdmVyUGFkZGluZzogdyxcbiAgICAgIHBvcG92ZXJBcnJvd0RpbWVuc2lvbnM6IHZcbiAgICB9KTtcbiAgICB0LndyYXBwZXIuc3R5bGUubGVmdCA9IGAke1B9cHhgLCB0LndyYXBwZXIuc3R5bGUuYm90dG9tID0gYCR7Yn1weGAsIHQud3JhcHBlci5zdHlsZS50b3AgPSBcImF1dG9cIiwgdC53cmFwcGVyLnN0eWxlLnJpZ2h0ID0gXCJhdXRvXCIsIFMgPSBcImJvdHRvbVwiO1xuICB9XG4gIEMgPyB0LmFycm93LmNsYXNzTGlzdC5hZGQoXCJkcml2ZXItcG9wb3Zlci1hcnJvdy1ub25lXCIpIDogRWUobiwgUywgZSk7XG59XG5mdW5jdGlvbiBFZShlLCBvLCB0KSB7XG4gIGNvbnN0IGkgPSBsKFwicG9wb3ZlclwiKTtcbiAgaWYgKCFpKVxuICAgIHJldHVybjtcbiAgY29uc3QgZCA9IHQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCksIG4gPSBzZSgpLCBmID0gaS5hcnJvdywgdyA9IG4ud2lkdGgsIHIgPSB3aW5kb3cuaW5uZXJXaWR0aCwgdiA9IGQud2lkdGgsIGcgPSBkLmxlZnQsIHkgPSBuLmhlaWdodCwgYSA9IHdpbmRvdy5pbm5lckhlaWdodCwgcCA9IGQudG9wLCBjID0gZC5oZWlnaHQ7XG4gIGYuY2xhc3NOYW1lID0gXCJkcml2ZXItcG9wb3Zlci1hcnJvd1wiO1xuICBsZXQgdSA9IG8sIGggPSBlO1xuICBpZiAobyA9PT0gXCJ0b3BcIiA/IChnICsgdiA8PSAwID8gKHUgPSBcInJpZ2h0XCIsIGggPSBcImVuZFwiKSA6IGcgKyB2IC0gdyA8PSAwICYmICh1ID0gXCJ0b3BcIiwgaCA9IFwic3RhcnRcIiksIGcgPj0gciA/ICh1ID0gXCJsZWZ0XCIsIGggPSBcImVuZFwiKSA6IGcgKyB3ID49IHIgJiYgKHUgPSBcInRvcFwiLCBoID0gXCJlbmRcIikpIDogbyA9PT0gXCJib3R0b21cIiA/IChnICsgdiA8PSAwID8gKHUgPSBcInJpZ2h0XCIsIGggPSBcInN0YXJ0XCIpIDogZyArIHYgLSB3IDw9IDAgJiYgKHUgPSBcImJvdHRvbVwiLCBoID0gXCJzdGFydFwiKSwgZyA+PSByID8gKHUgPSBcImxlZnRcIiwgaCA9IFwic3RhcnRcIikgOiBnICsgdyA+PSByICYmICh1ID0gXCJib3R0b21cIiwgaCA9IFwiZW5kXCIpKSA6IG8gPT09IFwibGVmdFwiID8gKHAgKyBjIDw9IDAgPyAodSA9IFwiYm90dG9tXCIsIGggPSBcImVuZFwiKSA6IHAgKyBjIC0geSA8PSAwICYmICh1ID0gXCJsZWZ0XCIsIGggPSBcInN0YXJ0XCIpLCBwID49IGEgPyAodSA9IFwidG9wXCIsIGggPSBcImVuZFwiKSA6IHAgKyB5ID49IGEgJiYgKHUgPSBcImxlZnRcIiwgaCA9IFwiZW5kXCIpKSA6IG8gPT09IFwicmlnaHRcIiAmJiAocCArIGMgPD0gMCA/ICh1ID0gXCJib3R0b21cIiwgaCA9IFwic3RhcnRcIikgOiBwICsgYyAtIHkgPD0gMCAmJiAodSA9IFwicmlnaHRcIiwgaCA9IFwic3RhcnRcIiksIHAgPj0gYSA/ICh1ID0gXCJ0b3BcIiwgaCA9IFwic3RhcnRcIikgOiBwICsgeSA+PSBhICYmICh1ID0gXCJyaWdodFwiLCBoID0gXCJlbmRcIikpLCAhdSlcbiAgICBmLmNsYXNzTGlzdC5hZGQoXCJkcml2ZXItcG9wb3Zlci1hcnJvdy1ub25lXCIpO1xuICBlbHNlIHtcbiAgICBmLmNsYXNzTGlzdC5hZGQoYGRyaXZlci1wb3BvdmVyLWFycm93LXNpZGUtJHt1fWApLCBmLmNsYXNzTGlzdC5hZGQoYGRyaXZlci1wb3BvdmVyLWFycm93LWFsaWduLSR7aH1gKTtcbiAgICBjb25zdCBtID0gdC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKSwgeCA9IGYuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCksIEMgPSBzKFwic3RhZ2VQYWRkaW5nXCIpIHx8IDAsIFMgPSBtLmxlZnQgLSBDIDwgd2luZG93LmlubmVyV2lkdGggJiYgbS5yaWdodCArIEMgPiAwICYmIG0udG9wIC0gQyA8IHdpbmRvdy5pbm5lckhlaWdodCAmJiBtLmJvdHRvbSArIEMgPiAwO1xuICAgIG8gPT09IFwiYm90dG9tXCIgJiYgUyAmJiAoeC54ID4gbS54ICYmIHgueCArIHgud2lkdGggPCBtLnggKyBtLndpZHRoID8gaS53cmFwcGVyLnN0eWxlLnRyYW5zZm9ybSA9IFwidHJhbnNsYXRlWSgwKVwiIDogKGYuY2xhc3NMaXN0LnJlbW92ZShgZHJpdmVyLXBvcG92ZXItYXJyb3ctYWxpZ24tJHtofWApLCBmLmNsYXNzTGlzdC5hZGQoXCJkcml2ZXItcG9wb3Zlci1hcnJvdy1ub25lXCIpLCBpLndyYXBwZXIuc3R5bGUudHJhbnNmb3JtID0gYHRyYW5zbGF0ZVkoLSR7QyAvIDJ9cHgpYCkpO1xuICB9XG59XG5mdW5jdGlvbiBMZSgpIHtcbiAgY29uc3QgZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIGUuY2xhc3NMaXN0LmFkZChcImRyaXZlci1wb3BvdmVyXCIpO1xuICBjb25zdCBvID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgby5jbGFzc0xpc3QuYWRkKFwiZHJpdmVyLXBvcG92ZXItYXJyb3dcIik7XG4gIGNvbnN0IHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiaGVhZGVyXCIpO1xuICB0LmlkID0gXCJkcml2ZXItcG9wb3Zlci10aXRsZVwiLCB0LmNsYXNzTGlzdC5hZGQoXCJkcml2ZXItcG9wb3Zlci10aXRsZVwiKSwgdC5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCIsIHQuaW5uZXJUZXh0ID0gXCJQb3BvdmVyIFRpdGxlXCI7XG4gIGNvbnN0IGkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICBpLmlkID0gXCJkcml2ZXItcG9wb3Zlci1kZXNjcmlwdGlvblwiLCBpLmNsYXNzTGlzdC5hZGQoXCJkcml2ZXItcG9wb3Zlci1kZXNjcmlwdGlvblwiKSwgaS5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCIsIGkuaW5uZXJUZXh0ID0gXCJQb3BvdmVyIGRlc2NyaXB0aW9uIGlzIGhlcmVcIjtcbiAgY29uc3QgZCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJidXR0b25cIik7XG4gIGQudHlwZSA9IFwiYnV0dG9uXCIsIGQuY2xhc3NMaXN0LmFkZChcImRyaXZlci1wb3BvdmVyLWNsb3NlLWJ0blwiKSwgZC5zZXRBdHRyaWJ1dGUoXCJhcmlhLWxhYmVsXCIsIFwiQ2xvc2VcIiksIGQuaW5uZXJIVE1MID0gXCImdGltZXM7XCI7XG4gIGNvbnN0IG4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZm9vdGVyXCIpO1xuICBuLmNsYXNzTGlzdC5hZGQoXCJkcml2ZXItcG9wb3Zlci1mb290ZXJcIik7XG4gIGNvbnN0IGYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgZi5jbGFzc0xpc3QuYWRkKFwiZHJpdmVyLXBvcG92ZXItcHJvZ3Jlc3MtdGV4dFwiKSwgZi5pbm5lclRleHQgPSBcIlwiO1xuICBjb25zdCB3ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gIHcuY2xhc3NMaXN0LmFkZChcImRyaXZlci1wb3BvdmVyLW5hdmlnYXRpb24tYnRuc1wiKTtcbiAgY29uc3QgciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJidXR0b25cIik7XG4gIHIudHlwZSA9IFwiYnV0dG9uXCIsIHIuY2xhc3NMaXN0LmFkZChcImRyaXZlci1wb3BvdmVyLXByZXYtYnRuXCIpLCByLmlubmVySFRNTCA9IFwiJmxhcnI7IFByZXZpb3VzXCI7XG4gIGNvbnN0IHYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYnV0dG9uXCIpO1xuICByZXR1cm4gdi50eXBlID0gXCJidXR0b25cIiwgdi5jbGFzc0xpc3QuYWRkKFwiZHJpdmVyLXBvcG92ZXItbmV4dC1idG5cIiksIHYuaW5uZXJIVE1MID0gXCJOZXh0ICZyYXJyO1wiLCB3LmFwcGVuZENoaWxkKHIpLCB3LmFwcGVuZENoaWxkKHYpLCBuLmFwcGVuZENoaWxkKGYpLCBuLmFwcGVuZENoaWxkKHcpLCBlLmFwcGVuZENoaWxkKGQpLCBlLmFwcGVuZENoaWxkKG8pLCBlLmFwcGVuZENoaWxkKHQpLCBlLmFwcGVuZENoaWxkKGkpLCBlLmFwcGVuZENoaWxkKG4pLCB7XG4gICAgd3JhcHBlcjogZSxcbiAgICBhcnJvdzogbyxcbiAgICB0aXRsZTogdCxcbiAgICBkZXNjcmlwdGlvbjogaSxcbiAgICBmb290ZXI6IG4sXG4gICAgcHJldmlvdXNCdXR0b246IHIsXG4gICAgbmV4dEJ1dHRvbjogdixcbiAgICBjbG9zZUJ1dHRvbjogZCxcbiAgICBmb290ZXJCdXR0b25zOiB3LFxuICAgIHByb2dyZXNzOiBmXG4gIH07XG59XG5mdW5jdGlvbiBUZSgpIHtcbiAgdmFyIG87XG4gIGNvbnN0IGUgPSBsKFwicG9wb3ZlclwiKTtcbiAgZSAmJiAoKG8gPSBlLndyYXBwZXIucGFyZW50RWxlbWVudCkgPT0gbnVsbCB8fCBvLnJlbW92ZUNoaWxkKGUud3JhcHBlcikpO1xufVxuZnVuY3Rpb24gQWUoZSA9IHt9KSB7XG4gIEYoZSk7XG4gIGZ1bmN0aW9uIG8oKSB7XG4gICAgcyhcImFsbG93Q2xvc2VcIikgJiYgZygpO1xuICB9XG4gIGZ1bmN0aW9uIHQoKSB7XG4gICAgY29uc3QgYSA9IHMoXCJvdmVybGF5Q2xpY2tCZWhhdmlvclwiKTtcbiAgICBpZiAocyhcImFsbG93Q2xvc2VcIikgJiYgYSA9PT0gXCJjbG9zZVwiKSB7XG4gICAgICBnKCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmICh0eXBlb2YgYSA9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgIGNvbnN0IHAgPSBsKFwiX19hY3RpdmVTdGVwXCIpLCBjID0gbChcIl9fYWN0aXZlRWxlbWVudFwiKTtcbiAgICAgIGEoYywgcCwge1xuICAgICAgICBjb25maWc6IHMoKSxcbiAgICAgICAgc3RhdGU6IGwoKSxcbiAgICAgICAgZHJpdmVyOiBfKClcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBhID09PSBcIm5leHRTdGVwXCIgJiYgaSgpO1xuICB9XG4gIGZ1bmN0aW9uIGkoKSB7XG4gICAgY29uc3QgYSA9IGwoXCJhY3RpdmVJbmRleFwiKSwgcCA9IHMoXCJzdGVwc1wiKSB8fCBbXTtcbiAgICBpZiAodHlwZW9mIGEgPT0gXCJ1bmRlZmluZWRcIilcbiAgICAgIHJldHVybjtcbiAgICBjb25zdCBjID0gYSArIDE7XG4gICAgcFtjXSA/IHYoYykgOiBnKCk7XG4gIH1cbiAgZnVuY3Rpb24gZCgpIHtcbiAgICBjb25zdCBhID0gbChcImFjdGl2ZUluZGV4XCIpLCBwID0gcyhcInN0ZXBzXCIpIHx8IFtdO1xuICAgIGlmICh0eXBlb2YgYSA9PSBcInVuZGVmaW5lZFwiKVxuICAgICAgcmV0dXJuO1xuICAgIGNvbnN0IGMgPSBhIC0gMTtcbiAgICBwW2NdID8gdihjKSA6IGcoKTtcbiAgfVxuICBmdW5jdGlvbiBuKGEpIHtcbiAgICAocyhcInN0ZXBzXCIpIHx8IFtdKVthXSA/IHYoYSkgOiBnKCk7XG4gIH1cbiAgZnVuY3Rpb24gZigpIHtcbiAgICB2YXIgeDtcbiAgICBpZiAobChcIl9fdHJhbnNpdGlvbkNhbGxiYWNrXCIpKVxuICAgICAgcmV0dXJuO1xuICAgIGNvbnN0IHAgPSBsKFwiYWN0aXZlSW5kZXhcIiksIGMgPSBsKFwiX19hY3RpdmVTdGVwXCIpLCB1ID0gbChcIl9fYWN0aXZlRWxlbWVudFwiKTtcbiAgICBpZiAodHlwZW9mIHAgPT0gXCJ1bmRlZmluZWRcIiB8fCB0eXBlb2YgYyA9PSBcInVuZGVmaW5lZFwiIHx8IHR5cGVvZiBsKFwiYWN0aXZlSW5kZXhcIikgPT0gXCJ1bmRlZmluZWRcIilcbiAgICAgIHJldHVybjtcbiAgICBjb25zdCBtID0gKCh4ID0gYy5wb3BvdmVyKSA9PSBudWxsID8gdm9pZCAwIDogeC5vblByZXZDbGljaykgfHwgcyhcIm9uUHJldkNsaWNrXCIpO1xuICAgIGlmIChtKVxuICAgICAgcmV0dXJuIG0odSwgYywge1xuICAgICAgICBjb25maWc6IHMoKSxcbiAgICAgICAgc3RhdGU6IGwoKSxcbiAgICAgICAgZHJpdmVyOiBfKClcbiAgICAgIH0pO1xuICAgIGQoKTtcbiAgfVxuICBmdW5jdGlvbiB3KCkge1xuICAgIHZhciBtO1xuICAgIGlmIChsKFwiX190cmFuc2l0aW9uQ2FsbGJhY2tcIikpXG4gICAgICByZXR1cm47XG4gICAgY29uc3QgcCA9IGwoXCJhY3RpdmVJbmRleFwiKSwgYyA9IGwoXCJfX2FjdGl2ZVN0ZXBcIiksIHUgPSBsKFwiX19hY3RpdmVFbGVtZW50XCIpO1xuICAgIGlmICh0eXBlb2YgcCA9PSBcInVuZGVmaW5lZFwiIHx8IHR5cGVvZiBjID09IFwidW5kZWZpbmVkXCIpXG4gICAgICByZXR1cm47XG4gICAgY29uc3QgaCA9ICgobSA9IGMucG9wb3ZlcikgPT0gbnVsbCA/IHZvaWQgMCA6IG0ub25OZXh0Q2xpY2spIHx8IHMoXCJvbk5leHRDbGlja1wiKTtcbiAgICBpZiAoaClcbiAgICAgIHJldHVybiBoKHUsIGMsIHtcbiAgICAgICAgY29uZmlnOiBzKCksXG4gICAgICAgIHN0YXRlOiBsKCksXG4gICAgICAgIGRyaXZlcjogXygpXG4gICAgICB9KTtcbiAgICBpKCk7XG4gIH1cbiAgZnVuY3Rpb24gcigpIHtcbiAgICBsKFwiaXNJbml0aWFsaXplZFwiKSB8fCAoayhcImlzSW5pdGlhbGl6ZWRcIiwgITApLCBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5hZGQoXCJkcml2ZXItYWN0aXZlXCIsIHMoXCJhbmltYXRlXCIpID8gXCJkcml2ZXItZmFkZVwiIDogXCJkcml2ZXItc2ltcGxlXCIpLCBrZSgpLCBOKFwib3ZlcmxheUNsaWNrXCIsIHQpLCBOKFwiZXNjYXBlUHJlc3NcIiwgbyksIE4oXCJhcnJvd0xlZnRQcmVzc1wiLCBmKSwgTihcImFycm93UmlnaHRQcmVzc1wiLCB3KSk7XG4gIH1cbiAgZnVuY3Rpb24gdihhID0gMCkge1xuICAgIHZhciAkLCBCLCBSLCBXLCBWLCBxLCBLLCBZO1xuICAgIGNvbnN0IHAgPSBzKFwic3RlcHNcIik7XG4gICAgaWYgKCFwKSB7XG4gICAgICBjb25zb2xlLmVycm9yKFwiTm8gc3RlcHMgdG8gZHJpdmUgdGhyb3VnaFwiKSwgZygpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAoIXBbYV0pIHtcbiAgICAgIGcoKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgayhcIl9fYWN0aXZlT25EZXN0cm95ZWRcIiwgZG9jdW1lbnQuYWN0aXZlRWxlbWVudCksIGsoXCJhY3RpdmVJbmRleFwiLCBhKTtcbiAgICBjb25zdCBjID0gcFthXSwgdSA9IHBbYSArIDFdLCBoID0gcFthIC0gMV0sIG0gPSAoKCQgPSBjLnBvcG92ZXIpID09IG51bGwgPyB2b2lkIDAgOiAkLmRvbmVCdG5UZXh0KSB8fCBzKFwiZG9uZUJ0blRleHRcIikgfHwgXCJEb25lXCIsIHggPSBzKFwiYWxsb3dDbG9zZVwiKSwgQyA9IHR5cGVvZiAoKEIgPSBjLnBvcG92ZXIpID09IG51bGwgPyB2b2lkIDAgOiBCLnNob3dQcm9ncmVzcykgIT0gXCJ1bmRlZmluZWRcIiA/IChSID0gYy5wb3BvdmVyKSA9PSBudWxsID8gdm9pZCAwIDogUi5zaG93UHJvZ3Jlc3MgOiBzKFwic2hvd1Byb2dyZXNzXCIpLCBiID0gKCgoVyA9IGMucG9wb3ZlcikgPT0gbnVsbCA/IHZvaWQgMCA6IFcucHJvZ3Jlc3NUZXh0KSB8fCBzKFwicHJvZ3Jlc3NUZXh0XCIpIHx8IFwie3tjdXJyZW50fX0gb2Yge3t0b3RhbH19XCIpLnJlcGxhY2UoXCJ7e2N1cnJlbnR9fVwiLCBgJHthICsgMX1gKS5yZXBsYWNlKFwie3t0b3RhbH19XCIsIGAke3AubGVuZ3RofWApLCBQID0gKChWID0gYy5wb3BvdmVyKSA9PSBudWxsID8gdm9pZCAwIDogVi5zaG93QnV0dG9ucykgfHwgcyhcInNob3dCdXR0b25zXCIpLCBFID0gW1xuICAgICAgXCJuZXh0XCIsXG4gICAgICBcInByZXZpb3VzXCIsXG4gICAgICAuLi54ID8gW1wiY2xvc2VcIl0gOiBbXVxuICAgIF0uZmlsdGVyKChjZSkgPT4gIShQICE9IG51bGwgJiYgUC5sZW5ndGgpIHx8IFAuaW5jbHVkZXMoY2UpKSwgVCA9ICgocSA9IGMucG9wb3ZlcikgPT0gbnVsbCA/IHZvaWQgMCA6IHEub25OZXh0Q2xpY2spIHx8IHMoXCJvbk5leHRDbGlja1wiKSwgQSA9ICgoSyA9IGMucG9wb3ZlcikgPT0gbnVsbCA/IHZvaWQgMCA6IEsub25QcmV2Q2xpY2spIHx8IHMoXCJvblByZXZDbGlja1wiKSwgSCA9ICgoWSA9IGMucG9wb3ZlcikgPT0gbnVsbCA/IHZvaWQgMCA6IFkub25DbG9zZUNsaWNrKSB8fCBzKFwib25DbG9zZUNsaWNrXCIpO1xuICAgIGooe1xuICAgICAgLi4uYyxcbiAgICAgIHBvcG92ZXI6IHtcbiAgICAgICAgc2hvd0J1dHRvbnM6IEUsXG4gICAgICAgIG5leHRCdG5UZXh0OiB1ID8gdm9pZCAwIDogbSxcbiAgICAgICAgZGlzYWJsZUJ1dHRvbnM6IFsuLi5oID8gW10gOiBbXCJwcmV2aW91c1wiXV0sXG4gICAgICAgIHNob3dQcm9ncmVzczogQyxcbiAgICAgICAgcHJvZ3Jlc3NUZXh0OiBiLFxuICAgICAgICBvbk5leHRDbGljazogVCB8fCAoKCkgPT4ge1xuICAgICAgICAgIHUgPyB2KGEgKyAxKSA6IGcoKTtcbiAgICAgICAgfSksXG4gICAgICAgIG9uUHJldkNsaWNrOiBBIHx8ICgoKSA9PiB7XG4gICAgICAgICAgdihhIC0gMSk7XG4gICAgICAgIH0pLFxuICAgICAgICBvbkNsb3NlQ2xpY2s6IEggfHwgKCgpID0+IHtcbiAgICAgICAgICBnKCk7XG4gICAgICAgIH0pLFxuICAgICAgICAuLi4oYyA9PSBudWxsID8gdm9pZCAwIDogYy5wb3BvdmVyKSB8fCB7fVxuICAgICAgfVxuICAgIH0pO1xuICB9XG4gIGZ1bmN0aW9uIGcoYSA9ICEwKSB7XG4gICAgY29uc3QgcCA9IGwoXCJfX2FjdGl2ZUVsZW1lbnRcIiksIGMgPSBsKFwiX19hY3RpdmVTdGVwXCIpLCB1ID0gbChcIl9fYWN0aXZlT25EZXN0cm95ZWRcIiksIGggPSBzKFwib25EZXN0cm95U3RhcnRlZFwiKTtcbiAgICBpZiAoYSAmJiBoKSB7XG4gICAgICBjb25zdCBDID0gIXAgfHwgKHAgPT0gbnVsbCA/IHZvaWQgMCA6IHAuaWQpID09PSBcImRyaXZlci1kdW1teS1lbGVtZW50XCI7XG4gICAgICBoKEMgPyB2b2lkIDAgOiBwLCBjLCB7XG4gICAgICAgIGNvbmZpZzogcygpLFxuICAgICAgICBzdGF0ZTogbCgpLFxuICAgICAgICBkcml2ZXI6IF8oKVxuICAgICAgfSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IG0gPSAoYyA9PSBudWxsID8gdm9pZCAwIDogYy5vbkRlc2VsZWN0ZWQpIHx8IHMoXCJvbkRlc2VsZWN0ZWRcIiksIHggPSBzKFwib25EZXN0cm95ZWRcIik7XG4gICAgaWYgKGRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LnJlbW92ZShcImRyaXZlci1hY3RpdmVcIiwgXCJkcml2ZXItZmFkZVwiLCBcImRyaXZlci1zaW1wbGVcIiksIF9lKCksIFRlKCksIENlKCksIG1lKCksIGRlKCksIFgoKSwgcCAmJiBjKSB7XG4gICAgICBjb25zdCBDID0gcC5pZCA9PT0gXCJkcml2ZXItZHVtbXktZWxlbWVudFwiO1xuICAgICAgbSAmJiBtKEMgPyB2b2lkIDAgOiBwLCBjLCB7XG4gICAgICAgIGNvbmZpZzogcygpLFxuICAgICAgICBzdGF0ZTogbCgpLFxuICAgICAgICBkcml2ZXI6IF8oKVxuICAgICAgfSksIHggJiYgeChDID8gdm9pZCAwIDogcCwgYywge1xuICAgICAgICBjb25maWc6IHMoKSxcbiAgICAgICAgc3RhdGU6IGwoKSxcbiAgICAgICAgZHJpdmVyOiBfKClcbiAgICAgIH0pO1xuICAgIH1cbiAgICB1ICYmIHUuZm9jdXMoKTtcbiAgfVxuICBjb25zdCB5ID0ge1xuICAgIGlzQWN0aXZlOiAoKSA9PiBsKFwiaXNJbml0aWFsaXplZFwiKSB8fCAhMSxcbiAgICByZWZyZXNoOiBNLFxuICAgIGRyaXZlOiAoYSA9IDApID0+IHtcbiAgICAgIHIoKSwgdihhKTtcbiAgICB9LFxuICAgIHNldENvbmZpZzogRixcbiAgICBzZXRTdGVwczogKGEpID0+IHtcbiAgICAgIFgoKSwgRih7XG4gICAgICAgIC4uLnMoKSxcbiAgICAgICAgc3RlcHM6IGFcbiAgICAgIH0pO1xuICAgIH0sXG4gICAgZ2V0Q29uZmlnOiBzLFxuICAgIGdldFN0YXRlOiBsLFxuICAgIGdldEFjdGl2ZUluZGV4OiAoKSA9PiBsKFwiYWN0aXZlSW5kZXhcIiksXG4gICAgaXNGaXJzdFN0ZXA6ICgpID0+IGwoXCJhY3RpdmVJbmRleFwiKSA9PT0gMCxcbiAgICBpc0xhc3RTdGVwOiAoKSA9PiB7XG4gICAgICBjb25zdCBhID0gcyhcInN0ZXBzXCIpIHx8IFtdLCBwID0gbChcImFjdGl2ZUluZGV4XCIpO1xuICAgICAgcmV0dXJuIHAgIT09IHZvaWQgMCAmJiBwID09PSBhLmxlbmd0aCAtIDE7XG4gICAgfSxcbiAgICBnZXRBY3RpdmVTdGVwOiAoKSA9PiBsKFwiYWN0aXZlU3RlcFwiKSxcbiAgICBnZXRBY3RpdmVFbGVtZW50OiAoKSA9PiBsKFwiYWN0aXZlRWxlbWVudFwiKSxcbiAgICBnZXRQcmV2aW91c0VsZW1lbnQ6ICgpID0+IGwoXCJwcmV2aW91c0VsZW1lbnRcIiksXG4gICAgZ2V0UHJldmlvdXNTdGVwOiAoKSA9PiBsKFwicHJldmlvdXNTdGVwXCIpLFxuICAgIG1vdmVOZXh0OiBpLFxuICAgIG1vdmVQcmV2aW91czogZCxcbiAgICBtb3ZlVG86IG4sXG4gICAgaGFzTmV4dFN0ZXA6ICgpID0+IHtcbiAgICAgIGNvbnN0IGEgPSBzKFwic3RlcHNcIikgfHwgW10sIHAgPSBsKFwiYWN0aXZlSW5kZXhcIik7XG4gICAgICByZXR1cm4gcCAhPT0gdm9pZCAwICYmICEhYVtwICsgMV07XG4gICAgfSxcbiAgICBoYXNQcmV2aW91c1N0ZXA6ICgpID0+IHtcbiAgICAgIGNvbnN0IGEgPSBzKFwic3RlcHNcIikgfHwgW10sIHAgPSBsKFwiYWN0aXZlSW5kZXhcIik7XG4gICAgICByZXR1cm4gcCAhPT0gdm9pZCAwICYmICEhYVtwIC0gMV07XG4gICAgfSxcbiAgICBoaWdobGlnaHQ6IChhKSA9PiB7XG4gICAgICByKCksIGooe1xuICAgICAgICAuLi5hLFxuICAgICAgICBwb3BvdmVyOiBhLnBvcG92ZXIgPyB7XG4gICAgICAgICAgc2hvd0J1dHRvbnM6IFtdLFxuICAgICAgICAgIHNob3dQcm9ncmVzczogITEsXG4gICAgICAgICAgcHJvZ3Jlc3NUZXh0OiBcIlwiLFxuICAgICAgICAgIC4uLmEucG9wb3ZlclxuICAgICAgICB9IDogdm9pZCAwXG4gICAgICB9KTtcbiAgICB9LFxuICAgIGRlc3Ryb3k6ICgpID0+IHtcbiAgICAgIGcoITEpO1xuICAgIH1cbiAgfTtcbiAgcmV0dXJuIGxlKHkpLCB5O1xufVxuZXhwb3J0IHtcbiAgQWUgYXMgZHJpdmVyXG59O1xuIiwiaW1wb3J0IHsgZHJpdmVyIH0gZnJvbSAnZHJpdmVyLmpzJztcbmltcG9ydCAnZHJpdmVyLmpzL2Rpc3QvZHJpdmVyLmNzcyc7XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbnRlbnRTY3JpcHQoe1xuICBtYXRjaGVzOiBbJ2h0dHBzOi8vd3d3LnBhdGVudC5nby5rci8qJ10sXG4gIG1haW4oKSB7XG4gICAgY29uc29sZS5sb2coJ1BhdGVudCBHdWlkZSBBc3Npc3RhbnQgLSBDb250ZW50IFNjcmlwdCBMb2FkZWQnKTtcblxuICAgIC8vIFNoYWRvdyBET03snLzroZwg6rKp66as65CcIOyxl+u0hyDrsoTtirwg7IOd7ISxXG4gICAgY29uc3QgY29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgY29udGFpbmVyLmlkID0gJ3BhdGVudC1ndWlkZS1jb250YWluZXInO1xuICAgIGNvbnRhaW5lci5zdHlsZS5jc3NUZXh0ID0gYFxuICAgICAgcG9zaXRpb246IGZpeGVkO1xuICAgICAgYm90dG9tOiAyMHB4O1xuICAgICAgcmlnaHQ6IDIwcHg7XG4gICAgICB6LWluZGV4OiA5OTk5OTk7XG4gICAgYDtcblxuICAgIGNvbnN0IHNoYWRvdyA9IGNvbnRhaW5lci5hdHRhY2hTaGFkb3coeyBtb2RlOiAnb3BlbicgfSk7XG5cbiAgICAvLyDssZfrtIcg7Je06riwIOuyhO2KvFxuICAgIGNvbnN0IGJ1dHRvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2J1dHRvbicpO1xuICAgIGJ1dHRvbi50ZXh0Q29udGVudCA9ICfwn5KsIOqwgOydtOuTnCDrj4TsmrDrr7gnO1xuICAgIGJ1dHRvbi5zdHlsZS5jc3NUZXh0ID0gYFxuICAgICAgYmFja2dyb3VuZDogbGluZWFyLWdyYWRpZW50KDEzNWRlZywgIzY2N2VlYSAwJSwgIzc2NGJhMiAxMDAlKTtcbiAgICAgIGNvbG9yOiB3aGl0ZTtcbiAgICAgIGJvcmRlcjogbm9uZTtcbiAgICAgIGJvcmRlci1yYWRpdXM6IDUwcHg7XG4gICAgICBwYWRkaW5nOiAxMnB4IDI0cHg7XG4gICAgICBmb250LXNpemU6IDE0cHg7XG4gICAgICBmb250LXdlaWdodDogNjAwO1xuICAgICAgY3Vyc29yOiBwb2ludGVyO1xuICAgICAgYm94LXNoYWRvdzogMCA0cHggMTVweCByZ2JhKDEwMiwgMTI2LCAyMzQsIDAuNCk7XG4gICAgICB0cmFuc2l0aW9uOiBhbGwgMC4zcyBlYXNlO1xuICAgIGA7XG5cbiAgICBidXR0b24uYWRkRXZlbnRMaXN0ZW5lcignbW91c2VlbnRlcicsICgpID0+IHtcbiAgICAgIGJ1dHRvbi5zdHlsZS50cmFuc2Zvcm0gPSAndHJhbnNsYXRlWSgtMnB4KSc7XG4gICAgICBidXR0b24uc3R5bGUuYm94U2hhZG93ID0gJzAgNnB4IDIwcHggcmdiYSgxMDIsIDEyNiwgMjM0LCAwLjYpJztcbiAgICB9KTtcblxuICAgIGJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWxlYXZlJywgKCkgPT4ge1xuICAgICAgYnV0dG9uLnN0eWxlLnRyYW5zZm9ybSA9ICd0cmFuc2xhdGVZKDApJztcbiAgICAgIGJ1dHRvbi5zdHlsZS5ib3hTaGFkb3cgPSAnMCA0cHggMTVweCByZ2JhKDEwMiwgMTI2LCAyMzQsIDAuNCknO1xuICAgIH0pO1xuXG4gICAgYnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuICAgICAgLy8gUG9wdXAg7Je06riwXG4gICAgICBjaHJvbWUucnVudGltZS5zZW5kTWVzc2FnZSh7IHR5cGU6ICdPUEVOX1BPUFVQJyB9KTtcbiAgICB9KTtcblxuICAgIHNoYWRvdy5hcHBlbmRDaGlsZChidXR0b24pO1xuICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoY29udGFpbmVyKTtcblxuICAgIC8vIEJhY2tncm91bmTroZzrtoDthLAg6rCA7J2065OcIOyLnOyekSDrqZTsi5zsp4Ag7IiY7IugXG4gICAgY2hyb21lLnJ1bnRpbWUub25NZXNzYWdlLmFkZExpc3RlbmVyKChtZXNzYWdlLCBzZW5kZXIsIHNlbmRSZXNwb25zZSkgPT4ge1xuICAgICAgaWYgKG1lc3NhZ2UudHlwZSA9PT0gJ1NUQVJUX0dVSURFJykge1xuICAgICAgICBzdGFydEd1aWRlKG1lc3NhZ2Uuc3RlcHMpO1xuICAgICAgICBzZW5kUmVzcG9uc2UoeyBzdWNjZXNzOiB0cnVlIH0pO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gRHJpdmVyLmpz66GcIOqwgOydtOuTnCDsi5zsnpFcbiAgICBmdW5jdGlvbiBzdGFydEd1aWRlKHN0ZXBzOiBBcnJheTx7IHNlbGVjdG9yOiBzdHJpbmc7IHRpdGxlOiBzdHJpbmc7IGRlc2NyaXB0aW9uOiBzdHJpbmcgfT4pIHtcbiAgICAgIGNvbnN0IGRyaXZlck9iaiA9IGRyaXZlcih7XG4gICAgICAgIHNob3dQcm9ncmVzczogdHJ1ZSxcbiAgICAgICAgc2hvd0J1dHRvbnM6IFsnbmV4dCcsICdwcmV2aW91cycsICdjbG9zZSddLFxuICAgICAgICBzdGVwczogc3RlcHMubWFwKChzdGVwLCBpbmRleCkgPT4gKHtcbiAgICAgICAgICBlbGVtZW50OiBzdGVwLnNlbGVjdG9yLFxuICAgICAgICAgIHBvcG92ZXI6IHtcbiAgICAgICAgICAgIHRpdGxlOiBzdGVwLnRpdGxlLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246IHN0ZXAuZGVzY3JpcHRpb24sXG4gICAgICAgICAgICBzaWRlOiAnbGVmdCcsXG4gICAgICAgICAgICBhbGlnbjogJ3N0YXJ0JyxcbiAgICAgICAgICB9LFxuICAgICAgICB9KSksXG4gICAgICB9KTtcblxuICAgICAgZHJpdmVyT2JqLmRyaXZlKCk7XG4gICAgfVxuICB9LFxufSk7XG4iLCIvLyAjcmVnaW9uIHNuaXBwZXRcbmV4cG9ydCBjb25zdCBicm93c2VyID0gZ2xvYmFsVGhpcy5icm93c2VyPy5ydW50aW1lPy5pZFxuICA/IGdsb2JhbFRoaXMuYnJvd3NlclxuICA6IGdsb2JhbFRoaXMuY2hyb21lO1xuLy8gI2VuZHJlZ2lvbiBzbmlwcGV0XG4iLCJpbXBvcnQgeyBicm93c2VyIGFzIF9icm93c2VyIH0gZnJvbSBcIkB3eHQtZGV2L2Jyb3dzZXJcIjtcbmV4cG9ydCBjb25zdCBicm93c2VyID0gX2Jyb3dzZXI7XG5leHBvcnQge307XG4iLCJmdW5jdGlvbiBwcmludChtZXRob2QsIC4uLmFyZ3MpIHtcbiAgaWYgKGltcG9ydC5tZXRhLmVudi5NT0RFID09PSBcInByb2R1Y3Rpb25cIikgcmV0dXJuO1xuICBpZiAodHlwZW9mIGFyZ3NbMF0gPT09IFwic3RyaW5nXCIpIHtcbiAgICBjb25zdCBtZXNzYWdlID0gYXJncy5zaGlmdCgpO1xuICAgIG1ldGhvZChgW3d4dF0gJHttZXNzYWdlfWAsIC4uLmFyZ3MpO1xuICB9IGVsc2Uge1xuICAgIG1ldGhvZChcIlt3eHRdXCIsIC4uLmFyZ3MpO1xuICB9XG59XG5leHBvcnQgY29uc3QgbG9nZ2VyID0ge1xuICBkZWJ1ZzogKC4uLmFyZ3MpID0+IHByaW50KGNvbnNvbGUuZGVidWcsIC4uLmFyZ3MpLFxuICBsb2c6ICguLi5hcmdzKSA9PiBwcmludChjb25zb2xlLmxvZywgLi4uYXJncyksXG4gIHdhcm46ICguLi5hcmdzKSA9PiBwcmludChjb25zb2xlLndhcm4sIC4uLmFyZ3MpLFxuICBlcnJvcjogKC4uLmFyZ3MpID0+IHByaW50KGNvbnNvbGUuZXJyb3IsIC4uLmFyZ3MpXG59O1xuIiwiaW1wb3J0IHsgYnJvd3NlciB9IGZyb20gXCJ3eHQvYnJvd3NlclwiO1xuZXhwb3J0IGNsYXNzIFd4dExvY2F0aW9uQ2hhbmdlRXZlbnQgZXh0ZW5kcyBFdmVudCB7XG4gIGNvbnN0cnVjdG9yKG5ld1VybCwgb2xkVXJsKSB7XG4gICAgc3VwZXIoV3h0TG9jYXRpb25DaGFuZ2VFdmVudC5FVkVOVF9OQU1FLCB7fSk7XG4gICAgdGhpcy5uZXdVcmwgPSBuZXdVcmw7XG4gICAgdGhpcy5vbGRVcmwgPSBvbGRVcmw7XG4gIH1cbiAgc3RhdGljIEVWRU5UX05BTUUgPSBnZXRVbmlxdWVFdmVudE5hbWUoXCJ3eHQ6bG9jYXRpb25jaGFuZ2VcIik7XG59XG5leHBvcnQgZnVuY3Rpb24gZ2V0VW5pcXVlRXZlbnROYW1lKGV2ZW50TmFtZSkge1xuICByZXR1cm4gYCR7YnJvd3Nlcj8ucnVudGltZT8uaWR9OiR7aW1wb3J0Lm1ldGEuZW52LkVOVFJZUE9JTlR9OiR7ZXZlbnROYW1lfWA7XG59XG4iLCJpbXBvcnQgeyBXeHRMb2NhdGlvbkNoYW5nZUV2ZW50IH0gZnJvbSBcIi4vY3VzdG9tLWV2ZW50cy5tanNcIjtcbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVMb2NhdGlvbldhdGNoZXIoY3R4KSB7XG4gIGxldCBpbnRlcnZhbDtcbiAgbGV0IG9sZFVybDtcbiAgcmV0dXJuIHtcbiAgICAvKipcbiAgICAgKiBFbnN1cmUgdGhlIGxvY2F0aW9uIHdhdGNoZXIgaXMgYWN0aXZlbHkgbG9va2luZyBmb3IgVVJMIGNoYW5nZXMuIElmIGl0J3MgYWxyZWFkeSB3YXRjaGluZyxcbiAgICAgKiB0aGlzIGlzIGEgbm9vcC5cbiAgICAgKi9cbiAgICBydW4oKSB7XG4gICAgICBpZiAoaW50ZXJ2YWwgIT0gbnVsbCkgcmV0dXJuO1xuICAgICAgb2xkVXJsID0gbmV3IFVSTChsb2NhdGlvbi5ocmVmKTtcbiAgICAgIGludGVydmFsID0gY3R4LnNldEludGVydmFsKCgpID0+IHtcbiAgICAgICAgbGV0IG5ld1VybCA9IG5ldyBVUkwobG9jYXRpb24uaHJlZik7XG4gICAgICAgIGlmIChuZXdVcmwuaHJlZiAhPT0gb2xkVXJsLmhyZWYpIHtcbiAgICAgICAgICB3aW5kb3cuZGlzcGF0Y2hFdmVudChuZXcgV3h0TG9jYXRpb25DaGFuZ2VFdmVudChuZXdVcmwsIG9sZFVybCkpO1xuICAgICAgICAgIG9sZFVybCA9IG5ld1VybDtcbiAgICAgICAgfVxuICAgICAgfSwgMWUzKTtcbiAgICB9XG4gIH07XG59XG4iLCJpbXBvcnQgeyBicm93c2VyIH0gZnJvbSBcInd4dC9icm93c2VyXCI7XG5pbXBvcnQgeyBsb2dnZXIgfSBmcm9tIFwiLi4vdXRpbHMvaW50ZXJuYWwvbG9nZ2VyLm1qc1wiO1xuaW1wb3J0IHtcbiAgZ2V0VW5pcXVlRXZlbnROYW1lXG59IGZyb20gXCIuL2ludGVybmFsL2N1c3RvbS1ldmVudHMubWpzXCI7XG5pbXBvcnQgeyBjcmVhdGVMb2NhdGlvbldhdGNoZXIgfSBmcm9tIFwiLi9pbnRlcm5hbC9sb2NhdGlvbi13YXRjaGVyLm1qc1wiO1xuZXhwb3J0IGNsYXNzIENvbnRlbnRTY3JpcHRDb250ZXh0IHtcbiAgY29uc3RydWN0b3IoY29udGVudFNjcmlwdE5hbWUsIG9wdGlvbnMpIHtcbiAgICB0aGlzLmNvbnRlbnRTY3JpcHROYW1lID0gY29udGVudFNjcmlwdE5hbWU7XG4gICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucztcbiAgICB0aGlzLmFib3J0Q29udHJvbGxlciA9IG5ldyBBYm9ydENvbnRyb2xsZXIoKTtcbiAgICBpZiAodGhpcy5pc1RvcEZyYW1lKSB7XG4gICAgICB0aGlzLmxpc3RlbkZvck5ld2VyU2NyaXB0cyh7IGlnbm9yZUZpcnN0RXZlbnQ6IHRydWUgfSk7XG4gICAgICB0aGlzLnN0b3BPbGRTY3JpcHRzKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMubGlzdGVuRm9yTmV3ZXJTY3JpcHRzKCk7XG4gICAgfVxuICB9XG4gIHN0YXRpYyBTQ1JJUFRfU1RBUlRFRF9NRVNTQUdFX1RZUEUgPSBnZXRVbmlxdWVFdmVudE5hbWUoXG4gICAgXCJ3eHQ6Y29udGVudC1zY3JpcHQtc3RhcnRlZFwiXG4gICk7XG4gIGlzVG9wRnJhbWUgPSB3aW5kb3cuc2VsZiA9PT0gd2luZG93LnRvcDtcbiAgYWJvcnRDb250cm9sbGVyO1xuICBsb2NhdGlvbldhdGNoZXIgPSBjcmVhdGVMb2NhdGlvbldhdGNoZXIodGhpcyk7XG4gIHJlY2VpdmVkTWVzc2FnZUlkcyA9IC8qIEBfX1BVUkVfXyAqLyBuZXcgU2V0KCk7XG4gIGdldCBzaWduYWwoKSB7XG4gICAgcmV0dXJuIHRoaXMuYWJvcnRDb250cm9sbGVyLnNpZ25hbDtcbiAgfVxuICBhYm9ydChyZWFzb24pIHtcbiAgICByZXR1cm4gdGhpcy5hYm9ydENvbnRyb2xsZXIuYWJvcnQocmVhc29uKTtcbiAgfVxuICBnZXQgaXNJbnZhbGlkKCkge1xuICAgIGlmIChicm93c2VyLnJ1bnRpbWUuaWQgPT0gbnVsbCkge1xuICAgICAgdGhpcy5ub3RpZnlJbnZhbGlkYXRlZCgpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5zaWduYWwuYWJvcnRlZDtcbiAgfVxuICBnZXQgaXNWYWxpZCgpIHtcbiAgICByZXR1cm4gIXRoaXMuaXNJbnZhbGlkO1xuICB9XG4gIC8qKlxuICAgKiBBZGQgYSBsaXN0ZW5lciB0aGF0IGlzIGNhbGxlZCB3aGVuIHRoZSBjb250ZW50IHNjcmlwdCdzIGNvbnRleHQgaXMgaW52YWxpZGF0ZWQuXG4gICAqXG4gICAqIEByZXR1cm5zIEEgZnVuY3Rpb24gdG8gcmVtb3ZlIHRoZSBsaXN0ZW5lci5cbiAgICpcbiAgICogQGV4YW1wbGVcbiAgICogYnJvd3Nlci5ydW50aW1lLm9uTWVzc2FnZS5hZGRMaXN0ZW5lcihjYik7XG4gICAqIGNvbnN0IHJlbW92ZUludmFsaWRhdGVkTGlzdGVuZXIgPSBjdHgub25JbnZhbGlkYXRlZCgoKSA9PiB7XG4gICAqICAgYnJvd3Nlci5ydW50aW1lLm9uTWVzc2FnZS5yZW1vdmVMaXN0ZW5lcihjYik7XG4gICAqIH0pXG4gICAqIC8vIC4uLlxuICAgKiByZW1vdmVJbnZhbGlkYXRlZExpc3RlbmVyKCk7XG4gICAqL1xuICBvbkludmFsaWRhdGVkKGNiKSB7XG4gICAgdGhpcy5zaWduYWwuYWRkRXZlbnRMaXN0ZW5lcihcImFib3J0XCIsIGNiKTtcbiAgICByZXR1cm4gKCkgPT4gdGhpcy5zaWduYWwucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImFib3J0XCIsIGNiKTtcbiAgfVxuICAvKipcbiAgICogUmV0dXJuIGEgcHJvbWlzZSB0aGF0IG5ldmVyIHJlc29sdmVzLiBVc2VmdWwgaWYgeW91IGhhdmUgYW4gYXN5bmMgZnVuY3Rpb24gdGhhdCBzaG91bGRuJ3QgcnVuXG4gICAqIGFmdGVyIHRoZSBjb250ZXh0IGlzIGV4cGlyZWQuXG4gICAqXG4gICAqIEBleGFtcGxlXG4gICAqIGNvbnN0IGdldFZhbHVlRnJvbVN0b3JhZ2UgPSBhc3luYyAoKSA9PiB7XG4gICAqICAgaWYgKGN0eC5pc0ludmFsaWQpIHJldHVybiBjdHguYmxvY2soKTtcbiAgICpcbiAgICogICAvLyAuLi5cbiAgICogfVxuICAgKi9cbiAgYmxvY2soKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKCgpID0+IHtcbiAgICB9KTtcbiAgfVxuICAvKipcbiAgICogV3JhcHBlciBhcm91bmQgYHdpbmRvdy5zZXRJbnRlcnZhbGAgdGhhdCBhdXRvbWF0aWNhbGx5IGNsZWFycyB0aGUgaW50ZXJ2YWwgd2hlbiBpbnZhbGlkYXRlZC5cbiAgICpcbiAgICogSW50ZXJ2YWxzIGNhbiBiZSBjbGVhcmVkIGJ5IGNhbGxpbmcgdGhlIG5vcm1hbCBgY2xlYXJJbnRlcnZhbGAgZnVuY3Rpb24uXG4gICAqL1xuICBzZXRJbnRlcnZhbChoYW5kbGVyLCB0aW1lb3V0KSB7XG4gICAgY29uc3QgaWQgPSBzZXRJbnRlcnZhbCgoKSA9PiB7XG4gICAgICBpZiAodGhpcy5pc1ZhbGlkKSBoYW5kbGVyKCk7XG4gICAgfSwgdGltZW91dCk7XG4gICAgdGhpcy5vbkludmFsaWRhdGVkKCgpID0+IGNsZWFySW50ZXJ2YWwoaWQpKTtcbiAgICByZXR1cm4gaWQ7XG4gIH1cbiAgLyoqXG4gICAqIFdyYXBwZXIgYXJvdW5kIGB3aW5kb3cuc2V0VGltZW91dGAgdGhhdCBhdXRvbWF0aWNhbGx5IGNsZWFycyB0aGUgaW50ZXJ2YWwgd2hlbiBpbnZhbGlkYXRlZC5cbiAgICpcbiAgICogVGltZW91dHMgY2FuIGJlIGNsZWFyZWQgYnkgY2FsbGluZyB0aGUgbm9ybWFsIGBzZXRUaW1lb3V0YCBmdW5jdGlvbi5cbiAgICovXG4gIHNldFRpbWVvdXQoaGFuZGxlciwgdGltZW91dCkge1xuICAgIGNvbnN0IGlkID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICBpZiAodGhpcy5pc1ZhbGlkKSBoYW5kbGVyKCk7XG4gICAgfSwgdGltZW91dCk7XG4gICAgdGhpcy5vbkludmFsaWRhdGVkKCgpID0+IGNsZWFyVGltZW91dChpZCkpO1xuICAgIHJldHVybiBpZDtcbiAgfVxuICAvKipcbiAgICogV3JhcHBlciBhcm91bmQgYHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWVgIHRoYXQgYXV0b21hdGljYWxseSBjYW5jZWxzIHRoZSByZXF1ZXN0IHdoZW5cbiAgICogaW52YWxpZGF0ZWQuXG4gICAqXG4gICAqIENhbGxiYWNrcyBjYW4gYmUgY2FuY2VsZWQgYnkgY2FsbGluZyB0aGUgbm9ybWFsIGBjYW5jZWxBbmltYXRpb25GcmFtZWAgZnVuY3Rpb24uXG4gICAqL1xuICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoY2FsbGJhY2spIHtcbiAgICBjb25zdCBpZCA9IHJlcXVlc3RBbmltYXRpb25GcmFtZSgoLi4uYXJncykgPT4ge1xuICAgICAgaWYgKHRoaXMuaXNWYWxpZCkgY2FsbGJhY2soLi4uYXJncyk7XG4gICAgfSk7XG4gICAgdGhpcy5vbkludmFsaWRhdGVkKCgpID0+IGNhbmNlbEFuaW1hdGlvbkZyYW1lKGlkKSk7XG4gICAgcmV0dXJuIGlkO1xuICB9XG4gIC8qKlxuICAgKiBXcmFwcGVyIGFyb3VuZCBgd2luZG93LnJlcXVlc3RJZGxlQ2FsbGJhY2tgIHRoYXQgYXV0b21hdGljYWxseSBjYW5jZWxzIHRoZSByZXF1ZXN0IHdoZW5cbiAgICogaW52YWxpZGF0ZWQuXG4gICAqXG4gICAqIENhbGxiYWNrcyBjYW4gYmUgY2FuY2VsZWQgYnkgY2FsbGluZyB0aGUgbm9ybWFsIGBjYW5jZWxJZGxlQ2FsbGJhY2tgIGZ1bmN0aW9uLlxuICAgKi9cbiAgcmVxdWVzdElkbGVDYWxsYmFjayhjYWxsYmFjaywgb3B0aW9ucykge1xuICAgIGNvbnN0IGlkID0gcmVxdWVzdElkbGVDYWxsYmFjaygoLi4uYXJncykgPT4ge1xuICAgICAgaWYgKCF0aGlzLnNpZ25hbC5hYm9ydGVkKSBjYWxsYmFjayguLi5hcmdzKTtcbiAgICB9LCBvcHRpb25zKTtcbiAgICB0aGlzLm9uSW52YWxpZGF0ZWQoKCkgPT4gY2FuY2VsSWRsZUNhbGxiYWNrKGlkKSk7XG4gICAgcmV0dXJuIGlkO1xuICB9XG4gIGFkZEV2ZW50TGlzdGVuZXIodGFyZ2V0LCB0eXBlLCBoYW5kbGVyLCBvcHRpb25zKSB7XG4gICAgaWYgKHR5cGUgPT09IFwid3h0OmxvY2F0aW9uY2hhbmdlXCIpIHtcbiAgICAgIGlmICh0aGlzLmlzVmFsaWQpIHRoaXMubG9jYXRpb25XYXRjaGVyLnJ1bigpO1xuICAgIH1cbiAgICB0YXJnZXQuYWRkRXZlbnRMaXN0ZW5lcj8uKFxuICAgICAgdHlwZS5zdGFydHNXaXRoKFwid3h0OlwiKSA/IGdldFVuaXF1ZUV2ZW50TmFtZSh0eXBlKSA6IHR5cGUsXG4gICAgICBoYW5kbGVyLFxuICAgICAge1xuICAgICAgICAuLi5vcHRpb25zLFxuICAgICAgICBzaWduYWw6IHRoaXMuc2lnbmFsXG4gICAgICB9XG4gICAgKTtcbiAgfVxuICAvKipcbiAgICogQGludGVybmFsXG4gICAqIEFib3J0IHRoZSBhYm9ydCBjb250cm9sbGVyIGFuZCBleGVjdXRlIGFsbCBgb25JbnZhbGlkYXRlZGAgbGlzdGVuZXJzLlxuICAgKi9cbiAgbm90aWZ5SW52YWxpZGF0ZWQoKSB7XG4gICAgdGhpcy5hYm9ydChcIkNvbnRlbnQgc2NyaXB0IGNvbnRleHQgaW52YWxpZGF0ZWRcIik7XG4gICAgbG9nZ2VyLmRlYnVnKFxuICAgICAgYENvbnRlbnQgc2NyaXB0IFwiJHt0aGlzLmNvbnRlbnRTY3JpcHROYW1lfVwiIGNvbnRleHQgaW52YWxpZGF0ZWRgXG4gICAgKTtcbiAgfVxuICBzdG9wT2xkU2NyaXB0cygpIHtcbiAgICB3aW5kb3cucG9zdE1lc3NhZ2UoXG4gICAgICB7XG4gICAgICAgIHR5cGU6IENvbnRlbnRTY3JpcHRDb250ZXh0LlNDUklQVF9TVEFSVEVEX01FU1NBR0VfVFlQRSxcbiAgICAgICAgY29udGVudFNjcmlwdE5hbWU6IHRoaXMuY29udGVudFNjcmlwdE5hbWUsXG4gICAgICAgIG1lc3NhZ2VJZDogTWF0aC5yYW5kb20oKS50b1N0cmluZygzNikuc2xpY2UoMilcbiAgICAgIH0sXG4gICAgICBcIipcIlxuICAgICk7XG4gIH1cbiAgdmVyaWZ5U2NyaXB0U3RhcnRlZEV2ZW50KGV2ZW50KSB7XG4gICAgY29uc3QgaXNTY3JpcHRTdGFydGVkRXZlbnQgPSBldmVudC5kYXRhPy50eXBlID09PSBDb250ZW50U2NyaXB0Q29udGV4dC5TQ1JJUFRfU1RBUlRFRF9NRVNTQUdFX1RZUEU7XG4gICAgY29uc3QgaXNTYW1lQ29udGVudFNjcmlwdCA9IGV2ZW50LmRhdGE/LmNvbnRlbnRTY3JpcHROYW1lID09PSB0aGlzLmNvbnRlbnRTY3JpcHROYW1lO1xuICAgIGNvbnN0IGlzTm90RHVwbGljYXRlID0gIXRoaXMucmVjZWl2ZWRNZXNzYWdlSWRzLmhhcyhldmVudC5kYXRhPy5tZXNzYWdlSWQpO1xuICAgIHJldHVybiBpc1NjcmlwdFN0YXJ0ZWRFdmVudCAmJiBpc1NhbWVDb250ZW50U2NyaXB0ICYmIGlzTm90RHVwbGljYXRlO1xuICB9XG4gIGxpc3RlbkZvck5ld2VyU2NyaXB0cyhvcHRpb25zKSB7XG4gICAgbGV0IGlzRmlyc3QgPSB0cnVlO1xuICAgIGNvbnN0IGNiID0gKGV2ZW50KSA9PiB7XG4gICAgICBpZiAodGhpcy52ZXJpZnlTY3JpcHRTdGFydGVkRXZlbnQoZXZlbnQpKSB7XG4gICAgICAgIHRoaXMucmVjZWl2ZWRNZXNzYWdlSWRzLmFkZChldmVudC5kYXRhLm1lc3NhZ2VJZCk7XG4gICAgICAgIGNvbnN0IHdhc0ZpcnN0ID0gaXNGaXJzdDtcbiAgICAgICAgaXNGaXJzdCA9IGZhbHNlO1xuICAgICAgICBpZiAod2FzRmlyc3QgJiYgb3B0aW9ucz8uaWdub3JlRmlyc3RFdmVudCkgcmV0dXJuO1xuICAgICAgICB0aGlzLm5vdGlmeUludmFsaWRhdGVkKCk7XG4gICAgICB9XG4gICAgfTtcbiAgICBhZGRFdmVudExpc3RlbmVyKFwibWVzc2FnZVwiLCBjYik7XG4gICAgdGhpcy5vbkludmFsaWRhdGVkKCgpID0+IHJlbW92ZUV2ZW50TGlzdGVuZXIoXCJtZXNzYWdlXCIsIGNiKSk7XG4gIH1cbn1cbiJdLCJuYW1lcyI6WyJkZWZpbml0aW9uIiwiZHJpdmVyIiwiYnJvd3NlciIsIl9icm93c2VyIiwicHJpbnQiLCJsb2dnZXIiXSwibWFwcGluZ3MiOiI7O0FBQU8sV0FBUyxvQkFBb0JBLGFBQVk7QUFDOUMsV0FBT0E7QUFBQSxFQUNUO0FDRkEsTUFBSSxJQUFJLENBQUEsR0FBSTtBQUNaLFdBQVMsRUFBRSxJQUFJLElBQUk7QUFDakIsUUFBSTtBQUFBLE1B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
content;