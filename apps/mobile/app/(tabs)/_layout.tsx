import { Tabs, useRouter } from 'expo-router';
import { TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Compass, Film, User, Plus } from 'lucide-react-native';
import { colors, radius } from '../../src/constants/theme';
import { fonts } from '../../src/constants/fonts';

function PlusButton({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityLabel="Nouvelle publication"
      accessibilityRole="button"
      style={{
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
      }}
    >
      <Plus size={26} color="#FFFFFF" strokeWidth={2.5} />
    </TouchableOpacity>
  );
}

export default function TabsLayout() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 64 + insets.bottom,
          paddingBottom: insets.bottom + 8,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontFamily: fonts.body.regular,
          fontSize: 10,
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="feed"
        options={{
          tabBarLabel: 'Accueil',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} strokeWidth={1.5} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          tabBarLabel: 'Découvrir',
          tabBarIcon: ({ color, size }) => <Compass color={color} size={size} strokeWidth={1.5} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          href: null,
          tabBarButton: () => <PlusButton onPress={() => router.push('/post/new')} />,
          tabBarLabel: () => null,
        }}
      />
      <Tabs.Screen
        name="reels"
        options={{
          tabBarLabel: 'Reels',
          tabBarIcon: ({ color, size }) => <Film color={color} size={size} strokeWidth={1.5} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarLabel: 'Profil',
          tabBarIcon: ({ color, size }) => <User color={color} size={size} strokeWidth={1.5} />,
        }}
      />
    </Tabs>
  );
}
