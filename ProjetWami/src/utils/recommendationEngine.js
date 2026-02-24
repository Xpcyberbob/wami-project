/**
 * Moteur de recommandation WAMI
 * Score = 50% proximité géographique + 50% meilleur prix
 */
import sellersData from '../data/sellers.json';

// ─── Haversine distance (km) ────────────────────────────────────────────────
export function haversineDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Rayon de la Terre en km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
}

// ─── Liste des villes disponibles ────────────────────────────────────────────
export const CITIES = sellersData.cities;
export const CITY_NAMES = Object.keys(sellersData.cities).sort();

// ─── Moteur de recommandation ─────────────────────────────────────────────────
/**
 * Retourne les meilleures recommandations pour une catégorie et une ville.
 * @param {string} category - 'poissons' | 'alevins' | 'equipement' | 'alimentation' | 'all'
 * @param {string} userCity - Nom de la ville de l'utilisateur
 * @param {number} maxResults - Nombre max de résultats (défaut 5)
 * @returns {Array} - Vendeurs triés par score combiné
 */
export function getRecommendations(category, userCity, maxResults = 5) {
    const sellers = sellersData.sellers;
    const userCoords = CITIES[userCity];

    if (!userCoords) return [];

    // 1. Filtrer par catégorie
    const filtered = sellers.filter(s =>
        category === 'all' || s.specialties.includes(category)
    );

    if (filtered.length === 0) return [];

    // 2. Calculer la distance et le prix moyen pour chaque vendeur
    const withMetrics = filtered.map(seller => {
        const distance = haversineDistance(
            userCoords.lat, userCoords.lng,
            seller.lat, seller.lng
        );

        // Prix moyen de la catégorie demandée (ou global)
        const relevantProducts = category === 'all'
            ? seller.products
            : seller.products.filter(p => p.category === category);

        const avgPrice = relevantProducts.length > 0
            ? relevantProducts.reduce((sum, p) => sum + p.price, 0) / relevantProducts.length
            : Infinity;

        const minPrice = relevantProducts.length > 0
            ? Math.min(...relevantProducts.map(p => p.price))
            : Infinity;

        return { ...seller, distance, avgPrice, minPrice, relevantProducts };
    });

    // 3. Normaliser les scores (0 = meilleur, 1 = pire)
    const distances = withMetrics.map(s => s.distance);
    const prices = withMetrics.filter(s => s.minPrice !== Infinity).map(s => s.minPrice);

    const maxDist = Math.max(...distances, 1);
    const maxPrice = Math.max(...prices, 1);
    const minPrice = Math.min(...prices, 0);
    const priceRange = maxPrice - minPrice || 1;

    // 4. Score combiné — plus le score est BAS, plus c'est recommandé
    const scored = withMetrics.map(seller => {
        const distScore = seller.distance / maxDist;           // 0 = très proche
        const priceScore = (seller.minPrice - minPrice) / priceRange; // 0 = moins cher

        const combinedScore = distScore * 0.5 + priceScore * 0.5;

        return { ...seller, combinedScore, distScore, priceScore };
    });

    // 5. Trier par score (meilleur en premier) + rating en tiebreaker
    scored.sort((a, b) => {
        const diff = a.combinedScore - b.combinedScore;
        if (Math.abs(diff) < 0.01) return b.rating - a.rating; // tiebreak par note
        return diff;
    });

    return scored.slice(0, maxResults);
}

// ─── Labels de catégorie ──────────────────────────────────────────────────────
export const CATEGORY_LABELS = {
    poissons: { label: 'Poissons frais', emoji: '🐟', color: '#0077B6' },
    alevins: { label: 'Alevins & Géniteurs', emoji: '🐠', color: '#00B4D8' },
    equipement: { label: 'Équipements', emoji: '⚙️', color: '#48CAE4' },
    alimentation: { label: 'Alimentation', emoji: '🌿', color: '#10B981' },
    all: { label: 'Tout type', emoji: '🛒', color: '#0B5394' },
};
