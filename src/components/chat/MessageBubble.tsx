import React from 'react';
import { Message } from '../../types';
import { Bot, User as UserIcon } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = React.memo(({ message }) => {
  return (
    <div
      className={`flex w-full ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
    >
      <div className={`flex max-w-[90%] md:max-w-[80%] gap-3 md:gap-4 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>

        {/* Avatar */}
        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg border ${
          message.role === 'user'
            ? 'bg-void-800 border-void-600 text-gray-300'
            : 'bg-void-900 border-gold-500/30 text-gold-400'
        }`}>
          {message.role === 'user' ? <UserIcon size={18} /> : <Bot size={18} />}
        </div>

        {/* Bubble */}
        <div className={`relative px-5 py-4 rounded-2xl shadow-xl transition-all ${
          message.role === 'user'
            ? 'bg-gradient-to-br from-void-800 to-void-900 border border-void-700 text-gray-100 rounded-tr-none'
            : 'glass-panel text-gray-100 rounded-tl-none border-gold-500/10'
        }`}>
          <div className={`prose prose-invert max-w-none break-keep leading-relaxed ${
            message.role === 'model' ? 'font-book text-lg text-gray-100' : 'font-sans text-base text-gray-100'
          }`}>
            <ReactMarkdown>{message.text}</ReactMarkdown>
          </div>
          <div className="text-[10px] opacity-40 mt-1 text-right font-sans">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
    </div>
  );
});

MessageBubble.displayName = 'MessageBubble';

export default MessageBubble;
