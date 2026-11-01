import { useId } from 'react';
import './Logo.css';

// Workard mark: blue + green "W" with an upward growth arrow
export default function Logo({ variant = 'dark', showText = true, size = 32, tagline = false }) {
  const id = useId().replace(/:/g, '');
  return (
    <span className={`logo logo--${variant}`} style={{ '--logo-size': `${size}px` }}>
      <svg className="logo__mark" viewBox="0 0 64 52" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id={`${id}b`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#3B82F6" />
            <stop offset="1" stopColor="#2563EB" />
          </linearGradient>
          <linearGradient id={`${id}g`} x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor="#14B8A6" />
            <stop offset="1" stopColor="#10B981" />
          </linearGradient>
        </defs>
        <path
          d="M6 14 L18 44 L29 20"
          fill="none"
          stroke={`url(#${id}b)`}
          strokeWidth="9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M29 20 L39 44 L52 13"
          fill="none"
          stroke={`url(#${id}g)`}
          strokeWidth="9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M45 7 L60 3 L57 18 Z" fill="#10B981" stroke="#10B981" strokeWidth="2.5" strokeLinejoin="round" />
      </svg>
      {showText && (
        <span className="logo__text">
          <span className="logo__word">Workard</span>
          {tagline && <span className="logo__tagline">Run Your Business. Grow Smarter.</span>}
        </span>
      )}
    </span>
  );
}
