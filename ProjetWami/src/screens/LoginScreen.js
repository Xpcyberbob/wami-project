import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
  Modal, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';

// ─── Comptes pré-définis (toujours role + sellerType) ───────────────────────
const AUTHORIZED_USERS = [
  { email: 'admin@wami.com', password: 'wami2024', name: 'Administrateur', role: 'admin', sellerType: null },
  { email: 'demo@wami.com', password: 'demo123', name: 'Utilisateur Démo', role: 'user', sellerType: 'pisciculteur' },
  { email: 'pisciculteur@wami.com', password: 'pisciculture2024', name: 'Pisciculteur', role: 'user', sellerType: 'pisciculteur' },
  { email: 'fournisseur@wami.com', password: 'fourni2024', name: 'Fournisseur WAMI', role: 'user', sellerType: 'fournisseur' },
  { email: 'acheteur@wami.com', password: 'acheteur123', name: 'Acheteur Test', role: 'client', sellerType: null },
];

// Comptes créés en cours de session (reset à chaque relance)
let SESSION_USERS = [];

// ─── Types de compte pour l'inscription ─────────────────────────────────────
const ACCOUNT_TYPES = [
  {
    id: 'pisciculteur',
    label: 'Pisciculteur',
    icon: '🐟',
    desc: 'Je vends des poissons et des alevins',
    role: 'user',
    sellerType: 'pisciculteur',
  },
  {
    id: 'fournisseur',
    label: 'Fournisseur',
    icon: '📦',
    desc: 'Je fournis aliments, équipements, etc.',
    role: 'user',
    sellerType: 'fournisseur',
  },
  {
    id: 'acheteur',
    label: 'Acheteur',
    icon: '🛒',
    desc: 'Je cherche des produits piscicoles',
    role: 'client',
    sellerType: null,
  },
];

