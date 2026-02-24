import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    TextInput, Alert, Modal, SafeAreaView, FlatList,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';
import { COLORS } from '../constants/theme';

const STORAGE_KEY = '@my_boutique_products';

const SELLER_CATEGORIES = {
    pisciculteur: [
        { id: 'poissons', name: 'Poissons frais', icon: '🐟' },
        { id: 'alevins', name: 'Alevins & géniteurs', icon: '🐠' },
    ],
    fournisseur: [
        { id: 'alimentation', name: 'Alimentation', icon: '🌾' },
        { id: 'equipement', name: 'Équipement', icon: '⚙️' },
    ],
};

const UNITS = ['kg', 'pièce', 'sac 10kg', 'sac 25kg', 'bidon 1L', 'kit', 'lot'];

export default function MaBoutiqueScreen({ navigation }) {
    const { user } = useAuth();
    const sellerType = user?.sellerType || 'pisciculteur';
    const categories = SELLER_CATEGORIES[sellerType] || SELLER_CATEGORIES.pisciculteur;

    const [products, setProducts] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editProduct, setEditProduct] = useState(null); // null = nouveau

    // Champs du formulaire
    const [formName, setFormName] = useState('');
    const [formPrice, setFormPrice] = useState('');
    const [formUnit, setFormUnit] = useState(UNITS[0]);
    const [formStock, setFormStock] = useState('');
    const [formDesc, setFormDesc] = useState('');
    const [formCategory, setFormCategory] = useState(categories[0].id);
    const [formEmoji, setFormEmoji] = useState(categories[0].icon);

    // Chargement initial
    useEffect(() => {
        AsyncStorage.getItem(STORAGE_KEY).then(raw => {
            if (raw) setProducts(JSON.parse(raw));
        });
    }, []);

    const saveProducts = async (list) => {
        setProducts(list);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
        // Déclencher un événement global pour que MarketplaceScreen se mette à jour
        await AsyncStorage.setItem('@boutique_updated', Date.now().toString());
    };

    const openNewForm = () => {
        setEditProduct(null);
        setFormName(''); setFormPrice(''); setFormUnit(UNITS[0]);
        setFormStock(''); setFormDesc('');
        setFormCategory(categories[0].id);
        setFormEmoji(categories[0].icon);
        setShowForm(true);
    };

    const openEditForm = (p) => {
        setEditProduct(p);
        setFormName(p.name); setFormPrice(String(p.price)); setFormUnit(p.unit);
        setFormStock(String(p.stock)); setFormDesc(p.description);
        setFormCategory(p.category); setFormEmoji(p.emoji);
        setShowForm(true);
    };

    const handleSave = async () => {
        if (!formName.trim() || !formPrice.trim() || !formStock.trim()) {
            Alert.alert('Erreur', 'Nom, prix et stock sont obligatoires'); return;
        }
        const price = parseInt(formPrice, 10);
        const stock = parseInt(formStock, 10);
        if (isNaN(price) || price <= 0) { Alert.alert('Erreur', 'Prix invalide'); return; }
        if (isNaN(stock) || stock < 0) { Alert.alert('Erreur', 'Stock invalide'); return; }

        const entry = {
            id: editProduct ? editProduct.id : 'seller_' + Date.now(),
            name: formName.trim(),
            price,
            unit: formUnit,
            stock,
            description: formDesc.trim() || formName.trim(),
            category: formCategory,
            emoji: formEmoji,
            seller: user?.name || 'Vendeur',
            location: 'Côte d\'Ivoire',
            rating: 4.5,
            minOrder: 1,
            sellerOwned: true,
            sellerId: user?.email,
        };

        let updated;
        if (editProduct) {
            updated = products.map(p => p.id === editProduct.id ? entry : p);
        } else {
            updated = [...products, entry];
        }
        await saveProducts(updated);
        setShowForm(false);
    };

    const handleDelete = (id) => {
        Alert.alert('Supprimer', 'Êtes-vous sûr de vouloir supprimer ce produit ?', [
            { text: 'Annuler', style: 'cancel' },
            {
                text: 'Supprimer', style: 'destructive', onPress: async () => {
                    await saveProducts(products.filter(p => p.id !== id));
                }
            },
        ]);
    };

    const sellerLabel = sellerType === 'pisciculteur' ? '🐟 Pisciculteur' : '📦 Fournisseur';

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <LinearGradient colors={COLORS.gradients.header} style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={styles.headerTitle}>Ma Boutique</Text>
                    <Text style={styles.headerSub}>{sellerLabel} · {products.length} produit{products.length !== 1 ? 's' : ''}</Text>
                </View>
                <TouchableOpacity style={styles.addBtn} onPress={openNewForm}>
                    <Ionicons name="add" size={26} color="#fff" />
                </TouchableOpacity>
            </LinearGradient>

            {/* Liste produits */}
            {products.length === 0 ? (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyEmoji}>{sellerType === 'pisciculteur' ? '🐟' : '📦'}</Text>
                    <Text style={styles.emptyTitle}>Aucun produit encore</Text>
                    <Text style={styles.emptyDesc}>
                        {sellerType === 'pisciculteur'
                            ? 'Ajoutez vos poissons et alevins à vendre sur la Marketplace'
                            : 'Ajoutez vos aliments et équipements à vendre sur la Marketplace'}
                    </Text>
                    <TouchableOpacity style={styles.emptyBtn} onPress={openNewForm}>
                        <Ionicons name="add-circle-outline" size={20} color="#fff" />
                        <Text style={styles.emptyBtnText}>Ajouter un produit</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 30 }} showsVerticalScrollIndicator={false}>
                    {products.map(p => (
                        <View key={p.id} style={styles.productCard}>
                            <View style={styles.productLeft}>
                                <Text style={styles.productEmoji}>{p.emoji}</Text>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.productName}>{p.name}</Text>
                                    <Text style={styles.productMeta}>
                                        {p.price.toLocaleString()} FCFA/{p.unit} · Stock: {p.stock}
                                    </Text>
                                    {p.description ? (
                                        <Text style={styles.productDesc} numberOfLines={1}>{p.description}</Text>
                                    ) : null}
                                </View>
                            </View>
                            <View style={styles.productActions}>
                                <TouchableOpacity style={styles.editBtn} onPress={() => openEditForm(p)}>
                                    <Ionicons name="create-outline" size={20} color={COLORS.primary} />
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(p.id)}>
                                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}
                </ScrollView>
            )}

            {/* FAB ajouter */}
            {products.length > 0 && (
                <TouchableOpacity style={styles.fab} onPress={openNewForm}>
                    <Ionicons name="add" size={28} color="#fff" />
                </TouchableOpacity>
            )}

            {/* ─── Modal Formulaire Produit ─── */}
            <Modal visible={showForm} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalSheet}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{editProduct ? 'Modifier le produit' : 'Nouveau produit'}</Text>
                            <TouchableOpacity onPress={() => setShowForm(false)}>
                                <Ionicons name="close-circle" size={28} color="#999" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" style={{ padding: 20 }}>
                            {/* Catégorie */}
                            <Text style={styles.fieldLabel}>Catégorie</Text>
                            <View style={styles.catRow}>
                                {categories.map(c => (
                                    <TouchableOpacity
                                        key={c.id}
                                        style={[styles.catChip, formCategory === c.id && styles.catChipActive]}
                                        onPress={() => { setFormCategory(c.id); setFormEmoji(c.icon); }}
                                    >
                                        <Text>{c.icon}</Text>
                                        <Text style={[styles.catChipText, formCategory === c.id && { color: COLORS.primary }]}>
                                            {c.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Nom */}
                            <Text style={styles.fieldLabel}>Nom du produit *</Text>
                            <TextInput
                                style={styles.fieldInput} placeholder="Ex: Tilapia du Nil"
                                value={formName} onChangeText={setFormName}
                            />

                            {/* Prix + Unité (côte à côte) */}
                            <View style={styles.row2}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.fieldLabel}>Prix (FCFA) *</Text>
                                    <TextInput
                                        style={styles.fieldInput} placeholder="5000"
                                        value={formPrice} onChangeText={setFormPrice} keyboardType="numeric"
                                    />
                                </View>
                                <View style={{ width: 12 }} />
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.fieldLabel}>Unité</Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
                                        {UNITS.map(u => (
                                            <TouchableOpacity
                                                key={u}
                                                style={[styles.unitChip, formUnit === u && styles.unitChipActive]}
                                                onPress={() => setFormUnit(u)}
                                            >
                                                <Text style={[styles.unitChipText, formUnit === u && { color: COLORS.primary }]}>{u}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>
                            </View>

                            {/* Stock */}
                            <Text style={styles.fieldLabel}>Stock disponible *</Text>
                            <TextInput
                                style={styles.fieldInput} placeholder="100"
                                value={formStock} onChangeText={setFormStock} keyboardType="numeric"
                            />

                            {/* Description */}
                            <Text style={styles.fieldLabel}>Description (optionnel)</Text>
                            <TextInput
                                style={[styles.fieldInput, { height: 80, textAlignVertical: 'top', paddingTop: 10 }]}
                                placeholder="Décrivez votre produit..."
                                value={formDesc} onChangeText={setFormDesc}
                                multiline numberOfLines={3}
                            />

                            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                                <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                                <Text style={styles.saveBtnText}>{editProduct ? 'Enregistrer' : 'Publier dans la Marketplace'}</Text>
                            </TouchableOpacity>
                            <View style={{ height: 30 }} />
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F0F4F8' },

    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16, gap: 12 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
    headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
    addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },

    emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    emptyEmoji: { fontSize: 72, marginBottom: 16 },
    emptyTitle: { fontSize: 22, fontWeight: '800', color: '#1E293B', marginBottom: 8 },
    emptyDesc: { fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 22, marginBottom: 28 },
    emptyBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.primary, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14 },
    emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

    productCard: {
        backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 12,
        flexDirection: 'row', alignItems: 'center',
        elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6,
    },
    productLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
    productEmoji: { fontSize: 36, width: 48, textAlign: 'center' },
    productName: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
    productMeta: { fontSize: 13, color: COLORS.primary, fontWeight: '600', marginTop: 2 },
    productDesc: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
    productActions: { flexDirection: 'row', gap: 8 },
    editBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.primary + '15', justifyContent: 'center', alignItems: 'center' },
    deleteBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#FEF2F2', justifyContent: 'center', alignItems: 'center' },

    fab: {
        position: 'absolute', bottom: 24, right: 24,
        width: 56, height: 56, borderRadius: 28,
        backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center',
        elevation: 6, shadowColor: COLORS.primary, shadowOpacity: 0.4, shadowRadius: 8,
    },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
    modalSheet: { backgroundColor: '#fff', borderTopLeftRadius: 26, borderTopRightRadius: 26, maxHeight: '92%', paddingBottom: 10 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#F0F4F8' },
    modalTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B' },

    fieldLabel: { fontSize: 13, fontWeight: '700', color: '#475569', marginBottom: 6, marginTop: 14 },
    fieldInput: {
        backgroundColor: '#F8FAFC', borderWidth: 1.5, borderColor: '#E2E8F0',
        borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
        fontSize: 15, color: '#1E293B',
    },
    catRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginBottom: 4 },
    catChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F0F4F8', borderWidth: 1.5, borderColor: '#E2E8F0' },
    catChipActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '10' },
    catChipText: { fontSize: 13, fontWeight: '600', color: '#475569' },
    row2: { flexDirection: 'row', alignItems: 'flex-start' },
    unitChip: { paddingHorizontal: 12, paddingVertical: 7, backgroundColor: '#F0F4F8', borderRadius: 10, marginRight: 6, borderWidth: 1.5, borderColor: '#E2E8F0' },
    unitChipActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '10' },
    unitChipText: { fontSize: 12, fontWeight: '600', color: '#475569' },
    saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 14, marginTop: 20 },
    saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
