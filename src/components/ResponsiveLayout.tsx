import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { getResponsiveDimensions, isTablet } from '../utils/responsive';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: 'small' | 'medium' | 'large' | 'xlarge' | 'none';
  maxWidth?: boolean;
  center?: boolean;
}

const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  children,
  style,
  padding = 'medium',
  maxWidth = true,
  center = true,
}) => {
  const dimensions = getResponsiveDimensions();
  const tablet = isTablet();

  const containerStyle: ViewStyle = {
    flex: 1,
    padding: padding === 'none' ? 0 : dimensions.padding[padding],
    ...(maxWidth && {
      maxWidth: dimensions.layout.maxWidth,
      alignSelf: center ? 'center' : 'flex-start',
      width: '100%',
    }),
    ...style,
  };

  return <View style={containerStyle}>{children}</View>;
};

export default ResponsiveLayout; 