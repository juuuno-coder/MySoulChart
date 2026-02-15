import React, { useEffect, useRef } from 'react';
import { Message } from '../../types';
import { Stars, Loader2 } from 'lucide-react';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';

interface ChatInterfaceProps {
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (text: string) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, isLoading, onSendMessage }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  return (
    <div className="flex-1 flex flex-col h-full relative">

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-6 z-10 scrollbar-hide pt-24 flex flex-col justify-end">
        <div className="space-y-6">
          {/* Empty State */}
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center text-center text-gray-500 opacity-80 animate-fadeIn pb-10">
              <div className="w-16 h-16 rounded-full bg-void-800 flex items-center justify-center border border-void-700 mb-4 shadow-2xl relative">
                <div className="absolute inset-0 rounded-full bg-gold-400/10 animate-pulse-slow"></div>
                <Stars className="w-6 h-6 text-gold-300" />
              </div>
              <p className="font-serif text-xl text-gold-100 mb-2 tracking-wide">운명의 대화를 시작합니다</p>
              <p className="text-sm font-light text-gray-500">당신의 이야기가 별들에게 닿기를 기다립니다.</p>
            </div>
          )}

          {/* Message List */}
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex w-full justify-start pl-[54px]">
              <div className="px-5 py-3 rounded-2xl rounded-tl-none glass-panel border-gold-500/10 text-gold-400 flex items-center gap-3">
                <Loader2 size={18} className="animate-spin text-gold-500" />
                <span className="text-sm font-serif opacity-80 tracking-widest text-gold-200">운명의 흐름을 읽는 중...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <ChatInput isLoading={isLoading} onSendMessage={onSendMessage} />
    </div>
  );
};

export default ChatInterface;
