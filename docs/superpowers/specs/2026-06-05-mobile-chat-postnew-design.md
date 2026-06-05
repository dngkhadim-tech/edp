# EDP Mobile — Chat · Post/New Design Spec (P5)

**Date :** 2026-06-05
**Périmètre :** `/chat/[userId].tsx` (conversation), `/post/new.tsx` (nouvelle publication)
**Référence design system :** `docs/superpowers/specs/2026-06-04-edp-design.md`
**Tokens :** `src/constants/theme.ts` + `src/constants/fonts.ts`

---

## 1. Chat — `app/chat/[userId].tsx`

### 1.1 Structure

```
SafeAreaView (bg: colors.background)
  Header (56px, borderBottom colors.border, flexDirection row, alignItems center, px 16, gap 12)
    TouchableOpacity ArrowLeft (20px, colors.muted) → router.back()
    Avatar 36px (expo-image ou fallback initiales)
    View flex 1
      Text nom (fonts.heading.semibold 15, colors.foreground)
    TouchableOpacity MoreHorizontal (20px, colors.muted)

  FlatList messages (flex 1, inverted, contentContainerStyle paddingVertical 16)
    MessageBubble par message

  Input bar (borderTop colors.border, px 16, py 10, flexDirection row, gap 8, bg colors.background)
    View pill (flex 1, bg colors.surface, borderRadius 999, px 16, height 44, flexDirection row, alignItems center)
      TextInput (flex 1, fonts.body.regular 14, colors.foreground, placeholder "Votre message...")
    TouchableOpacity Send (44x44, bg colors.primary, borderRadius 22, alignItems center, justifyContent center)
      Send icon 18px blanc
```

### 1.2 MessageBubble

```
Envoyé (isMe = true) :
  alignSelf 'flex-end'
  bg colors.primary (#E11D48)
  borderRadius: [16, 4, 16, 16] → borderTopLeftRadius 16, borderTopRightRadius 4, borderBottomRightRadius 16, borderBottomLeftRadius 16
  text : fonts.body.regular 14, blanc (#FFFFFF)
  timestamp : fonts.body.regular 11, rgba(255,255,255,0.6), textAlign right

Reçu (isMe = false) :
  alignSelf 'flex-start'
  bg colors.surface (#F9FAFB)
  borderRadius: [4, 16, 16, 16] → borderTopLeftRadius 4, borderTopRightRadius 16, borderBottomRightRadius 16, borderBottomLeftRadius 16
  text : fonts.body.regular 14, colors.foreground
  timestamp : fonts.body.regular 11, colors.muted
```

Padding bulle : `paddingHorizontal 14, paddingVertical 10`
`maxWidth: SCREEN_WIDTH * 0.72`
`marginBottom 4`

### 1.3 Interface Message

```ts
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
  username: string;
  avatar?: string;
}
```

### 1.4 Données

- Query messages : `GET /messages/${userId}` → `{ data: Message[] }`
- Query otherUser : `GET /users/${userId}` → `OtherUser`
- Socket.io : `EXPO_PUBLIC_API_URL/messages`, event `new_message` (receive) + `send_message` (emit)
- `useAuthStore()` pour `user.id` (déterminer isMe)
- Token socket : `storage.getString('edp_access_token')` (MMKV)

### 1.5 FlatList inversée

- `inverted` prop → les messages récents apparaissent en bas
- Data passée dans l'ordre normal (API), FlatList gère le rendu inversé
- Pas de scroll manuel nécessaire avec `inverted`

### 1.6 Envoi

```ts
const sendMessage = () => {
  if (!input.trim() || !socket) return;
  socket.emit('send_message', { receiverId: userId, content: input });
  setMessages((prev) => [
    { id: Date.now().toString(), senderId: user.id, content: input, createdAt: new Date() },
    ...prev, // prepend car inverted
  ]);
  setInput('');
};
```

### 1.7 Fichier et route

- Créer : `apps/mobile/app/chat/[userId].tsx`
- Route : `/chat/[userId]` — déjà référencée dans `messages.tsx`

---

## 2. Post/New — `app/post/new.tsx`

### 2.1 Structure (2 étapes)

```
SafeAreaView (bg: colors.background)
  Header (px 16, py 14, flexDirection row, justifyContent space-between)
    TouchableOpacity "Annuler" (fonts.body.regular 15, colors.muted) → router.back()
    Text "Nouvelle publication" (fonts.heading.bold 17, colors.foreground)
    View (width 70) [placeholder droit pour centrer le titre]

  Indicateur étapes (px 16, mb 16) [barre de progression]
    2 segments : actif = colors.primary, inactif = colors.border, height 3, borderRadius 2

  ScrollView contenu (flex 1)
    [Étape 1 ou Étape 2 selon step]

  Bouton bas (px 16, py 12, borderTop colors.border)
    [Suivant / Publier selon étape]
```

