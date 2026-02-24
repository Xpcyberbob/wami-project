import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import TopographicWaterMap from '../components/TopographicWaterMap';
import { getServoStatus, startServo, stopServo, emergencyStop, pingBackend } from '../services/robotService';
import { useRobot } from '../contexts/RobotContext';

export default function RobotControlScreen({ openAssistant }) {
  const { robots, activeRobot, selectRobot, addRobot, removeRobot, updateRobot } = useRobot();
  const [robotModalVisible, setRobotModalVisible] = useState(false);
  const [addRobotModalVisible, setAddRobotModalVisible] = useState(false);
  const [newRobotName, setNewRobotName] = useState('');
  const [newRobotBassin, setNewRobotBassin] = useState('');
  const [robotStatus, setRobotStatus] = useState({
    connected: false,
    battery: 85,
    mode: 'surveillance',
    depth: 1.2,
    speed: 'medium',
  });

  const [autoMode, setAutoMode] = useState(false);
  const [cameraActive, setCameraActive] = useState(true);
  const [lightsOn, setLightsOn] = useState(false);

  // État réel du servo (depuis le backend)
  const [servoActive, setServoActive] = useState(false);
  const [servoLoading, setServoLoading] = useState(false);
  const [backendOnline, setBackendOnline] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const pollRef = useRef(null);

  // Position du robot (simulation de mouvement)
  const [robotPosition, setRobotPosition] = useState({ x: 50, y: 50 });

  // Zones de qualité d'eau
  const waterZones = [
    { x: 10, y: 10, width: 30, height: 30, color: '#10b981', quality: 'Excellente' },
    { x: 60, y: 10, width: 30, height: 30, color: '#f59e0b', quality: 'Moyenne' },
    { x: 10, y: 60, width: 30, height: 30, color: '#3b82f6', quality: 'Bonne' },
    { x: 60, y: 60, width: 30, height: 30, color: '#10b981', quality: 'Excellente' },
  ];

  // Polling de l'état réel du servo depuis le backend
  const refreshServoStatus = useCallback(async () => {
    try {
      const data = await getServoStatus();
      setServoActive(!!data.is_active);
      setLastUpdate(data.updated_at);
      setBackendOnline(true);
      setRobotStatus(prev => ({ ...prev, connected: true }));
    } catch (err) {
      setBackendOnline(false);
      setRobotStatus(prev => ({ ...prev, connected: false }));
    }
  }, []);

  useEffect(() => {
    refreshServoStatus();
    pollRef.current = setInterval(refreshServoStatus, 2000);
    return () => clearInterval(pollRef.current);
  }, [refreshServoStatus]);

  // Activer le servo réel
  const handleStartServo = async () => {
    setServoLoading(true);
    try {
      await startServo();
      await refreshServoStatus();
    } catch (err) {
      Alert.alert('Erreur', 'Impossible d\'activer le servo. Vérifiez la connexion au backend.');
    } finally {
      setServoLoading(false);
    }
  };

  // Désactiver le servo réel
  const handleStopServo = async () => {
    setServoLoading(true);
    try {
      await stopServo();
      await refreshServoStatus();
    } catch (err) {
      Alert.alert('Erreur', 'Impossible de désactiver le servo. Vérifiez la connexion au backend.');
    } finally {
      setServoLoading(false);
    }
  };

  // Simulation du mouvement du robot
  useEffect(() => {
    if (autoMode && servoActive) {
      const interval = setInterval(() => {
        setRobotPosition(prev => ({
          x: Math.max(10, Math.min(90, prev.x + (Math.random() - 0.5) * 5)),
          y: Math.max(10, Math.min(90, prev.y + (Math.random() - 0.5) * 5)),
        }));
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [autoMode, servoActive]);

  const modes = [
    { id: 'surveillance', name: 'Surveillance', icon: 'eye', color: '#0891b2' },
    { id: 'inspection', name: 'Inspection', icon: 'search', color: '#8b5cf6' },
    { id: 'cleaning', name: 'Nettoyage', icon: 'brush', color: '#10b981' },
    { id: 'feeding', name: 'Alimentation', icon: 'nutrition', color: '#f59e0b' },
  ];

  const handleDirectionPress = (direction) => {
    // Déplacer le robot sur la carte
    setRobotPosition(prev => {
      let newPos = { ...prev };
      const step = 5;

      switch (direction) {
        case 'haut':
          newPos.y = Math.max(5, prev.y - step);
          break;
        case 'bas':
          newPos.y = Math.min(95, prev.y + step);
          break;
        case 'gauche':
          newPos.x = Math.max(5, prev.x - step);
          break;
        case 'droite':
          newPos.x = Math.min(95, prev.x + step);
          break;
      }

      return newPos;
    });
    // Ici, vous enverriez la commande au robot via API/WebSocket
  };

  const handleModeChange = (mode) => {
    setRobotStatus({ ...robotStatus, mode });
    Alert.alert('Mode changé', `Robot en mode ${mode}`);
  };

  const handleEmergencyStop = () => {
    Alert.alert(
      'Arrêt d\'urgence',
      'Voulez-vous vraiment arrêter le robot?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Arrêter',
          style: 'destructive',
          onPress: async () => {
            try {
              await emergencyStop();
              await refreshServoStatus();
              Alert.alert('Robot arrêté', 'Le servo a été désactivé en toute sécurité.');
            } catch (err) {
              Alert.alert('Erreur', 'Impossible d\'envoyer l\'arrêt d\'urgence.');
            }
          },
        },
      ]
    );
  };

  const getBatteryColor = (level) => {
    if (level > 50) return '#10b981';
    if (level > 20) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={['#0B5394', '#3498DB']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.iconHeader}>
            <MaterialCommunityIcons name="robot-outline" size={64} color="#ffffff" />
          </View>
          <Text style={styles.headerTitle}>Contrôle Robot</Text>
          <Text style={styles.headerSubtitle}>Pilotage du robot poisson</Text>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {/* Sélecteur de robot */}
        <TouchableOpacity
          style={styles.robotSelectorCard}
          onPress={() => setRobotModalVisible(true)}
          activeOpacity={0.7}
        >
          <View style={styles.robotSelectorLeft}>
            <MaterialCommunityIcons name="robot" size={28} color="#0B5394" />
            <View style={styles.robotSelectorInfo}>
              <Text style={styles.robotSelectorName}>{activeRobot?.name}</Text>
              <Text style={styles.robotSelectorBassin}>{activeRobot?.bassin}</Text>
            </View>
          </View>
          <View style={styles.robotSelectorRight}>
            <View style={styles.robotCountBadge}>
              <Text style={styles.robotCountText}>{robots.length}</Text>
            </View>
            <Ionicons name="chevron-down" size={20} color="#64748b" />
          </View>
        </TouchableOpacity>

        {/* Section Contrôle Servo Réel */}
        <View style={styles.servoCard}>
          <View style={styles.servoHeader}>
            <View style={styles.servoStatusRow}>
              <View style={[styles.statusDot, { backgroundColor: backendOnline ? '#10b981' : '#ef4444' }]} />
              <Text style={styles.servoStatusLabel}>
                {backendOnline ? 'Connecté' : 'Hors ligne'}
              </Text>
            </View>
            <View style={styles.servoStatusRow}>
              <View style={[styles.statusDot, { backgroundColor: servoActive ? '#10b981' : '#94a3b8' }]} />
              <Text style={[styles.servoStatusLabel, { fontWeight: '700' }]}>
                Servo: {servoActive ? 'ACTIF' : 'INACTIF'}
              </Text>
            </View>
          </View>

          <View style={styles.servoButtons}>
            <TouchableOpacity
              style={[styles.servoBtn, styles.servoBtnStart, servoActive && styles.servoBtnDisabled]}
              onPress={handleStartServo}
              disabled={servoLoading || servoActive}
            >
              {servoLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="play-circle" size={22} color="#fff" />
                  <Text style={styles.servoBtnText}>Activer</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.servoBtn, styles.servoBtnStop, !servoActive && styles.servoBtnDisabled]}
              onPress={handleStopServo}
              disabled={servoLoading || !servoActive}
            >
              {servoLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="stop-circle" size={22} color="#fff" />
                  <Text style={styles.servoBtnText}>Désactiver</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {lastUpdate && (
            <Text style={styles.servoLastUpdate}>
              Dernière mise à jour: {new Date(lastUpdate).toLocaleTimeString()}
            </Text>
          )}
        </View>

        {/* Section Carte + Contrôles */}
        <View style={styles.mapControlSection}>
          <Text style={styles.sectionTitle}>Position du Robot</Text>

          {/* Cartographie Topographique */}
          <TopographicWaterMap robotPosition={robotPosition} zones={waterZones} />

          {/* Contrôles directionnels - Juste en bas de la carte */}
          <Text style={styles.controlsTitle}>Diriger le robot</Text>
          <View style={styles.controlsContainer}>
            <View style={styles.controlsRow}>
              <View style={styles.controlSpacer} />
              <TouchableOpacity
                style={styles.directionButton}
                onPress={() => handleDirectionPress('haut')}
              >
                <Ionicons name="arrow-up" size={32} color="#ffffff" />
              </TouchableOpacity>
              <View style={styles.controlSpacer} />
            </View>

            <View style={styles.controlsRow}>
              <TouchableOpacity
                style={styles.directionButton}
                onPress={() => handleDirectionPress('gauche')}
              >
                <Ionicons name="arrow-back" size={32} color="#ffffff" />
              </TouchableOpacity>
              <View style={styles.centerButton}>
                <Ionicons name="radio-button-on" size={48} color="#3b82f6" />
              </View>
              <TouchableOpacity
                style={styles.directionButton}
                onPress={() => handleDirectionPress('droite')}
              >
                <Ionicons name="arrow-forward" size={32} color="#ffffff" />
              </TouchableOpacity>
            </View>

            <View style={styles.controlsRow}>
              <View style={styles.controlSpacer} />
              <TouchableOpacity
                style={styles.directionButton}
                onPress={() => handleDirectionPress('bas')}
              >
                <Ionicons name="arrow-down" size={32} color="#ffffff" />
              </TouchableOpacity>
              <View style={styles.controlSpacer} />
            </View>
          </View>
        </View>

        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View style={styles.statusIndicatorContainer}>
              <View style={[styles.statusDot, { backgroundColor: robotStatus.connected ? '#10b981' : '#ef4444' }]} />
              <Text style={styles.statusText}>
                {robotStatus.connected ? 'Connecté' : 'Déconnecté'}
              </Text>
            </View>
            <View style={styles.batteryContainer}>
              <Ionicons name="battery-charging" size={20} color={getBatteryColor(robotStatus.battery)} />
              <Text style={[styles.batteryText, { color: getBatteryColor(robotStatus.battery) }]}>
                {robotStatus.battery}%
              </Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="speedometer" size={24} color="#64748b" />
              <Text style={styles.statLabel}>Vitesse</Text>
              <Text style={styles.statValue}>{robotStatus.speed}</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="arrow-down" size={24} color="#64748b" />
              <Text style={styles.statLabel}>Profondeur</Text>
              <Text style={styles.statValue}>{robotStatus.depth}m</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="navigate" size={24} color="#64748b" />
              <Text style={styles.statLabel}>Mode</Text>
              <Text style={styles.statValue}>{robotStatus.mode}</Text>
            </View>
          </View>
        </View>

        {/* Mode Selection */}
        <Text style={styles.sectionTitle}>Mode de fonctionnement</Text>
        <View style={styles.modesContainer}>
          {modes.map((mode) => (
            <TouchableOpacity
              key={mode.id}
              style={[
                styles.modeButton,
                robotStatus.mode === mode.id && { backgroundColor: mode.color + '20', borderColor: mode.color },
              ]}
              onPress={() => handleModeChange(mode.id)}
            >
              <Ionicons
                name={mode.icon}
                size={28}
                color={robotStatus.mode === mode.id ? mode.color : '#64748b'}
              />
              <Text
                style={[
                  styles.modeText,
                  robotStatus.mode === mode.id && { color: mode.color, fontWeight: 'bold' },
                ]}
              >
                {mode.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>


        {/* Settings */}
        <Text style={styles.sectionTitle}>Paramètres</Text>
        <View style={styles.settingsCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="sync" size={24} color="#64748b" />
              <Text style={styles.settingLabel}>Mode automatique</Text>
            </View>
            <Switch
              value={autoMode}
              onValueChange={setAutoMode}
              trackColor={{ false: '#cbd5e1', true: '#7dd3fc' }}
              thumbColor={autoMode ? '#0891b2' : '#f1f5f9'}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="camera" size={24} color="#64748b" />
              <Text style={styles.settingLabel}>Caméra</Text>
            </View>
            <Switch
              value={cameraActive}
              onValueChange={setCameraActive}
              trackColor={{ false: '#cbd5e1', true: '#7dd3fc' }}
              thumbColor={cameraActive ? '#0891b2' : '#f1f5f9'}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="flashlight" size={24} color="#64748b" />
              <Text style={styles.settingLabel}>Éclairage</Text>
            </View>
            <Switch
              value={lightsOn}
              onValueChange={setLightsOn}
              trackColor={{ false: '#cbd5e1', true: '#7dd3fc' }}
              thumbColor={lightsOn ? '#0891b2' : '#f1f5f9'}
            />
          </View>
        </View>

        {/* Camera View Placeholder */}
        {cameraActive && (
          <View style={styles.cameraView}>
            <Ionicons name="videocam" size={48} color="#64748b" />
            <Text style={styles.cameraText}>Vue caméra du robot</Text>
            <Text style={styles.cameraSubtext}>
              La vidéo en direct s'affichera ici
            </Text>
          </View>
        )}

        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color="#0891b2" />
          <Text style={styles.infoText}>
            Le robot collecte des données en temps réel sur la qualité de l'eau et l'état du bassin.
          </Text>
        </View>
      </View>

      {/* Modal Sélection de Robot */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={robotModalVisible}
        onRequestClose={() => setRobotModalVisible(false)}
      >
        <View style={styles.rmOverlay}>
          <View style={styles.rmContent}>
            <View style={styles.rmHeader}>
              <Text style={styles.rmTitle}>Mes Robots</Text>
              <TouchableOpacity onPress={() => setRobotModalVisible(false)}>
                <Ionicons name="close-circle" size={28} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.rmList}>
              {robots.map(robot => (
                <TouchableOpacity
                  key={robot.id}
                  style={[styles.rmItem, robot.id === activeRobot?.id && styles.rmItemActive]}
                  onPress={() => {
                    selectRobot(robot.id);
                    setRobotModalVisible(false);
                  }}
                >
                  <View style={styles.rmItemLeft}>
                    <MaterialCommunityIcons name="robot" size={28} color={robot.id === activeRobot?.id ? '#0B5394' : '#94a3b8'} />
                    <View>
                      <Text style={styles.rmItemName}>{robot.name}</Text>
                      <Text style={styles.rmItemBassin}>{robot.bassin}</Text>
                    </View>
                  </View>
                  {robot.id === activeRobot?.id && (
                    <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                  )}
                  {robot.id !== activeRobot?.id && robots.length > 1 && (
                    <TouchableOpacity
                      onPress={() => {
                        Alert.alert('Supprimer', `Supprimer ${robot.name} ?`, [
                          { text: 'Annuler', style: 'cancel' },
                          { text: 'Supprimer', style: 'destructive', onPress: () => removeRobot(robot.id) },
                        ]);
                      }}
                    >
                      <Ionicons name="trash-outline" size={20} color="#ef4444" />
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.rmAddButton}
              onPress={() => {
                setRobotModalVisible(false);
                setNewRobotName('');
                setNewRobotBassin('');
                setAddRobotModalVisible(true);
              }}
            >
              <Ionicons name="add-circle" size={22} color="#ffffff" />
              <Text style={styles.rmAddButtonText}>Ajouter un robot</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Ajout de Robot */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={addRobotModalVisible}
        onRequestClose={() => setAddRobotModalVisible(false)}
      >
        <View style={styles.rmOverlay}>
          <View style={styles.rmContent}>
            <View style={styles.rmHeader}>
              <Text style={styles.rmTitle}>Nouveau Robot</Text>
              <TouchableOpacity onPress={() => setAddRobotModalVisible(false)}>
                <Ionicons name="close-circle" size={28} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View style={{ padding: 20 }}>
              <Text style={styles.rmInputLabel}>Nom du robot</Text>
              <TextInput
                style={styles.rmInput}
                placeholder="Ex: Robot Wami 2"
                value={newRobotName}
                onChangeText={setNewRobotName}
              />

              <Text style={styles.rmInputLabel}>Bassin associé</Text>
              <TextInput
                style={styles.rmInput}
                placeholder="Ex: Bassin Nord"
                value={newRobotBassin}
                onChangeText={setNewRobotBassin}
              />

              <TouchableOpacity
                style={[styles.rmAddButton, (!newRobotName.trim() || !newRobotBassin.trim()) && { opacity: 0.5 }]}
                disabled={!newRobotName.trim() || !newRobotBassin.trim()}
                onPress={() => {
                  addRobot(newRobotName.trim(), newRobotBassin.trim());
                  setAddRobotModalVisible(false);
                  Alert.alert('Robot ajouté', `${newRobotName} a été enregistré pour ${newRobotBassin}.`);
                }}
              >
                <Ionicons name="checkmark-circle" size={22} color="#ffffff" />
                <Text style={styles.rmAddButtonText}>Enregistrer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  header: {
    padding: 20,
    paddingTop: 15,
    paddingBottom: 35,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  headerContent: {
    paddingTop: 5,
    alignItems: 'center',
  },
  iconHeader: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 6,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#dbeafe',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  content: {
    padding: 20,
  },
  mapControlSection: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  statusCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  statusIndicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  batteryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  batteryText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 8,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 15,
    marginTop: 10,
  },
  modesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modeButton: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  modeText: {
    marginTop: 8,
    fontSize: 14,
    color: '#64748b',
  },
  controlsTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748b',
    textAlign: 'center',
    marginTop: 15,
    marginBottom: 5,
  },
  controlsContainer: {
    paddingVertical: 15,
    alignItems: 'center',
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 8,
  },
  directionButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 12,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  centerButton: {
    width: 64,
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  controlSpacer: {
    width: 64,
    marginHorizontal: 12,
  },
  depthControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  depthButton: {
    alignItems: 'center',
  },
  depthButtonText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#0891b2',
  },
  settingsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 15,
    marginBottom: 20,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 16,
    color: '#1e293b',
    marginLeft: 12,
  },
  cameraView: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    marginBottom: 20,
    minHeight: 200,
    justifyContent: 'center',
  },
  cameraText: {
    fontSize: 16,
    color: '#ffffff',
    marginTop: 12,
    fontWeight: '600',
  },
  cameraSubtext: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 4,
  },
  emergencyButton: {
    backgroundColor: '#ef4444',
    borderRadius: 12,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  emergencyButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#e0f2fe',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 13,
    color: '#0c4a6e',
    lineHeight: 18,
  },
  servoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 2,
    borderColor: '#e0f2fe',
  },
  servoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  servoStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  servoStatusLabel: {
    fontSize: 14,
    color: '#1e293b',
    marginLeft: 6,
  },
  servoButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  servoBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  servoBtnStart: {
    backgroundColor: '#10b981',
  },
  servoBtnStop: {
    backgroundColor: '#ef4444',
  },
  servoBtnDisabled: {
    opacity: 0.4,
  },
  servoBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  servoLastUpdate: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 12,
  },
  robotSelectorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  robotSelectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  robotSelectorInfo: {},
  robotSelectorName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
  },
  robotSelectorBassin: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  robotSelectorRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  robotCountBadge: {
    backgroundColor: '#0B5394',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  robotCountText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  rmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  rmContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
  },
  rmHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  rmTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1e293b',
  },
  rmList: {
    padding: 16,
    maxHeight: 300,
  },
  rmItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  rmItemActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#0B5394',
  },
  rmItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rmItemName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
  },
  rmItemBassin: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  rmAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0B5394',
    margin: 16,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  rmAddButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  rmInputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 6,
    marginTop: 10,
  },
  rmInput: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1e293b',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
});
