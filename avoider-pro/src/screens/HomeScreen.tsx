import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StorageUtils } from '../utils/storage';

export const HomeScreen = () => {
  const navigation = useNavigation<any>();
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    StorageUtils.isTutorialSeen().then(seen => {
      if (!seen) setShowTutorial(true);
    });
  }, []);

  const closeTutorial = () => {
    StorageUtils.setTutorialSeen();
    setShowTutorial(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>AVOIDER</Text>
      <Text style={styles.subtitle}>Top-Down Survival</Text>

      <View style={styles.menu}>
        <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('Game')}>
          <Text style={styles.btnText}>PLAY GAME</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('Leaderboard')}>
          <Text style={styles.btnText}>LEADERBOARD</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('Options')}>
          <Text style={styles.btnText}>OPTIONS</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={showTutorial} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>How to Play</Text>
            <Text style={styles.modalText}>
              1. Tap Left/Right to move.{'\n'}
              2. Swipe to Dash.{'\n'}
              3. Avoid Red Blocks.{'\n'}
              4. Collect Power-ups!
            </Text>
            <TouchableOpacity style={styles.btn} onPress={closeTutorial}>
              <Text style={styles.btnText}>GOT IT</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2c3e50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 50,
    fontWeight: '900',
    color: '#3498db',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 20,
    color: '#bdc3c7',
    marginBottom: 60,
  },
  menu: {
    width: '80%',
  },
  btn: {
    backgroundColor: '#2980b9',
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
    alignItems: 'center',
  },
  btnText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 30,
    borderRadius: 20,
    width: '80%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 30,
    color: '#333',
  },
});