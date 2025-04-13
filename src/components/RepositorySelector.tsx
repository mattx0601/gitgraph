import React, { useState } from 'react';
import { View, StyleSheet, TextInput, Button, Text } from 'react-native';
import { useRepositoryStore } from '../store/repositoryStore';
import { useAuthStore } from '../store/authStore';

const RepositorySelector: React.FC = () => {
  const [owner, setOwner] = useState('facebook');
  const [repo, setRepo] = useState('react');
  const token = useAuthStore((state) => state.token);
  const { 
    isLoading, 
    loadBranches,
    setCurrentRepository,
    error,
    loadCommits,
    } = useRepositoryStore();
  
  const handleLoadRepository = async () => {
    if (!owner || !repo) return;
    if (!token) {
      console.error('Authentication token missing');
      return;
    }
    
    try {
      setCurrentRepository(owner, repo);
      await loadBranches(owner, repo, token);
      await loadCommits(owner, repo, null, token);
    } catch (err) {
      console.error('Failed to load repository:', err);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Owner"
        value={owner}
        onChangeText={setOwner}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <TextInput
        style={styles.input}
        placeholder="Repository"
        value={repo}
        onChangeText={setRepo}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <Button
        title={isLoading ? "Loading..." : "Load Repository"}
        onPress={handleLoadRepository}
        disabled={isLoading}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    padding: 10,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  error: {
    color: 'red',
    marginTop: 10,
    textAlign: 'center',
  },
});

export default RepositorySelector;