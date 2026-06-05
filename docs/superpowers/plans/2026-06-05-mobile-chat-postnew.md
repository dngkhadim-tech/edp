# Mobile Chat · Post/New Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Créer les deux écrans mobiles manquants : conversation chat temps-réel et création de post (wizard 2 étapes).

**Architecture:** Deux nouveaux fichiers indépendants. `chat/[userId].tsx` utilise socket.io-client (déjà installé) + react-query pour les messages. `post/new.tsx` utilise expo-image-picker (déjà installé) + FormData multipart. Aucun composant partagé — tout co-localisé.

**Tech Stack:** React Native 0.74, Expo 51, expo-image, expo-image-picker, socket.io-client, @tanstack/react-query, lucide-react-native, TypeScript 5.5

---

## File Map

| Action | Fichier | Rôle |
|---|---|---|
| Create | `apps/mobile/app/chat/[userId].tsx` | Conversation temps-réel |
| Create | `apps/mobile/app/post/new.tsx` | Wizard création post 2 étapes |

---

## Task 1 : Chat — `app/chat/[userId].tsx`

**Files:**
- Create: `apps/mobile/app/chat/[userId].tsx`

- [ ] **Step 1 : Créer le répertoire et le fichier**

Créer `apps/mobile/app/chat/[userId].tsx` avec le contenu suivant :

```tsx
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
```

- [ ] **Step 2 : Commit**

```bash
cd /Users/khadimdiongue/edp && git add apps/mobile/app/chat/ && git commit -m "feat(mobile/chat): add real-time conversation screen"
```

---

## Task 2 : Post/New — `app/post/new.tsx`

**Files:**
- Create: `apps/mobile/app/post/new.tsx`

- [ ] **Step 1 : Créer le fichier**

Créer `apps/mobile/app/post/new.tsx` avec le contenu suivant :

