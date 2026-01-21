import { useState } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: '안녕하세요! 특허청 사이트 이용을 도와드리겠습니다. 무엇을 도와드릴까요?',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      chrome.runtime.sendMessage(
        {
          type: 'ASK_AI',
          question: input,
          tabId: tab.id,
        },
        (response) => {
          if (response.success) {
            const assistantMessage: Message = {
              role: 'assistant',
              content: '가이드를 시작하겠습니다. 화면을 확인해주세요!',
            };
            setMessages((prev) => [...prev, assistantMessage]);

            chrome.tabs.sendMessage(tab.id!, {
              type: 'START_GUIDE',
              steps: response.steps,
            });
          } else {
            const errorMessage: Message = {
              role: 'assistant',
              content: '죄송합니다. 오류가 발생했습니다.',
            };
            setMessages((prev) => [...prev, errorMessage]);
          }
          setLoading(false);
        }
      );
    } catch (error) {
      console.error('Error:', error);
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <header className="header">
        <h1>💬 특허 가이드 도우미</h1>
      </header>

      <div className="messages">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.role}`}>
            <div className="message-content">{msg.content}</div>
          </div>
        ))}
        {loading && (
          <div className="message assistant">
            <div className="message-content">생각 중...</div>
          </div>
        )}
      </div>

      <div className="input-container">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="예: 특허 출원 방법 알려줘"
          disabled={loading}
        />
        <button onClick={sendMessage} disabled={loading || !input.trim()}>
          전송
        </button>
      </div>
    </div>
  );
}
