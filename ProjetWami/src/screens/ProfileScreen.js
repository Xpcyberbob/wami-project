import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';
import { COLORS } from '../constants/theme';
import { useGamification } from '../contexts/GamificationContext';

export default function ProfileScreen({ navigation }) {
  const { user, logout, updateUser } = useAuth();
  const { points, getLevel, history } = useGamification();
  const level = getLevel();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [avatarUri, setAvatarUri] = useState(null);

  useEffect(() => {
    AsyncStorage.getItem('@avatar_uri').then(uri => {
      if (uri) setAvatarUri(uri);
    });
  }, []);

  const pickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission requise', 'Autorisez l\'accès à la galerie pour choisir une photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      const uri = result.assets[0].uri;
      setAvatarUri(uri);
      await AsyncStorage.setItem('@avatar_uri', uri);
    }
  };

  const handleSave = async () => {
    try {
      await updateUser({ name, email });
      setIsEditing(false);
      Alert.alert('Succès', 'Profil mis à jour avec succès');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de mettre à jour le profil');
    }
  };

  const handleCancel = () => {
    setName(user?.name || '');
    setEmail(user?.email || '');
    setIsEditing(false);
  };

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              console.error('Erreur lors de la déconnexion:', error);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* En-tête du profil */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.avatarContainer} onPress={pickAvatar} activeOpacity={0.7}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
          ) : (
            <Ionicons name="person" size={60} color="#fff" />
          )}
          <View style={styles.avatarEditBadge}>
            <Ionicons name="camera" size={16} color="#fff" />
          </View>
        </TouchableOpacity>
        <Text style={styles.userName}>{user?.name}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
        {/* Badge de rôle */}
        <View style={[
          styles.roleBadge,
          user?.role === 'admin' && { backgroundColor: '#7C3AED20', borderColor: '#7C3AED' },
          user?.role === 'user' && { backgroundColor: '#0077B620', borderColor: '#0077B6' },
          user?.role === 'client' && { backgroundColor: '#10B98120', borderColor: '#10B981' },
        ]}>
          <Text style={[
            styles.roleBadgeText,
            user?.role === 'admin' && { color: '#7C3AED' },
            user?.role === 'user' && { color: '#0077B6' },
            user?.role === 'client' && { color: '#10B981' },
          ]}>
            {user?.role === 'admin' && '👑 Administrateur'}
            {user?.role === 'user' && user?.sellerType === 'pisciculteur' && '🐟 Pisciculteur'}
            {user?.role === 'user' && user?.sellerType === 'fournisseur' && '📦 Fournisseur'}
            {user?.role === 'user' && !user?.sellerType && '🐟 Vendeur'}
            {user?.role === 'client' && '🛒 Acheteur'}
            {!user?.role && '👤 Utilisateur'}
          </Text>
        </View>
      </View>

      {/* Section Gamification */}
      <View style={styles.gamificationSection}>
        <View style={styles.gamificationCard}>
          <View style={styles.gamificationRow}>
            <View style={styles.gamificationItem}>
              <Ionicons name={level.icon} size={32} color={level.color} />
              <Text style={styles.gamificationLabel}>Niveau</Text>
              <Text style={[styles.gamificationValue, { color: level.color }]}>{level.name}</Text>
            </View>
            <View style={styles.gamificationDivider} />
            <View style={styles.gamificationItem}>
              <Ionicons name="star" size={32} color="#f59e0b" />
              <Text style={styles.gamificationLabel}>Points</Text>
              <Text style={[styles.gamificationValue, { color: '#f59e0b' }]}>{points}</Text>
            </View>
            <View style={styles.gamificationDivider} />
            <View style={styles.gamificationItem}>
              <Ionicons name="checkmark-done" size={32} color="#10b981" />
              <Text style={styles.gamificationLabel}>Actions</Text>
              <Text style={[styles.gamificationValue, { color: '#10b981' }]}>{history.length}</Text>
            </View>
          </View>
          {level.next && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${Math.min((points / level.next) * 100, 100)}%`, backgroundColor: level.color }]} />
              </View>
              <Text style={styles.progressText}>{points}/{level.next} pts pour le niveau suivant</Text>
            </View>
          )}
        </View>
      </View>

      {/* Informations du profil */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Informations personnelles</Text>
          {!isEditing && (
            <TouchableOpacity onPress={() => setIsEditing(true)}>
              <Ionicons name="create-outline" size={24} color="#3498DB" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.infoContainer}>
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={20} color="#666" />
            <Text style={styles.infoLabel}>Nom</Text>
          </View>
          {isEditing ? (
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Votre nom"
            />
          ) : (
            <Text style={styles.infoValue}>{user?.name}</Text>
          )}
        </View>

        <View style={styles.infoContainer}>
          <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={20} color="#666" />
            <Text style={styles.infoLabel}>Email</Text>
          </View>
          {isEditing ? (
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Votre email"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          ) : (
            <Text style={styles.infoValue}>{user?.email}</Text>
          )}
        </View>

        <View style={styles.infoContainer}>
          <View style={styles.infoRow}>
            <Ionicons name="shield-checkmark-outline" size={20} color="#666" />
            <Text style={styles.infoLabel}>Rôle</Text>
          </View>
          <Text style={styles.infoValue}>{user?.role || 'Utilisateur'}</Text>
        </View>

        {isEditing && (
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleCancel}
            >
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleSave}
            >
              <Text style={styles.saveButtonText}>Enregistrer</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Paramètres */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Paramètres</Text>

        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Ionicons name="notifications-outline" size={24} color="#666" />
            <Text style={styles.settingText}>Notifications</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Ionicons name="lock-closed-outline" size={24} color="#666" />
            <Text style={styles.settingText}>Changer le mot de passe</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Ionicons name="language-outline" size={24} color="#666" />
            <Text style={styles.settingText}>Langue</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Ionicons name="help-circle-outline" size={24} color="#666" />
            <Text style={styles.settingText}>Aide & Support</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#999" />
        </TouchableOpacity>
      </View>

      {/* Ma Boutique — visible uniquement pour les vendeurs (role = 'user') */}
      {(user?.role === 'user' || user?.role === 'admin') && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Commerce</Text>
          <TouchableOpacity
            style={styles.shopItem}
            onPress={() => navigation.navigate('MaBoutique')}
          >
            <View style={styles.shopLeft}>
              <View style={styles.shopIconContainer}>
                <Ionicons name="storefront" size={24} color={COLORS.primary} />
              </View>
              <View>
                <Text style={styles.shopText}>Ma Boutique</Text>
                <Text style={styles.shopSubtext}>
                  {user?.sellerType === 'fournisseur'
                    ? 'Gérer vos aliments et équipements'
                    : 'Gérer vos poissons et alevins'}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#999" />
          </TouchableOpacity>
        </View>
      )}

      {/* Bouton de déconnexion */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={24} color="#E74C3C" />
        <Text style={styles.logoutText}>Déconnexion</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Version 1.0.1</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.primaryDark,
    paddingVertical: 40,
    alignItems: 'center',
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#0891b2',
    borderRadius: 12,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 10,
  },
  roleBadge: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1.5,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderColor: 'rgba(255,255,255,0.4)',
    marginTop: 4,
  },
  roleBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text.primary,
  },
  infoContainer: {
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginLeft: 8,
  },
  infoValue: {
    fontSize: 16,
    color: COLORS.text.primary,
    marginLeft: 28,
  },
  input: {
    fontSize: 16,
    color: COLORS.text.primary,
    marginLeft: 28,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.primary,
    paddingVertical: 5,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#E0E0E0',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: COLORS.primary,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    fontSize: 16,
    color: COLORS.text.primary,
    marginLeft: 15,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginTop: 20,
    marginHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E74C3C',
  },
  logoutText: {
    fontSize: 16,
    color: '#E74C3C',
    fontWeight: '600',
    marginLeft: 10,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  footerText: {
    fontSize: 14,
    color: '#999',
  },
  shopItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  shopLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shopIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  shopText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  shopSubtext: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginTop: 2,
  },
  gamificationSection: {
    paddingHorizontal: 16,
    marginTop: -10,
  },
  gamificationCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  gamificationRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  gamificationItem: {
    alignItems: 'center',
    flex: 1,
  },
  gamificationLabel: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
    marginTop: 6,
  },
  gamificationValue: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
  },
  gamificationDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e2e8f0',
  },
  progressContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 6,
    fontWeight: '600',
  },
});
