import React from 'react';

interface LordIconProps {
  src: string;
  trigger?: string;
  delay?: string;
  stroke?: string;
  style?: React.CSSProperties;
  className?: string;
  loop?: boolean;
  colors?: string;
}

export const LordIcon: React.FC<LordIconProps> = ({ 
  src, 
  trigger = 'hover', 
  delay, 
  stroke, 
  style, 
  className,
  loop,
  colors 
}) => {
  return React.createElement('lord-icon', {
    src,
    trigger,
    delay,
    stroke,
    style,
    className,
    loop,
    colors
  });
};
