import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { LiveKitRoom, VideoConference, RoomAudioRenderer, useRoomContext } from '@livekit/components-react';
import { RoomEvent } from 'livekit-client';
import '@livekit/components-styles';
import { ArrowLeft, ListChecks, X } from 'lucide-react';
import StandupBoard from '../../../components/StandupBoard.jsx';
import { api } from '../../../api/client.js';
import { useApi } from '../../../hooks/useApi.js';
import { todayString } from '../../../utils/format.js';
import './Meetings.css';

// The stand-up panel beside the video. Whoever clicks a person "presents" them:
// the choice is sent to everyone in the room over LiveKit's data channel, so all screens follow.
function StandupPanel({ meetingId, date, onClose }) {
  const room = useRoomContext();
  const { data, reload } = useApi(`/api/meetings/${meetingId}/standup?date=${date}`);
  const [focus, setFocus] = useState(null);

  useEffect(() => {
    const onData = (payload, _participant, _kind, topic) => {
      if (topic !== 'standup') return;
      try {
        const msg = JSON.parse(new TextDecoder().decode(payload));
        setFocus(msg.focus ?? null);
      } catch {
        // ignore anything that isn't ours
      }
    };
    room.on(RoomEvent.DataReceived, onData);
    const timer = setInterval(reload, 30_000); // ticks made during the meeting show up
    return () => {
      room.off(RoomEvent.DataReceived, onData);
      clearInterval(timer);
    };
  }, [room, reload]);

  const present = useCallback(
    (personId) => {
      setFocus(personId);
      const bytes = new TextEncoder().encode(JSON.stringify({ focus: personId }));
      room.localParticipant.publishData(bytes, { reliable: true, topic: 'standup' }).catch(() => {});
    },
    [room]
  );

  return (
    <aside className="room__panel">
      <button type="button" className="icon-btn room__panel-close" onClick={onClose} aria-label="Hide stand-up"><X size={18} /></button>
      {data ? <StandupBoard data={data} focus={focus} onFocus={present} compact /> : <div className="page-loader"><span className="page-loader__spinner" /></div>}
    </aside>
  );
}

// /meetings/:id/room?date=YYYY-MM-DD — the video room (LiveKit)
export default function MeetingRoom() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const date = params.get('date') || todayString();
  const [join, setJoin] = useState(null);
  const [error, setError] = useState('');
  const [panel, setPanel] = useState(true);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    api(`/api/meetings/${id}/join?date=${date}`, { method: 'POST' }).then(setJoin).catch((err) => setError(err.message));
  }, [id, date]);

  const leave = () => navigate(`/meetings/${id}?date=${date}`);

  if (error) {
    return (
      <div className="room room--message">
        <p>{error}</p>
        <button type="button" className="btn btn--outline" onClick={leave}><ArrowLeft size={16} /> Back to the meeting</button>
      </div>
    );
  }
  if (!join) return <div className="room room--message"><span className="page-loader__spinner" /> <p>Getting your seat…</p></div>;

  return (
    <div className="room" data-lk-theme="default">
      <header className="room__bar">
        <button type="button" className="room__back" onClick={leave}><ArrowLeft size={16} /> {join.title}</button>
        {join.isStandup && !panel && (
          <button type="button" className="room__toggle" onClick={() => setPanel(true)}><ListChecks size={16} /> Show stand-up</button>
        )}
      </header>
      <LiveKitRoom
        serverUrl={join.url}
        token={join.token}
        connect
        video={false}
        audio
        onConnected={() => setConnected(true)}
        // Leaving (or being removed) after joining → back to the meeting page
        onDisconnected={() => connected && leave()}
        onError={(err) => setError(`Couldn’t connect to the video service. Check your internet and try again. (${err.message})`)}
        className="room__lk"
      >
        <div className={`room__main ${join.isStandup && panel ? 'with-panel' : ''}`}>
          <div className="room__video"><VideoConference /></div>
          {join.isStandup && panel && <StandupPanel meetingId={id} date={date} onClose={() => setPanel(false)} />}
        </div>
        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  );
}
