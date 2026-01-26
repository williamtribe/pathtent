import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

export default defineContentScript({
  matches: ['https://www.patent.go.kr/*'],
  main() {
    console.log('Patent Guide Assistant - Content Script Loaded');

    const STORAGE_KEY = 'patent_guide_state';

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
          <div class="message-content">안녕하세요! 특허 고객 등록을 도와드릴까요? 🚀<br><br>22단계로 구성된 가이드를 통해 쉽게 등록하실 수 있습니다.</div>
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

    const resetBtn = chatPanel.querySelector('.reset-btn');
    resetBtn?.addEventListener('click', () => {
      chrome.storage.local.remove([STORAGE_KEY], () => {
        console.log('Guide state cleared - restarting from beginning');
        location.reload();
      });
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

    chrome.storage.local.get([STORAGE_KEY], (result) => {
      if (result[STORAGE_KEY]) {
        const { currentStep } = result[STORAGE_KEY];
        console.log(`Resuming guide from step ${currentStep + 1}`);
        chatPanel.style.display = 'flex';
        button.style.display = 'none';
        
        chrome.runtime.sendMessage(
          { type: 'ASK_AI', question: '가이드 재개' },
          (response) => {
            if (response.success) {
              const resumeMessageDiv = document.createElement('div');
              resumeMessageDiv.className = 'message assistant';
              resumeMessageDiv.innerHTML = `<div class="message-content">가이드를 계속 진행합니다! (${currentStep + 1}/${response.steps.length}단계)</div>`;
              messagesContainer?.appendChild(resumeMessageDiv);
              
              startGuide(response.steps, currentStep);
            }
          }
        );
      }
    });

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'START_GUIDE') {
        startGuide(message.steps);
        sendResponse({ success: true });
      }
    });

    function startGuide(steps: Array<{ selector: string; title: string; description: string; url?: string; externalLink?: string; autoAdvance?: boolean }>, startFromStep: number = 0) {
      let currentStepIndex = startFromStep;
      let currentDriver: any = null;
      let clickListener: ((e: Event) => void) | null = null;

      const saveProgress = (stepIndex: number) => {
        chrome.storage.local.set({
          [STORAGE_KEY]: {
            currentStep: stepIndex,
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
            currentElement.removeEventListener('click', clickListener);
          }
          clickListener = null;
        }

        currentStepIndex++;
        if (currentStepIndex < steps.length) {
          saveProgress(currentStepIndex);
          setTimeout(() => showStep(currentStepIndex), 300);
        } else {
          clearProgress();
          
          chrome.storage.local.get(['patent_invention_names'], (result) => {
            const completionMessageDiv = document.createElement('div');
            completionMessageDiv.className = 'message assistant';
            completionMessageDiv.innerHTML = `<div class="message-content">🎉 가이드를 모두 완료했습니다!</div>`;
            messagesContainer?.appendChild(completionMessageDiv);
            
            if (result.patent_invention_names) {
              const { korean, english } = result.patent_invention_names;
              
              const inventionNamesDiv = document.createElement('div');
              inventionNamesDiv.style.cssText = 'padding: 0 20px 20px;';
              inventionNamesDiv.innerHTML = `
                <div style="background: #f3f4f6; border-radius: 12px; padding: 16px; margin-bottom: 12px;">
                  <h3 style="font-size: 14px; font-weight: 600; margin-bottom: 12px; color: #1f2937;">📋 발명의 명칭</h3>
                  
                  <div style="background: white; border-radius: 8px; padding: 12px; margin-bottom: 8px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                      <div style="flex: 1;">
                        <p style="font-size: 11px; color: #6b7280; margin-bottom: 4px;">국문</p>
                        <p style="font-size: 14px; font-weight: 500; color: #1f2937;">${korean}</p>
                      </div>
                      <button class="copy-korean-btn" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 6px; padding: 8px 16px; font-size: 12px; font-weight: 600; cursor: pointer; margin-left: 12px; white-space: nowrap;">복사</button>
                    </div>
                  </div>
                  
                  <div style="background: white; border-radius: 8px; padding: 12px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                      <div style="flex: 1;">
                        <p style="font-size: 11px; color: #6b7280; margin-bottom: 4px;">영문</p>
                        <p style="font-size: 14px; font-weight: 500; color: #1f2937;">${english}</p>
                      </div>
                      <button class="copy-english-btn" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 6px; padding: 8px 16px; font-size: 12px; font-weight: 600; cursor: pointer; margin-left: 12px; white-space: nowrap;">복사</button>
                    </div>
                  </div>
                </div>
              `;
              
              chatPanel.appendChild(inventionNamesDiv);
              
              const copyKoreanBtn = inventionNamesDiv.querySelector('.copy-korean-btn');
              const copyEnglishBtn = inventionNamesDiv.querySelector('.copy-english-btn');
              
              copyKoreanBtn?.addEventListener('click', async () => {
                await navigator.clipboard.writeText(korean);
                const originalText = copyKoreanBtn.textContent;
                copyKoreanBtn.textContent = '✓ 복사됨!';
                setTimeout(() => {
                  copyKoreanBtn.textContent = originalText;
                }, 2000);
              });
              
              copyEnglishBtn?.addEventListener('click', async () => {
                await navigator.clipboard.writeText(english);
                const originalText = copyEnglishBtn.textContent;
                copyEnglishBtn.textContent = '✓ 복사됨!';
                setTimeout(() => {
                  copyEnglishBtn.textContent = originalText;
                }, 2000);
              });
            }
            
            messagesContainer?.scrollTo({ top: messagesContainer.scrollHeight, behavior: 'smooth' });
          });
        }
      };

      const showStep = (index: number, retryCount: number = 0) => {
        if (index >= steps.length) return;

        const step = steps[index];
        
        if (index === 5 && window.location.href.includes('popUpInfo.do')) {
          const popupInfoMessageDiv = document.createElement('div');
          popupInfoMessageDiv.className = 'message assistant';
          popupInfoMessageDiv.innerHTML = `<div class="message-content">ℹ️ 특허고객 행정처리 편리화에 대한 안내 페이지입니다.<br><br>내용을 확인하신 후 팝업을 닫고 원래 페이지로 돌아가서 계속 진행하시면 됩니다.</div>`;
          messagesContainer?.appendChild(popupInfoMessageDiv);
          messagesContainer?.scrollTo({ top: messagesContainer.scrollHeight, behavior: 'smooth' });
          
          const interval = setInterval(() => {
            if (!window.location.href.includes('popUpInfo.do')) {
              clearInterval(interval);
              const returnMessageDiv = document.createElement('div');
              returnMessageDiv.className = 'message assistant';
              returnMessageDiv.innerHTML = `<div class="message-content">✅ 원래 페이지로 돌아왔습니다. 다시 시도합니다...</div>`;
              messagesContainer?.appendChild(returnMessageDiv);
              messagesContainer?.scrollTo({ top: messagesContainer.scrollHeight, behavior: 'smooth' });
              setTimeout(() => showStep(index, 0), 500);
            }
          }, 1000);
          return;
        }
        
        if (step.url && !window.location.href.includes(step.url.split('/').pop() || '')) {
          console.log(`Current page doesn't match step ${index + 1} URL. Expected: ${step.url}, Current: ${window.location.href}`);
          
          if (retryCount < 10) {
            setTimeout(() => showStep(index, retryCount + 1), 500);
            return;
          } else {
            const errorMessageDiv = document.createElement('div');
            errorMessageDiv.className = 'message assistant';
            errorMessageDiv.innerHTML = `<div class="message-content">⚠️ 올바른 페이지로 이동하지 않았습니다.<br><br>예상 페이지: ${step.url}<br>현재 페이지: ${window.location.href}<br><br>페이지를 확인해주세요.</div>`;
            messagesContainer?.appendChild(errorMessageDiv);
            messagesContainer?.scrollTo({ top: messagesContainer.scrollHeight, behavior: 'smooth' });
            
            const skipButtonDiv = document.createElement('div');
            skipButtonDiv.style.cssText = 'padding: 0 20px 20px; display: flex; gap: 10px;';
            skipButtonDiv.innerHTML = `
              <button style="flex: 1; background: #ef4444; color: white; border: none; border-radius: 8px; padding: 12px; font-weight: 600; cursor: pointer;">가이드 종료</button>
              <button style="flex: 1; background: #667eea; color: white; border: none; border-radius: 8px; padding: 12px; font-weight: 600; cursor: pointer;">다시 시도</button>
            `;
            
            const endBtn = skipButtonDiv.querySelector('button:first-child');
            const retryBtn = skipButtonDiv.querySelector('button:last-child');
            
            endBtn?.addEventListener('click', () => {
              clearProgress();
              skipButtonDiv.remove();
              const endMessageDiv = document.createElement('div');
              endMessageDiv.className = 'message assistant';
              endMessageDiv.innerHTML = `<div class="message-content">가이드를 종료했습니다.</div>`;
              messagesContainer?.appendChild(endMessageDiv);
            });
            
            retryBtn?.addEventListener('click', () => {
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
            const errorMessageDiv = document.createElement('div');
            errorMessageDiv.className = 'message assistant';
            errorMessageDiv.innerHTML = `<div class="message-content">⚠️ 이 페이지에서 다음 단계를 찾을 수 없습니다.<br><br>올바른 페이지로 이동했는지 확인해주세요.<br><br>진행을 계속하려면 아래 버튼을 눌러주세요.</div>`;
            messagesContainer?.appendChild(errorMessageDiv);
            messagesContainer?.scrollTo({ top: messagesContainer.scrollHeight, behavior: 'smooth' });
            
            const skipButtonDiv = document.createElement('div');
            skipButtonDiv.style.cssText = 'padding: 0 20px 20px; display: flex; gap: 10px;';
            skipButtonDiv.innerHTML = `
              <button style="flex: 1; background: #ef4444; color: white; border: none; border-radius: 8px; padding: 12px; font-weight: 600; cursor: pointer;">가이드 종료</button>
              <button style="flex: 1; background: #667eea; color: white; border: none; border-radius: 8px; padding: 12px; font-weight: 600; cursor: pointer;">다시 시도</button>
            `;
            
            const endBtn = skipButtonDiv.querySelector('button:first-child');
            const retryBtn = skipButtonDiv.querySelector('button:last-child');
            
            endBtn?.addEventListener('click', () => {
              clearProgress();
              skipButtonDiv.remove();
              const endMessageDiv = document.createElement('div');
              endMessageDiv.className = 'message assistant';
              endMessageDiv.innerHTML = `<div class="message-content">가이드를 종료했습니다.</div>`;
              messagesContainer?.appendChild(endMessageDiv);
            });
            
            retryBtn?.addEventListener('click', () => {
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
                },
              },
            }],
          });

          clickListener = (e: Event) => {
            console.log('Element clicked! Moving to next step...');
            
            const nextStepIndex = currentStepIndex + 1;
            if (nextStepIndex < steps.length) {
              saveProgress(nextStepIndex);
              console.log(`Saved progress: step ${nextStepIndex}`);
            }
            
            setTimeout(() => {
              moveToNextStep();
            }, 100);
          };

          element.addEventListener('click', clickListener, { capture: true, once: true });
          
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          currentDriver.drive();
        } else {
          const stepMessageDiv = document.createElement('div');
          stepMessageDiv.className = 'message assistant';
          stepMessageDiv.innerHTML = `<div class="message-content"><strong>${step.title}</strong><br><br>${step.description}${step.externalLink ? `<br><br><a href="${step.externalLink}" target="_blank" style="color: #667eea; font-weight: bold;">🔗 ${step.externalLink}</a>` : ''}</div>`;
          messagesContainer?.appendChild(stepMessageDiv);
          
          if ((step as any).showCopyButton) {
            chrome.storage.local.get(['patent_invention_names'], (result) => {
              if (result.patent_invention_names) {
                const { korean, english } = result.patent_invention_names;
                const copyType = (step as any).showCopyButton;
                const nameToShow = copyType === 'korean' ? korean : english;
                const label = copyType === 'korean' ? '국문 명칭' : '영문 명칭';
                
                const copyButtonDiv = document.createElement('div');
                copyButtonDiv.style.cssText = 'padding: 0 20px 20px;';
                copyButtonDiv.innerHTML = `
                  <div style="background: #f3f4f6; border-radius: 12px; padding: 16px; margin-bottom: 12px;">
                    <p style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">${label}</p>
                    <div style="background: white; border-radius: 8px; padding: 12px; display: flex; justify-content: space-between; align-items: center;">
                      <p style="font-size: 14px; font-weight: 500; color: #1f2937; flex: 1;">${nameToShow}</p>
                      <button class="copy-name-btn" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 6px; padding: 8px 16px; font-size: 12px; font-weight: 600; cursor: pointer; margin-left: 12px; white-space: nowrap;">📋 복사</button>
                    </div>
                  </div>
                `;
                
                chatPanel.appendChild(copyButtonDiv);
                
                const copyBtn = copyButtonDiv.querySelector('.copy-name-btn');
                copyBtn?.addEventListener('click', async () => {
                  await navigator.clipboard.writeText(nameToShow);
                  const originalText = copyBtn.textContent;
                  copyBtn.textContent = '✓ 복사됨!';
                  setTimeout(() => {
                    copyBtn.textContent = originalText;
                  }, 2000);
                });
              }
            });
          }
          
          const completeButtonDiv = document.createElement('div');
          completeButtonDiv.style.cssText = 'padding: 0 20px 20px; display: flex; gap: 10px;';
          completeButtonDiv.innerHTML = `
            <button style="flex: 1; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; border: none; border-radius: 12px; padding: 14px 28px; font-size: 16px; font-weight: 600; cursor: pointer; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">✅ 완료했어요!</button>
          `;
          
          const completeBtn = completeButtonDiv.querySelector('button');
          completeBtn?.addEventListener('click', () => {
            completeButtonDiv.remove();
            
            const completedMessageDiv = document.createElement('div');
            completedMessageDiv.className = 'message user';
            completedMessageDiv.innerHTML = `<div class="message-content">완료했어요!</div>`;
            messagesContainer?.appendChild(completedMessageDiv);
            
            moveToNextStep();
          });
          
          chatPanel.appendChild(completeButtonDiv);
          messagesContainer?.scrollTo({ top: messagesContainer.scrollHeight, behavior: 'smooth' });
        }

        setTimeout(() => {
          const highlightedElement = document.querySelector('.driver-active-element');
          if (highlightedElement) {
            (highlightedElement as HTMLElement).style.pointerEvents = 'auto';
            (highlightedElement as HTMLElement).style.cursor = 'pointer';
          }
        }, 100);
      };

      showStep(startFromStep);
    }
  },
});