export default function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [locked, setLocked] = useState(false);

  // Modal inscription
  const [showSignup, setShowSignup] = useState(false);
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regShowPwd, setRegShowPwd] = useState(false);
  const [regType, setRegType] = useState(null); // id du type choisi
  const [regLoading, setRegLoading] = useState(false);

  // ─── Connexion ─────────────────────────────────────────────────────────────
  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs'); return;
    }
    if (!email.includes('@')) {
      Alert.alert('Erreur', 'Veuillez entrer une adresse email valide'); return;
    }
    if (locked) {
      Alert.alert('Compte verrouillé', 'Trop de tentatives. Veuillez patienter 1 minute.'); return;
    }
    setLoading(true);
    try {
      await new Promise(r => setTimeout(r, 800));
      const allUsers = [...AUTHORIZED_USERS, ...SESSION_USERS];
      const user = allUsers.find(
        u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
      );
      if (!user) {
        const n = attempts + 1;
        setAttempts(n);
        if (n >= 5) {
          setLocked(true);
          setTimeout(() => { setLocked(false); setAttempts(0); }, 60000);
          Alert.alert('Compte verrouillé', 'Trop de tentatives. Réessayez dans 1 minute.');
        } else {
          Alert.alert('Identifiants incorrects', `Email ou mot de passe invalide. Tentative ${n}/5.`);
        }
        return;
      }
      onLogin({
        email: user.email,
        name: user.name,
        role: user.role,
        sellerType: user.sellerType,
        token: 'wami-token-' + Date.now(),
        loginTime: new Date().toISOString(),
      });
    } catch {
      Alert.alert('Erreur', 'Échec de la connexion. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Inscription ───────────────────────────────────────────────────────────
  const handleSignup = async () => {
    if (!regName.trim() || !regEmail.trim() || !regPassword.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs'); return;
    }
    if (!regEmail.includes('@')) {
      Alert.alert('Erreur', 'Email invalide'); return;
    }
    if (regPassword.length < 6) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères'); return;
    }
    if (!regType) {
      Alert.alert('Erreur', 'Veuillez choisir votre type de compte'); return;
    }
    const exists = [...AUTHORIZED_USERS, ...SESSION_USERS].find(
      u => u.email.toLowerCase() === regEmail.toLowerCase()
    );
    if (exists) {
      Alert.alert('Erreur', 'Cet email est déjà utilisé'); return;
    }

    setRegLoading(true);
    await new Promise(r => setTimeout(r, 600));

    const chosen = ACCOUNT_TYPES.find(t => t.id === regType);
    const newUser = {
      email: regEmail.trim().toLowerCase(),
      password: regPassword,
      name: regName.trim(),
      role: chosen.role,
      sellerType: chosen.sellerType,
    };
    SESSION_USERS.push(newUser);

    setRegLoading(false);
    setShowSignup(false);

    onLogin({
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      sellerType: newUser.sellerType,
      token: 'wami-token-' + Date.now(),
      loginTime: new Date().toISOString(),
    });
  };

  const resetSignup = () => {
    setRegName(''); setRegEmail(''); setRegPassword('');
    setRegShowPwd(false); setRegType(null);
    setShowSignup(false);
  };

  // ─── Rendu ─────────────────────────────────────────────────────────────────
  return (
    <LinearGradient colors={COLORS.gradients.header} style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <View style={styles.content}>
          {/* Logo */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Ionicons name="fish" size={60} color="#fff" />
            </View>
            <Text style={styles.title}>WAMI Pisciculture</Text>
            <Text style={styles.subtitle}>Gestion intelligente de votre ferme</Text>
          </View>

          {/* Formulaire */}
          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input} placeholder="Email" placeholderTextColor="#999"
                value={email} onChangeText={setEmail}
                keyboardType="email-address" autoCapitalize="none" autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input} placeholder="Mot de passe" placeholderTextColor="#999"
                value={password} onChangeText={setPassword}
                secureTextEntry={!showPassword} autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color="#666" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Mot de passe oublié ?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              onPress={handleLogin} disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.loginButtonText}>Se connecter</Text>
              }
            </TouchableOpacity>
          </View>

          {/* Bas de page */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Pas encore de compte ?</Text>
            <TouchableOpacity onPress={() => setShowSignup(true)}>
              <Text style={styles.signupText}> S'inscrire</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* ─── Modal inscription ─── */}
      <Modal visible={showSignup} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            {/* Header modal */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Créer un compte</Text>
              <TouchableOpacity onPress={resetSignup}>
                <Ionicons name="close-circle" size={28} color="#999" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {/* Champs */}
              <View style={styles.regInput}>
                <Ionicons name="person-outline" size={18} color="#666" />
                <TextInput
                  style={styles.regTextInput} placeholder="Nom complet"
                  placeholderTextColor="#999" value={regName} onChangeText={setRegName}
                />
              </View>

              <View style={styles.regInput}>
                <Ionicons name="mail-outline" size={18} color="#666" />
                <TextInput
                  style={styles.regTextInput} placeholder="Email"
                  placeholderTextColor="#999" value={regEmail} onChangeText={setRegEmail}
                  keyboardType="email-address" autoCapitalize="none"
                />
              </View>

              <View style={styles.regInput}>
                <Ionicons name="lock-closed-outline" size={18} color="#666" />
                <TextInput
                  style={styles.regTextInput} placeholder="Mot de passe (6 caractères min.)"
                  placeholderTextColor="#999" value={regPassword} onChangeText={setRegPassword}
                  secureTextEntry={!regShowPwd} autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setRegShowPwd(!regShowPwd)}>
                  <Ionicons name={regShowPwd ? 'eye-outline' : 'eye-off-outline'} size={18} color="#999" />
                </TouchableOpacity>
              </View>

              {/* Choix du type */}
              <Text style={styles.typeLabel}>Je suis...</Text>
              {ACCOUNT_TYPES.map(t => (
                <TouchableOpacity
                  key={t.id}
                  style={[styles.typeCard, regType === t.id && styles.typeCardActive]}
                  onPress={() => setRegType(t.id)}
                >
                  <Text style={styles.typeEmoji}>{t.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.typeCardTitle, regType === t.id && { color: COLORS.primary }]}>
                      {t.label}
                    </Text>
                    <Text style={styles.typeCardDesc}>{t.desc}</Text>
                  </View>
                  {regType === t.id && (
                    <Ionicons name="checkmark-circle" size={22} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              ))}

              {/* Bouton créer */}
              <TouchableOpacity
                style={[styles.regButton, regLoading && { opacity: 0.6 }]}
                onPress={handleSignup} disabled={regLoading}
              >
                {regLoading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.regButtonText}>Créer mon compte</Text>
                }
              </TouchableOpacity>

              <View style={{ height: 20 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 30 },

  header: { alignItems: 'center', marginBottom: 50 },
  logoContainer: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center', marginBottom: 20,
  },
  title: { fontSize: 32, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  subtitle: { fontSize: 16, color: 'rgba(255,255,255,0.9)' },

  formContainer: {
    backgroundColor: '#fff', borderRadius: 20, padding: 25,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 4.65, elevation: 8,
  },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F5F5F5', borderRadius: 12,
    marginBottom: 15, paddingHorizontal: 15, height: 55,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: '#333' },
  eyeIcon: { padding: 5 },
  forgotPassword: { alignSelf: 'flex-end', marginBottom: 20 },
  forgotPasswordText: { color: COLORS.primary, fontSize: 14 },
  loginButton: {
    backgroundColor: COLORS.primary, borderRadius: 12, height: 55,
    justifyContent: 'center', alignItems: 'center', marginBottom: 20,
  },
  loginButtonDisabled: { opacity: 0.6 },
  loginButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },

  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 30 },
  footerText: { color: '#fff', fontSize: 16 },
  signupText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  // Modal inscription
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    maxHeight: '90%', paddingBottom: 10,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, borderBottomWidth: 1, borderBottomColor: '#F0F4F8',
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#1E293B' },

  regInput: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#F5F7FA', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    marginHorizontal: 20, marginTop: 14,
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  regTextInput: { flex: 1, fontSize: 15, color: '#333' },

  typeLabel: {
    fontSize: 15, fontWeight: '700', color: '#475569',
    marginHorizontal: 20, marginTop: 20, marginBottom: 8,
  },
  typeCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: 20, marginBottom: 10,
    backgroundColor: '#F8FAFC', borderRadius: 14,
    padding: 14, borderWidth: 2, borderColor: '#E2E8F0',
  },
  typeCardActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '0D' },
  typeEmoji: { fontSize: 28 },
  typeCardTitle: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  typeCardDesc: { fontSize: 12, color: '#94A3B8', marginTop: 2 },

  regButton: {
    backgroundColor: COLORS.primary, borderRadius: 14, height: 52,
    justifyContent: 'center', alignItems: 'center',
    marginHorizontal: 20, marginTop: 20,
  },
  regButtonText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
