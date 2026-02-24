import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, StyleSheet, Modal, TouchableOpacity,
    ScrollView, Animated, Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getRecommendations, CITY_NAMES, CATEGORY_LABELS } from '../utils/recommendationEngine';


// ─── Étapes du wizard ────────────────────────────────────────────────────────
const STEP_WELCOME = 0;
const STEP_CATEGORY = 1;
const STEP_CITY = 2;
const STEP_RESULTS = 3;

// ─── Bulle de chat ────────────────────────────────────────────────────────────
function ChatBubble({ text, isBot, delay = 0, children }) {
    const opacity = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(12)).current;

    useEffect(() => {
        setTimeout(() => {
            Animated.parallel([
                Animated.timing(opacity, { toValue: 1, duration: 280, useNativeDriver: true }),
                Animated.timing(translateY, { toValue: 0, duration: 280, useNativeDriver: true }),
            ]).start();
        }, delay);
    }, []);

    return (
        <Animated.View style={[
            styles.bubbleRow,
            isBot ? styles.bubbleRowBot : styles.bubbleRowUser,
            { opacity, transform: [{ translateY }] },
        ]}>
            {isBot && (
                <View style={styles.avatar}>
                    <Text style={styles.avatarEmoji}>🐟</Text>
                </View>
            )}
            <View style={[styles.bubble, isBot ? styles.bubbleBot : styles.bubbleUser]}>
                {text ? <Text style={isBot ? styles.bubbleTextBot : styles.bubbleTextUser}>{text}</Text> : null}
                {children}
            </View>
        </Animated.View>
    );
}

// ─── Carte résultat vendeur ────────────────────────────────────────────────────
function SellerCard({ seller, index, onSelect }) {
    const medals = ['🥇', '🥈', '🥉'];
    const medal = medals[index] || `#${index + 1}`;

    const bestProduct = seller.relevantProducts[0];
    const distLabel = seller.distance === 0 ? 'Même ville' : `${seller.distance} km`;
    const isLivraison = seller.livraison && seller.rayon_livraison_km >= seller.distance;

    return (
        <TouchableOpacity style={styles.sellerCard} onPress={() => onSelect(seller)} activeOpacity={0.8}>
            {/* Médaille + nom */}
            <View style={styles.sellerCardHeader}>
                <Text style={styles.medal}>{medal}</Text>
                <View style={styles.sellerMeta}>
                    <Text style={styles.sellerName}>{seller.name}</Text>
                    <View style={styles.sellerRow}>
                        <Ionicons name="location-outline" size={12} color="#64748B" />
                        <Text style={styles.sellerCity}>{seller.city} · {distLabel}</Text>
                    </View>
                </View>
                {seller.verified && (
                    <View style={styles.verifiedBadge}>
                        <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                        <Text style={styles.verifiedText}>Vérifié</Text>
                    </View>
                )}
            </View>

            {/* Métriques */}
            <View style={styles.metricsRow}>
                {/* Rating */}
                <View style={styles.metric}>
                    <Ionicons name="star" size={13} color="#F59E0B" />
                    <Text style={styles.metricVal}>{seller.rating}</Text>
                    <Text style={styles.metricLabel}>({seller.reviews})</Text>
                </View>
                {/* Prix */}
                {bestProduct && (
                    <View style={styles.metric}>
                        <Ionicons name="pricetag-outline" size={13} color="#0B5394" />
                        <Text style={styles.metricVal}>
                            {bestProduct.price.toLocaleString()} FCFA
                        </Text>
                        <Text style={styles.metricLabel}>/{bestProduct.unit}</Text>
                    </View>
                )}
                {/* Livraison */}
                <View style={[styles.metricBadge, { backgroundColor: isLivraison ? '#DCFCE7' : '#FEE2E2' }]}>
                    <Ionicons
                        name={isLivraison ? 'car-outline' : 'walk-outline'}
                        size={13}
                        color={isLivraison ? '#16A34A' : '#DC2626'}
                    />
                    <Text style={[styles.deliveryText, { color: isLivraison ? '#16A34A' : '#DC2626' }]}>
                        {isLivraison ? 'Livraison' : 'Retrait'}
                    </Text>
                </View>
            </View>

            {/* Description */}
            <Text style={styles.sellerDesc} numberOfLines={2}>{seller.description}</Text>

            {/* CTA */}
            <View style={styles.sellerCTA}>
                <Text style={styles.sellerCTAText}>Voir les produits →</Text>
            </View>
        </TouchableOpacity>
    );
}

