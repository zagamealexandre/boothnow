import React from 'react';
import { Text } from 'react-native';

interface TabBarIconProps {
  route: {
    name: string;
  };
  focused: boolean;
  color: string;
  size: number;
}

export default function TabBarIcon({ route, focused, color, size }: TabBarIconProps) {
  const getIcon = (routeName: string) => {
    switch (routeName) {
      case 'Home':
        return '🏠';
      case 'History':
        return '📋';
      case 'Profile':
        return '👤';
      default:
        return '❓';
    }
  };

  return (
    <Text style={{ fontSize: size, color }}>
      {getIcon(route.name)}
    </Text>
  );
}
