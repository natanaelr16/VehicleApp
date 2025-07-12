import { useRef, useEffect } from 'react';
import { Animated } from 'react-native';

interface UseTabAnimationProps {
  activeTab: string;
  duration?: number;
}

export const useTabAnimation = ({ activeTab, duration = 400 }: UseTabAnimationProps) => {
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    // Resetear animaciones
    slideAnim.setValue(0);
    fadeAnim.setValue(0);
    scaleAnim.setValue(0.95);

    // Animar entrada cuando cambia el tab
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: duration * 0.8,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: duration * 0.6,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [activeTab, duration]);

  const getAnimatedStyle = () => ({
    opacity: fadeAnim,
    transform: [
      {
        translateY: slideAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [15, 0],
        }),
      },
      {
        scale: scaleAnim,
      },
    ],
  });

  return {
    slideAnim,
    fadeAnim,
    scaleAnim,
    getAnimatedStyle,
  };
}; 