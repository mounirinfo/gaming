import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StorageUtils } from '../utils/storage';
import { LeaderboardEntry } from '../types';

export const LeaderboardScreen = () => {
  const navigation = useNavigation();
  const [data, setData] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    StorageUtils.getLeaderboard().then(setData);
  }, []);

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString() + ' ' + new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>TOP 10</Text>
      
      <FlatList
        data={data}
        keyExtractor={(item: LeaderboardEntry, index: number) => index.toString()}
        ListEmptyComponent={<Text style={styles.empty}>No scores yet!</Text>}
        renderItem={({ item, index }: { item: LeaderboardEntry; index: number }) => (
          <View style={styles.row}>
            <Text style={styles.rank}>#{index + 1}</Text>
            <View style={styles.info}>
              <Text style={styles.score}>{Math.floor(item.score)}</Text>
              <Text style={styles.date}>{formatDate(item.date)}</Text>
            </View>
          </View>
        )}
      />

      <TouchableOpacity style={styles.btn} onPress={() => navigation.goBack()}>
        <Text style={styles.btnText}>BACK</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2c3e50',
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 30,
    color: '#f1c40f',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
  },
  empty: {
    color: 'white',
    textAlign: 'center',
    marginTop: 50,
    fontSize: 18,
  },
  row: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.2)',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  rank: {
    color: '#f1c40f',
    fontSize: 24,
    fontWeight: 'bold',
    width: 50,
  },
  info: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  score: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  date: {
    color: '#95a5a6',
    fontSize: 12,
  },
  btn: {
    backgroundColor: '#34495e',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  btnText: { color: 'white' },
});