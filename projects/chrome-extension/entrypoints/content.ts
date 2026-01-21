import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

export default defineContentScript({
  matches: ['https://www.patent.go.kr/*'],
  main() {
    console.log('Patent Guide Assistant - Content Script Loaded');

    // Shadow DOM으로 격리된 챗봇 버튼 생성
    const container = document.createElement('div');
    container.id = 'patent-guide-container';
    container.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 999999;
    `;

    const shadow = container.attachShadow({ mode: 'open' });

    // 챗봇 열기 버튼
    const button = document.createElement('button');
    button.textContent = '💬 가이드 도우미';
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

    button.addEventListener('mouseenter', () => {
      button.style.transform = 'translateY(-2px)';
      button.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.6)';
    });

    button.addEventListener('mouseleave', () => {
      button.style.transform = 'translateY(0)';
      button.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
    });

    button.addEventListener('click', () => {
      // Popup 열기
      chrome.runtime.sendMessage({ type: 'OPEN_POPUP' });
    });

    shadow.appendChild(button);
    document.body.appendChild(container);

    // Background로부터 가이드 시작 메시지 수신
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'START_GUIDE') {
        startGuide(message.steps);
        sendResponse({ success: true });
      }
    });

    // Driver.js로 가이드 시작
    function startGuide(steps: Array<{ selector: string; title: string; description: string }>) {
      const driverObj = driver({
        showProgress: true,
        showButtons: ['next', 'previous', 'close'],
        steps: steps.map((step, index) => ({
          element: step.selector,
          popover: {
            title: step.title,
            description: step.description,
            side: 'left',
            align: 'start',
          },
        })),
      });

      driverObj.drive();
    }
  },
});
