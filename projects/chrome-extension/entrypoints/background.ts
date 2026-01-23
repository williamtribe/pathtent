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
          url: 'https://www.patent.go.kr/smart/portal/Main.do',
          autoAdvance: true,
        },
        {
          selector: '#simpleDemo',
          title: '2단계: 간편인증',
          description: '간편인증 버튼을 클릭합니다.',
          url: 'https://www.patent.go.kr/smart/LoginForm.do',
          autoAdvance: true,
        },
        {
          selector: 'body',
          title: '3단계: 간편인증 진행',
          description: '간편인증 과정을 직접 진행해주세요. 인증이 완료되면 아래 "완료했어요!" 버튼을 눌러주세요.',
          autoAdvance: false,
        },
        {
          selector: '#header > div.gnb_wrap > div.gnb_cnt > div > div.ar > ul > li:nth-child(3)',
          title: '4단계: 특허고객등록',
          description: '특허고객등록 메뉴를 클릭합니다.',
          url: 'https://www.patent.go.kr/smart/portal/Main.do',
          autoAdvance: true,
        },
        {
          selector: '#content > ul > li:nth-child(1) > a',
          title: '5단계: 특허고객등록 진행',
          description: '특허고객등록을 클릭하여 등록 페이지로 이동합니다.',
          url: 'https://www.patent.go.kr/smart/jsp/ka/prestep/codeapp/CodeAppIndex.do',
          autoAdvance: true,
        },
        {
          selector: '#content > div.board_body.table_scroll > table > tbody > tr:nth-child(1) > td:nth-child(4) > a',
          title: '6단계: 프로그램 다운로드',
          description: '다운로드 버튼을 클릭하여 필요한 프로그램을 설치합니다. 설치가 완료되면 아래 "완료했어요!" 버튼을 눌러주세요.',
          autoAdvance: false,
        },
        {
          selector: '#tab-1Div > div',
          title: '7단계: 하단 섹션 이동',
          description: '아래로 스크롤하여 이 섹션으로 이동합니다.',
          autoAdvance: true,
        },
        {
          selector: '#tab-1Div > div > fieldset > ul > li:nth-child(1) > div.mouseKeytype > a',
          title: '8단계: 발급확인',
          description: '발급확인 버튼을 클릭하고 확인이 완료될 때까지 기다립니다. 완료되면 아래 "완료했어요!" 버튼을 눌러주세요.',
          autoAdvance: false,
        },
        {
          selector: '#tab-1Div > div > div > a',
          title: '9단계: 실명인증',
          description: '실명인증 버튼을 클릭합니다. 인증이 완료되면 아래 "완료했어요!" 버튼을 눌러주세요.',
          autoAdvance: false,
        },
        {
          selector: '#content > div.area_box.box02.mt40 > div.btn_area > a.btn.navy',
          title: '10단계: 다음',
          description: '실명인증이 완료되면 다음 버튼을 클릭합니다.',
          url: 'https://www.patent.go.kr/smart/jsp/ka/prestep/codeapp/CodeAppView.do',
          autoAdvance: true,
        },
        {
          selector: 'body',
          title: '11단계: 서명/인감도장 생성',
          description: '서명/인감도장이 필요합니다. https://donue.co.kr/service/signature/ 사이트를 이용하세요. 완료되면 아래 "완료했어요!" 버튼을 눌러주세요.',
          url: 'https://www.patent.go.kr/smart/jsp/ka/prestep/codeapp/CodeAppView02.do',
          externalLink: 'https://donue.co.kr/service/signature/',
          autoAdvance: false,
        },
        {
          selector: '#input_form > div.btn_area > a.btn.navy',
          title: '12단계: 신청',
          description: '모든 정보를 입력해주세요. 입력이 완료되면 아래 "완료했어요!" 버튼을 눌러주세요.',
          autoAdvance: false,
        },
        {
          selector: '#gnb > ul > li:nth-child(2) > ul > li:nth-child(1)',
          title: '13단계: 신청/제출 메뉴',
          description: '신청/제출 메뉴에서 첫 번째 항목을 클릭해주세요.',
          autoAdvance: true,
        },
        {
          selector: '#content > ul > li:nth-child(3) > div > strong > span > a',
          title: '14단계: 온라인 출원',
          description: '온라인 출원 링크를 클릭해주세요.',
          url: 'https://www.patent.go.kr/smart/jsp/kiponet/ma/websolution/OnlineIndex.do',
          autoAdvance: true,
        },
        {
          selector: '#content > ul:nth-child(4) > li:nth-child(2) > strong > a',
          title: '15단계: 출원 항목 선택',
          description: '해당 출원 항목을 클릭해주세요.',
          url: 'https://www.patent.go.kr/smart/jsp/kiponet/ma/websolution/OnlineWrite.do',
          autoAdvance: true,
        },
        {
          selector: '#menuBody > div:nth-child(4) > nav > button',
          title: '16단계: 출원 메뉴',
          description: '이 버튼을 클릭해주세요.',
          url: 'https://www.patent.go.kr/smart/kiponet3/apl/sg/ap/renew/main/EasyMain.do',
          autoAdvance: true,
        },
        {
          selector: '#\\31 00010',
          title: '17단계: 출원 항목 선택',
          description: '이 항목을 클릭해주세요.',
          autoAdvance: true,
        },
        {
          selector: '#CHK_KR_ReferenceNumber',
          title: '18단계: 참조번호 체크',
          description: '오늘 2개 이상의 특허를 제출할 것이 아니면 체크 해제해주셔도 됩니다!',
          url: 'https://www.patent.go.kr/smart/kiponet3/apl/sg/ap/renew/main/DrawApplication.do',
          autoAdvance: false,
        },
        {
          selector: '#prvAplbdy',
          title: '19단계: 가출원 명세서',
          description: '저희 서비스로 작성한 명세서는 가출원에만 사용하시길 권장드립니다.',
          autoAdvance: false,
        },
        {
          selector: '#CE_KR_InventionTitle',
          title: '20단계: 발명의 국문 명칭',
          description: '챗봇에서 국문 명칭을 복사하여 여기에 붙여넣기 해주세요!',
          autoAdvance: false,
          showCopyButton: 'korean',
        },
        {
          selector: '#CE_KR_InventionENTitle',
          title: '21단계: 발명의 영문 명칭',
          description: '챗봇에서 영문 명칭을 복사하여 여기에 붙여넣기 해주세요!',
          autoAdvance: false,
          showCopyButton: 'english',
        },
        {
          selector: '#openDocPath_1__pdf_ppt_pptx_doc_docx_hwp_hlz_elz_jpg_tif_hwpx__DIV_main_dtstmnAtch',
          title: '22단계: 파일 업로드',
          description: '아까 다운로드한 파일을 업로드 해주세요!',
          autoAdvance: false,
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
