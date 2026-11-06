import Modal from './Modal.jsx';
import Avatar from './Avatar.jsx';
import { useApi } from '../hooks/useApi.js';
import { timeAgo } from '../utils/format.js';

// Who in the group has seen / acknowledged an announcement
export default function ReadersModal({ post, onClose }) {
  const { data } = useApi(`/api/announcements/${post.id}/readers`);
  const groups = data && [
    { title: post.needs_ack ? 'Acknowledged' : 'Seen', people: data.filter((p) => (post.needs_ack ? p.acknowledgedAt : p.seenAt)) },
    ...(post.needs_ack ? [{ title: 'Seen, not acknowledged yet', people: data.filter((p) => p.seenAt && !p.acknowledgedAt) }] : []),
    { title: 'Not seen yet', people: data.filter((p) => !p.seenAt) },
  ];
  return (
    <Modal title="Who has read it" onClose={onClose} size="sm">
      {!data && <div className="page-loader"><span className="page-loader__spinner" /></div>}
      {groups?.map((g) => g.people.length > 0 && (
        <section key={g.title} className="readers__group">
          <h3>{g.title} · {g.people.length}</h3>
          <ul>
            {g.people.map((p) => (
              <li key={p.employeeId} className="person">
                <Avatar name={p.name} src={p.photoUrl} size={30} />
                <span>
                  <strong>{p.name}</strong>
                  <span>
                    {p.acknowledgedAt ? `Acknowledged ${timeAgo(p.acknowledgedAt)}` : p.seenAt ? `Seen ${timeAgo(p.seenAt)}` : p.hasLogin ? 'Not opened yet' : 'Has no Workard login'}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </Modal>
  );
}
