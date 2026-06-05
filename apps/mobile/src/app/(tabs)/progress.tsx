import { View, Text } from 'react-native';

export default function ProgressScreen() {
  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>Your Progress</Text>

      <View style={{ backgroundColor: '#f0f0f0', padding: 20, borderRadius: 12, marginBottom: 16 }}>
        <Text style={{ fontSize: 16, color: '#666' }}>Workouts Completed</Text>
        <Text style={{ fontSize: 36, fontWeight: 'bold', marginTop: 8 }}>24</Text>
      </View>

      <View style={{ backgroundColor: '#f0f0f0', padding: 20, borderRadius: 12 }}>
        <Text style={{ fontSize: 16, color: '#666' }}>Current Streak</Text>
        <Text style={{ fontSize: 36, fontWeight: 'bold', marginTop: 8 }}>7 days</Text>
      </View>
    </View>
  );
}