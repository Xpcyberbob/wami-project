import React, { useState, useMemo, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    TextInput, Alert, Modal, SafeAreaView, Platform, useWindowDimensions,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../constants/theme';
import RecommendationModal from '../components/RecommendationModal';

// ─── Données fictives ────────────────────────────────────────────────────────

const PRODUCTS = [
    // Poissons frais
    { id: 1, name: 'Tilapia du Nil', category: 'poissons', price: 5000, unit: 'kg', stock: 150, emoji: '🐟', description: 'Tilapia frais de qualité supérieure, pêché ce matin.', seller: 'Ferme Aqua Konan', rating: 4.8, location: 'Abidjan, Cocody', minOrder: 1 },
    { id: 2, name: 'Carpe Royale', category: 'poissons', price: 4500, unit: 'kg', stock: 200, emoji: '🐠', description: 'Carpe fraîche élevée en eau douce, idéale pour les braisés.', seller: 'Pisciculture Yao & Fils', rating: 4.6, location: 'Bouaké', minOrder: 1 },
    { id: 3, name: 'Silure de Rivière', category: 'poissons', price: 6000, unit: 'kg', stock: 80, emoji: '🐡', description: 'Silure sauvage, chair blanche et tendre.', seller: 'Pêcherie du Bandama', rating: 4.9, location: 'Yamoussoukro', minOrder: 1 },
    { id: 4, name: 'Poisson-Chat', category: 'poissons', price: 5500, unit: 'kg', stock: 120, emoji: '🐟', description: 'Poisson-chat frais, excellent pour la soupe.', seller: 'Aqua Brou', rating: 4.5, location: 'San-Pédro', minOrder: 2 },
    { id: 5, name: 'Mulet à Grosse Tête', category: 'poissons', price: 7000, unit: 'kg', stock: 50, emoji: '🐠', description: 'Mulet de mer, saveur délicate, idéal fumé.', seller: 'Ferme Lagunaire Assinie', rating: 4.7, location: 'Grand-Bassam', minOrder: 1 },

    // Alevins & géniteurs
    { id: 6, name: 'Alevins Tilapia', category: 'alevins', price: 50, unit: 'pièce', stock: 5000, emoji: '🐟', description: 'Alevins de tilapia, 3–5 cm, croissance rapide.', seller: 'Nurserie Koffi', rating: 4.7, location: 'Abidjan, Yopougon', minOrder: 100 },
    { id: 7, name: 'Alevins Carpe', category: 'alevins', price: 45, unit: 'pièce', stock: 3000, emoji: '🐠', description: 'Alevins de carpe sélectionnés, 2–4 cm.', seller: 'Aqua Génétique CI', rating: 4.6, location: 'Daloa', minOrder: 100 },
    { id: 8, name: 'Géniteurs Tilapia', category: 'alevins', price: 2000, unit: 'pièce', stock: 50, emoji: '🐟', description: 'Paires de géniteurs sélectionnés pour la reproduction.', seller: 'Nurserie Koffi', rating: 4.9, location: 'Abidjan', minOrder: 2 },
    { id: 9, name: 'Alevins Silure', category: 'alevins', price: 60, unit: 'pièce', stock: 2000, emoji: '🐡', description: 'Alevins de silure robustes, faciles à élever.', seller: 'Pisciculture Yao & Fils', rating: 4.5, location: 'Bouaké', minOrder: 50 },

    // Équipements
    { id: 10, name: 'Filet de Pêche 10m', category: 'equipement', price: 25000, unit: 'pièce', stock: 30, emoji: '🕸️', description: 'Filet en nylon résistant, maille 2 cm, longévité 5 ans.', seller: 'AquaEquip CI', rating: 4.4, location: 'Abidjan, Treichville', minOrder: 1 },
    { id: 11, name: 'Pompe à Air 50W', category: 'equipement', price: 35000, unit: 'pièce', stock: 15, emoji: '⚙️', description: 'Pompe aération haute performance, débit 80L/min.', seller: 'TechAqua', rating: 4.6, location: 'Abidjan', minOrder: 1 },
    { id: 12, name: 'Bassin HDPE 10m³', category: 'equipement', price: 180000, unit: 'pièce', stock: 8, emoji: '🏊', description: 'Bassin hors-sol en polyéthylène, résistant aux UV.', seller: 'AquaEquip CI', rating: 4.8, location: 'Abidjan', minOrder: 1 },
    { id: 13, name: 'Kit Test Eau 8 en 1', category: 'equipement', price: 8500, unit: 'kit', stock: 60, emoji: '🧪', description: 'Mesure pH, O₂, NH₃, NO₂, NO₃, T°, turbidité, sel.', seller: 'LabAqua', rating: 4.7, location: 'Abidjan', minOrder: 1 },

    // Alimentation
    { id: 14, name: 'Aliment Starter 0–2mm', category: 'alimentation', price: 12000, unit: 'sac 10kg', stock: 200, emoji: '🍃', description: 'Granulés protéinés 45% pour alevins, flottants.', seller: 'NutriAqua CI', rating: 4.8, location: 'Abidjan', minOrder: 1 },
    { id: 15, name: 'Aliment Croissance 4mm', category: 'alimentation', price: 9500, unit: 'sac 25kg', stock: 350, emoji: '🌾', description: 'Granulés 35% protéines pour poissons en croissance.', seller: 'FeedMaster', rating: 4.6, location: 'Bouaké', minOrder: 1 },
    { id: 16, name: 'Aliment Finition 6mm', category: 'alimentation', price: 8000, unit: 'sac 25kg', stock: 180, emoji: '🌿', description: "Granulés engraissement pour dernière phase d'élevage.", seller: 'NutriAqua CI', rating: 4.5, location: 'Abidjan', minOrder: 1 },
    { id: 17, name: 'Probiotiques Aquatiques', category: 'alimentation', price: 15000, unit: 'bidon 1L', stock: 40, emoji: '💊', description: "Améliore la digestion et l'immunité des poissons.", seller: 'BioAqua', rating: 4.7, location: 'Abidjan', minOrder: 1 },
];

const CATEGORIES = [
    { id: 'all', name: 'Tout', icon: 'grid-outline', color: COLORS.primary },
    { id: 'poissons', name: 'Poissons', icon: 'fish-outline', color: '#0077B6' },
    { id: 'alevins', name: 'Alevins', icon: 'water-outline', color: '#00B4D8' },
    { id: 'equipement', name: 'Équipement', icon: 'construct-outline', color: '#48CAE4' },
    { id: 'alimentation', name: 'Alimentation', icon: 'leaf-outline', color: '#10B981' },
];

// ─── Composant principal ──────────────────────────────────────────────────────

export default function MarketplaceScreen({ navigation }) {
    const { height: windowHeight } = useWindowDimensions();
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [cart, setCart] = useState({});
    const [showCart, setShowCart] = useState(false);
    const [showReco, setShowReco] = useState(false);
    const [sellerProducts, setSellerProducts] = useState([]);

    // Quand l'utilisateur sélectionne un fournisseur dans les recommandations
    const handleSellerFromReco = (seller) => {
        setSearchQuery(seller.name);
        setSelectedCategory('all');
    };

    // Charger les produits des vendeurs (Ma Boutique)
    const loadSellerProducts = async () => {
        try {
            const raw = await AsyncStorage.getItem('@my_boutique_products');
            if (raw) setSellerProducts(JSON.parse(raw));
        } catch (e) {
            console.warn('Marketplace: impossible de charger les produits vendeurs', e);
        }
    };

    useEffect(() => {
        loadSellerProducts();
    }, []);

    const allProducts = useMemo(() => [...PRODUCTS, ...sellerProducts], [sellerProducts]);

    const filteredProducts = useMemo(() => {
        return allProducts.filter(p => {
            const matchCat = selectedCategory === 'all' || p.category === selectedCategory;
            const matchSearch =
                p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.seller.toLowerCase().includes(searchQuery.toLowerCase());
            return matchCat && matchSearch;
        });
    }, [selectedCategory, searchQuery]);

    const cartItems = useMemo(() => {
        return Object.entries(cart)
            .map(([id, qty]) => ({ product: PRODUCTS.find(p => p.id === Number(id)), qty }))
            .filter(item => item.product && item.qty > 0);
    }, [cart]);

    const totalItems = cartItems.reduce((sum, i) => sum + i.qty, 0);
    const totalPrice = cartItems.reduce((sum, i) => sum + i.product.price * i.qty, 0);

    const addToCart = (product) => {
        setCart(prev => ({ ...prev, [product.id]: (prev[product.id] || 0) + 1 }));
    };

    const updateQty = (productId, delta) => {
        setCart(prev => {
            const newQty = (prev[productId] || 0) + delta;
            if (newQty <= 0) {
                const { [productId]: _, ...rest } = prev;
                return rest;
            }
            return { ...prev, [productId]: newQty };
        });
    };

    const removeFromCart = (productId) => {
        setCart(prev => {
            const { [productId]: _, ...rest } = prev;
            return rest;
        });
    };

    // Vide le panier : ferme d'abord le modal, puis efface le panier après l'animation
    const handleClearCart = () => {
        Alert.alert('Vider le panier', 'Êtes-vous sûr ?', [
            { text: 'Non', style: 'cancel' },
            {
                text: 'Oui', style: 'destructive',
                onPress: () => {
                    setShowCart(false);
                    setTimeout(() => setCart({}), 300);
                },
            },
        ]);
    };

    // Confirme la commande : ferme le modal avant d'afficher l'alerte de succès
    const handleOrder = () => {
        const items = totalItems;
        const price = totalPrice;
        setShowCart(false);
        setTimeout(() => {
            Alert.alert(
                '✅ Commande envoyée !',
                `Votre commande de ${items} article(s) pour un total de ${price.toLocaleString()} FCFA a bien été reçue.\n\nUn vendeur vous contactera sous 24h.`,
                [{ text: 'Super, merci !', onPress: () => setCart({}) }]
            );
        }, 300);
    };

    return (
        <>
            {/* ── ScrollView racine (même pattern que DashboardScreen) ── */}
            <ScrollView
                style={[styles.container, Platform.OS === 'web' && { height: '100vh' }]}
                contentContainerStyle={{ paddingBottom: 120 }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                stickyHeaderIndices={[0, 1]}
            >
                {/* ── Header (sticky index 0) ── */}
                <LinearGradient colors={COLORS.gradients.header} style={styles.header}>
                    <View style={styles.headerTop}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                            <Ionicons name="arrow-back" size={24} color="#fff" />
                        </TouchableOpacity>
                        <View>
                            <Text style={styles.headerTitle}>Marketplace</Text>
                            <Text style={styles.headerSub}>Acheter · Vendre · Échanger</Text>
                        </View>
                        <TouchableOpacity style={styles.iconBtn} onPress={() => setShowCart(true)}>
                            <Ionicons name="cart-outline" size={24} color="#fff" />
                            {totalItems > 0 && (
                                <View style={styles.badge}>
                                    <Text style={styles.badgeText}>{totalItems}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Recherche */}
                    <View style={styles.searchBar}>
                        <Ionicons name="search" size={18} color="#666" />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Rechercher un produit, un vendeur..."
                            placeholderTextColor="#999"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchQuery('')}>
                                <Ionicons name="close-circle" size={18} color="#999" />
                            </TouchableOpacity>
                        )}
                    </View>
                </LinearGradient>

                {/* ── Catégories (sticky index 1) ── */}
                <View style={styles.catsContainer}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingHorizontal: 12 }}
                    >
                        {CATEGORIES.map(cat => {
                            const active = selectedCategory === cat.id;
                            return (
                                <TouchableOpacity
                                    key={cat.id}
                                    style={[styles.catBtn, active && { backgroundColor: cat.color, borderColor: cat.color }]}
                                    onPress={() => setSelectedCategory(cat.id)}
                                >
                                    <Ionicons name={cat.icon} size={16} color={active ? '#fff' : cat.color} />
                                    <Text style={[styles.catText, active && { color: '#fff' }]}>{cat.name}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>

                {/* ── Liste produits ── */}
                <View style={styles.list}>
                    {filteredProducts.length === 0 ? (
                        <View style={styles.empty}>
                            <MaterialCommunityIcons name="fish-off" size={64} color="#ccc" />
                            <Text style={styles.emptyText}>Aucun produit trouvé</Text>
                        </View>
                    ) : (
                        filteredProducts.map(item => {
                            const inCart = cart[item.id] || 0;
                            const catColor = CATEGORIES.find(c => c.id === item.category)?.color;
                            return (
                                <View key={item.id} style={styles.card}>
                                    {/* Badge catégorie */}
                                    <View style={[styles.catBadge, { backgroundColor: catColor + '20' }]}>
                                        <Text style={[styles.catBadgeText, { color: catColor }]}>
                                            {CATEGORIES.find(c => c.id === item.category)?.name}
                                        </Text>
                                    </View>

                                    <View style={styles.cardBody}>
                                        {/* Emoji */}
                                        <View style={styles.emojiBox}>
                                            <Text style={styles.emoji}>{item.emoji}</Text>
                                        </View>

                                        {/* Infos */}
                                        <View style={styles.cardInfo}>
                                            <Text style={styles.productName}>{item.name}</Text>
                                            <Text style={styles.productDesc} numberOfLines={2}>{item.description}</Text>

                                            {/* Vendeur + lieu */}
                                            <View style={styles.row}>
                                                <Ionicons name="storefront-outline" size={12} color="#999" />
                                                <Text style={styles.sellerText}>{item.seller}</Text>
                                                <Ionicons name="location-outline" size={12} color="#999" style={{ marginLeft: 6 }} />
                                                <Text style={styles.sellerText}>{item.location}</Text>
                                            </View>

                                            {/* Rating + stock */}
                                            <View style={styles.row}>
                                                <Ionicons name="star" size={12} color="#F59E0B" />
                                                <Text style={styles.ratingText}>{item.rating}</Text>
                                                <View style={[styles.stockBadge, { backgroundColor: item.stock > 0 ? '#10B98115' : '#EF444415' }]}>
                                                    <Text style={[styles.stockText, { color: item.stock > 0 ? '#10B981' : '#EF4444' }]}>
                                                        {item.stock > 0 ? `${item.stock} en stock` : 'Rupture'}
                                                    </Text>
                                                </View>
                                            </View>

                                            {/* Prix + panier */}
                                            <View style={styles.priceRow}>
                                                <View>
                                                    <Text style={styles.price}>{item.price.toLocaleString()} FCFA</Text>
                                                    <Text style={styles.unit}>/{item.unit} · min. {item.minOrder}</Text>
                                                </View>

                                                {inCart > 0 ? (
                                                    <View style={styles.qtyCtrl}>
                                                        <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQty(item.id, -1)}>
                                                            <Ionicons name="remove" size={18} color={COLORS.primary} />
                                                        </TouchableOpacity>
                                                        <Text style={styles.qtyText}>{inCart}</Text>
                                                        <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQty(item.id, 1)}>
                                                            <Ionicons name="add" size={18} color={COLORS.primary} />
                                                        </TouchableOpacity>
                                                    </View>
                                                ) : (
                                                    <TouchableOpacity
                                                        style={[styles.addBtn, item.stock === 0 && { opacity: 0.4 }]}
                                                        onPress={() => { if (item.stock > 0) addToCart(item); }}
                                                        disabled={item.stock === 0}
                                                    >
                                                        <Ionicons name="cart-outline" size={16} color="#fff" />
                                                        <Text style={styles.addBtnText}>Ajouter</Text>
                                                    </TouchableOpacity>
                                                )}
                                            </View>
                                        </View>
                                    </View>
                                </View>
                            );
                        })
                    )}
                </View>
            </ScrollView>

            {/* ── Bouton panier flottant ── */}
            {totalItems > 0 && (
                <TouchableOpacity style={styles.floatingCart} onPress={() => setShowCart(true)}>
                    <Ionicons name="cart" size={22} color="#fff" />
                    <Text style={styles.floatingCartText}>
                        {totalItems} article{totalItems > 1 ? 's' : ''} · {totalPrice.toLocaleString()} FCFA
                    </Text>
                    <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.7)" />
                </TouchableOpacity>
            )}

            {/* ── Modal Panier ── */}
            <Modal visible={showCart} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalSheet}>
                        {/* Header modal */}
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>🛒 Mon Panier ({totalItems})</Text>
                            <TouchableOpacity onPress={() => setShowCart(false)}>
                                <Ionicons name="close-circle" size={28} color="#999" />
                            </TouchableOpacity>
                        </View>

                        {cartItems.length === 0 ? (
                            <View style={styles.emptyCart}>
                                <Text style={styles.emptyCartEmoji}>🛒</Text>
                                <Text style={styles.emptyCartText}>Votre panier est vide</Text>
                            </View>
                        ) : (
                            <>
                                <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                                    {cartItems.map(({ product, qty }) => (
                                        <View key={product.id} style={styles.cartItem}>
                                            <Text style={styles.cartItemEmoji}>{product.emoji}</Text>
                                            <View style={styles.cartItemInfo}>
                                                <Text style={styles.cartItemName}>{product.name}</Text>
                                                <Text style={styles.cartItemSeller}>{product.seller}</Text>
                                                <Text style={styles.cartItemPrice}>{(product.price * qty).toLocaleString()} FCFA</Text>
                                            </View>
                                            <View style={styles.qtyCtrl}>
                                                <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQty(product.id, -1)}>
                                                    <Ionicons name="remove" size={16} color={COLORS.primary} />
                                                </TouchableOpacity>
                                                <Text style={styles.qtyText}>{qty}</Text>
                                                <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQty(product.id, 1)}>
                                                    <Ionicons name="add" size={16} color={COLORS.primary} />
                                                </TouchableOpacity>
                                            </View>
                                            <TouchableOpacity onPress={() => removeFromCart(product.id)} style={{ padding: 6 }}>
                                                <Ionicons name="trash-outline" size={18} color="#EF4444" />
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                </ScrollView>

                                {/* Récap + commande */}
                                <View style={styles.cartFooter}>
                                    <View style={styles.totalRow}>
                                        <Text style={styles.totalLabel}>Total</Text>
                                        <Text style={styles.totalPrice}>{totalPrice.toLocaleString()} FCFA</Text>
                                    </View>
                                    <Text style={styles.deliveryNote}>🚚 Livraison estimée : 24–48h selon votre localisation</Text>
                                    <TouchableOpacity style={styles.orderBtn} onPress={handleOrder}>
                                        <Ionicons name="checkmark-circle-outline" size={22} color="#fff" />
                                        <Text style={styles.orderBtnText}>Confirmer la commande</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.clearBtn} onPress={handleClearCart}>
                                        <Text style={styles.clearBtnText}>Vider le panier</Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}
                    </View>
                </View>
            </Modal>

            {/* ── Bouton flottant IA Recommandation ── */}
            <TouchableOpacity style={styles.floatingReco} onPress={() => setShowReco(true)} activeOpacity={0.85}>
                <LinearGradient colors={['#F97316', '#FBBF24']} style={styles.floatingRecoGrad}>
                    <Text style={styles.floatingRecoEmoji}>🤖</Text>
                    <Text style={styles.floatingRecoText}>Recommandations IA</Text>
                </LinearGradient>
            </TouchableOpacity>

            {/* ── Modal Recommandations ── */}
            <RecommendationModal
                visible={showReco}
                onClose={() => setShowReco(false)}
                onSelectSeller={handleSellerFromReco}
            />
        </>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F0F4F8' },

    // Header
    header: { paddingTop: 10, paddingBottom: 16, paddingHorizontal: 16 },
    headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
    headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff', textAlign: 'center' },
    headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', textAlign: 'center' },
    iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
    badge: { position: 'absolute', top: -4, right: -4, backgroundColor: '#EF4444', borderRadius: 9, minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 3 },
    badgeText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
    searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
    searchInput: { flex: 1, fontSize: 14, color: '#333' },

    // Catégories
    catsContainer: { backgroundColor: '#fff', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
    catBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F0F4F8', borderWidth: 1.5, borderColor: COLORS.primary + '30', marginHorizontal: 4, gap: 6 },
    catText: { fontSize: 13, fontWeight: '600', color: COLORS.primary },

    // Produits
    list: { padding: 14, paddingBottom: 110 },
    card: { backgroundColor: '#fff', borderRadius: 16, marginBottom: 14, overflow: 'hidden', elevation: 3, shadowColor: '#00A3E0', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 },
    catBadge: { paddingHorizontal: 12, paddingVertical: 5, alignSelf: 'flex-start', marginTop: 12, marginLeft: 12, borderRadius: 10 },
    catBadgeText: { fontSize: 11, fontWeight: '700' },
    cardBody: { flexDirection: 'row', padding: 12, gap: 12 },
    emojiBox: { width: 70, height: 70, borderRadius: 14, backgroundColor: '#F0F4F8', justifyContent: 'center', alignItems: 'center' },
    emoji: { fontSize: 38 },
    cardInfo: { flex: 1 },
    productName: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginBottom: 2 },
    productDesc: { fontSize: 12, color: '#64748B', marginBottom: 6, lineHeight: 17 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
    sellerText: { fontSize: 11, color: '#94A3B8' },
    ratingText: { fontSize: 12, fontWeight: '600', color: '#F59E0B', marginRight: 8 },
    stockBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
    stockText: { fontSize: 11, fontWeight: '600' },
    priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
    price: { fontSize: 18, fontWeight: '800', color: COLORS.primary },
    unit: { fontSize: 11, color: '#94A3B8' },
    addBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, gap: 6 },
    addBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
    qtyCtrl: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: COLORS.primary, borderRadius: 10, overflow: 'hidden' },
    qtyBtn: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.primary + '12' },
    qtyText: { paddingHorizontal: 10, fontSize: 15, fontWeight: '700', color: COLORS.primary },

    // Panier flottant
    floatingCart: {
        position: 'absolute', bottom: 16, left: 16, right: 16,
        backgroundColor: COLORS.primaryDark, borderRadius: 16,
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 18, paddingVertical: 14, elevation: 8, gap: 10,
    },
    floatingCartText: { flex: 1, color: '#fff', fontWeight: '700', fontSize: 15 },

    // Bouton IA flottant
    floatingReco: {
        position: 'absolute', bottom: 80, right: 16,
        borderRadius: 28, elevation: 10, shadowColor: '#F97316',
        shadowOpacity: 0.35, shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
    },
    floatingRecoGrad: {
        flexDirection: 'row', alignItems: 'center', gap: 7,
        paddingHorizontal: 16, paddingVertical: 11, borderRadius: 28,
    },
    floatingRecoEmoji: { fontSize: 18 },
    floatingRecoText: { fontSize: 13, fontWeight: '800', color: '#fff' },

    // Modal panier
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
    modalSheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%', paddingBottom: 30 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#F0F4F8' },
    modalTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
    emptyCart: { alignItems: 'center', paddingVertical: 60 },
    emptyCartEmoji: { fontSize: 60, marginBottom: 12 },
    emptyCartText: { fontSize: 16, color: '#94A3B8', fontWeight: '600' },
    cartItem: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: '#F0F4F8', gap: 10 },
    cartItemEmoji: { fontSize: 32, width: 44, textAlign: 'center' },
    cartItemInfo: { flex: 1 },
    cartItemName: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
    cartItemSeller: { fontSize: 11, color: '#94A3B8' },
    cartItemPrice: { fontSize: 14, fontWeight: '700', color: COLORS.primary, marginTop: 2 },
    cartFooter: { padding: 20, borderTopWidth: 1, borderTopColor: '#F0F4F8' },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    totalLabel: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
    totalPrice: { fontSize: 22, fontWeight: '800', color: COLORS.primaryDark },
    deliveryNote: { fontSize: 12, color: '#94A3B8', marginBottom: 14 },
    orderBtn: { flexDirection: 'row', backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 14, justifyContent: 'center', alignItems: 'center', gap: 8, marginBottom: 10 },
    orderBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
    clearBtn: { alignItems: 'center', padding: 8 },
    clearBtnText: { color: '#EF4444', fontSize: 13, fontWeight: '600' },

    // Vide
    empty: { alignItems: 'center', paddingVertical: 80 },
    emptyText: { fontSize: 16, color: '#94A3B8', fontWeight: '600', marginTop: 12 },
});
