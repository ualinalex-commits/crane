import { useColorScheme } from 'react-native';
import { Colors, type ColorScheme } from '../theme';

export function useTheme(): { colors: ColorScheme; isDark: boolean } {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  return {
    colors: (isDark ? Colors.dark : Colors.light) as ColorScheme,
    isDark,
  };
}
