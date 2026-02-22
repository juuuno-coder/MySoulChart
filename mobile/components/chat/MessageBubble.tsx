import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { Message } from '../../shared/types';

interface Props {
  message: Message;
}

const markdownStyles: Record<string, any> = {
  body: { color: '#c8ccff', fontSize: 15, lineHeight: 24 },
  strong: { color: '#e8eaff', fontWeight: '700' },
  em: { color: '#c084fc', fontStyle: 'italic' },
  bullet_list: { marginVertical: 4 },
  ordered_list: { marginVertical: 4 },
  list_item: { marginVertical: 2 },
  heading1: { color: '#e8eaff', fontSize: 20, fontWeight: 'bold', marginVertical: 8 },
  heading2: { color: '#e8eaff', fontSize: 18, fontWeight: 'bold', marginVertical: 6 },
  heading3: { color: '#e8eaff', fontSize: 16, fontWeight: '600', marginVertical: 4 },
  blockquote: { backgroundColor: '#1a1a4220', borderLeftColor: '#9333ea', borderLeftWidth: 3, paddingLeft: 12, marginVertical: 8 },
  hr: { backgroundColor: '#1a1a42', height: 1, marginVertical: 12 },
  paragraph: { marginTop: 0, marginBottom: 8 },
};

function MessageBubbleInner({ message }: Props) {
  const isUser = message.role === 'user';

  return (
    <View style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble]}>
      {!isUser && <Text style={styles.aiLabel}>🔮 도사</Text>}
      {isUser ? (
        <Text style={styles.userText}>{message.text}</Text>
      ) : (
        <Markdown style={markdownStyles}>{message.text}</Markdown>
      )}
      <Text style={styles.timestamp}>
        {new Date(message.timestamp).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
      </Text>
    </View>
  );
}

export const MessageBubble = React.memo(MessageBubbleInner, (prev, next) => {
  return prev.message.id === next.message.id && prev.message.text === next.message.text;
});

const styles = StyleSheet.create({
  bubble: {
    maxWidth: '85%',
    marginBottom: 12,
    padding: 14,
    borderRadius: 16,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#1a1a42',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#12122e',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#1a1a4280',
  },
  aiLabel: { fontSize: 11, color: '#9333ea', fontWeight: '600', marginBottom: 6 },
  userText: { fontSize: 15, lineHeight: 24, color: '#e8eaff' },
  timestamp: { fontSize: 10, color: '#9da3ff40', marginTop: 6, textAlign: 'right' },
});