```tsx
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { ImagePlus, X, MapPin, Hash } from 'lucide-react-native';
import { api } from '../../src/lib/api';
import { useAuthStore } from '../../src/store/auth.store';
import { getInitials } from '../../src/lib/utils';
import { colors, radius } from '../../src/constants/theme';
import { fonts } from '../../src/constants/fonts';

type Step = 'media' | 'details';
type PostType = 'PHOTO' | 'REEL' | 'STORY';

const POST_TYPES: { value: PostType; label: string }[] = [
  { value: 'PHOTO', label: 'Photo' },
  { value: 'REEL', label: 'Reel' },
  { value: 'STORY', label: 'Story' },
];

export default function NewPostScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [step, setStep] = useState<Step>('media');
  const [postType, setPostType] = useState<PostType>('PHOTO');
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<string>('image/jpeg');
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [hashtagInput, setHashtagInput] = useState('');
  const [publishing, setPublishing] = useState(false);

  const pickMedia = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setMediaUri(result.assets[0].uri);
      setMediaType(result.assets[0].type === 'video' ? 'video/mp4' : 'image/jpeg');
    }
  };

  const removeMedia = () => setMediaUri(null);

  const addHashtag = () => {
    const tag = hashtagInput.trim().replace(/^#/, '');
    if (tag && !hashtags.includes(tag)) setHashtags((prev) => [...prev, tag]);
    setHashtagInput('');
  };

  const removeHashtag = (tag: string) =>
    setHashtags((prev) => prev.filter((h) => h !== tag));

  const handlePublish = async () => {
    if (!mediaUri) return;
    setPublishing(true);
    try {
      const form = new FormData();
      form.append('media', { uri: mediaUri, type: mediaType, name: 'upload' } as unknown as Blob);
      form.append('caption', caption);
      form.append('type', postType);
      if (location) form.append('location', location);
      hashtags.forEach((h) => form.append('hashtags[]', h));
      await api.post('/posts', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      router.replace('/(tabs)/feed');
    } catch {
      // publication silencieuse MVP
    } finally {
      setPublishing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.cancelText}>Annuler</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nouvelle publication</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Progress bar */}
      <View style={styles.progress}>
        <View style={[styles.progressSegment, { backgroundColor: colors.primary }]} />
        <View style={[styles.progressSegment, { backgroundColor: step === 'details' ? colors.primary : colors.border }]} />
      </View>

      <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
        {step === 'media' ? (
          <View style={styles.stepContent}>
            {/* Type pills */}
            <Text style={styles.sectionLabel}>TYPE</Text>
            <View style={styles.pills}>
              {POST_TYPES.map(({ value, label }) => (
                <TouchableOpacity
                  key={value}
                  style={[styles.pill, postType === value && styles.pillActive]}
                  onPress={() => setPostType(value)}
                >
                  <Text style={[styles.pillText, postType === value && styles.pillTextActive]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Media picker */}
            <Text style={styles.sectionLabel}>MÉDIA</Text>
            {mediaUri ? (
              <View style={styles.previewContainer}>
                <Image source={{ uri: mediaUri }} style={styles.preview} contentFit="cover" />
                <TouchableOpacity style={styles.removeBtn} onPress={removeMedia} accessibilityLabel="Supprimer le média">
                  <X size={14} color="#FFFFFF" strokeWidth={2} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.picker} onPress={pickMedia}>
                <ImagePlus size={40} color={colors.muted} strokeWidth={1.5} />
                <Text style={styles.pickerText}>Appuyer pour choisir</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.stepContent}>
            {/* Caption */}
            <View style={styles.captionRow}>
              {user?.avatar ? (
                <Image source={{ uri: user.avatar }} style={styles.userAvatar} contentFit="cover" />
              ) : (
                <View style={[styles.userAvatar, styles.userAvatarFallback]}>
                  <Text style={styles.userAvatarText}>
                    {user ? getInitials(user.firstName, user.lastName) : '?'}
                  </Text>
                </View>
              )}
              <TextInput
                style={styles.captionInput}
                value={caption}
                onChangeText={setCaption}
                placeholder="Écrivez une légende..."
                placeholderTextColor={colors.muted}
                multiline
                maxLength={2200}
              />
            </View>

            {/* Location */}
            <View style={styles.fieldRow}>
              <MapPin size={16} color={colors.muted} strokeWidth={1.5} />
              <TextInput
                style={styles.fieldInput}
                value={location}
                onChangeText={setLocation}
                placeholder="Ajouter un lieu"
                placeholderTextColor={colors.muted}
              />
            </View>

            {/* Hashtags */}
            <View style={styles.fieldRow}>
              <Hash size={16} color={colors.primary} strokeWidth={1.5} />
              <TextInput
                style={styles.fieldInput}
                value={hashtagInput}
                onChangeText={setHashtagInput}
                placeholder="Ajouter un hashtag"
                placeholderTextColor={colors.muted}
                onSubmitEditing={addHashtag}
                returnKeyType="done"
                autoCapitalize="none"
              />
            </View>
            {hashtags.length > 0 && (
              <View style={styles.hashtagList}>
                {hashtags.map((tag) => (
                  <View key={tag} style={styles.hashtagPill}>
                    <Text style={styles.hashtagText}>#{tag}</Text>
                    <TouchableOpacity onPress={() => removeHashtag(tag)} accessibilityLabel={`Supprimer #${tag}`}>
                      <X size={12} color={colors.muted} strokeWidth={2} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.footer}>
        {step === 'media' ? (
          <TouchableOpacity
            style={[styles.cta, !mediaUri && styles.ctaDisabled]}
            onPress={() => setStep('details')}
            disabled={!mediaUri}
          >
            <Text style={styles.ctaText}>Suivant →</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.cta, publishing && styles.ctaDisabled]}
            onPress={handlePublish}
            disabled={publishing}
          >
            {publishing ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.ctaText}>Publier</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  cancelText: { fontFamily: fonts.body.regular, fontSize: 15, color: colors.muted },
  headerTitle: { fontFamily: fonts.heading.bold, fontSize: 17, color: colors.foreground },
  headerRight: { width: 60 },

  progress: { flexDirection: 'row', gap: 4, paddingHorizontal: 16, marginBottom: 16 },
  progressSegment: { flex: 1, height: 3, borderRadius: 2 },

  scroll: { flex: 1 },
  stepContent: { paddingHorizontal: 16, paddingBottom: 24 },

  sectionLabel: {
    fontFamily: fonts.body.medium,
    fontSize: 11,
    color: colors.muted,
    letterSpacing: 1,
    marginBottom: 10,
    marginTop: 8,
  },

  pills: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  pillText: { fontFamily: fonts.body.medium, fontSize: 13, color: colors.muted },
  pillTextActive: { color: '#FFFFFF' },

  picker: {
    aspectRatio: 1,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerText: { fontFamily: fonts.body.regular, fontSize: 14, color: colors.muted, marginTop: 12 },

  previewContainer: { aspectRatio: 4 / 5, borderRadius: 16, overflow: 'hidden' },
  preview: { width: '100%', height: '100%' },
  removeBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  captionRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  userAvatar: { width: 40, height: 40, borderRadius: 20, flexShrink: 0 },
  userAvatarFallback: {
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: { fontFamily: fonts.heading.bold, fontSize: 14, color: colors.primary },
  captionInput: {
    flex: 1,
    fontFamily: fonts.body.regular,
    fontSize: 15,
    color: colors.foreground,
    minHeight: 80,
    textAlignVertical: 'top',
  },

  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 12,
    marginBottom: 16,
  },
  fieldInput: {
    flex: 1,
    fontFamily: fonts.body.regular,
    fontSize: 14,
    color: colors.foreground,
    height: 40,
  },

  hashtagList: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: -8, marginBottom: 16 },
  hashtagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  hashtagText: { fontFamily: fonts.body.regular, fontSize: 13, color: colors.primary },

  footer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  cta: {
    backgroundColor: colors.primary,
    borderRadius: radius.button,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaDisabled: { opacity: 0.4 },
  ctaText: { fontFamily: fonts.heading.semibold, fontSize: 15, color: '#FFFFFF' },
});
```

- [ ] **Step 2 : Commit**

```bash
cd /Users/khadimdiongue/edp && git add apps/mobile/app/post/ && git commit -m "feat(mobile/post): add new post wizard — 2-step, image picker, hashtags"
```
