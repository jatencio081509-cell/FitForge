import { View, Text, FlatList, TouchableOpacity } from 'react-native';

const workouts = [
  { id: '1', title: 'Full Body Strength', duration: '45 min', level: 'Intermediate' },
  { id: '2', title: 'HIIT Cardio Blast', duration: '25 min', level: 'Advanced' },
  { id: '3', title: 'Upper Body Focus', duration: '40 min', level: 'Beginner' },
];

export default function WorkoutsScreen() {
  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}>Workouts</Text>

      <FlatList
        data={workouts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={{
              backgroundColor: '#f5f5f5',
              padding: 16,
              borderRadius: 12,
              marginBottom: 12,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: '600' }}>{item.title}</Text>
            <Text style={{ color: '#666', marginTop: 4 }}>
              {item.duration} • {item.level}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}