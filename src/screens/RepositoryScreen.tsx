import React from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { useRepositoryStore } from '../store/repositoryStore';
import BranchCommitGraph from '../components/BranchCommitGraph';

const RepositoryScreen = () => {
  const { 
    branches, 
    commits, 
    selectedBranch,
    currentOwner,
    currentRepo,
    isLoading,
    error
  } = useRepositoryStore();

  return (
    <ScrollView 
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.header}>
        {currentOwner}/{currentRepo}
      </Text>
      
      {selectedBranch && (
        <Text style={styles.subheader}>
          Branch: {selectedBranch} • {commits.length} commits
        </Text>
      )}

      <BranchCommitGraph 
        branches={branches}
        commits={commits}
        selectedBranch={selectedBranch}
      />

      {isLoading && <Text style={styles.loading}>Loading more commits...</Text>}
      {error && <Text style={styles.error}>{error}</Text>}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#24292e',
    marginBottom: 10,
  },
  subheader: {
    fontSize: 16,
    color: '#586069',
    marginBottom: 20,
  },
  loading: {
    textAlign: 'center',
    color: '#0366d6',
    marginTop: 20,
  },
  error: {
    color: '#cb2431',
    textAlign: 'center',
    marginTop: 20,
  },
});

export default RepositoryScreen;