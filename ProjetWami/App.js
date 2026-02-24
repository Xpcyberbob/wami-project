import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet, TouchableOpacity, Text, Platform } from 'react-native';
import { COLORS } from './src/constants/theme';

// Import screens
import DashboardScreen from './src/screens/DashboardScreen';
import PredictionScreen from './src/screens/PredictionScreen';
import RecommendationsScreen from './src/screens/RecommendationsScreen';
import RobotControlScreen from './src/screens/RobotControlScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import ShopScreen from './src/screens/ShopScreen';
import AnnuaireScreen from './src/screens/AnnuaireScreen';
import LoginScreen from './src/screens/LoginScreen';
import SplashScreen from './src/screens/SplashScreen';
import WelcomeSelectionScreen from './src/screens/WelcomeSelectionScreen';
import MarketplaceScreen from './src/screens/MarketplaceScreen';
import MaBoutiqueScreen from './src/screens/MaBoutiqueScreen';
import ScreenWithAssistant from './src/components/ScreenWithAssistant';

// Import Auth Context
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { WaterDataProvider } from './src/contexts/WaterDataContext';
import { AssistantProvider } from './src/contexts/AssistantContext';
import { SpeechProvider } from './src/contexts/SpeechContext';
import { GamificationProvider } from './src/contexts/GamificationContext';
import { RobotProvider } from './src/contexts/RobotContext';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();
const ProfileStack = createStackNavigator();

// Stack Navigator pour le Profil
function ProfileStackScreen() {
  return (
    <ProfileStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <ProfileStack.Screen name="ProfileMain">
        {() => (
          <ScreenWithAssistant>
            <ProfileScreen />
          </ScreenWithAssistant>
        )}
      </ProfileStack.Screen>
      <ProfileStack.Screen name="Shop" component={ShopScreen} />
      <ProfileStack.Screen name="MaBoutique" component={MaBoutiqueScreen} />
    </ProfileStack.Navigator>
  );
}

// Composant pour les onglets (écrans principaux)
function MainTabs() {
  const { logout, user } = useAuth();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Tableau de bord') {
            iconName = focused ? 'water' : 'water-outline';
          } else if (route.name === 'Prédiction') {
            iconName = focused ? 'analytics' : 'analytics-outline';
          } else if (route.name === 'Recommandations') {
            iconName = focused ? 'bulb' : 'bulb-outline';
          } else if (route.name === 'Robot') {
            iconName = focused ? 'fish' : 'fish-outline';
          } else if (route.name === 'Annuaire') {
            iconName = focused ? 'book' : 'book-outline';
          } else if (route.name === 'Profil') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: 'gray',
        headerStyle: {
          backgroundColor: COLORS.primaryDark,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerRight: () => (
          <TouchableOpacity
            onPress={logout}
            style={styles.logoutButton}
          >
            <Ionicons name="log-out-outline" size={24} color="#fff" />
          </TouchableOpacity>
        ),
      })}
    >
      <Tab.Screen name="Tableau de bord">
        {() => (
          <ScreenWithAssistant>
            <DashboardScreen />
          </ScreenWithAssistant>
        )}
      </Tab.Screen>
      <Tab.Screen name="Prédiction">
        {() => (
          <ScreenWithAssistant>
            <PredictionScreen />
          </ScreenWithAssistant>
        )}
      </Tab.Screen>
      <Tab.Screen name="Recommandations">
        {() => (
          <ScreenWithAssistant>
            <RecommendationsScreen />
          </ScreenWithAssistant>
        )}
      </Tab.Screen>
      <Tab.Screen name="Robot">
        {() => (
          <ScreenWithAssistant>
            <RobotControlScreen />
          </ScreenWithAssistant>
        )}
      </Tab.Screen>
      <Tab.Screen name="Annuaire">
        {() => (
          <ScreenWithAssistant>
            <AnnuaireScreen />
          </ScreenWithAssistant>
        )}
      </Tab.Screen>
      <Tab.Screen
        name="Profil"
        component={ProfileStackScreen}
        options={{
          headerRight: null,
        }}
      />
    </Tab.Navigator>
  );
}

// Composant de navigation principal
function Navigation() {
  const { user, loading, login } = useAuth();
  const [showSplash, setShowSplash] = React.useState(null);
  const [hasShownSplashThisSession, setHasShownSplashThisSession] = React.useState(false);
  const [hasSelectedOption, setHasSelectedOption] = React.useState(false);
  const prevUserRef = React.useRef(null);

  // Afficher le splash uniquement lors d'une nouvelle connexion (pas au démarrage si déjà connecté)
  React.useEffect(() => {
    if (loading) return;

    const prev = prevUserRef.current;

    // Logout : user vient de se déconnecter → réinitialiser pour la prochaine connexion
    if (prev !== null && user === null) {
      prevUserRef.current = null;
      setHasShownSplashThisSession(false);
      setShowSplash(null);
      return;
    }

    // Login : user vient de se connecter (null → object)
    if (prev === null && user !== null && !hasShownSplashThisSession) {
      setShowSplash(true);
      setHasShownSplashThisSession(true);
    }

    prevUserRef.current = user;
  }, [loading, user]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0B5394" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  // Afficher le splash si l'utilisateur est connecté et le splash n'a pas encore été fermé
  if (user && showSplash === true) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return (
    <NavigationContainer key={user ? 'authenticated' : 'guest'}>
      <StatusBar style="light" />
      <Stack.Navigator screenOptions={{
        headerShown: false,
        cardStyle: Platform.OS === 'web' ? { height: '100vh', overflow: 'hidden' } : {},
      }}>

        {user ? (
          <>
            <Stack.Screen name="WelcomeSelection">
              {({ navigation }) => (
                <ScreenWithAssistant hideFloatingButton={true}>
                  <WelcomeSelectionScreen
                    navigation={navigation}
                    onOptionSelected={() => setHasSelectedOption(true)}
                  />
                </ScreenWithAssistant>
              )}
            </Stack.Screen>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen name="Marketplace" component={MarketplaceScreen} />
          </>
        ) : (
          <Stack.Screen name="Login">
            {() => <LoginScreen onLogin={login} />}
          </Stack.Screen>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// Composant App principal avec AuthProvider, WaterDataProvider et AssistantProvider
export default function App() {
  return (
    <View style={[{ flex: 1 }, Platform.OS === 'web' && { height: '100vh', overflow: 'hidden' }]}>
      <AuthProvider>
        <WaterDataProvider>
          <GamificationProvider>
            <RobotProvider>
              <AssistantProvider>
                <SpeechProvider>
                  <Navigation />
                </SpeechProvider>
              </AssistantProvider>
            </RobotProvider>
          </GamificationProvider>
        </WaterDataProvider>
      </AuthProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: COLORS.text.secondary,
  },
  logoutButton: {
    marginRight: 15,
    padding: 5,
  },
});
