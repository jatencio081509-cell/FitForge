import { View, Text, Button } from 'react-native';
import { useSignIn } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';

export default function SignIn() {
  const { signIn, isLoaded } = useSignIn();
  const router = useRouter();

  const onSignInPress = async () => {
    if (!isLoaded) return;
    // Add your sign in logic here
    router.replace('/');
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>Sign In</Text>
      <Button title="Sign In" onPress={onSignInPress} />
    </View>
  );
}