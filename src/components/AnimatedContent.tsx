import React, { useEffect, useRef } from 'react';
import { Animated, ViewStyle } from 'react-native';

interface AnimatedContentProps {
  children: React.ReactNode;
  style?: ViewStyle;
  duration?: number;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'fade' | 'scale';
  onAnimationComplete?: () => void;
}

const AnimatedContent: React.FC<AnimatedContentProps> = ({
  children,
  style,
  duration = 400,
  delay = 0,
  direction = 'up',
  onAnimationComplete,
}) => {
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    const animations: Animated.CompositeAnimation[] = [];

    // Animación de fade
    animations.push(
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: duration * 0.8,
        delay,
        useNativeDriver: true,
      })
    );

    // Animación de slide según dirección
    if (direction !== 'fade' && direction !== 'scale') {
      const slideValue = direction === 'up' ? 20 : direction === 'down' ? -20 : 0;
      const translateAxis = direction === 'left' || direction === 'right' ? 'translateX' : 'translateY';
      
      animations.push(
        Animated.timing(slideAnim, {
          toValue: 1,
          duration,
          delay,
          useNativeDriver: true,
        })
      );
    }

    // Animación de scale
    if (direction === 'scale') {
      animations.push(
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          delay,
          useNativeDriver: true,
        })
      );
    }

    Animated.parallel(animations).start(onAnimationComplete);
  }, [direction, duration, delay]);

  const getTransform = () => {
    const transforms: any[] = [];

    if (direction === 'up') {
      transforms.push({
        translateY: slideAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [20, 0],
        }),
      });
    } else if (direction === 'down') {
      transforms.push({
        translateY: slideAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [-20, 0],
        }),
      });
    } else if (direction === 'left') {
      transforms.push({
        translateX: slideAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [20, 0],
        }),
      });
    } else if (direction === 'right') {
      transforms.push({
        translateX: slideAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [-20, 0],
        }),
      });
    }

    if (direction === 'scale') {
      transforms.push({
        scale: scaleAnim,
      });
    }

    return transforms;
  };

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: fadeAnim,
          transform: getTransform(),
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};

export default AnimatedContent; 