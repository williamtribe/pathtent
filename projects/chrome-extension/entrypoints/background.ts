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
      // 현재는 특허 고객 등록 프로세스 가이드 데이터 반환
      const patentRegistrationSteps = [
        {
          selector: '#header > div.gnb_wrap > div.gnb_cnt > div > div.ar > ul > li.link_login',
          title: '1단계: 로그인',
          description: '로그인 버튼을 클릭하여 로그인 페이지로 이동합니다.',
          url: 'https://www.patent.go.kr/smart/LoginForm.do',
        },
        {
          selector: '#simpleDemo',
          title: '2단계: 간편인증',
          description: '간편인증 버튼을 클릭합니다.',
        },
        {
          selector: 'body',
          title: '3단계: 간편인증 진행',
          description: '간편인증 과정은 사용자가 직접 진행해야 합니다. 인증을 완료한 후 다음 단계로 진행하세요.',
        },
        {
          selector: '#header > div.gnb_wrap > div.gnb_cnt > div > div.ar > ul > li:nth-child(3)',
          title: '4단계: 특허고객등록',
          description: '특허고객등록 메뉴를 클릭합니다.',
          url: 'https://www.patent.go.kr/smart/jsp/ka/prestep/codeapp/CodeAppIndex.do',
        },
        {
          selector: '#content > ul > li:nth-child(1) > a',
          title: '5단계: 특허고객등록 진행',
          description: '특허고객등록을 클릭하여 등록 페이지로 이동합니다.',
          url: 'https://www.patent.go.kr/smart/jsp/ka/prestep/codeapp/CodeAppView.do',
        },
        {
          selector: '#content > div.board_body.table_scroll > table > tbody > tr:nth-child(1) > td:nth-child(4) > a',
          title: '6단계: 프로그램 다운로드',
          description: '다운로드 버튼을 클릭하여 필요한 프로그램을 설치합니다. 설치 후 다음 단계로 진행하세요.',
        },
        {
          selector: '#tab-1Div > div',
          title: '7단계: 하단 섹션 이동',
          description: '아래로 스크롤하여 이 섹션으로 이동합니다.',
        },
        {
          selector: '#tab-1Div > div > fieldset > ul > li:nth-child(1) > div.mouseKeytype > a',
          title: '8단계: 발급확인',
          description: '발급확인 버튼을 클릭하고 확인이 완료될 때까지 기다립니다.',
        },
        {
          selector: '#tab-1Div > div > div > a',
          title: '9단계: 실명인증',
          description: '실명인증 버튼을 클릭합니다. 인증 페이지로 이동합니다.',
        },
        {
          selector: '#content > div.area_box.box02.mt40 > div.btn_area > a.btn.navy',
          title: '10단계: 다음',
          description: '실명인증이 완료되면 다음 버튼을 클릭합니다.',
        },
        {
          selector: 'body',
          title: '11단계: 서명/인감도장 생성',
          description: '서명/인감도장이 필요합니다. https://donue.co.kr/service/signature/ 사이트를 이용하세요. 주소 자동 변경 옵션을 활성화하는 것이 좋습니다.',
          url: 'https://www.patent.go.kr/smart/jsp/ka/prestep/codeapp/CodeAppView02.do',
          externalLink: 'https://donue.co.kr/service/signature/',
        },
        {
          selector: '#input_form > div.btn_area > a.btn.navy',
          title: '12단계: 신청',
          description: '모든 정보를 입력한 후 신청 버튼을 클릭하여 특허 고객 등록을 완료합니다.',
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

      sendResponse({ success: true, steps: patentRegistrationSteps });
    } catch (error) {
      console.error('AI request failed:', error);
      sendResponse({ success: false, error: String(error) });
    }
  }
});