// ─── Composant principal ──────────────────────────────────────────────────────
const STEP_CITY_CONFIRM = 1.5; // étape virtuelle : ville confirmée depuis profil

export default function RecommendationModal({ visible, onClose, onSelectSeller }) {
    const [step, setStep] = useState(STEP_WELCOME);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedCity, setSelectedCity] = useState(null);
    const [savedCity, setSavedCity] = useState(null);    // ville du profil
    const [usingSavedCity, setUsingSavedCity] = useState(false);
    const [recommendations, setRecommendations] = useState([]);
    const scrollRef = useRef(null);

    // Charger la ville sauvegardée depuis le profil et réinitialiser le wizard
    useEffect(() => {
        if (visible) {
            AsyncStorage.getItem('@user_city').then(saved => {
                setSavedCity(saved || null);
            });
            setStep(STEP_WELCOME);
            setSelectedCategory(null);
            setSelectedCity(null);
            setUsingSavedCity(false);
            setRecommendations([]);
        }
    }, [visible]);

    const scrollToBottom = () => {
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300);
    };

    const handleCategorySelect = (catKey) => {
        setSelectedCategory(catKey);
        if (savedCity) {
            // On a une ville de profil → on l'utilise directement
            const results = getRecommendations(catKey, savedCity, 5);
            setRecommendations(results);
            setSelectedCity(savedCity);
            setUsingSavedCity(true);
            setStep(STEP_RESULTS);
        } else {
            setStep(STEP_CITY);
        }
        scrollToBottom();
    };

    const handleCitySelect = (city) => {
        setSelectedCity(city);
        setUsingSavedCity(false);
        const results = getRecommendations(selectedCategory, city, 5);
        setRecommendations(results);
        setStep(STEP_RESULTS);
        scrollToBottom();
    };

    const handleChangeCity = () => {
        setSelectedCity(null);
        setUsingSavedCity(false);
        setRecommendations([]);
        setStep(STEP_CITY);
        scrollToBottom();
    };

    const handleSellerSelect = (seller) => {
        onClose();
        if (onSelectSeller) onSelectSeller(seller);
    };

    const handleRestart = () => {
        setStep(STEP_WELCOME);
        setSelectedCategory(null);
        setSelectedCity(null);
        setUsingSavedCity(false);
        setRecommendations([]);
        scrollRef.current?.scrollTo({ y: 0, animated: true });
    };

    return (
        <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen">
            <View style={styles.overlay}>
                <View style={styles.sheet}>
                    {/* Header */}
                    <LinearGradient colors={['#0B5394', '#00A3E0']} style={styles.header}>
                        <View style={styles.headerContent}>
                            <View style={styles.headerLeft}>
                                <Text style={styles.headerEmoji}>🐟</Text>
                                <View>
                                    <Text style={styles.headerTitle}>WAMI Assistant</Text>
                                    <View style={styles.onlineRow}>
                                        <View style={styles.onlineDot} />
                                        <Text style={styles.onlineText}>IA · En ligne</Text>
                                    </View>
                                </View>
                            </View>
                            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                                <Ionicons name="close" size={22} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </LinearGradient>

                    {/* Chat area */}
                    <ScrollView
                        ref={scrollRef}
                        style={styles.chatArea}
                        contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* ── Bienvenue ── */}
                        <ChatBubble isBot delay={0}
                            text={savedCity
                                ? `Bonjour ! 👋 Je suis WAMI-Assistant. J'ai détecté votre localisation : 📍 ${savedCity}. Dites-moi ce dont vous avez besoin ! 🐟`
                                : "Bonjour ! 👋 Je suis WAMI-Assistant. Je vais vous trouver les meilleurs fournisseurs selon votre localisation et votre budget. 🐟"}
                        />
                        <ChatBubble isBot delay={300}
                            text="De quoi avez-vous besoin aujourd'hui ?"
                        />

                        {/* ── Choix catégorie ── */}
                        {step >= STEP_WELCOME && (
                            <ChatBubble isBot delay={600}>
                                <View style={styles.chipsGrid}>
                                    {Object.entries(CATEGORY_LABELS).map(([key, { label, emoji, color }]) => (
                                        <TouchableOpacity
                                            key={key}
                                            style={[
                                                styles.chip,
                                                { borderColor: color },
                                                selectedCategory === key && { backgroundColor: color },
                                                step > STEP_WELCOME && selectedCategory !== key && styles.chipDisabled,
                                            ]}
                                            onPress={() => step === STEP_WELCOME && handleCategorySelect(key)}
                                            disabled={step > STEP_WELCOME}
                                            activeOpacity={0.8}
                                        >
                                            <Text style={styles.chipEmoji}>{emoji}</Text>
                                            <Text style={[
                                                styles.chipText,
                                                { color: selectedCategory === key ? '#fff' : color },
                                                step > STEP_WELCOME && selectedCategory !== key && { color: '#CBD5E1' },
                                            ]}>
                                                {label}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </ChatBubble>
                        )}

                        {/* ── Réponse catégorie + question ville ── */}
                        {step >= STEP_CITY && selectedCategory && (
                            <>
                                <ChatBubble isBot={false} delay={0}
                                    text={`${CATEGORY_LABELS[selectedCategory].emoji} ${CATEGORY_LABELS[selectedCategory].label}`}
                                />
                                <ChatBubble isBot delay={200}
                                    text="Parfait ! 📍 Dans quelle ville se trouve votre exploitation piscicole ?"
                                />
                                <ChatBubble isBot delay={500}>
                                    <View style={styles.cityGrid}>
                                        {CITY_NAMES.map(city => (
                                            <TouchableOpacity
                                                key={city}
                                                style={[
                                                    styles.cityChip,
                                                    selectedCity === city && styles.cityChipActive,
                                                    step > STEP_CITY && selectedCity !== city && styles.chipDisabled,
                                                ]}
                                                onPress={() => step === STEP_CITY && handleCitySelect(city)}
                                                disabled={step > STEP_CITY}
                                                activeOpacity={0.8}
                                            >
                                                <Text style={[
                                                    styles.cityChipText,
                                                    selectedCity === city && styles.cityChipTextActive,
                                                ]}>
                                                    {city}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </ChatBubble>
                            </>
                        )}

                        {/* ── Réponse ville + résultats ── */}
                        {step >= STEP_RESULTS && selectedCity && (
                            <>
                                {/* Si ville du profil : message spécial */}
                                {usingSavedCity ? (
                                    <ChatBubble isBot delay={0}
                                        text={`📍 Localisation du profil : ${selectedCity}`}
                                    />
                                ) : (
                                    <ChatBubble isBot={false} delay={0}
                                        text={`📍 ${selectedCity}`}
                                    />
                                )}

                                {recommendations.length === 0 ? (
                                    <ChatBubble isBot delay={200}
                                        text="😔 Aucun fournisseur trouvé pour cette combinaison. Essayez une autre ville ou catégorie."
                                    />
                                ) : (
                                    <>
                                        <ChatBubble isBot delay={200}
                                            text={`🎯 J'ai trouvé ${recommendations.length} fournisseur${recommendations.length > 1 ? 's' : ''} recommandé${recommendations.length > 1 ? 's' : ''} près de ${selectedCity} — triés par proximité et meilleur prix :`}
                                        />
                                        <Animated.View style={{ marginTop: 8 }}>
                                            {recommendations.map((seller, i) => (
                                                <SellerCard
                                                    key={seller.id}
                                                    seller={seller}
                                                    index={i}
                                                    onSelect={handleSellerSelect}
                                                />
                                            ))}
                                        </Animated.View>
                                        <ChatBubble isBot delay={200}
                                            text="Appuyez sur un fournisseur pour filtrer la marketplace sur ses produits. 🛒"
                                        />
                                    </>
                                )}

                                {/* Changer de ville */}
                                <TouchableOpacity style={styles.changeCityBtn} onPress={handleChangeCity}>
                                    <Ionicons name="location-outline" size={15} color="#0B5394" />
                                    <Text style={styles.changeCityText}>Changer de ville</Text>
                                </TouchableOpacity>

                                {/* Recommencer */}
                                <TouchableOpacity style={styles.restartBtn} onPress={handleRestart}>
                                    <Ionicons name="refresh-outline" size={16} color="#0B5394" />
                                    <Text style={styles.restartText}>Nouvelle recherche</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
        ...(Platform.OS === 'web' && { height: '100vh' }),
    },
    sheet: {
        backgroundColor: '#F8FAFC',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        height: '90%',
        overflow: 'hidden',
    },

    // Header
    header: { paddingTop: 16, paddingBottom: 14, paddingHorizontal: 16 },
    headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    headerEmoji: { fontSize: 32 },
    headerTitle: { fontSize: 17, fontWeight: '700', color: '#fff' },
    onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    onlineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#4ADE80' },
    onlineText: { fontSize: 11, color: 'rgba(255,255,255,0.8)' },
    closeBtn: { padding: 6, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)' },

    // Chat
    chatArea: { flex: 1 },
    bubbleRow: { flexDirection: 'row', marginBottom: 10, maxWidth: '90%' },
    bubbleRowBot: { alignSelf: 'flex-start' },
    bubbleRowUser: { alignSelf: 'flex-end', flexDirection: 'row-reverse' },
    avatar: {
        width: 34, height: 34, borderRadius: 17,
        backgroundColor: '#E0F2FE', alignItems: 'center', justifyContent: 'center',
        marginRight: 8, marginTop: 2, flexShrink: 0,
    },
    avatarEmoji: { fontSize: 18 },
    bubble: { borderRadius: 18, padding: 12, maxWidth: '100%' },
    bubbleBot: { backgroundColor: '#fff', borderTopLeftRadius: 4, elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } },
    bubbleUser: { backgroundColor: '#0B5394', borderTopRightRadius: 4 },
    bubbleTextBot: { fontSize: 14, color: '#1E293B', lineHeight: 20 },
    bubbleTextUser: { fontSize: 14, color: '#fff', lineHeight: 20 },

    // Chips catégorie
    chipsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
    chip: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        borderWidth: 1.5, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7,
        backgroundColor: '#fff',
    },
    chipDisabled: { opacity: 0.35 },
    chipEmoji: { fontSize: 15 },
    chipText: { fontSize: 13, fontWeight: '600' },

    // Chips ville
    cityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 4 },
    cityChip: {
        paddingHorizontal: 11, paddingVertical: 6,
        borderRadius: 14, borderWidth: 1, borderColor: '#CBD5E1',
        backgroundColor: '#fff',
    },
    cityChipActive: { backgroundColor: '#0B5394', borderColor: '#0B5394' },
    cityChipText: { fontSize: 12, color: '#475569', fontWeight: '500' },
    cityChipTextActive: { color: '#fff', fontWeight: '700' },

    // Cartes vendeurs
    sellerCard: {
        backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 10,
        elevation: 3, shadowColor: '#0B5394', shadowOpacity: 0.10, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
    },
    sellerCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
    medal: { fontSize: 22 },
    sellerMeta: { flex: 1 },
    sellerName: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
    sellerRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
    sellerCity: { fontSize: 12, color: '#64748B' },
    verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#DCFCE7', borderRadius: 10, paddingHorizontal: 7, paddingVertical: 3 },
    verifiedText: { fontSize: 10, color: '#16A34A', fontWeight: '700' },

    metricsRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' },
    metric: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    metricVal: { fontSize: 13, fontWeight: '600', color: '#1E293B' },
    metricLabel: { fontSize: 11, color: '#94A3B8' },
    metricBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
    deliveryText: { fontSize: 11, fontWeight: '600' },

    sellerDesc: { fontSize: 12, color: '#64748B', lineHeight: 17, marginBottom: 10 },
    sellerCTA: { alignSelf: 'flex-end' },
    sellerCTAText: { fontSize: 13, color: '#00A3E0', fontWeight: '700' },

    // Restart
    restartBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        alignSelf: 'center', marginTop: 8,
        backgroundColor: '#EFF6FF', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 9,
        borderWidth: 1, borderColor: '#BFDBFE',
    },
    restartText: { fontSize: 13, color: '#0B5394', fontWeight: '600' },
    // Changer de ville
    changeCityBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        alignSelf: 'center', marginTop: 12, marginBottom: 4,
        backgroundColor: '#F0F9FF', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8,
        borderWidth: 1, borderColor: '#BAE6FD',
    },
    changeCityText: { fontSize: 13, color: '#0B5394', fontWeight: '600' },
});
