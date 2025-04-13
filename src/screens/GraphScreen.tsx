import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, FlatList, Button, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useRepositoryStore } from '../store/repositoryStore';
import { useAuthStore } from '../store/authStore';
import { RootStackParamList } from '../navigation/NavigationTypes';

type GraphScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Graph'>;

const GraphScreen = ({ route }: { route: any }) => {
  const navigation = useNavigation<GraphScreenNavigationProp>();
  const token = useAuthStore((state) => state.token);
  const {
    branches,
    isLoading,
    error,
    loadBranches,
    loadCommits,
    selectBranch,
    selectedBranch,
    setCurrentRepository,
  } = useRepositoryStore();

  const { owner = 'facebook', repo = 'react', fromSelection = false } = route.params || {};
  const [preSelectedOwner, setPreSelectedOwner] = useState(owner);
  const [preSelectedRepo, setPreSelectedRepo] = useState(repo);

  useEffect(() => {
    if (token) {
      setCurrentRepository(owner, repo);
      loadBranches(owner, repo, token);
      if (fromSelection) {
        loadCommits(owner, repo, 'main', token);
      }
    }
  }, [token, owner, repo, fromSelection]);

  useEffect(() => {
    if (route.params?.owner) setPreSelectedOwner(route.params.owner);
    if (route.params?.repo) setPreSelectedRepo(route.params.repo);
  }, [route.params]);

  const handleBranchSelect = (branchName: string) => {
    selectBranch(branchName);
    loadCommits(preSelectedOwner, preSelectedRepo, branchName, token);
    navigation.navigate('Repository');

  };

  const handleLoadRepository = async () => {
    if (!preSelectedOwner || !preSelectedRepo) return;
    navigation.setParams({
      owner: preSelectedOwner,
      repo: preSelectedRepo,
      fromSelection: false
    });
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.repositorySelector}>
        <TextInput
          style={styles.input}
          placeholder="Owner"
          value={preSelectedOwner}
          onChangeText={setPreSelectedOwner}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TextInput
          style={styles.input}
          placeholder="Repository"
          value={preSelectedRepo}
          onChangeText={setPreSelectedRepo}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Button
          title={isLoading ? "Loading..." : "Load Repository"}
          onPress={handleLoadRepository}
          disabled={isLoading}
        />
      </View>

      {branches.length > 0 && (
        <>
          <Text style={styles.branchTitle}>Select a Branch:</Text>
          <FlatList
            data={branches}
            keyExtractor={(item) => item.name}
            renderItem={({ item }) => (
              <Button
                title={item.name}
                onPress={() => handleBranchSelect(item.name)}
                color={selectedBranch === item.name ? 'green' : undefined}
              />
            )}
            contentContainerStyle={styles.branchList}
          />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  repositorySelector: {
    marginBottom: 20,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  branchTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  branchList: {
    paddingBottom: 20,
  },
  error: {
    color: 'red',
    textAlign: 'center',
  },
});

export default GraphScreen;