### 2.2 Étape 1 — Média

```
Section type (px 16, mb 20)
  Titre "Type" (fonts.heading.semibold 13, colors.muted, mb 8, uppercase letterSpacing 1)
  Pills horizontales (flexDirection row, gap 8)
    Chaque pill : TouchableOpacity, padding 8 16, borderRadius radius.pill
    Actif : bg colors.primary, text blanc
    Inactif : bg colors.surface, text colors.muted, borderWidth 1, borderColor colors.border
    Options : "Photo" | "Reel" | "Story"

Section média (px 16)
  Si pas de media sélectionné :
    TouchableOpacity zone (aspect ratio 1, borderRadius 16, borderWidth 2, borderStyle 'dashed', borderColor colors.border, bg colors.surface)
      ImagePlus icon 40px, colors.muted
      Text "Appuyer pour choisir" (fonts.body.regular 14, colors.muted, mt 12)
  Si media sélectionné :
    Image preview (aspect ratio 4/5, borderRadius 16, overflow hidden)
      expo-image contentFit="cover"
      TouchableOpacity X en haut-droite (28x28, bg rgba(0,0,0,0.5), borderRadius 14) → removeMedia()
```

Bouton bas : "Suivant →" (bg colors.primary, text blanc, fonts.heading.semibold 15, height 48, borderRadius radius.button)
Désactivé si pas de media sélectionné (opacity 0.4)

### 2.3 Étape 2 — Détails

```
Avatar + Caption (px 16, mb 16, flexDirection row, gap 12)
  Avatar user 40px (expo-image ou initiales)
  TextInput multiline (flex 1, fonts.body.regular 15, colors.foreground, minHeight 80)
    placeholder "Écrivez une légende..."

Section localisation (px 16, mb 16)
  TextInput avec MapPin icon (16px, colors.muted) à gauche
  placeholder "Ajouter un lieu"
  borderBottom 1px colors.border, pb 12

Section hashtags (px 16, mb 16)
  Titre "#" (fonts.heading.bold 16, colors.primary, mr 8) + TextInput inline
  placeholder "Ajouter un hashtag"
  onSubmitEditing → addHashtag()
  Liste pills hashtags (flexWrap wrap, gap 6, mt 8)
    Chaque pill : "#tag" + X button, bg colors.surface, borderRadius radius.pill, px 10 py 4
    X : colors.muted, fontSize 12
```

Bouton bas : "Publier" (bg colors.primary, loading spinner si en cours)

### 2.4 Logique publication

```ts
const handlePublish = async () => {
  if (!mediaUri) return;
  setPublishing(true);
  try {
    const form = new FormData();
    form.append('media', { uri: mediaUri, type: mediaType, name: 'upload' } as any);
    form.append('caption', caption);
    form.append('type', postType);
    if (location) form.append('location', location);
    hashtags.forEach((h) => form.append('hashtags[]', h));
    await api.post('/posts', form, { headers: { 'Content-Type': 'multipart/form-data' } });
    router.replace('/(tabs)/feed');
  } catch {
    // noop — pas de toast MVP
  } finally {
    setPublishing(false);
  }
};
```

### 2.5 Picker

```ts
import * as ImagePicker from 'expo-image-picker';

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
```

### 2.6 État local

```ts
type Step = 'media' | 'details';
type PostType = 'PHOTO' | 'REEL' | 'STORY';

const [step, setStep] = useState<Step>('media');
const [postType, setPostType] = useState<PostType>('PHOTO');
const [mediaUri, setMediaUri] = useState<string | null>(null);
const [mediaType, setMediaType] = useState<string>('image/jpeg');
const [caption, setCaption] = useState('');
const [location, setLocation] = useState('');
const [hashtags, setHashtags] = useState<string[]>([]);
const [hashtagInput, setHashtagInput] = useState('');
const [publishing, setPublishing] = useState(false);
```

### 2.7 Fichier et route

- Créer : `apps/mobile/app/post/new.tsx`
- Route : `/post/new` — référencée dans `(tabs)/_layout.tsx` (bouton +)

---

## 3. Fichiers créés

| Action | Fichier |
|---|---|
| Create | `apps/mobile/app/chat/[userId].tsx` |
| Create | `apps/mobile/app/post/new.tsx` |
