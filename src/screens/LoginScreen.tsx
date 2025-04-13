import React, { useState } from 'react';
import { View, StyleSheet, Button, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuthStore } from '../store/authStore';
import { RootStackParamList } from '../navigation/NavigationTypes';
import {API_KEY} from '../config/auth';
type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

export const LoginScreen = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuthStore();
  const navigation = useNavigation<LoginScreenNavigationProp>();

  const GITHUB_PERSONAL_TOKEN = API_KEY;

  const handleDemoLogin = async () => {
    setIsLoading(true);
    try {
      const user = await fetchUserInfo(GITHUB_PERSONAL_TOKEN);
      console.log('User Info:', user);
      await login(GITHUB_PERSONAL_TOKEN);
      console.log('Login successful:', user.login);
      navigation.navigate('RepositorySelection');
      console.log('Navigating to RepositorySelection');
    } catch (error) {
      Alert.alert(
        'Login Failed', 
        error instanceof Error ? error.message : 'Authentication failed'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserInfo = async (token: string) => {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }
    
    return await response.json();
  };

  return (
    <View style={styles.container}>
      {isLoading ? (
        <ActivityIndicator size="large" />
      ) : (
        <Button
          title="Login to Github"
          onPress={handleDemoLogin}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
});

export default LoginScreen;