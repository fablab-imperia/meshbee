import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { PlatformPressable } from '@react-navigation/elements';
import * as Haptics from 'expo-haptics';

export function HapticTab(props: BottomTabBarButtonProps) {
  const isSelected = props.accessibilityState?.selected;
  const activeBorderColor = isSelected ? '#0a7ea4' : 'transparent';
  const activeBackgroundColor = isSelected ? 'rgba(10, 126, 164, 0.12)' : 'transparent';

  return (
    <PlatformPressable
      {...props}
      style={[
        props.style,
        {
          borderBottomWidth: 3,
          borderBottomColor: activeBorderColor,
          backgroundColor: activeBackgroundColor,
        },
      ]}
      onPressIn={(ev) => {
        if (process.env.EXPO_OS === 'ios') {
          // Add a soft haptic feedback when pressing down on the tabs.
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        props.onPressIn?.(ev);
      }}
    />
  );
}
