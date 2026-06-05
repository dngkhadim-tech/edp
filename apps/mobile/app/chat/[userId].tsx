import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, Dimensions,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { io, Socket } from 'socket.io-client';
import { ArrowLeft, MoreHorizontal, Send } from 'lucide-react-native';
import { api, storage } from '../../src/lib/api';
import { useAuthStore } from '../../src/store/auth.store';
import { getInitials, timeAgo } from '../../src/lib/utils';
import { colors, radius } from '../../src/constants/theme';
import { fonts } from '../../src/constants/fonts';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';

interface Message {
  id: string | number;
  senderId: string;
  content: string;
  createdAt: string | Date;
}

interface OtherUser {
  id: string;
  firstName: string;
  lastName: string;
  avatar?: string;
}

export default function ChatScreen() {
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const socketRef = useRef<Socket | null>(null);

  const { data: conversation } = useQuery<{ data: Message[] }>({
    queryKey: ['messages', userId],
    queryFn: () => api.get(`/messages/${userId}`).then((r) => r.data),
    enabled: !!userId,
  });

  const { data: otherUser } = useQuery<OtherUser>({
    queryKey: ['user', userId],
    queryFn: () => api.get(`/users/${userId}`).then((r) => r.data),
    enabled: !!userId,
  });

  useEffect(() => {
    if (conversation?.data) {
      setMessages([...conversation.data].reverse());
    }
  }, [conversation]);

  useEffect(() => {
    const token = storage.getString('edp_access_token');
    const socket = io(`${API_URL}/messages`, { auth: { token } });
    socketRef.current = socket;
    socket.on('new_message', (msg: Message) => {
      if (msg.senderId === userId) {
        setMessages((prev) => [msg, ...prev]);
      }
    });
    return () => { socket.disconnect(); };
  }, [userId]);

  const sendMessage = () => {
    if (!input.trim() || !socketRef.current || !user) return;
    socketRef.current.emit('send_message', { receiverId: userId, content: input });
    setMessages((prev) => [
      {
        id: Date.now().toString(),
        senderId: user.id,
        content: input,
        createdAt: new Date(),
      },
      ...prev,
    ]);
    setInput('');
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = item.senderId === user?.id;
    return (
      <View style={[styles.bubbleWrapper, isMe ? styles.bubbleRight : styles.bubbleLeft]}>
        <View style={[styles.bubble, isMe ? styles.bubbleSent : styles.bubbleReceived]}>
          <Text style={[styles.bubbleText, isMe ? styles.bubbleTextSent : styles.bubbleTextReceived]}>
            {item.content}
          </Text>
          <Text style={[styles.bubbleTime, isMe ? styles.bubbleTimeSent : styles.bubbleTimeReceived]}>
            {timeAgo(item.createdAt)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} accessibilityLabel="Retour" style={styles.headerBtn}>
            <ArrowLeft size={20} color={colors.muted} strokeWidth={1.5} />
          </TouchableOpacity>

          {otherUser?.avatar ? (
            <Image source={{ uri: otherUser.avatar }} style={styles.headerAvatar} contentFit="cover" />
          ) : (
            <View style={[styles.headerAvatar, styles.headerAvatarFallback]}>
              <Text style={styles.headerAvatarText}>
                {otherUser ? getInitials(otherUser.firstName, otherUser.lastName) : '?'}
              </Text>
            </View>
          )}

          <View style={styles.headerInfo}>
            <Text style={styles.headerName} numberOfLines={1}>
              {otherUser ? `${otherUser.firstName} ${otherUser.lastName}` : '...'}
            </Text>
          </View>

          <TouchableOpacity style={styles.headerBtn} accessibilityLabel="Plus d'options">
            <MoreHorizontal size={20} color={colors.muted} strokeWidth={1.5} />
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <FlatList
          data={messages}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderMessage}
          inverted
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
        />

        {/* Input */}
        <View style={styles.inputBar}>
          <View style={styles.inputPill}>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder="Votre message..."
              placeholderTextColor={colors.muted}
              onSubmitEditing={sendMessage}
              returnKeyType="send"
              multiline={false}
            />
          </View>
          <TouchableOpacity
            style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
            onPress={sendMessage}
            disabled={!input.trim()}
            accessibilityLabel="Envoyer"
          >
            <Send size={18} color="#FFFFFF" strokeWidth={1.5} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerBtn: { padding: 4 },
  headerAvatar: { width: 36, height: 36, borderRadius: 18 },
  headerAvatarFallback: {
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarText: { fontFamily: fonts.heading.bold, fontSize: 13, color: colors.primary },
  headerInfo: { flex: 1, minWidth: 0 },
  headerName: { fontFamily: fonts.heading.semibold, fontSize: 15, color: colors.foreground },

  messageList: { paddingHorizontal: 16, paddingVertical: 16 },
  bubbleWrapper: { marginBottom: 4 },
  bubbleRight: { alignItems: 'flex-end' },
  bubbleLeft: { alignItems: 'flex-start' },
  bubble: {
    maxWidth: SCREEN_WIDTH * 0.72,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleSent: {
    backgroundColor: colors.primary,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 16,
    borderBottomLeftRadius: 16,
  },
  bubbleReceived: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
    borderBottomLeftRadius: 16,
  },
  bubbleText: { fontFamily: fonts.body.regular, fontSize: 14, lineHeight: 20 },
  bubbleTextSent: { color: '#FFFFFF' },
  bubbleTextReceived: { color: colors.foreground },
  bubbleTime: { fontFamily: fonts.body.regular, fontSize: 11, marginTop: 4 },
  bubbleTimeSent: { color: 'rgba(255,255,255,0.6)', textAlign: 'right' },
  bubbleTimeReceived: { color: colors.muted },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  inputPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 999,
    paddingHorizontal: 16,
    height: 44,
  },
  input: {
    flex: 1,
    fontFamily: fonts.body.regular,
    fontSize: 14,
    color: colors.foreground,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
});
