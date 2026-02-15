import React, { useState } from 'react';
import { Send } from 'lucide-react';

interface ChatInputProps {
  isLoading: boolean;
  onSendMessage: (text: string) => void;
}

const ChatInput: React.FC<ChatInputProps> = ({ isLoading, onSendMessage }) => {
  const [inputValue, setInputValue] = useState('');

  const handleSend = () => {
    if (!inputValue.trim()) return;
    onSendMessage(inputValue);
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="px-3 pb-3 pt-2 z-20 bg-gradient-to-t from-void-950 via-void-950 to-transparent">
      <div className="max-w-4xl mx-auto relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-gold-500/20 to-violet-500/20 rounded-full opacity-50 blur group-hover:opacity-75 transition duration-500"></div>
        <div className="relative flex items-center gap-2 bg-void-900 rounded-full p-1.5 border border-void-700 shadow-2xl">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="무엇이든 물어보세요..."
            disabled={isLoading}
            className="flex-1 bg-transparent border-none text-gray-200 placeholder-gray-500 px-5 py-3 focus:ring-0 focus:outline-none font-sans text-base"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !inputValue.trim()}
            className={`p-3 rounded-full transition-all duration-300 flex items-center justify-center ${
              isLoading || !inputValue.trim()
                ? 'bg-void-800 text-gray-600'
                : 'bg-gold-500 hover:bg-gold-400 text-void-950 shadow-[0_0_15px_rgba(212,175,55,0.4)] transform hover:scale-105'
            }`}
          >
            <Send size={20} />
          </button>
        </div>
      </div>
      <p className="text-center text-[10px] text-gray-600 mt-1.5 font-sans tracking-wide">
        AI는 운명의 조언자일 뿐, 선택은 당신의 몫입니다.
      </p>
    </div>
  );
};

export default ChatInput;
