import { initials } from '../utils/format.js';
import './Avatar.css';

export default function Avatar({ name, src, size = 36 }) {
  return (
    <span className="avatar" style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {src ? <img src={src} alt="" /> : initials(name)}
    </span>
  );
}
