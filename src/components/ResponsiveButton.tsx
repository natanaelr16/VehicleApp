import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import { getResponsiveDimensions, getResponsiveColors } from '../utils/responsive';

interface ResponsiveButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'outline';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

const ResponsiveButton: React.FC<ResponsiveButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
  fullWidth = false,
}) => {
  const dimensions = getResponsiveDimensions();
  const colors = getResponsiveColors();

  const getVariantStyles = (): { button: ViewStyle; text: TextStyle } => {
    switch (variant) {
      case 'primary':
        return {
          button: {
            backgroundColor: colors.primary,
            borderColor: colors.primary,
          },
          text: { color: colors.surface },
        };
      case 'secondary':
        return {
          button: {
            backgroundColor: colors.secondary,
            borderColor: colors.secondary,
          },
          text: { color: colors.surface },
        };
      case 'danger':
        return {
          button: {
            backgroundColor: colors.error,
            borderColor: colors.error,
          },
          text: { color: colors.surface },
        };
      case 'success':
        return {
          button: {
            backgroundColor: colors.success,
            borderColor: colors.success,
          },
          text: { color: colors.surface },
        };
      case 'outline':
        return {
          button: {
            backgroundColor: 'transparent',
            borderColor: colors.primary,
            borderWidth: 2,
          },
          text: { color: colors.primary },
        };
      default:
        return {
          button: {
            backgroundColor: colors.primary,
            borderColor: colors.primary,
          },
          text: { color: colors.surface },
        };
    }
  };

  const getSizeStyles = (): { button: ViewStyle; text: TextStyle } => {
    switch (size) {
      case 'small':
        return {
          button: {
            height: dimensions.button.height * 0.8,
            paddingHorizontal: dimensions.padding.medium,
          },
          text: { fontSize: dimensions.fontSize.small },
        };
      case 'large':
        return {
          button: {
            height: dimensions.button.height * 1.2,
            paddingHorizontal: dimensions.padding.large,
          },
          text: { fontSize: dimensions.fontSize.large },
        };
      default:
        return {
          button: {
            height: dimensions.button.height,
            paddingHorizontal: dimensions.padding.medium,
          },
          text: { fontSize: dimensions.fontSize.medium },
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  const buttonStyle: ViewStyle = {
    ...styles.button,
    ...variantStyles.button,
    ...sizeStyles.button,
    borderRadius: dimensions.button.borderRadius,
    opacity: disabled ? 0.6 : 1,
    width: fullWidth ? '100%' : 'auto',
    ...style,
  };

  const textStyleCombined: TextStyle = {
    ...styles.text,
    ...variantStyles.text,
    ...sizeStyles.text,
    ...textStyle,
  };

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator 
          color={variantStyles.text.color} 
          size="small" 
        />
      ) : (
        <Text style={textStyleCombined}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default ResponsiveButton; 