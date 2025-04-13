import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import { useAuthStore } from '../store/authStore';
import LoginScreen from '../screens/LoginScreen';
import GraphScreen from '../screens/GraphScreen';
import RepositoryScreen from '../screens/RepositoryScreen';
import RepositorySelection from '../screens/Selection';

const Stack = createStackNavigator();

export function AppNavigator() {
  return (
    <Stack.Navigator id={undefined} initialRouteName="Login">
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="RepositorySelection" component={RepositorySelection} />
      <Stack.Screen name="Graph" component={GraphScreen} />
      <Stack.Screen name="Repository" component={RepositoryScreen} />
    </Stack.Navigator>
  );
}