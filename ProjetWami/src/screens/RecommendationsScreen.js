import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { generateRecommendations } from '../services/recommendationsService';
import { COLORS } from '../constants/theme';
import { useWaterData } from '../contexts/WaterDataContext';
import { useGamification } from '../contexts/GamificationContext';

export default function RecommendationsScreen({ openAssistant }) {
  const { waterData } = useWaterData();
  const { trackRecommendation, applyRecommendation, points } = useGamification();
  const [selectedRecommendation, setSelectedRecommendation] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [recommendations, setRecommendations] = useState([]);

  // Générer les recommandations quand les données changent
  useEffect(() => {
    setRecommendations(generateRecommendations(waterData));
  }, [waterData]);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return '#ef4444';
      case 'medium':
        return '#f59e0b';
      case 'low':
        return '#10b981';
      default:
        return '#64748b';
    }
  };

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 'high':
        return 'Urgent';
      case 'medium':
        return 'Modéré';
      case 'low':
        return 'Faible';
      default:
        return 'Normal';
    }
  };

  const openRecommendationDetails = (recommendation) => {
    setSelectedRecommendation(recommendation);
    setModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={COLORS.gradients.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerIconContainer}>
            <Ionicons name="bulb" size={50} color="#ffffff" />
          </View>
          <Text style={styles.headerTitle}>Recommandations</Text>
          <Text style={styles.headerSubtitle}>Actions suggérées pour optimiser votre pisciculture</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>Toutes les recommandations</Text>

        {recommendations.map((recommendation) => (
          <TouchableOpacity
            key={recommendation.id}
            style={styles.recommendationCard}
            onPress={() => openRecommendationDetails(recommendation)}
          >
            <View style={[styles.priorityIndicator, { backgroundColor: getPriorityColor(recommendation.priority) }]} />

            <View style={[styles.iconContainer, { backgroundColor: recommendation.color + '20' }]}>
              <Ionicons name={recommendation.icon} size={28} color={recommendation.color} />
            </View>

            <View style={styles.recommendationContent}>
              <View style={styles.recommendationHeader}>
                <Text style={styles.categoryText}>{recommendation.category}</Text>
                <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(recommendation.priority) + '20' }]}>
                  <Text style={[styles.priorityText, { color: getPriorityColor(recommendation.priority) }]}>
                    {getPriorityLabel(recommendation.priority)}
                  </Text>
                </View>
              </View>

              <Text style={styles.recommendationTitle}>{recommendation.title}</Text>
              <Text style={styles.recommendationDescription}>{recommendation.description}</Text>

              <View style={styles.actionContainer}>
                <Ionicons name="arrow-forward-circle" size={16} color="#0891b2" />
                <Text style={styles.actionText}>{recommendation.action}</Text>
              </View>
            </View>

            <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedRecommendation?.title}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close-circle" size={28} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={[styles.modalIconContainer, { backgroundColor: selectedRecommendation?.color + '20' }]}>
                <Ionicons name={selectedRecommendation?.icon} size={48} color={selectedRecommendation?.color} />
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Valeur actuelle:</Text>
                <Text style={styles.detailValue}>{selectedRecommendation?.details.currentValue}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Valeur cible:</Text>
                <Text style={styles.detailValue}>{selectedRecommendation?.details.targetValue}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Temps estimé:</Text>
                <Text style={styles.detailValue}>{selectedRecommendation?.details.estimatedTime}</Text>
              </View>

              <Text style={styles.stepsTitle}>Étapes à suivre:</Text>
              {selectedRecommendation?.details.steps.map((step, index) => (
                <View key={index} style={styles.stepItem}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.stepText}>{step}</Text>
                </View>
              ))}

              <View style={styles.impactBox}>
                <Ionicons name="information-circle" size={24} color="#0891b2" />
                <Text style={styles.impactText}>{selectedRecommendation?.details.impact}</Text>
              </View>
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.explainButton}
                onPress={() => {
                  setModalVisible(false);
                  if (openAssistant) {
                    openAssistant();
                  }
                }}
              >
                <Ionicons name="chatbubbles" size={20} color="#3498DB" />
                <Text style={styles.explainButtonText}>Plus d'explications avec Wami-IA</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.applyButton}
                onPress={() => {
                  const recId = trackRecommendation(selectedRecommendation);
                  const success = applyRecommendation(recId);
                  setModalVisible(false);
                  if (success) {
                    Alert.alert(
                      '+10 Points !',
                      `Bravo ! Vous avez appliqu\u00e9 la recommandation "${selectedRecommendation.title}". Votre score : ${points + 10} points.`,
                      [{ text: 'Super !' }]
                    );
                  }
                }}
              >
                <Text style={styles.applyButtonText}>Appliquer la recommandation (+10 pts)</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: 20,
    paddingTop: 15,
    paddingBottom: 35,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  headerContent: {
    paddingTop: 20,
    paddingBottom: 20,
    alignItems: 'center',
  },
  headerIconContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
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
    color: COLORS.opacity.white30,
    fontWeight: '600',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: 15,
  },
  recommendationCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 15,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  priorityIndicator: {
    width: 5,
    height: '100%',
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    marginRight: 12,
  },
  recommendationContent: {
    flex: 1,
  },
  recommendationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  categoryText: {
    fontSize: 12,
    color: COLORS.text.secondary,
    fontWeight: '600',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  recommendationDescription: {
    fontSize: 13,
    color: COLORS.text.secondary,
    marginBottom: 8,
  },
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
    marginLeft: 6,
  },
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
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.light,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    flex: 1,
  },
  modalBody: {
    padding: 20,
  },
  modalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.light,
  },
  detailLabel: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  stepsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginTop: 20,
    marginBottom: 12,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text.primary,
  },
  impactBox: {
    flexDirection: 'row',
    backgroundColor: COLORS.opacity.primary10,
    borderRadius: 12,
    padding: 15,
    marginTop: 20,
    marginBottom: 10,
  },
  impactText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 13,
    color: COLORS.primaryDark,
    lineHeight: 18,
  },
  modalButtons: {
    gap: 10,
    marginTop: 10,
  },
  explainButton: {
    backgroundColor: COLORS.opacity.primary10,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
    gap: 8,
  },
  explainButtonText: {
    color: COLORS.primaryDark,
    fontSize: 15,
    fontWeight: '700',
  },
  applyButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
