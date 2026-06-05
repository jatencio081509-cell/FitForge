import { View, Text, Button } from 'react-native';
import { useUser, useAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const { user } = useUser();
  const { signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.replace('/(auth)/sign-in');
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>Profile</Text>

      {user ? (
        <>
          <Text style={{ fontSize: 18, marginBottom: 8 }}>Hello, {user.firstName || 'User'}!</Text>
          <Text style={{ color: '#666', marginBottom: 20 }}>{user.primaryEmailAddress?.emailAddress}</Text>

          <Button title="Sign Out" onPress={handleSignOut} color="#E53935" />
        </>
      ) : (
        <Text>Loading user...</Text>
      )}
    </View>
  );
}