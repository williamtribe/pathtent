import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

export default defineContentScript({
  matches: ['https://www.patent.go.kr/*'],
  main() {
    console.log('Patent Guide Assistant - Content Script Loaded');

    const chatPanelContainer = document.createElement('div');
    chatPanelContainer.id = 'patent-chat-panel-container';
    document.body.appendChild(chatPanelContainer);

    const container = document.createElement('div');
    container.id = 'patent-guide-container';
    container.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 999999;
    `;

    const shadow = container.attachShadow({ mode: 'open' });

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

    const chatPanel = document.createElement('div');
    chatPanel.style.cssText = `
      display: none;
      position: fixed;
      top: 0;
      right: 0;
      width: 400px;
      height: 100vh;
      background: white;
      box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1);
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
      </style>
      <div class="chat-header">
        <h1>💬 특허 가이드 도우미</h1>
        <button class="close-btn">×</button>
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

    button.addEventListener('mouseenter', () => {
      button.style.transform = 'translateY(-2px)';
      button.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.6)';
    });

    button.addEventListener('mouseleave', () => {
      button.style.transform = 'translateY(0)';
      button.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
    });

    button.addEventListener('click', () => {
      console.log('Button clicked!');
      chatPanel.style.display = 'flex';
      button.style.display = 'none';
    });

    const closeBtn = chatPanel.querySelector('.close-btn');
    closeBtn?.addEventListener('click', () => {
      chatPanel.style.display = 'none';
      button.style.display = 'block';
    });

    const input = chatPanel.querySelector('input');
    const sendBtn = chatPanel.querySelector('.input-container button');
    const messagesContainer = chatPanel.querySelector('.messages');
    const quickActions = chatPanel.querySelector('.quick-actions');
    const startGuideBtn = chatPanel.querySelector('.start-guide-btn');
    const inputContainer = chatPanel.querySelector('.input-container');

    const sendMessage = async () => {
      const message = (input as HTMLInputElement).value.trim();
      if (!message) return;

      const userMessageDiv = document.createElement('div');
      userMessageDiv.className = 'message user';
      userMessageDiv.innerHTML = `<div class="message-content">${message}</div>`;
      messagesContainer?.appendChild(userMessageDiv);

      (input as HTMLInputElement).value = '';
      (sendBtn as HTMLButtonElement).disabled = true;

      messagesContainer?.scrollTo({ top: messagesContainer.scrollHeight, behavior: 'smooth' });

      const normalizedMessage = message.toLowerCase().trim();
      const isStartCommand = normalizedMessage === '네' || 
                            normalizedMessage === '예' || 
                            normalizedMessage === '시작' || 
                            normalizedMessage === 'ㅇㅇ' ||
                            normalizedMessage === 'ok' ||
                            normalizedMessage === 'yes' ||
                            normalizedMessage.includes('시작');

      if (isStartCommand) {
        const assistantMessageDiv = document.createElement('div');
        assistantMessageDiv.className = 'message assistant';
        assistantMessageDiv.innerHTML = `<div class="message-content">좋습니다! 특허 고객 등록 가이드를 시작하겠습니다. 🎯<br><br>화면의 하이라이트를 따라가며 단계별로 진행해주세요!</div>`;
        messagesContainer?.appendChild(assistantMessageDiv);
        messagesContainer?.scrollTo({ top: messagesContainer.scrollHeight, behavior: 'smooth' });

        (sendBtn as HTMLButtonElement).disabled = false;

        chrome.runtime.sendMessage(
          {
            type: 'ASK_AI',
            question: message,
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
            type: 'ASK_AI',
            question: message,
          },
          (response) => {
            const assistantMessageDiv = document.createElement('div');
            assistantMessageDiv.className = 'message assistant';
            assistantMessageDiv.innerHTML = `<div class="message-content">가이드를 시작하겠습니다. 화면을 확인해주세요!</div>`;
            messagesContainer?.appendChild(assistantMessageDiv);
            messagesContainer?.scrollTo({ top: messagesContainer.scrollHeight, behavior: 'smooth' });

            (sendBtn as HTMLButtonElement).disabled = false;

            if (response.success) {
              startGuide(response.steps);
            }
          }
        );
      }
    };

    startGuideBtn?.addEventListener('click', () => {
      const userMessageDiv = document.createElement('div');
      userMessageDiv.className = 'message user';
      userMessageDiv.innerHTML = `<div class="message-content">넵! 시작할게요 👍</div>`;
      messagesContainer?.appendChild(userMessageDiv);

      quickActions?.classList.add('hidden');
      inputContainer?.classList.remove('hidden');

      const assistantMessageDiv = document.createElement('div');
      assistantMessageDiv.className = 'message assistant';
      assistantMessageDiv.innerHTML = `<div class="message-content">좋습니다! 특허 고객 등록 가이드를 시작하겠습니다. 🎯<br><br>화면의 하이라이트를 따라가며 단계별로 진행해주세요!</div>`;
      messagesContainer?.appendChild(assistantMessageDiv);
      messagesContainer?.scrollTo({ top: messagesContainer.scrollHeight, behavior: 'smooth' });

      chrome.runtime.sendMessage(
        {
          type: 'ASK_AI',
          question: '시작',
        },
        (response) => {
          if (response.success) {
            startGuide(response.steps);
          }
        }
      );
    });

    sendBtn?.addEventListener('click', sendMessage);
    input?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        sendMessage();
      }
    });

    shadow.appendChild(button);
    chatPanelContainer.appendChild(chatPanel);
    document.body.appendChild(container);

    // Background로부터 가이드 시작 메시지 수신
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'START_GUIDE') {
        startGuide(message.steps);
        sendResponse({ success: true });
      }
    });

    function startGuide(steps: Array<{ selector: string; title: string; description: string; url?: string; externalLink?: string }>) {
      let currentStepIndex = 0;
      let currentDriver: any = null;
      let clickListener: ((e: Event) => void) | null = null;

      const moveToNextStep = () => {
        if (currentDriver) {
          currentDriver.destroy();
          currentDriver = null;
        }
        
        if (clickListener) {
          const currentStep = steps[currentStepIndex];
          const currentElement = document.querySelector(currentStep.selector);
          if (currentElement) {
            currentElement.removeEventListener('click', clickListener);
          }
          clickListener = null;
        }

        currentStepIndex++;
        if (currentStepIndex < steps.length) {
          setTimeout(() => showStep(currentStepIndex), 300);
        }
      };

      const showStep = (index: number) => {
        if (index >= steps.length) return;

        const step = steps[index];
        const element = document.querySelector(step.selector);

        if (!element) {
          console.warn(`Element not found: ${step.selector}`);
          return;
        }

        let description = step.description;
        if (step.externalLink) {
          description += `<br><br><a href="${step.externalLink}" target="_blank" style="color: #667eea; font-weight: bold;">🔗 ${step.externalLink}</a>`;
        }

        description += `<br><br><small style="color: #9ca3af;">💡 이 요소를 직접 클릭하면 자동으로 다음 단계로 넘어갑니다.</small>`;

        currentDriver = driver({
          showProgress: true,
          showButtons: ['next', 'previous', 'close'],
          steps: [{
            element: step.selector,
            popover: {
              title: step.title,
              description: description,
              side: 'left',
              align: 'start',
              onNextClick: () => {
                moveToNextStep();
              },
              onPrevClick: () => {
                if (currentDriver) {
                  currentDriver.destroy();
                  currentDriver = null;
                }
                if (clickListener) {
                  const currentStep = steps[currentStepIndex];
                  const currentElement = document.querySelector(currentStep.selector);
                  if (currentElement) {
                    currentElement.removeEventListener('click', clickListener);
                  }
                  clickListener = null;
                }
                if (index > 0) {
                  currentStepIndex = index - 1;
                  showStep(currentStepIndex);
                }
              },
              onCloseClick: () => {
                if (currentDriver) {
                  currentDriver.destroy();
                  currentDriver = null;
                }
                if (clickListener) {
                  const currentStep = steps[currentStepIndex];
                  const currentElement = document.querySelector(currentStep.selector);
                  if (currentElement) {
                    currentElement.removeEventListener('click', clickListener);
                  }
                  clickListener = null;
                }
              },
            },
          }],
        });

        clickListener = (e: Event) => {
          console.log('Element clicked! Moving to next step...');
          e.stopPropagation();
          moveToNextStep();
        };

        element.addEventListener('click', clickListener, { capture: true, once: true });

        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        currentDriver.drive();

        setTimeout(() => {
          const highlightedElement = document.querySelector('.driver-active-element');
          if (highlightedElement) {
            (highlightedElement as HTMLElement).style.pointerEvents = 'auto';
            (highlightedElement as HTMLElement).style.cursor = 'pointer';
          }
        }, 100);
      };

      showStep(0);
    }
  },
});
