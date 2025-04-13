import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, FlatList, TextInput, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/NavigationTypes';
import { useAuthStore } from '../store/authStore';
import axios from 'axios';

type RepositorySelectionNavigationProp = StackNavigationProp<RootStackParamList, 'RepositorySelection'>;

interface Repository {
  name: string;
  owner: { login: string };
  private: boolean;
}

const RepositorySelection = () => {
  const navigation = useNavigation<RepositorySelectionNavigationProp>();
  const token = useAuthStore((state) => state.token);
  const [repos, setRepos] = useState<Repository[]>([]);
  const [isSwitched, setIsSwitched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState<'myRepos' | 'search'>('myRepos');
  const [ownerInput, setOwnerInput] = useState('');
  const [repoInput, setRepoInput] = useState('');

  useEffect(() => {
    if (selectedOption === 'myRepos' && token) {
      fetchUserRepos();
    }
  }, [selectedOption, token]);

  const fetchUserRepos = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('https://api.github.com/user/repos', {
        headers: { Authorization: `token ${token}` },
        params: { per_page: 100 }
      });
      setRepos(response.data.filter((repo: Repository) => !repo.private));
    } catch (error) {
      console.error('Failed to fetch user repos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRepositorySelect = (owner: string, repo: string) => {
    navigation.navigate('Graph', { 
      owner, 
      repo,
      fromSelection: true
    });
  };
  const handleSwitch = () => { 
    setIsSwitched(!isSwitched);
    setSelectedOption(isSwitched ? 'myRepos' : 'search');
  }
  
  return (
    <View style={styles.container}>
      <View style={styles.optionSelector}>
        <TouchableOpacity
          style={[styles.optionButton, selectedOption === 'myRepos' && styles.selectedOption]}
          onPress={() => setSelectedOption('myRepos')}
        >
          <Text style={[styles.optionText, selectedOption === 'search' && styles.selectedOptionText]}>My Repositories</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.optionButton, selectedOption === 'search' && styles.selectedOption]}
          onPress={() => setSelectedOption('search')}
        >
          <Text style={[styles.optionText, selectedOption === 'myRepos' && styles.selectedOptionText]}>Search Public Repo</Text>
        </TouchableOpacity>
      </View>

      {selectedOption === 'myRepos' ? (
        <>
          <Text style={styles.sectionTitle}>Select a Repository:</Text>
          {isLoading ? (
            <ActivityIndicator size="large" style={styles.loader} />
          ) : (
            <FlatList
              data={repos}
              keyExtractor={(item) => item.name}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.repoItem}
                  onPress={() => handleRepositorySelect(item.owner.login, item.name)}
                >
                  <Text style={styles.repoText}>{item.owner.login}/{item.name}</Text>
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.listContainer}
            />
          )}
        </>
      ) : (
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.input}
            placeholder="Owner (e.g., facebook)"
            value={ownerInput}
            onChangeText={setOwnerInput}
          />
          <TextInput
            style={styles.input}
            placeholder="Repository (e.g., react)"
            value={repoInput}
            onChangeText={setRepoInput}
          />
          <TouchableOpacity
            style={styles.searchButton}
            onPress={() => {
              if (ownerInput && repoInput) {
                handleRepositorySelect(ownerInput, repoInput);
              }
            }}
            disabled={!ownerInput || !repoInput}
          >
            <Text style={styles.searchButtonText}>View Repository</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  optionSelector: {
    flexDirection: 'row',
    marginBottom: 20,
    justifyContent: 'space-around',
  },
  optionButton: {
    padding: 15,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  selectedOption: {
    backgroundColor: '#0366d6',
    color: '#fff',
  },
  optionText: {
    color: '#fff',
  },
  selectedOptionText: {
    color: '#000',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  listContainer: {
    paddingBottom: 20,
  },
  repoItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  repoText: {
    fontSize: 16,
  },
  loader: {
    marginTop: 20,
  },
  searchContainer: {
    marginTop: 20,
  },
  input: {
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: '#0366d6',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  searchButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default RepositorySelection;