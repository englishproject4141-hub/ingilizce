import { View, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing } from '../../constants/theme';
import { Home, Compass, BookOpen, RotateCcw, User } from 'lucide-react-native';

const { width } = Dimensions.get('window');

const TABS = [
  { id: 'home', icon: Home },
  { id: 'discover', icon: Compass },
  { id: 'reading', icon: BookOpen },
  { id: 'review', icon: RotateCcw },
  { id: 'profile', icon: User },
];

export const FloatingNav = ({ activeTab }: { activeTab: string }) => {
  const router = useRouter();

  const handlePress = (id: string) => {
    if (id === 'home') router.push('/');
    if (id === 'review') router.push('/words');
    // Diğerleri için şimdilik boş
  };

  return (
    <View style={styles.container}>
      <View style={styles.bar}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <TouchableOpacity 
              key={tab.id} 
              style={styles.tab}
              onPress={() => handlePress(tab.id)}
            >
              <Icon 
                size={22} 
                color={isActive ? Colors.text.primary : Colors.text.muted} 
                strokeWidth={isActive ? 2 : 1.5} 
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 34,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: Spacing.outer,
  },
  bar: {
    width: '100%',
    height: 72,
    backgroundColor: 'rgba(251, 248, 244, 0.95)', // Secondary surface with slight transparency
    borderRadius: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    // Very subtle shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  tab: {
    padding: 12,
  },
});
