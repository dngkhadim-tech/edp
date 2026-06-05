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
