import React from 'react';
import './input.scss';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  styles?: React.CSSProperties;
  className?: string;
}

export const Input: React.FC<InputProps> = ({ className, ...props }) => {
  return (
    <input
      className={`input ${className || ''}`}
      {...props}
    />
  );
};

export default Input; 