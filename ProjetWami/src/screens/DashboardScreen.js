import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import WaterQualityCard from '../components/WaterQualityCard';
import { getWaterQualityData } from '../services/api';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { generateRecommendations } from '../services/recommendationsService';
import { useWaterData } from '../contexts/WaterDataContext';
import { createShadowStyle, createTextShadowStyle } from '../utils/styleUtils';
import * as Speech from 'expo-speech';
import { useSpeech } from '../contexts/SpeechContext';
import ttsService from '../services/ttsService';


export default function DashboardScreen({ openAssistant }) {
  const { waterData, updateWaterData, refreshData, backendConnected, lastFetch } = useWaterData();

  const { isSpeaking, stopSpeaking: stopSpeechContext } = useSpeech();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRecommendation, setSelectedRecommendation] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editedData, setEditedData] = useState({});
  const [parameterModalVisible, setParameterModalVisible] = useState(false);
  const [selectedParameter, setSelectedParameter] = useState(null);
  const [parametersListModalVisible, setParametersListModalVisible] = useState(false);

  // Fonction pour arrêter la synthèse vocale
  const stopSpeaking = () => {
    try {
      ttsService.stop(); // Utiliser le service TTS unifié
      stopSpeechContext();
      console.log('🔇 Synthèse vocale arrêtée');
    } catch (error) {
      console.error('❌ Erreur lors de l\'arrêt de la synthèse vocale:', error);
      stopSpeechContext();
    }
  };

  // Arrêter la synthèse vocale quand on quitte le tableau de bord
  useEffect(() => {
    return () => {
      console.log('🚪 Sortie du tableau de bord - Arrêt de la synthèse vocale');
      stopSpeaking();
    };
  }, []);



  // Utiliser le service partagé pour générer des recommandations dynamiques
  const getRecommendations = () => {
    return generateRecommendations(waterData);
  };

  // Ancienne fonction (remplacée par le service)
  const oldGenerateRecommendations = () => {
    const recs = [];
    let id = 1;

    // Vérifier la température
    if (waterData.temperature > 27) {
      recs.push({
        id: id++,
        priority: 'high',
        category: 'Température',
        title: 'Température élevée détectée',
        description: `Température actuelle: ${waterData.temperature}°C (optimal: 25-27°C)`,
        action: 'Activer le système de refroidissement',
        icon: 'thermometer',
        color: '#ef4444',
        bgColor: '#fee2e2',
        details: {
          currentValue: `${waterData.temperature}°C`,
          targetValue: '26.0°C',
          steps: [
            'Activer le système de refroidissement',
            'Augmenter l\'aération',
            'Réduire l\'exposition au soleil',
            'Vérifier dans 2 heures',
          ],
          estimatedTime: '2-3 heures',
          impact: 'Critique - Stress thermique pour les poissons',
        },
      });
    } else if (waterData.temperature < 25) {
      recs.push({
        id: id++,
        priority: 'medium',
        category: 'Température',
        title: 'Température basse détectée',
        description: `Température actuelle: ${waterData.temperature}°C (optimal: 25-27°C)`,
        action: 'Augmenter la température',
        icon: 'thermometer',
        color: '#f59e0b',
        bgColor: '#fef3c7',
        details: {
          currentValue: `${waterData.temperature}°C`,
          targetValue: '26.0°C',
          steps: [
            'Activer le système de chauffage',
            'Réduire l\'aération excessive',
            'Vérifier l\'isolation',
          ],
          estimatedTime: '3-4 heures',
          impact: 'Métabolisme ralenti des poissons',
        },
      });
    }

    // Vérifier le pH
    if (waterData.ph > 7.5 || waterData.ph < 7.0) {
      recs.push({
        id: id++,
        priority: waterData.ph > 8.0 || waterData.ph < 6.5 ? 'high' : 'medium',
        category: 'pH',
        title: waterData.ph > 7.5 ? 'pH trop élevé' : 'pH trop bas',
        description: `pH actuel: ${waterData.ph} (optimal: 7.0-7.5)`,
        action: waterData.ph > 7.5 ? 'Réduire le pH' : 'Augmenter le pH',
        icon: 'flask',
        color: waterData.ph > 8.0 || waterData.ph < 6.5 ? '#ef4444' : '#f59e0b',
        bgColor: waterData.ph > 8.0 || waterData.ph < 6.5 ? '#fee2e2' : '#fef3c7',
        details: {
          currentValue: `${waterData.ph}`,
          targetValue: '7.2',
          steps: waterData.ph > 7.5 ? [
            'Ajouter un acidifiant naturel',
            'Augmenter l\'aération',
            'Vérifier dans 4 heures',
          ] : [
            'Ajouter du bicarbonate',
            'Réduire l\'aération',
            'Vérifier dans 4 heures',
          ],
          estimatedTime: '4-6 heures',
          impact: 'Affecte la respiration et le métabolisme',
        },
      });
    }

    // Vérifier l'oxygène
    if (waterData.oxygen < 7) {
      recs.push({
        id: id++,
        priority: waterData.oxygen < 5 ? 'high' : 'medium',
        category: 'Oxygène',
        title: 'Oxygène dissous faible',
        description: `Oxygène: ${waterData.oxygen} mg/L (optimal: 7-9 mg/L)`,
        action: 'Augmenter l\'oxygénation',
        icon: 'water',
        color: waterData.oxygen < 5 ? '#ef4444' : '#f59e0b',
        bgColor: waterData.oxygen < 5 ? '#fee2e2' : '#fef3c7',
        details: {
          currentValue: `${waterData.oxygen} mg/L`,
          targetValue: '8.0 mg/L',
          steps: [
            'Activer les aérateurs',
            'Réduire la densité de poissons',
            'Vérifier les filtres',
            'Surveiller en continu',
          ],
          estimatedTime: '1-2 heures',
          impact: 'Critique - Risque d\'asphyxie',
        },
      });
    }

    // Vérifier l'ammoniaque
    if (waterData.ammonia > 0.2) {
      recs.push({
        id: id++,
        priority: waterData.ammonia > 0.5 ? 'high' : 'medium',
        category: 'Ammoniaque',
        title: 'Niveau d\'ammoniaque élevé',
        description: `Ammoniaque: ${waterData.ammonia} mg/L (optimal: 0-0.2 mg/L)`,
        action: 'Réduire l\'ammoniaque',
        icon: 'warning',
        color: waterData.ammonia > 0.5 ? '#ef4444' : '#f59e0b',
        bgColor: waterData.ammonia > 0.5 ? '#fee2e2' : '#fef3c7',
        details: {
          currentValue: `${waterData.ammonia} mg/L`,
          targetValue: '< 0.2 mg/L',
          steps: [
            'Changer 30% de l\'eau',
            'Réduire l\'alimentation',
            'Vérifier le filtre biologique',
            'Ajouter des bactéries nitrifiantes',
          ],
          estimatedTime: '24-48 heures',
          impact: 'Toxique - Dommages aux branchies',
        },
      });
    }

    // Vérifier la turbidité
    if (waterData.turbidity > 20) {
      recs.push({
        id: id++,
        priority: waterData.turbidity > 40 ? 'high' : 'medium',
        category: 'Turbidité',
        title: 'Eau trouble',
        description: `Turbidité: ${waterData.turbidity} NTU (optimal: 0-20 NTU)`,
        action: 'Clarifier l\'eau',
        icon: 'eye-off',
        color: waterData.turbidity > 40 ? '#ef4444' : '#f59e0b',
        bgColor: waterData.turbidity > 40 ? '#fee2e2' : '#fef3c7',
        details: {
          currentValue: `${waterData.turbidity} NTU`,
          targetValue: '< 15 NTU',
          steps: [
            'Nettoyer les filtres mécaniques',
            'Réduire l\'alimentation',
            'Ajouter un floculant naturel',
            'Vérifier le système de filtration',
          ],
          estimatedTime: '12-24 heures',
          impact: 'Réduit l\'oxygène et stresse les poissons',
        },
      });
    }

    // Si tout est optimal ou moins de 2 recommandations, ajouter des recommandations de maintenance
    if (recs.length === 0) {
      recs.push({
        id: id++,
        priority: 'low',
        category: 'Maintenance',
        title: 'Tout est optimal !',
        description: 'Tous les paramètres sont dans les normes',
        action: 'Continuer la surveillance régulière',
        icon: 'checkmark-circle',
        color: '#10b981',
        bgColor: '#d1fae5',
        details: {
          currentValue: 'Optimal',
          targetValue: 'Maintenir',
          steps: [
            'Continuer la surveillance',
            'Planifier la maintenance préventive',
            'Vérifier l\'alimentation',
            'Observer le comportement des poissons',
          ],
          estimatedTime: 'Continu',
          impact: 'Maintient la santé optimale',
        },
      });
    }

    // Toujours ajouter une recommandation de surveillance si moins de 1 recommandation
    if (recs.length < 1) {
      recs.push({
        id: id++,
        priority: 'low',
        category: 'Surveillance',
        title: 'Surveillance comportementale',
        description: 'Observer le comportement des poissons',
        action: 'Inspection visuelle quotidienne',
        icon: 'eye',
        color: '#8b5cf6',
        bgColor: '#f3e8ff',
        details: {
          currentValue: 'Comportement normal',
          targetValue: 'Maintenir',
          steps: [
            'Observer l\'activité de nage',
            'Vérifier l\'appétit',
            'Détecter les signes de stress',
            'Noter les anomalies',
          ],
          estimatedTime: '15 min/jour',
          impact: 'Détection précoce des problèmes',
        },
      });
    }

    return recs;
  };

  const recommendations = getRecommendations();


  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshData();
    } catch (e) {
      console.warn('Erreur refresh:', e.message);
    }
    setRefreshing(false);
  };

  // Ouvrir le modal d'édition
  const openEditModal = () => {
    setEditedData({ ...waterData });
    setEditModalVisible(true);
  };

  // Sauvegarder les données modifiées
  const saveEditedData = async () => {
    // Valider les données
    const validatedData = {};
    let hasError = false;

    Object.keys(editedData).forEach(key => {
      const value = parseFloat(editedData[key]);
      if (isNaN(value)) {
        hasError = true;
        Alert.alert('Erreur', `Valeur invalide pour ${key}`);
        return;
      }
      validatedData[key] = value;
    });

    if (!hasError) {
      const success = await updateWaterData(validatedData);
      setEditModalVisible(false);
      if (success) {
        Alert.alert('Succès', 'Les paramètres ont été mis à jour dans toute l\'application');
      } else {
        Alert.alert('Erreur', 'Impossible de mettre à jour les paramètres');
      }
    }
  };

  const getStatusColor = (param, value) => {
    const ranges = {
      temperature: { min: 24, max: 28, optimal: [25, 27] },
      ph: { min: 6.5, max: 8.5, optimal: [7.0, 7.5] },
      oxygen: { min: 5, max: 12, optimal: [7, 9] },
      ammonia: { min: 0, max: 0.5, optimal: [0, 0.2] },
      turbidity: { min: 0, max: 50, optimal: [0, 20] },
      salinity: { min: 0, max: 2, optimal: [0, 1] },
    };

    const range = ranges[param];
    if (!range) return '#10b981'; // green

    if (value >= range.optimal[0] && value <= range.optimal[1]) {
      return '#10b981'; // green - optimal
    } else if (value >= range.min && value <= range.max) {
      return '#f59e0b'; // orange - acceptable
    } else {
      return '#ef4444'; // red - danger
    }
  };

  // Calculer l'état global de l'eau
  const getGlobalWaterStatus = () => {
    const params = [
      { name: 'temperature', value: waterData.temperature },
      { name: 'ph', value: waterData.ph },
      { name: 'oxygen', value: waterData.oxygen },
      { name: 'ammonia', value: waterData.ammonia },
      { name: 'turbidity', value: waterData.turbidity },
      { name: 'salinity', value: waterData.salinity },
    ];

    let criticalCount = 0;
    let warningCount = 0;
    let optimalCount = 0;

    params.forEach(param => {
      const color = getStatusColor(param.name, param.value);
      if (color === '#ef4444') criticalCount++;
      else if (color === '#f59e0b') warningCount++;
      else optimalCount++;
    });

    if (criticalCount > 0) {
      return {
        status: 'Critique',
        color: '#ef4444',
        icon: 'alert-circle',
        message: `${criticalCount} paramètre(s) en zone critique`,
        bgColor: '#fee2e2',
      };
    } else if (warningCount > 2) {
      return {
        status: 'Attention',
        color: '#f59e0b',
        icon: 'warning',
        message: `${warningCount} paramètre(s) nécessitent attention`,
        bgColor: '#fef3c7',
      };
    } else if (warningCount > 0) {
      return {
        status: 'Bon',
        color: '#3498DB',
        icon: 'checkmark-circle',
        message: 'Qualité de l\'eau satisfaisante',
        bgColor: '#dbeafe',
      };
    } else {
      return {
        status: 'Optimal',
        color: '#48C9B0',
        icon: 'checkmark-circle',
        message: 'Tous les paramètres sont optimaux',
        bgColor: '#d1fae5',
      };
    }
  };

  const globalStatus = getGlobalWaterStatus();

  // Fonction pour ouvrir le modal de paramètre
  const openParameterModal = (paramName, paramValue, paramUnit, paramIcon, paramColor) => {
    setSelectedParameter({
      name: paramName,
      value: paramValue,
      unit: paramUnit,
      icon: paramIcon,
      color: paramColor,
      recommendations: getParameterRecommendations(paramName, paramValue),
    });
    setParameterModalVisible(true);
  };

  // Générer des recommandations spécifiques pour un paramètre
  const getParameterRecommendations = (paramName, paramValue) => {
    const value = parseFloat(paramValue);
    const recommendations = [];

    switch (paramName.toLowerCase()) {
      case 'température':
        if (value > 27) {
          recommendations.push({
            type: 'danger',
            title: 'Température trop élevée',
            message: `La température actuelle (${value}°C) dépasse la plage optimale (25-27°C)`,
            actions: [
              'Activer le système de refroidissement',
              'Augmenter l\'aération pour favoriser l\'évaporation',
              'Réduire l\'exposition directe au soleil',
              'Ajouter de l\'eau fraîche progressivement',
            ],
            impact: 'Stress thermique, métabolisme accéléré, risque de mortalité',
          });
        } else if (value < 25) {
          recommendations.push({
            type: 'warning',
            title: 'Température basse',
            message: `La température actuelle (${value}°C) est en dessous de la plage optimale`,
            actions: [
              'Activer le système de chauffage',
              'Réduire l\'aération excessive',
              'Améliorer l\'isolation du bassin',
              'Vérifier l\'exposition au soleil',
            ],
            impact: 'Métabolisme ralenti, croissance réduite, appétit diminué',
          });
        } else {
          recommendations.push({
            type: 'success',
            title: 'Température optimale',
            message: `La température (${value}°C) est dans la plage idéale`,
            actions: [
              'Maintenir la surveillance régulière',
              'Continuer les bonnes pratiques',
              'Surveiller les variations saisonnières',
            ],
            impact: 'Conditions idéales pour la croissance et la santé',
          });
        }
        break;

      case 'ph':
        if (value > 7.5) {
          recommendations.push({
            type: value > 8.0 ? 'danger' : 'warning',
            title: 'pH trop élevé (alcalin)',
            message: `Le pH actuel (${value}) dépasse la plage optimale (7.0-7.5)`,
            actions: [
              'Ajouter un acidifiant naturel (acide citrique)',
              'Augmenter l\'aération',
              'Réduire l\'utilisation de chaux',
              'Tester régulièrement (2 fois par jour)',
            ],
            impact: 'Toxicité de l\'ammoniaque accrue, stress respiratoire',
          });
        } else if (value < 7.0) {
          recommendations.push({
            type: value < 6.5 ? 'danger' : 'warning',
            title: 'pH trop bas (acide)',
            message: `Le pH actuel (${value}) est en dessous de la plage optimale`,
            actions: [
              'Ajouter du bicarbonate de soude',
              'Utiliser de la chaux agricole',
              'Réduire l\'aération excessive',
              'Vérifier la source d\'eau',
            ],
            impact: 'Stress physiologique, vulnérabilité aux maladies',
          });
        } else {
          recommendations.push({
            type: 'success',
            title: 'pH optimal',
            message: `Le pH (${value}) est dans la plage idéale`,
            actions: [
              'Maintenir le suivi régulier',
              'Éviter les changements brusques',
              'Tester quotidiennement',
            ],
            impact: 'Conditions optimales pour la respiration et le métabolisme',
          });
        }
        break;

      case 'oxygène':
        if (value < 7) {
          recommendations.push({
            type: value < 5 ? 'danger' : 'warning',
            title: 'Oxygène dissous faible',
            message: `L\'oxygène (${value} mg/L) est en dessous de la plage optimale (7-9 mg/L)`,
            actions: [
              'Activer immédiatement les aérateurs',
              'Réduire la densité de poissons',
              'Vérifier et nettoyer les filtres',
              'Réduire l\'alimentation temporairement',
              'Surveiller en continu',
            ],
            impact: 'Risque d\'asphyxie, stress sévère, mortalité possible',
          });
        } else if (value > 9) {
          recommendations.push({
            type: 'warning',
            title: 'Oxygène élevé',
            message: `L\'oxygène (${value} mg/L) est au-dessus de la plage optimale`,
            actions: [
              'Réduire l\'aération',
              'Vérifier la température de l\'eau',
              'Surveiller le comportement des poissons',
            ],
            impact: 'Supersaturation possible, stress modéré',
          });
        } else {
          recommendations.push({
            type: 'success',
            title: 'Oxygène optimal',
            message: `L\'oxygène (${value} mg/L) est dans la plage idéale`,
            actions: [
              'Maintenir l\'aération actuelle',
              'Surveiller régulièrement',
              'Ajuster selon la densité',
            ],
            impact: 'Respiration optimale, croissance maximale',
          });
        }
        break;

      case 'ammoniaque':
        if (value > 0.2) {
          recommendations.push({
            type: value > 0.5 ? 'danger' : 'warning',
            title: 'Ammoniaque élevée',
            message: `L\'ammoniaque (${value} mg/L) dépasse le seuil acceptable (0-0.2 mg/L)`,
            actions: [
              'Changer 30-50% de l\'eau immédiatement',
              'Réduire ou arrêter l\'alimentation',
              'Vérifier le système de filtration biologique',
              'Ajouter des bactéries nitrifiantes',
              'Retirer les déchets et aliments non consommés',
            ],
            impact: 'Toxique pour les branchies, dommages tissulaires, mortalité',
          });
        } else {
          recommendations.push({
            type: 'success',
            title: 'Ammoniaque sous contrôle',
            message: `L\'ammoniaque (${value} mg/L) est dans la plage acceptable`,
            actions: [
              'Maintenir la filtration biologique',
              'Continuer le suivi régulier',
              'Éviter la suralimentation',
              'Nettoyer régulièrement',
            ],
            impact: 'Environnement sain, pas de toxicité',
          });
        }
        break;

      case 'turbidité':
        if (value > 20) {
          recommendations.push({
            type: value > 40 ? 'danger' : 'warning',
            title: 'Eau trouble',
            message: `La turbidité (${value} NTU) dépasse la plage optimale (0-20 NTU)`,
            actions: [
              'Nettoyer les filtres mécaniques',
              'Réduire l\'alimentation',
              'Ajouter un floculant naturel',
              'Vérifier le système de filtration',
              'Retirer les matières en suspension',
            ],
            impact: 'Réduit l\'oxygène, stress visuel, croissance ralentie',
          });
        } else {
          recommendations.push({
            type: 'success',
            title: 'Eau claire',
            message: `La turbidité (${value} NTU) est dans la plage optimale`,
            actions: [
              'Maintenir la filtration',
              'Continuer les bonnes pratiques',
              'Surveiller après l\'alimentation',
            ],
            impact: 'Bonne pénétration de la lumière, environnement sain',
          });
        }
        break;

      case 'salinité':
        if (value > 1) {
          recommendations.push({
            type: value > 1.5 ? 'danger' : 'warning',
            title: 'Salinité élevée',
            message: `La salinité (${value} ppt) dépasse la plage optimale (0-1 ppt)`,
            actions: [
              'Diluer avec de l\'eau douce',
              'Vérifier la source d\'eau',
              'Réduire l\'évaporation',
              'Surveiller les poissons',
            ],
            impact: 'Stress osmotique, déshydratation possible',
          });
        } else {
          recommendations.push({
            type: 'success',
            title: 'Salinité optimale',
            message: `La salinité (${value} ppt) est dans la plage idéale`,
            actions: [
              'Maintenir la surveillance',
              'Contrôler l\'évaporation',
              'Tester régulièrement',
            ],
            impact: 'Équilibre osmotique optimal',
          });
        }
        break;

      default:
        recommendations.push({
          type: 'info',
          title: 'Paramètre surveillé',
          message: 'Continuez à surveiller ce paramètre régulièrement',
          actions: ['Maintenir la surveillance'],
          impact: 'Suivi régulier recommandé',
        });
    }

    return recommendations;
  };

  return (
    <>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <LinearGradient
          colors={['#0B5394', '#1a6bb8']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View style={styles.iconHeader}>
              <MaterialCommunityIcons name="water-check" size={64} color="#ffffff" />
            </View>
            <Text style={styles.headerTitle}>Qualité de l'Eau</Text>
            <Text style={styles.headerSubtitle}>
              {backendConnected ? '🟢 Connecté' : '🔴 Hors ligne'}
              {lastFetch ? ` • ${lastFetch.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}` : ''}
            </Text>
          </View>

          {/* Bouton d'arrêt de la synthèse vocale */}
          {isSpeaking && (
            <TouchableOpacity
              style={styles.stopSpeechButton}
              onPress={stopSpeaking}
              activeOpacity={0.8}
            >
              <View style={styles.stopSpeechButtonContent}>
                <Ionicons name="stop-circle" size={24} color="#ffffff" />
                <Text style={styles.stopSpeechButtonText}>Arrêter</Text>
              </View>
            </TouchableOpacity>
          )}
        </LinearGradient>

        {/* État Global de l'Eau */}
        <View style={styles.globalStatusContainer}>
          <View style={[styles.globalStatusCard, { backgroundColor: globalStatus.bgColor }]}>
            <View style={styles.globalStatusHeader}>
              <Ionicons name={globalStatus.icon} size={48} color={globalStatus.color} />
              <View style={styles.globalStatusTextContainer}>
                <Text style={styles.globalStatusLabel}>État Global</Text>
                <Text style={[styles.globalStatusValue, { color: globalStatus.color }]}>
                  {globalStatus.status}
                </Text>
              </View>
            </View>
            <Text style={styles.globalStatusMessage}>{globalStatus.message}</Text>
          </View>
        </View>

        <View style={styles.content}>
          {/* Section Recommandations */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionSubtitle}>Actions suggérées pour optimiser votre pisciculture</Text>
          </View>

          <View style={styles.recommendationsContainer}>
            {recommendations.map((rec) => {
              const priorityLabel = rec.priority === 'high' ? 'Urgent' : rec.priority === 'medium' ? 'Modéré' : 'Faible';
              const IconComponent = rec.icon === 'nutrition' ? MaterialCommunityIcons : Ionicons;

              return (
                <TouchableOpacity
                  key={rec.id}
                  style={[styles.recommendationCard, { borderLeftColor: rec.color }]}
                  onPress={() => {
                    setSelectedRecommendation(rec);
                    setModalVisible(true);
                  }}
                >
                  <View style={styles.recommendationHeader}>
                    <View style={[styles.iconContainer, { backgroundColor: rec.bgColor }]}>
                      <IconComponent name={rec.icon} size={28} color={rec.color} />
                    </View>
                    <View style={styles.recommendationTitleContainer}>
                      <View style={styles.categoryRow}>
                        <Text style={styles.categoryText}>{rec.category}</Text>
                        <View style={[styles.priorityBadge, { backgroundColor: rec.bgColor }]}>
                          <Text style={[styles.priorityText, { color: rec.color }]}>{priorityLabel}</Text>
                        </View>
                      </View>
                      <Text style={styles.recommendationTitle}>{rec.title}</Text>
                    </View>
                  </View>
                  <Text style={styles.recommendationDescription}>
                    {rec.description}
                  </Text>
                  <View style={styles.actionRow}>
                    <Ionicons name="flash" size={16} color="#3498DB" />
                    <Text style={styles.actionText}>{rec.action}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Bouton Saisir manuellement */}
          <TouchableOpacity style={styles.editButton} onPress={openEditModal}>
            <Ionicons name="create-outline" size={20} color="#0B5394" />
            <Text style={styles.editButtonText}>Saisir Paramètres</Text>
          </TouchableOpacity>

          {/* Section Paramètres Actuels */}
          <Text style={styles.sectionTitle}>Paramètres Actuels</Text>

          {/* Bouton pour ouvrir le popup des paramètres */}
          <TouchableOpacity
            style={styles.viewParametersButton}
            onPress={() => setParametersListModalVisible(true)}
          >
            <View style={styles.viewParametersContent}>
              <MaterialCommunityIcons name="water-check" size={32} color="#0B5394" />
              <View style={styles.viewParametersTextContainer}>
                <Text style={styles.viewParametersTitle}>Voir les Paramètres</Text>
                <Text style={styles.viewParametersSubtitle}>
                  Cliquez pour consulter les 6 paramètres d'eau
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#0B5394" />
            </View>
          </TouchableOpacity>

        </View>
      </ScrollView>

      {/* Modal de détails de recommandation */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedRecommendation && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{selectedRecommendation.title}</Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Ionicons name="close-circle" size={32} color="#64748b" />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalBody}>
                  {/* Icône centrale */}
                  <View style={styles.modalIconContainer}>
                    <View style={[styles.modalIcon, { backgroundColor: selectedRecommendation.bgColor }]}>
                      {selectedRecommendation.icon === 'nutrition' ? (
                        <MaterialCommunityIcons name={selectedRecommendation.icon} size={48} color={selectedRecommendation.color} />
                      ) : (
                        <Ionicons name={selectedRecommendation.icon} size={48} color={selectedRecommendation.color} />
                      )}
                    </View>
                  </View>

                  {/* Valeurs */}
                  <View style={styles.valuesContainer}>
                    <View style={styles.valueRow}>
                      <Text style={styles.valueLabel}>Valeur actuelle:</Text>
                      <Text style={styles.valueText}>{selectedRecommendation.details.currentValue}</Text>
                    </View>
                    <View style={styles.valueRow}>
                      <Text style={styles.valueLabel}>Valeur cible:</Text>
                      <Text style={styles.valueText}>{selectedRecommendation.details.targetValue}</Text>
                    </View>
                    <View style={styles.valueRow}>
                      <Text style={styles.valueLabel}>Temps estimé:</Text>
                      <Text style={styles.valueText}>{selectedRecommendation.details.estimatedTime}</Text>
                    </View>
                  </View>

                  {/* Étapes à suivre */}
                  <View style={styles.stepsContainer}>
                    <Text style={styles.stepsTitle}>Étapes à suivre:</Text>
                    {selectedRecommendation.details.steps.map((step, index) => (
                      <View key={index} style={styles.stepRow}>
                        <View style={styles.stepNumber}>
                          <Text style={styles.stepNumberText}>{index + 1}</Text>
                        </View>
                        <Text style={styles.stepText}>{step}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Impact */}
                  <View style={styles.impactContainer}>
                    <Ionicons name="information-circle" size={20} color="#3498DB" />
                    <Text style={styles.impactText}>{selectedRecommendation.details.impact}</Text>
                  </View>
                </ScrollView>

                {/* Boutons */}
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.explainButton}
                    onPress={() => {
                      setModalVisible(false);
                      if (openAssistant && selectedRecommendation && selectedRecommendation.details) {
                        // Créer un message contextuel pour l'IA
                        const contextMessage = `Je veux en savoir plus sur cette recommandation : ${selectedRecommendation.title || 'Recommandation'}. Valeur actuelle : ${selectedRecommendation.details.currentValue || 'Non définie'}, Valeur cible : ${selectedRecommendation.details.targetValue || 'Non définie'}. Impact : ${selectedRecommendation.details.impact || 'Impact non défini'}. Peux-tu m'expliquer en détail ce que je dois faire et pourquoi c'est important ?`;
                        openAssistant(contextMessage);
                      }
                    }}
                  >
                    <Ionicons name="chatbubbles" size={20} color="#3498DB" />
                    <Text style={styles.explainButtonText}>Plus d'explications avec Wami-IA</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.applyButton}
                    onPress={() => {
                      setModalVisible(false);
                      // Logique pour appliquer la recommandation
                    }}
                  >
                    <Text style={styles.applyButtonText}>Appliquer la recommandation</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Modal d'édition manuelle des paramètres */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Saisir les Paramètres</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close-circle" size={32} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.editScrollView}>
              {/* Température */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Température (°C)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={editedData.temperature?.toString()}
                  onChangeText={(text) => setEditedData({ ...editedData, temperature: text })}
                  placeholder="26.5"
                />
                <Text style={styles.inputHint}>Plage optimale: 25-27°C</Text>
              </View>

              {/* pH */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>pH</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={editedData.ph?.toString()}
                  onChangeText={(text) => setEditedData({ ...editedData, ph: text })}
                  placeholder="7.2"
                />
                <Text style={styles.inputHint}>Plage optimale: 7.0-7.5</Text>
              </View>

              {/* Oxygène */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Oxygène dissous (mg/L)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={editedData.oxygen?.toString()}
                  onChangeText={(text) => setEditedData({ ...editedData, oxygen: text })}
                  placeholder="8.5"
                />
                <Text style={styles.inputHint}>Plage optimale: 7-9 mg/L</Text>
              </View>

              {/* Ammoniaque */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Ammoniaque (mg/L)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={editedData.ammonia?.toString()}
                  onChangeText={(text) => setEditedData({ ...editedData, ammonia: text })}
                  placeholder="0.15"
                />
                <Text style={styles.inputHint}>Plage optimale: 0-0.2 mg/L</Text>
              </View>

              {/* Turbidité */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Turbidité (NTU)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={editedData.turbidity?.toString()}
                  onChangeText={(text) => setEditedData({ ...editedData, turbidity: text })}
                  placeholder="12"
                />
                <Text style={styles.inputHint}>Plage optimale: 0-20 NTU</Text>
              </View>

              {/* Salinité */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Salinité (ppt)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={editedData.salinity?.toString()}
                  onChangeText={(text) => setEditedData({ ...editedData, salinity: text })}
                  placeholder="0.5"
                />
                <Text style={styles.inputHint}>Plage optimale: 0-1 ppt</Text>
              </View>
            </ScrollView>

            {/* Boutons */}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={saveEditedData}
              >
                <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
                <Text style={styles.saveButtonText}>Enregistrer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de détails du paramètre */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={parameterModalVisible}
        onRequestClose={() => setParameterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.parameterModalContent}>
            {selectedParameter && (
              <>
                {/* En-tête du modal */}
                <View style={[styles.parameterModalHeader, { backgroundColor: selectedParameter.color }]}>
                  <View style={styles.parameterHeaderContent}>
                    <View style={styles.parameterIconLarge}>
                      <Ionicons name={selectedParameter.icon} size={48} color="#fff" />
                    </View>
                    <Text style={styles.parameterModalTitle}>{selectedParameter.name}</Text>
                    <View style={styles.parameterValueContainer}>
                      <Text style={styles.parameterValueLarge}>
                        {selectedParameter.value}
                      </Text>
                      <Text style={styles.parameterUnitLarge}>{selectedParameter.unit}</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => setParameterModalVisible(false)}
                    style={styles.closeButton}
                  >
                    <Ionicons name="close-circle" size={32} color="#fff" />
                  </TouchableOpacity>
                </View>

                {/* Corps du modal avec recommandations */}
                <ScrollView style={styles.parameterModalBody}>
                  {selectedParameter.recommendations.map((rec, index) => {
                    const getTypeColor = (type) => {
                      switch (type) {
                        case 'danger': return '#ef4444';
                        case 'warning': return '#f59e0b';
                        case 'success': return '#10b981';
                        default: return '#3b82f6';
                      }
                    };

                    const getTypeIcon = (type) => {
                      switch (type) {
                        case 'danger': return 'alert-circle';
                        case 'warning': return 'warning';
                        case 'success': return 'checkmark-circle';
                        default: return 'information-circle';
                      }
                    };

                    const typeColor = getTypeColor(rec.type);
                    const typeIcon = getTypeIcon(rec.type);

                    return (
                      <View key={index} style={styles.recommendationDetailCard}>
                        {/* En-tête de la recommandation */}
                        <View style={[styles.recDetailHeader, { backgroundColor: typeColor + '15' }]}>
                          <Ionicons name={typeIcon} size={32} color={typeColor} />
                          <Text style={[styles.recDetailTitle, { color: typeColor }]}>
                            {rec.title}
                          </Text>
                        </View>

                        {/* Message */}
                        <View style={styles.recDetailSection}>
                          <Text style={styles.recDetailLabel}>📋 Diagnostic</Text>
                          <Text style={styles.recDetailText}>{rec.message}</Text>
                        </View>

                        {/* Actions à prendre */}
                        <View style={styles.recDetailSection}>
                          <Text style={styles.recDetailLabel}>✅ Actions recommandées</Text>
                          {rec.actions.map((action, actionIndex) => (
                            <View key={actionIndex} style={styles.actionItem}>
                              <View style={[styles.actionBullet, { backgroundColor: typeColor }]} />
                              <Text style={styles.actionText}>{action}</Text>
                            </View>
                          ))}
                        </View>

                        {/* Impact */}
                        <View style={[styles.impactSection, { backgroundColor: typeColor + '10' }]}>
                          <Ionicons name="information-circle" size={20} color={typeColor} />
                          <View style={styles.impactTextContainer}>
                            <Text style={styles.impactLabel}>Impact :</Text>
                            <Text style={styles.impactText}>{rec.impact}</Text>
                          </View>
                        </View>
                      </View>
                    );
                  })}

                  {/* Bouton pour obtenir plus d'aide */}
                  <TouchableOpacity
                    style={styles.assistantButton}
                    onPress={() => {
                      setParameterModalVisible(false);
                      if (openAssistant && selectedParameter && selectedParameter.recommendations && selectedParameter.recommendations.length > 0) {
                        // Créer un message contextuel détaillé pour l'IA
                        const rec = selectedParameter.recommendations[0];
                        const contextMessage = `J'ai besoin d'aide avec le paramètre ${selectedParameter.name}. Voici ma situation :\n\nValeur actuelle : ${selectedParameter.value} ${selectedParameter.unit}\nProblème : ${rec.title || 'Non spécifié'}\nMessage : ${rec.message || 'Aucun message'}\nImpact : ${rec.impact || 'Impact non défini'}\n\nPeux-tu m'expliquer simplement ce qui se passe, pourquoi c'est important pour mes poissons, et me guider étape par étape sur ce que je dois faire ? J'aimerais aussi savoir comment éviter ce problème à l'avenir.`;
                        openAssistant(contextMessage);
                      }
                    }}
                  >
                    <Ionicons name="chatbubbles" size={24} color="#fff" />
                    <Text style={styles.assistantButtonText}>
                      Obtenir plus d'aide avec Wami-IA
                    </Text>
                  </TouchableOpacity>
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Modal de liste des paramètres */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={parametersListModalVisible}
        onRequestClose={() => setParametersListModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.parametersListModalContent}>
            {/* En-tête du modal */}
            <View style={styles.parametersListHeader}>
              <Text style={styles.parametersListTitle}>Paramètres Actuels</Text>
              <TouchableOpacity onPress={() => setParametersListModalVisible(false)}>
                <Ionicons name="close-circle" size={32} color="#64748b" />
              </TouchableOpacity>
            </View>

            {/* Liste des paramètres */}
            <ScrollView style={styles.parametersListBody}>
              <View style={styles.cardsContainer}>
                <WaterQualityCard
                  title="Température"
                  value={waterData.temperature}
                  unit="°C"
                  icon="thermometer"
                  color={getStatusColor('temperature', parseFloat(waterData.temperature))}
                  onPress={() => {
                    setParametersListModalVisible(false);
                    setTimeout(() => {
                      openParameterModal('Température', waterData.temperature, '°C', 'thermometer', getStatusColor('temperature', parseFloat(waterData.temperature)));
                    }, 300);
                  }}
                />
                <WaterQualityCard
                  title="pH"
                  value={waterData.ph}
                  unit=""
                  icon="flask"
                  color={getStatusColor('ph', parseFloat(waterData.ph))}
                  onPress={() => {
                    setParametersListModalVisible(false);
                    setTimeout(() => {
                      openParameterModal('pH', waterData.ph, '', 'flask', getStatusColor('ph', parseFloat(waterData.ph)));
                    }, 300);
                  }}
                />
                <WaterQualityCard
                  title="Oxygène"
                  value={waterData.oxygen}
                  unit="mg/L"
                  icon="water"
                  color={getStatusColor('oxygen', parseFloat(waterData.oxygen))}
                  onPress={() => {
                    setParametersListModalVisible(false);
                    setTimeout(() => {
                      openParameterModal('Oxygène', waterData.oxygen, 'mg/L', 'water', getStatusColor('oxygen', parseFloat(waterData.oxygen)));
                    }, 300);
                  }}
                />
                <WaterQualityCard
                  title="Ammoniaque"
                  value={waterData.ammonia}
                  unit="mg/L"
                  icon="warning"
                  color={getStatusColor('ammonia', parseFloat(waterData.ammonia))}
                  onPress={() => {
                    setParametersListModalVisible(false);
                    setTimeout(() => {
                      openParameterModal('Ammoniaque', waterData.ammonia, 'mg/L', 'warning', getStatusColor('ammonia', parseFloat(waterData.ammonia)));
                    }, 300);
                  }}
                />
                <WaterQualityCard
                  title="Turbidité"
                  value={waterData.turbidity}
                  unit="NTU"
                  icon="eye"
                  color={getStatusColor('turbidity', parseFloat(waterData.turbidity))}
                  onPress={() => {
                    setParametersListModalVisible(false);
                    setTimeout(() => {
                      openParameterModal('Turbidité', waterData.turbidity, 'NTU', 'eye', getStatusColor('turbidity', parseFloat(waterData.turbidity)));
                    }, 300);
                  }}
                />
                <WaterQualityCard
                  title="Salinité"
                  value={waterData.salinity}
                  unit="ppt"
                  icon="beaker"
                  color={getStatusColor('salinity', parseFloat(waterData.salinity))}
                  onPress={() => {
                    setParametersListModalVisible(false);
                    setTimeout(() => {
                      openParameterModal('Salinité', waterData.salinity, 'ppt', 'beaker', getStatusColor('salinity', parseFloat(waterData.salinity)));
                    }, 300);
                  }}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
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
    ...createShadowStyle({
      shadowColor: '#0891b2',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
      elevation: 8,
    }),
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
    textAlign: 'center',
    ...createTextShadowStyle({
      textShadowColor: 'rgba(0, 0, 0, 0.2)',
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 4,
    }),
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#e0f2fe',
    fontWeight: '600',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  globalStatusContainer: {
    marginTop: -20,
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  globalStatusCard: {
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  globalStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  globalStatusTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  globalStatusLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  globalStatusValue: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  globalStatusMessage: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '600',
    lineHeight: 20,
  },
  content: {
    padding: 20,
    marginTop: -15,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8,
    marginTop: 20,
    letterSpacing: 0.5,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 15,
    fontWeight: '500',
  },
  recommendationsContainer: {
    gap: 12,
    marginBottom: 10,
  },
  recommendationCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#48C9B0',
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recommendationTitleContainer: {
    flex: 1,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    lineHeight: 22,
  },
  recommendationDescription: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    marginBottom: 12,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f0f9ff',
    padding: 10,
    borderRadius: 10,
  },
  actionText: {
    fontSize: 13,
    color: '#0B5394',
    fontWeight: '600',
    flex: 1,
  },
  cardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  chartContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#0891b2',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#cffafe',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
    paddingRight: 0,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#ffffff',
    padding: 18,
    borderRadius: 20,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 2,
    borderColor: '#f8fafc',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 14,
    color: '#64748b',
  },
  // Styles du modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    flex: 1,
  },
  modalBody: {
    padding: 20,
  },
  modalIconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  valuesContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  valueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  valueLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },
  valueText: {
    fontSize: 16,
    color: '#0f172a',
    fontWeight: '700',
  },
  stepsContainer: {
    marginBottom: 20,
  },
  stepsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#3498DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    paddingTop: 4,
  },
  impactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginBottom: 20,
  },
  impactText: {
    flex: 1,
    fontSize: 14,
    color: '#0B5394',
    fontWeight: '600',
    lineHeight: 20,
  },
  modalButtons: {
    padding: 20,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  explainButton: {
    backgroundColor: '#E8F4F8',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#3498DB',
    gap: 8,
  },
  explainButtonText: {
    color: '#0B5394',
    fontSize: 15,
    fontWeight: '700',
  },
  applyButton: {
    backgroundColor: '#3498DB',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Styles pour le bouton d'édition
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 24,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#0B5394',
    gap: 8,
    shadowColor: '#0B5394',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  editButtonText: {
    color: '#0B5394',
    fontSize: 15,
    fontWeight: '700',
  },
  // Styles pour le modal d'édition
  editScrollView: {
    maxHeight: 450,
  },
  inputGroup: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#0f172a',
    fontWeight: '600',
  },
  inputHint: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 6,
    fontStyle: 'italic',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#64748b',
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#10b981',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginLeft: 8,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Styles pour le modal de paramètre
  parameterModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    maxHeight: '90%',
    width: '100%',
    position: 'absolute',
    bottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  parameterModalHeader: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 25,
    paddingTop: 30,
    position: 'relative',
  },
  parameterHeaderContent: {
    alignItems: 'center',
  },
  parameterIconLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  parameterModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  parameterValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  parameterValueLarge: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
  },
  parameterUnitLarge: {
    fontSize: 24,
    color: 'rgba(255, 255, 255, 0.9)',
    marginLeft: 8,
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
  },
  parameterModalBody: {
    padding: 20,
    maxHeight: '70%',
  },
  recommendationDetailCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  recDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 15,
  },
  recDetailTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
  recDetailSection: {
    padding: 20,
    paddingTop: 15,
  },
  recDetailLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: 12,
  },
  recDetailText: {
    fontSize: 15,
    color: '#64748b',
    lineHeight: 22,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingLeft: 5,
  },
  actionBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 7,
    marginRight: 12,
  },
  actionText: {
    flex: 1,
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  impactSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    margin: 20,
    marginTop: 0,
    borderRadius: 12,
    gap: 12,
  },
  impactTextContainer: {
    flex: 1,
  },
  impactLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: 4,
  },
  assistantButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 10,
    marginBottom: 30,
  },
  assistantButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Styles pour le bouton "Voir les Paramètres"
  viewParametersButton: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 2,
    borderColor: '#0B5394',
  },
  viewParametersContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 15,
  },
  viewParametersTextContainer: {
    flex: 1,
  },
  viewParametersTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0B5394',
    marginBottom: 4,
  },
  viewParametersSubtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  // Styles pour le modal de liste des paramètres
  parametersListModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    maxHeight: '85%',
    width: '100%',
    position: 'absolute',
    bottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  parametersListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 25,
    paddingTop: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  parametersListTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0B5394',
  },
  parametersListBody: {
    padding: 20,
  },
  stopSpeechButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 25,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  stopSpeechButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stopSpeechButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
});
