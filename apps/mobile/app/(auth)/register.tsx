import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/auth.store';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RegisterScreen() {
  const router = useRouter();
  const { register: registerUser, isLoading } = useAuthStore();
  const [form, setForm] = useState({
    firstName: '', lastName: '', username: '', email: '', password: '', isEstablishment: false,
  });

  const handleRegister = async () => {
    if (!form.email || !form.password || !form.username || !form.firstName) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }
    if (form.password.length < 8) {
      Alert.alert('Erreur', 'Le mot de passe doit avoir au moins 8 caractères');
      return;
    }
    try {
      await registerUser(form);
      router.replace('/(tabs)/feed');
    } catch (err: any) {
      Alert.alert('Erreur', err?.response?.data?.message || 'Erreur lors de l\'inscription');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.logo}>EDP</Text>
            <Text style={styles.tagline}>Créer votre compte</Text>
          </View>

          <View style={styles.toggle}>
            <TouchableOpacity
              style={[styles.toggleBtn, !form.isEstablishment && styles.toggleBtnActive]}
              onPress={() => setForm({ ...form, isEstablishment: false })}
            >
              <Text style={[styles.toggleText, !form.isEstablishment && styles.toggleTextActive]}>
                Utilisateur
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, form.isEstablishment && styles.toggleBtnActive]}
              onPress={() => setForm({ ...form, isEstablishment: true })}
            >
              <Text style={[styles.toggleText, form.isEstablishment && styles.toggleTextActive]}>
                Établissement
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            <View style={styles.row}>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.label}>Prénom *</Text>
                <TextInput
                  style={styles.input}
                  value={form.firstName}
                  onChangeText={(v) => setForm({ ...form, firstName: v })}
                  placeholder="Jean"
                  placeholderTextColor="#555"
                />
              </View>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.label}>Nom *</Text>
                <TextInput
                  style={styles.input}
                  value={form.lastName}
                  onChangeText={(v) => setForm({ ...form, lastName: v })}
                  placeholder="Dupont"
                  placeholderTextColor="#555"
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Nom d'utilisateur *</Text>
              <TextInput
                style={styles.input}
                value={form.username}
                onChangeText={(v) => setForm({ ...form, username: v.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                placeholder="jean_dupont"
                placeholderTextColor="#555"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Email *</Text>
              <TextInput
                style={styles.input}
                value={form.email}
                onChangeText={(v) => setForm({ ...form, email: v })}
                placeholder="jean@exemple.com"
                placeholderTextColor="#555"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Mot de passe *</Text>
              <TextInput
                style={styles.input}
                value={form.password}
                onChangeText={(v) => setForm({ ...form, password: v })}
                placeholder="••••••••"
                placeholderTextColor="#555"
                secureTextEntry
              />
              <Text style={styles.hint}>Minimum 8 caractères</Text>
            </View>

            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#0A0A0A" />
              ) : (
                <Text style={styles.buttonText}>Créer mon compte</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Déjà un compte ? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Text style={styles.link}>Se connecter</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  content: { flexGrow: 1, padding: 24 },
  header: { alignItems: 'center', marginVertical: 24 },
  logo: { fontSize: 40, fontWeight: '800', color: '#C9A84C', letterSpacing: 4 },
  tagline: { color: '#888', fontSize: 16, marginTop: 4 },
  toggle: { flexDirection: 'row', backgroundColor: '#1A1A1A', borderRadius: 12, padding: 4, marginBottom: 24 },
  toggleBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  toggleBtnActive: { backgroundColor: '#C9A84C' },
  toggleText: { color: '#666', fontWeight: '600', fontSize: 14 },
  toggleTextActive: { color: '#0A0A0A' },
  form: { gap: 16 },
  row: { flexDirection: 'row', gap: 12 },
  field: { gap: 6 },
  label: { color: '#ccc', fontSize: 13, fontWeight: '500' },
  input: { backgroundColor: '#1A1A1A', borderRadius: 12, padding: 14, color: '#fff', fontSize: 15, borderWidth: 1, borderColor: '#2A2A2A' },
  hint: { color: '#555', fontSize: 11, marginTop: 2 },
  button: { backgroundColor: '#C9A84C', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#0A0A0A', fontWeight: '700', fontSize: 16 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24, paddingBottom: 24 },
  footerText: { color: '#888', fontSize: 14 },
  link: { color: '#C9A84C', fontSize: 14, fontWeight: '600' },
});
