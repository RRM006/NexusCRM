import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTheme } from '@context/ThemeContext';
import { useAuth } from '@context/AuthContext';
import { Card } from '@components/Card';
import { aiService } from '@services/aiService';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Send, Trash2, MessageSquare } from 'lucide-react-native';
import { ChatMessage } from '../../types';
import Toast from 'react-native-toast-message';

export default function AIAssistantScreen() {
  const { theme } = useTheme();
  const { user, activeRole } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadChatHistory();
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      aiService.saveChatHistory(messages);
    }
  }, [messages]);

  const loadChatHistory = async () => {
    const history = await aiService.loadChatHistory();
    if (history.length > 0) {
      setMessages(history);
    } else {
      // Add welcome message
      setMessages([
        {
          id: '1',
          role: 'assistant',
          content: `Hello ${user?.name}! I'm your AI assistant. I can help you with:\n\n• Managing leads and tasks\n• Searching CRM data\n• Creating notes\n• Drafting emails\n• And more!\n\nHow can I assist you today?`,
          timestamp: new Date().toISOString(),
        },
      ]);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await aiService.sendMessage(input.trim(), messages);
      setMessages((prev) => [...prev, response]);
      
      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'AI Error',
        text2: error.response?.data?.message || 'Failed to get response',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    await aiService.clearChatHistory();
    setMessages([]);
    loadChatHistory();
    Toast.show({
      type: 'success',
      text1: 'Chat Cleared',
      text2: 'Chat history has been cleared',
    });
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === 'user';

    return (
      <View
        style={[
          styles.messageContainer,
          isUser ? styles.userMessageContainer : styles.assistantMessageContainer,
        ]}
      >
        <Card
          style={[
            styles.messageBubble,
            {
              backgroundColor: isUser ? theme.colors.primary : theme.colors.surface,
            },
          ]}
        >
          <Text
            style={[
              styles.messageText,
              { color: isUser ? '#ffffff' : theme.colors.text },
            ]}
          >
            {item.content}
          </Text>
          <Text
            style={[
              styles.messageTime,
              { color: isUser ? 'rgba(255,255,255,0.7)' : theme.colors.textSecondary },
            ]}
          >
            {new Date(item.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </Card>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MessageSquare size={24} color={theme.colors.primary} />
          <Text style={[styles.title, { color: theme.colors.text }]}>AI Assistant</Text>
        </View>
        <TouchableOpacity onPress={handleClearHistory}>
          <Trash2 size={24} color={theme.colors.error} />
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={[styles.inputContainer, { backgroundColor: theme.colors.surface }]}>
          <TextInput
            style={[styles.input, { color: theme.colors.text }]}
            placeholder="Type your message..."
            placeholderTextColor={theme.colors.textSecondary}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={!input.trim() || loading}
            style={[
              styles.sendButton,
              {
                backgroundColor: theme.colors.primary,
                opacity: !input.trim() || loading ? 0.5 : 1,
              },
            ]}
          >
            <Send size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  messagesList: {
    padding: 16,
  },
  messageContainer: {
    marginBottom: 12,
  },
  userMessageContainer: {
    alignItems: 'flex-end',
  },
  assistantMessageContainer: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 4,
  },
  messageTime: {
    fontSize: 11,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  input: {
    flex: 1,
    maxHeight: 100,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 16,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
});

