import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Modal } from 'react-native';
import FloatingAssistantButton from './FloatingAssistantButton';
import ChatbotScreen from '../screens/ChatbotScreen';
import { useAssistant } from '../contexts/AssistantContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import FloatingMarketplaceButton from './FloatingMarketplaceButton';

export default function ScreenWithAssistant({ children, hideFloatingButton = false }) {
  const [assistantVisible, setAssistantVisible] = useState(false);
  const [initialMessage, setInitialMessage] = useState(null);
  const { shouldShowWelcome, welcomeMessage, checkWelcomeStatus, dismissWelcome } = useAssistant();
  const { user } = useAuth();
  const navigation = useNavigation();

  // Vérifier si on doit afficher le message de bienvenue au premier chargement
  // DÉSACTIVÉ : Pour éviter l'ouverture automatique au démarrage
  /*
  useEffect(() => {
    if (user && user.email) {
      checkWelcomeStatus(user.email);
    }
  }, [user]);
  */

  // Afficher automatiquement l'assistant avec le message de bienvenue
  // DÉSACTIVÉ : Pour éviter l'ouverture automatique au démarrage
  /*
  useEffect(() => {
    if (shouldShowWelcome && welcomeMessage) {
      setInitialMessage(welcomeMessage);
      setAssistantVisible(true);
      dismissWelcome();
    }
  }, [shouldShowWelcome, welcomeMessage]);
  */

  const openAssistant = (contextMessage = null) => {
    setInitialMessage(contextMessage);
    setAssistantVisible(true);
  };

  // Cloner les enfants et leur passer la fonction openAssistant
  const childrenWithProps = React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, { openAssistant });
    }
    return child;
  });

  return (
    <View style={styles.container}>
      {childrenWithProps}

      {!hideFloatingButton && (
        <>
          {/* Bouton de l'assistant */}
          <FloatingAssistantButton onPress={() => openAssistant()} />

          {/* Bouton Marketplace (visible pour clients et pisciculteurs) */}
          {(user?.role === 'client' || user?.sellerType === 'pisciculteur') && (
            <FloatingMarketplaceButton onPress={() => navigation.navigate('Marketplace')} />
          )}
        </>
      )}

      <Modal
        visible={assistantVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setAssistantVisible(false);
          setInitialMessage(null);
        }}
      >
        <ChatbotScreen
          onClose={() => {
            setAssistantVisible(false);
            setInitialMessage(null);
          }}
          initialMessage={initialMessage}
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
