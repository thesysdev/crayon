interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  text: React.ReactNode;
  variant?: "primary" | "secondary" | "tertiary";
  size?: "small" | "medium" | "large";
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

const Button = (props: ButtonProps) => {
  return (
    
  );
};

export default Button;
