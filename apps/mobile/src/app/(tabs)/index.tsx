import { View, Text } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      <Text style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 10 }}>FitForge</Text>
      <Text style={{ fontSize: 16, color: '#666' }}>Ready to train today?</Text>
    </View>
  );
}