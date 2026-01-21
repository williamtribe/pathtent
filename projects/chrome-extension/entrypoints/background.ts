export default defineBackground(() => {
  console.log('Patent Guide Assistant - Background Script Loaded');

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'OPEN_POPUP') {
      // Popup은 브라우저 액션으로 열림 (아이콘 클릭)
      console.log('User requested to open popup');
    }

    if (message.type === 'ASK_AI') {
      handleAIRequest(message, sender, sendResponse);
      return true; // 비동기 응답을 위해 true 반환
    }
  });

  async function handleAIRequest(message: any, sender: any, sendResponse: any) {
    try {
      // TODO: 실제 AI API 호출 (OpenAI, Claude 등)
      // 현재는 더미 데이터 반환
      const dummySteps = [
        {
          selector: '#header',
          title: '특허청 메인 헤더',
          description: '이곳에서 주요 메뉴를 찾을 수 있습니다.',
        },
        {
          selector: '#gnb',
          title: '전체 메뉴',
          description: '전체 메뉴 버튼을 클릭하면 모든 서비스를 볼 수 있습니다.',
        },
      ];

      // AI API 호출 예시 (실제 구현 시)
      /*
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer YOUR_API_KEY`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are a guide for patent.go.kr. Provide step-by-step CSS selectors and instructions.',
            },
            {
              role: 'user',
              content: message.question,
            },
          ],
        }),
      });

      const data = await response.json();
      const steps = parseAIResponse(data);
      */

      sendResponse({ success: true, steps: dummySteps });
    } catch (error) {
      console.error('AI request failed:', error);
      sendResponse({ success: false, error: String(error) });
    }
  }
});
