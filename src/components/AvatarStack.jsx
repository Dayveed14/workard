import Avatar from './Avatar.jsx';
import './AvatarStack.css';

// Overlapping avatars for the people on a task: "[A][B][C] +2"
export default function AvatarStack({ people = [], size = 22, max = 3, showNames = false }) {
  const shown = people.slice(0, max);
  const names = people.map((p) => `${p.first_name} ${p.last_name}`).join(', ');
  return (
    <span className="avatar-stack" title={names}>
      <span className="avatar-stack__faces">
        {shown.map((p) => <Avatar key={p.id} name={`${p.first_name} ${p.last_name}`} src={p.photo_url} size={size} />)}
        {people.length > max && <span className="avatar-stack__more" style={{ width: size, height: size }}>+{people.length - max}</span>}
      </span>
      {showNames && <span className="avatar-stack__names">{people.length === 1 ? names : `${people[0].first_name} + ${people.length - 1}`}</span>}
    </span>
  );
}
