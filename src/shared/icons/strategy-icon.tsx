import type { SVGProps } from "react";

interface StrategyIconProps {
  size?: number;
  className?: string;
}

export const StrategyIcon = ({ size = 24, className = "", ...props }: StrategyIconProps & SVGProps<SVGSVGElement>) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 776 776"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    <ellipse cx="388.375" cy="387.961" rx="42.8036" ry="388.039" />
    <ellipse cx="262.068" cy="387.96" rx="37.19" ry="343.13" />
    <ellipse cx="146.286" cy="387.96" rx="32.2781" ry="292.608" opacity="0.75" />
    <ellipse cx="47.3492" cy="387.956" rx="20.3492" ry="191.564" opacity="0.5" />
    <ellipse cx="729.401" cy="387.956" rx="20.3492" ry="191.564" opacity="0.5" />
    <ellipse cx="514.68" cy="387.96" rx="37.19" ry="343.13" />
    <ellipse cx="630.458" cy="387.96" rx="32.2781" ry="292.608" opacity="0.75" />
  </svg>
);

export const StrategyIconWhite = ({ size = 24, className = "", ...props }: StrategyIconProps & SVGProps<SVGSVGElement>) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 776 776"
    fill="white"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    <ellipse cx="388.375" cy="387.961" rx="42.8036" ry="388.039" />
    <ellipse cx="262.068" cy="387.96" rx="37.19" ry="343.13" />
    <ellipse cx="146.286" cy="387.96" rx="32.2781" ry="292.608" opacity="0.75" />
    <ellipse cx="47.3492" cy="387.956" rx="20.3492" ry="191.564" opacity="0.5" />
    <ellipse cx="729.401" cy="387.956" rx="20.3492" ry="191.564" opacity="0.5" />
    <ellipse cx="514.68" cy="387.96" rx="37.19" ry="343.13" />
    <ellipse cx="630.458" cy="387.96" rx="32.2781" ry="292.608" opacity="0.75" />
  </svg>
);
