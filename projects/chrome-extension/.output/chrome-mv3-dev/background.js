var background = (function() {
  "use strict";
  function defineBackground(arg) {
    if (arg == null || typeof arg === "function") return { main: arg };
    return arg;
  }
  const definition = defineBackground(() => {
    console.log("Patent Guide Assistant - Background Script Loaded");
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === "OPEN_POPUP") {
        console.log("User requested to open popup");
      }
      if (message.type === "ASK_AI") {
        handleAIRequest(message, sender, sendResponse);
        return true;
      }
    });
    async function handleAIRequest(message, sender, sendResponse) {
      try {
        const patentRegistrationSteps = [
          {
            selector: "#header > div.gnb_wrap > div.gnb_cnt > div > div.ar > ul > li.link_login",
            title: "1단계: 로그인",
            description: "로그인 버튼을 클릭하여 로그인 페이지로 이동합니다.",
            url: "https://www.patent.go.kr/smart/portal/Main.do",
            autoAdvance: true
          },
          {
            selector: "#simpleDemo",
            title: "2단계: 간편인증",
            description: "간편인증 버튼을 클릭합니다.",
            url: "https://www.patent.go.kr/smart/LoginForm.do",
            autoAdvance: true
          },
          {
            selector: "body",
            title: "3단계: 간편인증 진행",
            description: '간편인증 과정을 직접 진행해주세요. 인증이 완료되면 아래 "완료했어요!" 버튼을 눌러주세요.',
            autoAdvance: false
          },
          {
            selector: "#header > div.gnb_wrap > div.gnb_cnt > div > div.ar > ul > li:nth-child(3)",
            title: "4단계: 특허고객등록",
            description: "특허고객등록 메뉴를 클릭합니다.",
            url: "https://www.patent.go.kr/smart/portal/Main.do",
            autoAdvance: true
          },
          {
            selector: "#content > ul > li:nth-child(1) > a",
            title: "5단계: 특허고객등록 진행",
            description: "특허고객등록을 클릭하여 등록 페이지로 이동합니다.",
            url: "https://www.patent.go.kr/smart/jsp/ka/prestep/codeapp/CodeAppIndex.do",
            autoAdvance: true
          },
          {
            selector: "#content > div.board_body.table_scroll > table > tbody > tr:nth-child(1) > td:nth-child(4) > a",
            title: "6단계: 프로그램 다운로드",
            description: '다운로드 버튼을 클릭하여 필요한 프로그램을 설치합니다. 설치가 완료되면 아래 "완료했어요!" 버튼을 눌러주세요.',
            autoAdvance: false
          },
          {
            selector: "#tab-1Div > div",
            title: "7단계: 하단 섹션 이동",
            description: "아래로 스크롤하여 이 섹션으로 이동합니다.",
            autoAdvance: true
          },
          {
            selector: "#tab-1Div > div > fieldset > ul > li:nth-child(1) > div.mouseKeytype > a",
            title: "8단계: 발급확인",
            description: '발급확인 버튼을 클릭하고 확인이 완료될 때까지 기다립니다. 완료되면 아래 "완료했어요!" 버튼을 눌러주세요.',
            autoAdvance: false
          },
          {
            selector: "#tab-1Div > div > div > a",
            title: "9단계: 실명인증",
            description: '실명인증 버튼을 클릭합니다. 인증이 완료되면 아래 "완료했어요!" 버튼을 눌러주세요.',
            autoAdvance: false
          },
          {
            selector: "#content > div.area_box.box02.mt40 > div.btn_area > a.btn.navy",
            title: "10단계: 다음",
            description: "실명인증이 완료되면 다음 버튼을 클릭합니다.",
            url: "https://www.patent.go.kr/smart/jsp/ka/prestep/codeapp/CodeAppView.do",
            autoAdvance: true
          },
          {
            selector: "body",
            title: "11단계: 서명/인감도장 생성",
            description: '서명/인감도장이 필요합니다. https://donue.co.kr/service/signature/ 사이트를 이용하세요. 완료되면 아래 "완료했어요!" 버튼을 눌러주세요.',
            url: "https://www.patent.go.kr/smart/jsp/ka/prestep/codeapp/CodeAppView02.do",
            externalLink: "https://donue.co.kr/service/signature/",
            autoAdvance: false
          },
          {
            selector: "#input_form > div.btn_area > a.btn.navy",
            title: "12단계: 신청",
            description: '모든 정보를 입력해주세요. 입력이 완료되면 아래 "완료했어요!" 버튼을 눌러주세요.',
            autoAdvance: false
          }
        ];
        sendResponse({ success: true, steps: patentRegistrationSteps });
      } catch (error) {
        console.error("AI request failed:", error);
        sendResponse({ success: false, error: String(error) });
      }
    }
  });
  function initPlugins() {
  }
  const browser$1 = globalThis.browser?.runtime?.id ? globalThis.browser : globalThis.chrome;
  const browser = browser$1;
  var _MatchPattern = class {
    constructor(matchPattern) {
      if (matchPattern === "<all_urls>") {
        this.isAllUrls = true;
        this.protocolMatches = [..._MatchPattern.PROTOCOLS];
        this.hostnameMatch = "*";
        this.pathnameMatch = "*";
      } else {
        const groups = /(.*):\/\/(.*?)(\/.*)/.exec(matchPattern);
        if (groups == null)
          throw new InvalidMatchPattern(matchPattern, "Incorrect format");
        const [_, protocol, hostname, pathname] = groups;
        validateProtocol(matchPattern, protocol);
        validateHostname(matchPattern, hostname);
        this.protocolMatches = protocol === "*" ? ["http", "https"] : [protocol];
        this.hostnameMatch = hostname;
        this.pathnameMatch = pathname;
      }
    }
    includes(url) {
      if (this.isAllUrls)
        return true;
      const u = typeof url === "string" ? new URL(url) : url instanceof Location ? new URL(url.href) : url;
      return !!this.protocolMatches.find((protocol) => {
        if (protocol === "http")
          return this.isHttpMatch(u);
        if (protocol === "https")
          return this.isHttpsMatch(u);
        if (protocol === "file")
          return this.isFileMatch(u);
        if (protocol === "ftp")
          return this.isFtpMatch(u);
        if (protocol === "urn")
          return this.isUrnMatch(u);
      });
    }
    isHttpMatch(url) {
      return url.protocol === "http:" && this.isHostPathMatch(url);
    }
    isHttpsMatch(url) {
      return url.protocol === "https:" && this.isHostPathMatch(url);
    }
    isHostPathMatch(url) {
      if (!this.hostnameMatch || !this.pathnameMatch)
        return false;
      const hostnameMatchRegexs = [
        this.convertPatternToRegex(this.hostnameMatch),
        this.convertPatternToRegex(this.hostnameMatch.replace(/^\*\./, ""))
      ];
      const pathnameMatchRegex = this.convertPatternToRegex(this.pathnameMatch);
      return !!hostnameMatchRegexs.find((regex) => regex.test(url.hostname)) && pathnameMatchRegex.test(url.pathname);
    }
    isFileMatch(url) {
      throw Error("Not implemented: file:// pattern matching. Open a PR to add support");
    }
    isFtpMatch(url) {
      throw Error("Not implemented: ftp:// pattern matching. Open a PR to add support");
    }
    isUrnMatch(url) {
      throw Error("Not implemented: urn:// pattern matching. Open a PR to add support");
    }
    convertPatternToRegex(pattern) {
      const escaped = this.escapeForRegex(pattern);
      const starsReplaced = escaped.replace(/\\\*/g, ".*");
      return RegExp(`^${starsReplaced}$`);
    }
    escapeForRegex(string) {
      return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }
  };
  var MatchPattern = _MatchPattern;
  MatchPattern.PROTOCOLS = ["http", "https", "file", "ftp", "urn"];
  var InvalidMatchPattern = class extends Error {
    constructor(matchPattern, reason) {
      super(`Invalid match pattern "${matchPattern}": ${reason}`);
    }
  };
  function validateProtocol(matchPattern, protocol) {
    if (!MatchPattern.PROTOCOLS.includes(protocol) && protocol !== "*")
      throw new InvalidMatchPattern(
        matchPattern,
        `${protocol} not a valid protocol (${MatchPattern.PROTOCOLS.join(", ")})`
      );
  }
  function validateHostname(matchPattern, hostname) {
    if (hostname.includes(":"))
      throw new InvalidMatchPattern(matchPattern, `Hostname cannot include a port`);
    if (hostname.includes("*") && hostname.length > 1 && !hostname.startsWith("*."))
      throw new InvalidMatchPattern(
        matchPattern,
        `If using a wildcard (*), it must go at the start of the hostname`
      );
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
  let ws;
  function getDevServerWebSocket() {
    if (ws == null) {
      const serverUrl = "ws://localhost:3000";
      logger.debug("Connecting to dev server @", serverUrl);
      ws = new WebSocket(serverUrl, "vite-hmr");
      ws.addWxtEventListener = ws.addEventListener.bind(ws);
      ws.sendCustom = (event, payload) => ws?.send(JSON.stringify({ type: "custom", event, payload }));
      ws.addEventListener("open", () => {
        logger.debug("Connected to dev server");
      });
      ws.addEventListener("close", () => {
        logger.debug("Disconnected from dev server");
      });
      ws.addEventListener("error", (event) => {
        logger.error("Failed to connect to dev server", event);
      });
      ws.addEventListener("message", (e) => {
        try {
          const message = JSON.parse(e.data);
          if (message.type === "custom") {
            ws?.dispatchEvent(
              new CustomEvent(message.event, { detail: message.data })
            );
          }
        } catch (err) {
          logger.error("Failed to handle message", err);
        }
      });
    }
    return ws;
  }
  function keepServiceWorkerAlive() {
    setInterval(async () => {
      await browser.runtime.getPlatformInfo();
    }, 5e3);
  }
  function reloadContentScript(payload) {
    const manifest = browser.runtime.getManifest();
    if (manifest.manifest_version == 2) {
      void reloadContentScriptMv2();
    } else {
      void reloadContentScriptMv3(payload);
    }
  }
  async function reloadContentScriptMv3({
    registration,
    contentScript
  }) {
    if (registration === "runtime") {
      await reloadRuntimeContentScriptMv3(contentScript);
    } else {
      await reloadManifestContentScriptMv3(contentScript);
    }
  }
  async function reloadManifestContentScriptMv3(contentScript) {
    const id = `wxt:${contentScript.js[0]}`;
    logger.log("Reloading content script:", contentScript);
    const registered = await browser.scripting.getRegisteredContentScripts();
    logger.debug("Existing scripts:", registered);
    const existing = registered.find((cs) => cs.id === id);
    if (existing) {
      logger.debug("Updating content script", existing);
      await browser.scripting.updateContentScripts([
        {
          ...contentScript,
          id,
          css: contentScript.css ?? []
        }
      ]);
    } else {
      logger.debug("Registering new content script...");
      await browser.scripting.registerContentScripts([
        {
          ...contentScript,
          id,
          css: contentScript.css ?? []
        }
      ]);
    }
    await reloadTabsForContentScript(contentScript);
  }
  async function reloadRuntimeContentScriptMv3(contentScript) {
    logger.log("Reloading content script:", contentScript);
    const registered = await browser.scripting.getRegisteredContentScripts();
    logger.debug("Existing scripts:", registered);
    const matches = registered.filter((cs) => {
      const hasJs = contentScript.js?.find((js) => cs.js?.includes(js));
      const hasCss = contentScript.css?.find((css) => cs.css?.includes(css));
      return hasJs || hasCss;
    });
    if (matches.length === 0) {
      logger.log(
        "Content script is not registered yet, nothing to reload",
        contentScript
      );
      return;
    }
    await browser.scripting.updateContentScripts(matches);
    await reloadTabsForContentScript(contentScript);
  }
  async function reloadTabsForContentScript(contentScript) {
    const allTabs = await browser.tabs.query({});
    const matchPatterns = contentScript.matches.map(
      (match) => new MatchPattern(match)
    );
    const matchingTabs = allTabs.filter((tab) => {
      const url = tab.url;
      if (!url) return false;
      return !!matchPatterns.find((pattern) => pattern.includes(url));
    });
    await Promise.all(
      matchingTabs.map(async (tab) => {
        try {
          await browser.tabs.reload(tab.id);
        } catch (err) {
          logger.warn("Failed to reload tab:", err);
        }
      })
    );
  }
  async function reloadContentScriptMv2(_payload) {
    throw Error("TODO: reloadContentScriptMv2");
  }
  {
    try {
      const ws2 = getDevServerWebSocket();
      ws2.addWxtEventListener("wxt:reload-extension", () => {
        browser.runtime.reload();
      });
      ws2.addWxtEventListener("wxt:reload-content-script", (event) => {
        reloadContentScript(event.detail);
      });
      if (true) {
        ws2.addEventListener(
          "open",
          () => ws2.sendCustom("wxt:background-initialized")
        );
        keepServiceWorkerAlive();
      }
    } catch (err) {
      logger.error("Failed to setup web socket connection with dev server", err);
    }
    browser.commands.onCommand.addListener((command) => {
      if (command === "wxt:reload-extension") {
        browser.runtime.reload();
      }
    });
  }
  let result;
  try {
    initPlugins();
    result = definition.main();
    if (result instanceof Promise) {
      console.warn(
        "The background's main() function return a promise, but it must be synchronous"
      );
    }
  } catch (err) {
    logger.error("The background crashed on startup!");
    throw err;
  }
  const result$1 = result;
  return result$1;
})();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFja2dyb3VuZC5qcyIsInNvdXJjZXMiOlsiLi4vLi4vbm9kZV9tb2R1bGVzL3d4dC9kaXN0L3V0aWxzL2RlZmluZS1iYWNrZ3JvdW5kLm1qcyIsIi4uLy4uL2VudHJ5cG9pbnRzL2JhY2tncm91bmQudHMiLCIuLi8uLi9ub2RlX21vZHVsZXMvQHd4dC1kZXYvYnJvd3Nlci9zcmMvaW5kZXgubWpzIiwiLi4vLi4vbm9kZV9tb2R1bGVzL3d4dC9kaXN0L2Jyb3dzZXIubWpzIiwiLi4vLi4vbm9kZV9tb2R1bGVzL0B3ZWJleHQtY29yZS9tYXRjaC1wYXR0ZXJucy9saWIvaW5kZXguanMiXSwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0IGZ1bmN0aW9uIGRlZmluZUJhY2tncm91bmQoYXJnKSB7XG4gIGlmIChhcmcgPT0gbnVsbCB8fCB0eXBlb2YgYXJnID09PSBcImZ1bmN0aW9uXCIpIHJldHVybiB7IG1haW46IGFyZyB9O1xuICByZXR1cm4gYXJnO1xufVxuIiwiZXhwb3J0IGRlZmF1bHQgZGVmaW5lQmFja2dyb3VuZCgoKSA9PiB7XG4gIGNvbnNvbGUubG9nKCdQYXRlbnQgR3VpZGUgQXNzaXN0YW50IC0gQmFja2dyb3VuZCBTY3JpcHQgTG9hZGVkJyk7XG5cbiAgY2hyb21lLnJ1bnRpbWUub25NZXNzYWdlLmFkZExpc3RlbmVyKChtZXNzYWdlLCBzZW5kZXIsIHNlbmRSZXNwb25zZSkgPT4ge1xuICAgIGlmIChtZXNzYWdlLnR5cGUgPT09ICdPUEVOX1BPUFVQJykge1xuICAgICAgLy8gUG9wdXDsnYAg67iM65287Jqw7KCAIOyVoeyFmOycvOuhnCDsl7TrprwgKOyVhOydtOy9mCDtgbTrpq0pXG4gICAgICBjb25zb2xlLmxvZygnVXNlciByZXF1ZXN0ZWQgdG8gb3BlbiBwb3B1cCcpO1xuICAgIH1cblxuICAgIGlmIChtZXNzYWdlLnR5cGUgPT09ICdBU0tfQUknKSB7XG4gICAgICBoYW5kbGVBSVJlcXVlc3QobWVzc2FnZSwgc2VuZGVyLCBzZW5kUmVzcG9uc2UpO1xuICAgICAgcmV0dXJuIHRydWU7IC8vIOu5hOuPmeq4sCDsnZHri7XsnYQg7JyE7ZW0IHRydWUg67CY7ZmYXG4gICAgfVxuICB9KTtcblxuICBhc3luYyBmdW5jdGlvbiBoYW5kbGVBSVJlcXVlc3QobWVzc2FnZTogYW55LCBzZW5kZXI6IGFueSwgc2VuZFJlc3BvbnNlOiBhbnkpIHtcbiAgICB0cnkge1xuICAgICAgLy8gVE9ETzog7Iuk7KCcIEFJIEFQSSDtmLjstpwgKE9wZW5BSSwgQ2xhdWRlIOuTsSlcbiAgICAgIC8vIO2YhOyerOuKlCDtirntl4gg6rOg6rCdIOuTseuhnSDtlITroZzshLjsiqQg6rCA7J2065OcIOuNsOydtO2EsCDrsJjtmZhcbiAgICAgIGNvbnN0IHBhdGVudFJlZ2lzdHJhdGlvblN0ZXBzID0gW1xuICAgICAgICB7XG4gICAgICAgICAgc2VsZWN0b3I6ICcjaGVhZGVyID4gZGl2LmduYl93cmFwID4gZGl2LmduYl9jbnQgPiBkaXYgPiBkaXYuYXIgPiB1bCA+IGxpLmxpbmtfbG9naW4nLFxuICAgICAgICAgIHRpdGxlOiAnMeuLqOqzhDog66Gc6re47J24JyxcbiAgICAgICAgICBkZXNjcmlwdGlvbjogJ+uhnOq3uOyduCDrsoTtirzsnYQg7YG066at7ZWY7JesIOuhnOq3uOyduCDtjpjsnbTsp4DroZwg7J2064+Z7ZWp64uI64ukLicsXG4gICAgICAgICAgdXJsOiAnaHR0cHM6Ly93d3cucGF0ZW50LmdvLmtyL3NtYXJ0L3BvcnRhbC9NYWluLmRvJyxcbiAgICAgICAgICBhdXRvQWR2YW5jZTogdHJ1ZSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIHNlbGVjdG9yOiAnI3NpbXBsZURlbW8nLFxuICAgICAgICAgIHRpdGxlOiAnMuuLqOqzhDog6rCE7Y647J247KadJyxcbiAgICAgICAgICBkZXNjcmlwdGlvbjogJ+qwhO2OuOyduOymnSDrsoTtirzsnYQg7YG066at7ZWp64uI64ukLicsXG4gICAgICAgICAgdXJsOiAnaHR0cHM6Ly93d3cucGF0ZW50LmdvLmtyL3NtYXJ0L0xvZ2luRm9ybS5kbycsXG4gICAgICAgICAgYXV0b0FkdmFuY2U6IHRydWUsXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBzZWxlY3RvcjogJ2JvZHknLFxuICAgICAgICAgIHRpdGxlOiAnM+uLqOqzhDog6rCE7Y647J247KadIOynhO2WiScsXG4gICAgICAgICAgZGVzY3JpcHRpb246ICfqsITtjrjsnbjspp0g6rO87KCV7J2EIOyngeygkSDsp4TtlontlbTso7zshLjsmpQuIOyduOymneydtCDsmYTro4zrkJjrqbQg7JWE656YIFwi7JmE66OM7ZaI7Ja07JqUIVwiIOuyhO2KvOydhCDriIzrn6zso7zshLjsmpQuJyxcbiAgICAgICAgICBhdXRvQWR2YW5jZTogZmFsc2UsXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBzZWxlY3RvcjogJyNoZWFkZXIgPiBkaXYuZ25iX3dyYXAgPiBkaXYuZ25iX2NudCA+IGRpdiA+IGRpdi5hciA+IHVsID4gbGk6bnRoLWNoaWxkKDMpJyxcbiAgICAgICAgICB0aXRsZTogJzTri6jqs4Q6IO2Kue2XiOqzoOqwneuTseuhnScsXG4gICAgICAgICAgZGVzY3JpcHRpb246ICftirntl4jqs6DqsJ3rk7HroZ0g66mU64m066W8IO2BtOumre2VqeuLiOuLpC4nLFxuICAgICAgICAgIHVybDogJ2h0dHBzOi8vd3d3LnBhdGVudC5nby5rci9zbWFydC9wb3J0YWwvTWFpbi5kbycsXG4gICAgICAgICAgYXV0b0FkdmFuY2U6IHRydWUsXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBzZWxlY3RvcjogJyNjb250ZW50ID4gdWwgPiBsaTpudGgtY2hpbGQoMSkgPiBhJyxcbiAgICAgICAgICB0aXRsZTogJzXri6jqs4Q6IO2Kue2XiOqzoOqwneuTseuhnSDsp4TtloknLFxuICAgICAgICAgIGRlc2NyaXB0aW9uOiAn7Yq57ZeI6rOg6rCd65Ox66Gd7J2EIO2BtOumre2VmOyXrCDrk7HroZ0g7Y6Y7J207KeA66GcIOydtOuPme2VqeuLiOuLpC4nLFxuICAgICAgICAgIHVybDogJ2h0dHBzOi8vd3d3LnBhdGVudC5nby5rci9zbWFydC9qc3Ava2EvcHJlc3RlcC9jb2RlYXBwL0NvZGVBcHBJbmRleC5kbycsXG4gICAgICAgICAgYXV0b0FkdmFuY2U6IHRydWUsXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBzZWxlY3RvcjogJyNjb250ZW50ID4gZGl2LmJvYXJkX2JvZHkudGFibGVfc2Nyb2xsID4gdGFibGUgPiB0Ym9keSA+IHRyOm50aC1jaGlsZCgxKSA+IHRkOm50aC1jaGlsZCg0KSA+IGEnLFxuICAgICAgICAgIHRpdGxlOiAnNuuLqOqzhDog7ZSE66Gc6re4656oIOuLpOyatOuhnOuTnCcsXG4gICAgICAgICAgZGVzY3JpcHRpb246ICfri6TsmrTroZzrk5wg67KE7Yq87J2EIO2BtOumre2VmOyXrCDtlYTsmpTtlZwg7ZSE66Gc6re4656o7J2EIOyEpOy5mO2VqeuLiOuLpC4g7ISk7LmY6rCAIOyZhOujjOuQmOuptCDslYTrnpggXCLsmYTro4ztlojslrTsmpQhXCIg67KE7Yq87J2EIOuIjOufrOyjvOyEuOyalC4nLFxuICAgICAgICAgIGF1dG9BZHZhbmNlOiBmYWxzZSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIHNlbGVjdG9yOiAnI3RhYi0xRGl2ID4gZGl2JyxcbiAgICAgICAgICB0aXRsZTogJzfri6jqs4Q6IO2VmOuLqCDshLnshZgg7J2064+ZJyxcbiAgICAgICAgICBkZXNjcmlwdGlvbjogJ+yVhOuemOuhnCDsiqTtgazroaTtlZjsl6wg7J20IOyEueyFmOycvOuhnCDsnbTrj5ntlanri4jri6QuJyxcbiAgICAgICAgICBhdXRvQWR2YW5jZTogdHJ1ZSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIHNlbGVjdG9yOiAnI3RhYi0xRGl2ID4gZGl2ID4gZmllbGRzZXQgPiB1bCA+IGxpOm50aC1jaGlsZCgxKSA+IGRpdi5tb3VzZUtleXR5cGUgPiBhJyxcbiAgICAgICAgICB0aXRsZTogJzjri6jqs4Q6IOuwnOq4ie2ZleyduCcsXG4gICAgICAgICAgZGVzY3JpcHRpb246ICfrsJzquIntmZXsnbgg67KE7Yq87J2EIO2BtOumre2VmOqzoCDtmZXsnbjsnbQg7JmE66OM65CgIOuVjOq5jOyngCDquLDri6Trpr3ri4jri6QuIOyZhOujjOuQmOuptCDslYTrnpggXCLsmYTro4ztlojslrTsmpQhXCIg67KE7Yq87J2EIOuIjOufrOyjvOyEuOyalC4nLFxuICAgICAgICAgIGF1dG9BZHZhbmNlOiBmYWxzZSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIHNlbGVjdG9yOiAnI3RhYi0xRGl2ID4gZGl2ID4gZGl2ID4gYScsXG4gICAgICAgICAgdGl0bGU6ICc564uo6rOEOiDsi6TrqoXsnbjspp0nLFxuICAgICAgICAgIGRlc2NyaXB0aW9uOiAn7Iuk66qF7J247KadIOuyhO2KvOydhCDtgbTrpq3tlanri4jri6QuIOyduOymneydtCDsmYTro4zrkJjrqbQg7JWE656YIFwi7JmE66OM7ZaI7Ja07JqUIVwiIOuyhO2KvOydhCDriIzrn6zso7zshLjsmpQuJyxcbiAgICAgICAgICBhdXRvQWR2YW5jZTogZmFsc2UsXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBzZWxlY3RvcjogJyNjb250ZW50ID4gZGl2LmFyZWFfYm94LmJveDAyLm10NDAgPiBkaXYuYnRuX2FyZWEgPiBhLmJ0bi5uYXZ5JyxcbiAgICAgICAgICB0aXRsZTogJzEw64uo6rOEOiDri6TsnYwnLFxuICAgICAgICAgIGRlc2NyaXB0aW9uOiAn7Iuk66qF7J247Kad7J20IOyZhOujjOuQmOuptCDri6TsnYwg67KE7Yq87J2EIO2BtOumre2VqeuLiOuLpC4nLFxuICAgICAgICAgIHVybDogJ2h0dHBzOi8vd3d3LnBhdGVudC5nby5rci9zbWFydC9qc3Ava2EvcHJlc3RlcC9jb2RlYXBwL0NvZGVBcHBWaWV3LmRvJyxcbiAgICAgICAgICBhdXRvQWR2YW5jZTogdHJ1ZSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIHNlbGVjdG9yOiAnYm9keScsXG4gICAgICAgICAgdGl0bGU6ICcxMeuLqOqzhDog7ISc66qFL+yduOqwkOuPhOyepSDsg53shLEnLFxuICAgICAgICAgIGRlc2NyaXB0aW9uOiAn7ISc66qFL+yduOqwkOuPhOyepeydtCDtlYTsmpTtlanri4jri6QuIGh0dHBzOi8vZG9udWUuY28ua3Ivc2VydmljZS9zaWduYXR1cmUvIOyCrOydtO2KuOulvCDsnbTsmqntlZjshLjsmpQuIOyZhOujjOuQmOuptCDslYTrnpggXCLsmYTro4ztlojslrTsmpQhXCIg67KE7Yq87J2EIOuIjOufrOyjvOyEuOyalC4nLFxuICAgICAgICAgIHVybDogJ2h0dHBzOi8vd3d3LnBhdGVudC5nby5rci9zbWFydC9qc3Ava2EvcHJlc3RlcC9jb2RlYXBwL0NvZGVBcHBWaWV3MDIuZG8nLFxuICAgICAgICAgIGV4dGVybmFsTGluazogJ2h0dHBzOi8vZG9udWUuY28ua3Ivc2VydmljZS9zaWduYXR1cmUvJyxcbiAgICAgICAgICBhdXRvQWR2YW5jZTogZmFsc2UsXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBzZWxlY3RvcjogJyNpbnB1dF9mb3JtID4gZGl2LmJ0bl9hcmVhID4gYS5idG4ubmF2eScsXG4gICAgICAgICAgdGl0bGU6ICcxMuuLqOqzhDog7Iug7LKtJyxcbiAgICAgICAgICBkZXNjcmlwdGlvbjogJ+uqqOuToCDsoJXrs7Trpbwg7J6F66Cl7ZW07KO87IS47JqULiDsnoXroKXsnbQg7JmE66OM65CY66m0IOyVhOuemCBcIuyZhOujjO2WiOyWtOyalCFcIiDrsoTtirzsnYQg64iM65+s7KO87IS47JqULicsXG4gICAgICAgICAgYXV0b0FkdmFuY2U6IGZhbHNlLFxuICAgICAgICB9LFxuICAgICAgXTtcblxuICAgICAgLy8gQUkgQVBJIO2YuOy2nCDsmIjsi5wgKOyLpOygnCDqtaztmIQg7IucKVxuICAgICAgLypcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2goJ2h0dHBzOi8vYXBpLm9wZW5haS5jb20vdjEvY2hhdC9jb21wbGV0aW9ucycsIHtcbiAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAnQXV0aG9yaXphdGlvbic6IGBCZWFyZXIgWU9VUl9BUElfS0VZYCxcbiAgICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgICB9LFxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgbW9kZWw6ICdncHQtNCcsXG4gICAgICAgICAgbWVzc2FnZXM6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgcm9sZTogJ3N5c3RlbScsXG4gICAgICAgICAgICAgIGNvbnRlbnQ6ICdZb3UgYXJlIGEgZ3VpZGUgZm9yIHBhdGVudC5nby5rci4gUHJvdmlkZSBzdGVwLWJ5LXN0ZXAgQ1NTIHNlbGVjdG9ycyBhbmQgaW5zdHJ1Y3Rpb25zLicsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICByb2xlOiAndXNlcicsXG4gICAgICAgICAgICAgIGNvbnRlbnQ6IG1lc3NhZ2UucXVlc3Rpb24sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIF0sXG4gICAgICAgIH0pLFxuICAgICAgfSk7XG5cbiAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCByZXNwb25zZS5qc29uKCk7XG4gICAgICBjb25zdCBzdGVwcyA9IHBhcnNlQUlSZXNwb25zZShkYXRhKTtcbiAgICAgICovXG5cbiAgICAgIHNlbmRSZXNwb25zZSh7IHN1Y2Nlc3M6IHRydWUsIHN0ZXBzOiBwYXRlbnRSZWdpc3RyYXRpb25TdGVwcyB9KTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcignQUkgcmVxdWVzdCBmYWlsZWQ6JywgZXJyb3IpO1xuICAgICAgc2VuZFJlc3BvbnNlKHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBTdHJpbmcoZXJyb3IpIH0pO1xuICAgIH1cbiAgfVxufSk7XG4iLCIvLyAjcmVnaW9uIHNuaXBwZXRcbmV4cG9ydCBjb25zdCBicm93c2VyID0gZ2xvYmFsVGhpcy5icm93c2VyPy5ydW50aW1lPy5pZFxuICA/IGdsb2JhbFRoaXMuYnJvd3NlclxuICA6IGdsb2JhbFRoaXMuY2hyb21lO1xuLy8gI2VuZHJlZ2lvbiBzbmlwcGV0XG4iLCJpbXBvcnQgeyBicm93c2VyIGFzIF9icm93c2VyIH0gZnJvbSBcIkB3eHQtZGV2L2Jyb3dzZXJcIjtcbmV4cG9ydCBjb25zdCBicm93c2VyID0gX2Jyb3dzZXI7XG5leHBvcnQge307XG4iLCIvLyBzcmMvaW5kZXgudHNcbnZhciBfTWF0Y2hQYXR0ZXJuID0gY2xhc3Mge1xuICBjb25zdHJ1Y3RvcihtYXRjaFBhdHRlcm4pIHtcbiAgICBpZiAobWF0Y2hQYXR0ZXJuID09PSBcIjxhbGxfdXJscz5cIikge1xuICAgICAgdGhpcy5pc0FsbFVybHMgPSB0cnVlO1xuICAgICAgdGhpcy5wcm90b2NvbE1hdGNoZXMgPSBbLi4uX01hdGNoUGF0dGVybi5QUk9UT0NPTFNdO1xuICAgICAgdGhpcy5ob3N0bmFtZU1hdGNoID0gXCIqXCI7XG4gICAgICB0aGlzLnBhdGhuYW1lTWF0Y2ggPSBcIipcIjtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgZ3JvdXBzID0gLyguKik6XFwvXFwvKC4qPykoXFwvLiopLy5leGVjKG1hdGNoUGF0dGVybik7XG4gICAgICBpZiAoZ3JvdXBzID09IG51bGwpXG4gICAgICAgIHRocm93IG5ldyBJbnZhbGlkTWF0Y2hQYXR0ZXJuKG1hdGNoUGF0dGVybiwgXCJJbmNvcnJlY3QgZm9ybWF0XCIpO1xuICAgICAgY29uc3QgW18sIHByb3RvY29sLCBob3N0bmFtZSwgcGF0aG5hbWVdID0gZ3JvdXBzO1xuICAgICAgdmFsaWRhdGVQcm90b2NvbChtYXRjaFBhdHRlcm4sIHByb3RvY29sKTtcbiAgICAgIHZhbGlkYXRlSG9zdG5hbWUobWF0Y2hQYXR0ZXJuLCBob3N0bmFtZSk7XG4gICAgICB2YWxpZGF0ZVBhdGhuYW1lKG1hdGNoUGF0dGVybiwgcGF0aG5hbWUpO1xuICAgICAgdGhpcy5wcm90b2NvbE1hdGNoZXMgPSBwcm90b2NvbCA9PT0gXCIqXCIgPyBbXCJodHRwXCIsIFwiaHR0cHNcIl0gOiBbcHJvdG9jb2xdO1xuICAgICAgdGhpcy5ob3N0bmFtZU1hdGNoID0gaG9zdG5hbWU7XG4gICAgICB0aGlzLnBhdGhuYW1lTWF0Y2ggPSBwYXRobmFtZTtcbiAgICB9XG4gIH1cbiAgaW5jbHVkZXModXJsKSB7XG4gICAgaWYgKHRoaXMuaXNBbGxVcmxzKVxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgY29uc3QgdSA9IHR5cGVvZiB1cmwgPT09IFwic3RyaW5nXCIgPyBuZXcgVVJMKHVybCkgOiB1cmwgaW5zdGFuY2VvZiBMb2NhdGlvbiA/IG5ldyBVUkwodXJsLmhyZWYpIDogdXJsO1xuICAgIHJldHVybiAhIXRoaXMucHJvdG9jb2xNYXRjaGVzLmZpbmQoKHByb3RvY29sKSA9PiB7XG4gICAgICBpZiAocHJvdG9jb2wgPT09IFwiaHR0cFwiKVxuICAgICAgICByZXR1cm4gdGhpcy5pc0h0dHBNYXRjaCh1KTtcbiAgICAgIGlmIChwcm90b2NvbCA9PT0gXCJodHRwc1wiKVxuICAgICAgICByZXR1cm4gdGhpcy5pc0h0dHBzTWF0Y2godSk7XG4gICAgICBpZiAocHJvdG9jb2wgPT09IFwiZmlsZVwiKVxuICAgICAgICByZXR1cm4gdGhpcy5pc0ZpbGVNYXRjaCh1KTtcbiAgICAgIGlmIChwcm90b2NvbCA9PT0gXCJmdHBcIilcbiAgICAgICAgcmV0dXJuIHRoaXMuaXNGdHBNYXRjaCh1KTtcbiAgICAgIGlmIChwcm90b2NvbCA9PT0gXCJ1cm5cIilcbiAgICAgICAgcmV0dXJuIHRoaXMuaXNVcm5NYXRjaCh1KTtcbiAgICB9KTtcbiAgfVxuICBpc0h0dHBNYXRjaCh1cmwpIHtcbiAgICByZXR1cm4gdXJsLnByb3RvY29sID09PSBcImh0dHA6XCIgJiYgdGhpcy5pc0hvc3RQYXRoTWF0Y2godXJsKTtcbiAgfVxuICBpc0h0dHBzTWF0Y2godXJsKSB7XG4gICAgcmV0dXJuIHVybC5wcm90b2NvbCA9PT0gXCJodHRwczpcIiAmJiB0aGlzLmlzSG9zdFBhdGhNYXRjaCh1cmwpO1xuICB9XG4gIGlzSG9zdFBhdGhNYXRjaCh1cmwpIHtcbiAgICBpZiAoIXRoaXMuaG9zdG5hbWVNYXRjaCB8fCAhdGhpcy5wYXRobmFtZU1hdGNoKVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIGNvbnN0IGhvc3RuYW1lTWF0Y2hSZWdleHMgPSBbXG4gICAgICB0aGlzLmNvbnZlcnRQYXR0ZXJuVG9SZWdleCh0aGlzLmhvc3RuYW1lTWF0Y2gpLFxuICAgICAgdGhpcy5jb252ZXJ0UGF0dGVyblRvUmVnZXgodGhpcy5ob3N0bmFtZU1hdGNoLnJlcGxhY2UoL15cXCpcXC4vLCBcIlwiKSlcbiAgICBdO1xuICAgIGNvbnN0IHBhdGhuYW1lTWF0Y2hSZWdleCA9IHRoaXMuY29udmVydFBhdHRlcm5Ub1JlZ2V4KHRoaXMucGF0aG5hbWVNYXRjaCk7XG4gICAgcmV0dXJuICEhaG9zdG5hbWVNYXRjaFJlZ2V4cy5maW5kKChyZWdleCkgPT4gcmVnZXgudGVzdCh1cmwuaG9zdG5hbWUpKSAmJiBwYXRobmFtZU1hdGNoUmVnZXgudGVzdCh1cmwucGF0aG5hbWUpO1xuICB9XG4gIGlzRmlsZU1hdGNoKHVybCkge1xuICAgIHRocm93IEVycm9yKFwiTm90IGltcGxlbWVudGVkOiBmaWxlOi8vIHBhdHRlcm4gbWF0Y2hpbmcuIE9wZW4gYSBQUiB0byBhZGQgc3VwcG9ydFwiKTtcbiAgfVxuICBpc0Z0cE1hdGNoKHVybCkge1xuICAgIHRocm93IEVycm9yKFwiTm90IGltcGxlbWVudGVkOiBmdHA6Ly8gcGF0dGVybiBtYXRjaGluZy4gT3BlbiBhIFBSIHRvIGFkZCBzdXBwb3J0XCIpO1xuICB9XG4gIGlzVXJuTWF0Y2godXJsKSB7XG4gICAgdGhyb3cgRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWQ6IHVybjovLyBwYXR0ZXJuIG1hdGNoaW5nLiBPcGVuIGEgUFIgdG8gYWRkIHN1cHBvcnRcIik7XG4gIH1cbiAgY29udmVydFBhdHRlcm5Ub1JlZ2V4KHBhdHRlcm4pIHtcbiAgICBjb25zdCBlc2NhcGVkID0gdGhpcy5lc2NhcGVGb3JSZWdleChwYXR0ZXJuKTtcbiAgICBjb25zdCBzdGFyc1JlcGxhY2VkID0gZXNjYXBlZC5yZXBsYWNlKC9cXFxcXFwqL2csIFwiLipcIik7XG4gICAgcmV0dXJuIFJlZ0V4cChgXiR7c3RhcnNSZXBsYWNlZH0kYCk7XG4gIH1cbiAgZXNjYXBlRm9yUmVnZXgoc3RyaW5nKSB7XG4gICAgcmV0dXJuIHN0cmluZy5yZXBsYWNlKC9bLiorP14ke30oKXxbXFxdXFxcXF0vZywgXCJcXFxcJCZcIik7XG4gIH1cbn07XG52YXIgTWF0Y2hQYXR0ZXJuID0gX01hdGNoUGF0dGVybjtcbk1hdGNoUGF0dGVybi5QUk9UT0NPTFMgPSBbXCJodHRwXCIsIFwiaHR0cHNcIiwgXCJmaWxlXCIsIFwiZnRwXCIsIFwidXJuXCJdO1xudmFyIEludmFsaWRNYXRjaFBhdHRlcm4gPSBjbGFzcyBleHRlbmRzIEVycm9yIHtcbiAgY29uc3RydWN0b3IobWF0Y2hQYXR0ZXJuLCByZWFzb24pIHtcbiAgICBzdXBlcihgSW52YWxpZCBtYXRjaCBwYXR0ZXJuIFwiJHttYXRjaFBhdHRlcm59XCI6ICR7cmVhc29ufWApO1xuICB9XG59O1xuZnVuY3Rpb24gdmFsaWRhdGVQcm90b2NvbChtYXRjaFBhdHRlcm4sIHByb3RvY29sKSB7XG4gIGlmICghTWF0Y2hQYXR0ZXJuLlBST1RPQ09MUy5pbmNsdWRlcyhwcm90b2NvbCkgJiYgcHJvdG9jb2wgIT09IFwiKlwiKVxuICAgIHRocm93IG5ldyBJbnZhbGlkTWF0Y2hQYXR0ZXJuKFxuICAgICAgbWF0Y2hQYXR0ZXJuLFxuICAgICAgYCR7cHJvdG9jb2x9IG5vdCBhIHZhbGlkIHByb3RvY29sICgke01hdGNoUGF0dGVybi5QUk9UT0NPTFMuam9pbihcIiwgXCIpfSlgXG4gICAgKTtcbn1cbmZ1bmN0aW9uIHZhbGlkYXRlSG9zdG5hbWUobWF0Y2hQYXR0ZXJuLCBob3N0bmFtZSkge1xuICBpZiAoaG9zdG5hbWUuaW5jbHVkZXMoXCI6XCIpKVxuICAgIHRocm93IG5ldyBJbnZhbGlkTWF0Y2hQYXR0ZXJuKG1hdGNoUGF0dGVybiwgYEhvc3RuYW1lIGNhbm5vdCBpbmNsdWRlIGEgcG9ydGApO1xuICBpZiAoaG9zdG5hbWUuaW5jbHVkZXMoXCIqXCIpICYmIGhvc3RuYW1lLmxlbmd0aCA+IDEgJiYgIWhvc3RuYW1lLnN0YXJ0c1dpdGgoXCIqLlwiKSlcbiAgICB0aHJvdyBuZXcgSW52YWxpZE1hdGNoUGF0dGVybihcbiAgICAgIG1hdGNoUGF0dGVybixcbiAgICAgIGBJZiB1c2luZyBhIHdpbGRjYXJkICgqKSwgaXQgbXVzdCBnbyBhdCB0aGUgc3RhcnQgb2YgdGhlIGhvc3RuYW1lYFxuICAgICk7XG59XG5mdW5jdGlvbiB2YWxpZGF0ZVBhdGhuYW1lKG1hdGNoUGF0dGVybiwgcGF0aG5hbWUpIHtcbiAgcmV0dXJuO1xufVxuZXhwb3J0IHtcbiAgSW52YWxpZE1hdGNoUGF0dGVybixcbiAgTWF0Y2hQYXR0ZXJuXG59O1xuIl0sIm5hbWVzIjpbImJyb3dzZXIiLCJfYnJvd3NlciJdLCJtYXBwaW5ncyI6Ijs7QUFBTyxXQUFTLGlCQUFpQixLQUFLO0FBQ3BDLFFBQUksT0FBTyxRQUFRLE9BQU8sUUFBUSxXQUFZLFFBQU8sRUFBRSxNQUFNLElBQUc7QUFDaEUsV0FBTztBQUFBLEVBQ1Q7QUNIQSxRQUFBLGFBQUEsaUJBQUEsTUFBQTtBQUNFLFlBQUEsSUFBQSxtREFBQTtBQUVBLFdBQUEsUUFBQSxVQUFBLFlBQUEsQ0FBQSxTQUFBLFFBQUEsaUJBQUE7QUFDRSxVQUFBLFFBQUEsU0FBQSxjQUFBO0FBRUUsZ0JBQUEsSUFBQSw4QkFBQTtBQUFBLE1BQTBDO0FBRzVDLFVBQUEsUUFBQSxTQUFBLFVBQUE7QUFDRSx3QkFBQSxTQUFBLFFBQUEsWUFBQTtBQUNBLGVBQUE7QUFBQSxNQUFPO0FBQUEsSUFDVCxDQUFBO0FBR0YsbUJBQUEsZ0JBQUEsU0FBQSxRQUFBLGNBQUE7QUFDRSxVQUFBO0FBR0UsY0FBQSwwQkFBQTtBQUFBLFVBQWdDO0FBQUEsWUFDOUIsVUFBQTtBQUFBLFlBQ1ksT0FBQTtBQUFBLFlBQ0gsYUFBQTtBQUFBLFlBQ00sS0FBQTtBQUFBLFlBQ1IsYUFBQTtBQUFBLFVBQ1E7QUFBQSxVQUNmO0FBQUEsWUFDQSxVQUFBO0FBQUEsWUFDWSxPQUFBO0FBQUEsWUFDSCxhQUFBO0FBQUEsWUFDTSxLQUFBO0FBQUEsWUFDUixhQUFBO0FBQUEsVUFDUTtBQUFBLFVBQ2Y7QUFBQSxZQUNBLFVBQUE7QUFBQSxZQUNZLE9BQUE7QUFBQSxZQUNILGFBQUE7QUFBQSxZQUNNLGFBQUE7QUFBQSxVQUNBO0FBQUEsVUFDZjtBQUFBLFlBQ0EsVUFBQTtBQUFBLFlBQ1ksT0FBQTtBQUFBLFlBQ0gsYUFBQTtBQUFBLFlBQ00sS0FBQTtBQUFBLFlBQ1IsYUFBQTtBQUFBLFVBQ1E7QUFBQSxVQUNmO0FBQUEsWUFDQSxVQUFBO0FBQUEsWUFDWSxPQUFBO0FBQUEsWUFDSCxhQUFBO0FBQUEsWUFDTSxLQUFBO0FBQUEsWUFDUixhQUFBO0FBQUEsVUFDUTtBQUFBLFVBQ2Y7QUFBQSxZQUNBLFVBQUE7QUFBQSxZQUNZLE9BQUE7QUFBQSxZQUNILGFBQUE7QUFBQSxZQUNNLGFBQUE7QUFBQSxVQUNBO0FBQUEsVUFDZjtBQUFBLFlBQ0EsVUFBQTtBQUFBLFlBQ1ksT0FBQTtBQUFBLFlBQ0gsYUFBQTtBQUFBLFlBQ00sYUFBQTtBQUFBLFVBQ0E7QUFBQSxVQUNmO0FBQUEsWUFDQSxVQUFBO0FBQUEsWUFDWSxPQUFBO0FBQUEsWUFDSCxhQUFBO0FBQUEsWUFDTSxhQUFBO0FBQUEsVUFDQTtBQUFBLFVBQ2Y7QUFBQSxZQUNBLFVBQUE7QUFBQSxZQUNZLE9BQUE7QUFBQSxZQUNILGFBQUE7QUFBQSxZQUNNLGFBQUE7QUFBQSxVQUNBO0FBQUEsVUFDZjtBQUFB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QUssQ0FBQyxVQUFVLE1BQU0sS0FBSyxJQUFJLFFBQVEsQ0FBQyxLQUFLLG1CQUFtQixLQUFLLElBQUksUUFBUTtBQUFBLElBQ2hIO0FBQUEsSUFDQSxZQUFZLEtBQUs7QUFDZixZQUFNLE1BQU0scUVBQXFFO0FBQUEsSUFDbkY7QUFBQSxJQUNBLFdBQVcsS0FBSztBQUNkLFlBQU0sTUFBTSxvRUFBb0U7QUFBQSxJQUNsRjtBQUFBLElBQ0EsV0FBVyxLQUFLO0FBQ2QsWUFBTSxNQUFNLG9FQUFvRTtBQUFBLElBQ2xGO0FBQUEsSUFDQSxzQkFBc0IsU0FBUztBQUM3QixZQUFNLFVBQVUsS0FBSyxlQUFlLE9BQU87QUFDM0MsWUFBTSxnQkFBZ0IsUUFBUSxRQUFRLFNBQVMsSUFBSTtBQUNuRCxhQUFPLE9BQU8sSUFBSSxhQUFhLEdBQUc7QUFBQSxJQUNwQztBQUFBLElBQ0EsZUFBZSxRQUFRO0FBQ3JCLGFBQU8sT0FBTyxRQUFRLHVCQUF1QixNQUFNO0FBQUEsSUFDckQ7QUFBQSxFQUNGO0FBQ0EsTUFBSSxlQUFlO0FBQ25CLGVBQWEsWUFBWSxDQUFDLFFBQVEsU0FBUyxRQUFRLE9BQU8sS0FBSztBQUMvRCxNQUFJLHNCQUFzQixjQUFjLE1BQU07QUFBQSxJQUM1QyxZQUFZLGNBQWMsUUFBUTtBQUNoQyxZQUFNLDBCQUEwQixZQUFZLE1BQU0sTUFBTSxFQUFFO0FBQUEsSUFDNUQ7QUFBQSxFQUNGO0FBQ0EsV0FBUyxpQkFBaUIsY0FBYyxVQUFVO0FBQ2hELFFBQUksQ0FBQyxhQUFhLFVBQVUsU0FBUyxRQUFRLEtBQUssYUFBYTtBQUM3RCxZQUFNLElBQUk7QUFBQSxRQUNSO0FBQUEsUUFDQSxHQUFHLFFBQVEsMEJBQTBCLGFBQWEsVUFBVSxLQUFLLElBQUksQ0FBQztBQUFBLE1BQzVFO0FBQUEsRUFDQTtBQUNBLFdBQVMsaUJBQWlCLGNBQWMsVUFBVTtBQUNoRCxRQUFJLFNBQVMsU0FBUyxHQUFHO0FBQ3ZCLFlBQU0sSUFBSSxvQkFBb0IsY0FBYyxnQ0FBZ0M7QUFDOUUsUUFBSSxTQUFTLFNBQVMsR0FBRyxLQUFLLFNBQVMsU0FBUyxLQUFLLENBQUMsU0FBUyxXQUFXLElBQUk7QUFDNUUsWUFBTSxJQUFJO0FBQUEsUUFDUjtBQUFBLFFBQ0E7QUFBQSxNQUNOO0FBQUEsRUFDQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OyIsInhfZ29vZ2xlX2lnbm9yZUxpc3QiOlswLDIsMyw0XX0=
