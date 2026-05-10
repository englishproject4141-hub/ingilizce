import { View, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing } from '../../constants/theme';
import { Home, Compass, BookOpen, RotateCcw, User } from 'lucide-react-native';

const { width } = Dimensions.get('window');

const TABS = [
  { id: 'home', icon: Home, path: '/' },
  { id: 'discover', icon: Compass, path: '/discover' },
  { id: 'listen', icon: BookOpen, path: '/listen' },
  { id: 'review', icon: RotateCcw, path: '/words' },
  { id: 'profile', icon: User, path: '/profile' },
];

export const FloatingNav = ({ activeTab }: { activeTab: string }) => {
  const router = useRouter();

  const handlePress = (path: string) => {
    router.push(path as any);
  };

  return (
    <View style={styles.bar}>
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;
        return (
          <TouchableOpacity 
            key={tab.id} 
            style={styles.tab}
            onPress={() => handlePress(tab.path)}
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
  );
};

const styles = StyleSheet.create({
  bar: {
    width: width - 48,
    height: 72,
    backgroundColor: 'rgba(251, 248, 244, 0.95)',
    borderRadius: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(30, 43, 74, 0.05)',
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
