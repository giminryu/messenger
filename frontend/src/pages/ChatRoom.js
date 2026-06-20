import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMessages, markRead } from '../services/roomService';
import Avatar from '../components/Avatar';

const WS_MAX_RETRIES = 5;
const WS_RETRY_DELAY = 3000;

function formatMessageTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function formatDateSeparator(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });
}

function isSameDay(a, b) {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

function ChatRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user, getAccessToken } = useAuth();

  const [messages, setMessages] = useState([]);
  const [roomName, setRoomName] = useState('');
  const [roomInfo, setRoomInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [wsStatus, setWsStatus] = useState('connecting'); // connecting, open, closed
  const [inputBarBottom, setInputBarBottom] = useState(0);

  const messagesEndRef = useRef(null);
  const messagesAreaRef = useRef(null);
  const wsRef = useRef(null);
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef(null);
  const inputRef = useRef(null);
  const isMountedRef = useRef(true);

  // Scroll to bottom
  const scrollToBottom = useCallback((smooth = false) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: smooth ? 'smooth' : 'auto',
        block: 'end',
      });
    }
  }, []);

  // Load messages on mount
  useEffect(() => {
    isMountedRef.current = true;
    setLoading(true);

    getMessages(roomId)
      .then((data) => {
        if (!isMountedRef.current) return;
        const msgs = Array.isArray(data) ? data : data.messages || [];
        setMessages(msgs);
        if (data.room) {
          setRoomInfo(data.room);
          setRoomName(
            data.room.name ||
              (data.room.members?.find((m) => m.id !== user?.id)?.nickname) ||
              '채팅방'
          );
        }
        setTimeout(() => scrollToBottom(false), 50);
      })
      .catch(() => {
        if (isMountedRef.current) setMessages([]);
      })
      .finally(() => {
        if (isMountedRef.current) setLoading(false);
      });

    markRead(roomId).catch(() => {});

    return () => {
      isMountedRef.current = false;
    };
  }, [roomId, user?.id, scrollToBottom]);

  // WebSocket connection
  const connectWs = useCallback(() => {
    if (!isMountedRef.current) return;
    const token = getAccessToken();
    const host = window.location.hostname;
    const wsUrl = `ws://${host}:8084/ws/chat?token=${token}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    setWsStatus('connecting');

    ws.onopen = () => {
      if (!isMountedRef.current) return;
      setWsStatus('open');
      retryCountRef.current = 0;
      // Join room
      ws.send(JSON.stringify({ type: 'JOIN', roomId }));
    };

    ws.onmessage = (event) => {
      if (!isMountedRef.current) return;
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'MESSAGE' || msg.type === 'SEND') {
          if (msg.roomId === roomId || msg.room_id === roomId) {
            setMessages((prev) => {
              // Deduplicate by id
              if (msg.id && prev.some((m) => m.id === msg.id)) return prev;
              return [...prev, msg];
            });
            setTimeout(() => scrollToBottom(true), 30);
          }
        }
      } catch (e) {
        // ignore parse errors
      }
    };

    ws.onerror = () => {
      // errors handled in onclose
    };

    ws.onclose = (event) => {
      if (!isMountedRef.current) return;
      setWsStatus('closed');
      // Reconnect logic
      if (retryCountRef.current < WS_MAX_RETRIES) {
        retryCountRef.current += 1;
        retryTimerRef.current = setTimeout(() => {
          if (isMountedRef.current) connectWs();
        }, WS_RETRY_DELAY);
      }
    };
  }, [roomId, getAccessToken, scrollToBottom]);

  useEffect(() => {
    connectWs();

    return () => {
      isMountedRef.current = false;
      clearTimeout(retryTimerRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
  }, [connectWs]);

  // iOS visual viewport handling — keep input above keyboard
  useEffect(() => {
    if (!window.visualViewport) return;

    function handleResize() {
      const vv = window.visualViewport;
      const windowHeight = window.innerHeight;
      const offset = windowHeight - vv.height - vv.offsetTop;
      setInputBarBottom(Math.max(0, offset));
    }

    window.visualViewport.addEventListener('resize', handleResize);
    window.visualViewport.addEventListener('scroll', handleResize);

    return () => {
      window.visualViewport.removeEventListener('resize', handleResize);
      window.visualViewport.removeEventListener('scroll', handleResize);
    };
  }, []);

  function sendMessage() {
    const content = inputText.trim();
    if (!content || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    wsRef.current.send(JSON.stringify({ type: 'SEND', roomId, content }));
    setInputText('');
    // Optimistically add own message
    const tempMsg = {
      id: `temp-${Date.now()}`,
      content,
      senderId: user?.id,
      sender: user,
      createdAt: new Date().toISOString(),
      isTemp: true,
    };
    setMessages((prev) => [...prev, tempMsg]);
    setTimeout(() => scrollToBottom(true), 30);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  // Group messages by date for separators
  const messageElements = useMemo(() => {
    const elements = [];
    let lastDate = null;

    messages.forEach((msg, idx) => {
      const msgDate = msg.createdAt;
      const isOwn = msg.senderId === user?.id || msg.sender?.id === user?.id;
      const senderName = msg.sender?.nickname || msg.senderName || '알 수 없음';

      // Date separator
      if (msgDate && (!lastDate || !isSameDay(lastDate, msgDate))) {
        elements.push(
          <div
            key={`date-${msgDate}-${idx}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              margin: '20px 0 12px',
            }}
          >
            <div style={{ flex: 1, height: 1, backgroundColor: '#e2e8f0' }} />
            <span
              style={{
                fontSize: 11,
                color: '#94a3b8',
                fontWeight: 500,
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              {formatDateSeparator(msgDate)}
            </span>
            <div style={{ flex: 1, height: 1, backgroundColor: '#e2e8f0' }} />
          </div>
        );
        lastDate = msgDate;
      }

      elements.push(
        <MessageBubble
          key={msg.id || `msg-${idx}`}
          msg={msg}
          isOwn={isOwn}
          senderName={senderName}
          showSender={!isOwn}
        />
      );
    });

    return elements;
  }, [messages, user?.id]);

  const headerName = roomName || roomInfo?.name || '채팅방';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#f0fdfa',
      }}
    >
      {/* Fixed Header */}
      <header
        style={{
          flexShrink: 0,
          height: 'calc(56px + env(safe-area-inset-top))',
          paddingTop: 'env(safe-area-inset-top)',
          backgroundColor: '#0f766e',
          display: 'flex',
          alignItems: 'center',
          padding: 'env(safe-area-inset-top) 12px 0',
          gap: 10,
          boxSizing: 'border-box',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          zIndex: 10,
        }}
      >
        {/* Back button */}
        <button
          onClick={() => navigate('/chat')}
          style={{
            width: 44,
            height: 44,
            border: 'none',
            background: 'none',
            color: '#fff',
            fontSize: 22,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 10,
            WebkitTapHighlightColor: 'transparent',
            flexShrink: 0,
          }}
          aria-label="뒤로가기"
        >
          ←
        </button>

        {/* Avatar + name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0, height: 56 }}>
          <Avatar name={headerName} size={36} />
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontWeight: 700,
                fontSize: 16,
                color: '#fff',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {headerName}
            </div>
            {wsStatus === 'connecting' && (
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>연결 중...</div>
            )}
            {wsStatus === 'closed' && (
              <div style={{ fontSize: 11, color: '#fca5a5' }}>연결 끊김 (재시도 중)</div>
            )}
          </div>
        </div>

        {/* Menu */}
        <button
          style={{
            width: 44,
            height: 44,
            border: 'none',
            background: 'none',
            color: '#fff',
            fontSize: 20,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 10,
            WebkitTapHighlightColor: 'transparent',
            flexShrink: 0,
          }}
          aria-label="메뉴"
        >
          ⋮
        </button>
      </header>

      {/* Messages area */}
      <div
        ref={messagesAreaRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          padding: '12px 16px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {loading ? (
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                border: '3px solid rgba(15,118,110,0.2)',
                borderTop: '3px solid #0f766e',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }}
            />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : messages.length === 0 ? (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              color: '#94a3b8',
            }}
          >
            <div style={{ fontSize: 40 }}>💬</div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>
              첫 메시지를 보내보세요!
            </p>
          </div>
        ) : (
          <>
            {messageElements}
          </>
        )}
        <div ref={messagesEndRef} style={{ height: 8 }} />
      </div>

      {/* Input bar — stays above keyboard */}
      <div
        style={{
          flexShrink: 0,
          backgroundColor: '#fff',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          padding: `10px 12px calc(10px + env(safe-area-inset-bottom))`,
          gap: 10,
          position: inputBarBottom > 0 ? 'fixed' : 'relative',
          bottom: inputBarBottom > 0 ? inputBarBottom : undefined,
          left: 0,
          right: 0,
          zIndex: 10,
          boxShadow: '0 -1px 4px rgba(0,0,0,0.06)',
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="메시지를 입력하세요..."
          style={{
            flex: 1,
            height: 40,
            padding: '0 14px',
            fontSize: 16,
            border: '1.5px solid #e2e8f0',
            borderRadius: 20,
            outline: 'none',
            backgroundColor: '#f8fafc',
            color: '#1e293b',
            boxSizing: 'border-box',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#0f766e';
            setTimeout(() => scrollToBottom(true), 300);
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#e2e8f0';
          }}
        />
        <button
          onClick={sendMessage}
          disabled={!inputText.trim()}
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            border: 'none',
            backgroundColor: inputText.trim() ? '#0f766e' : '#e2e8f0',
            color: inputText.trim() ? '#fff' : '#94a3b8',
            fontSize: 18,
            cursor: inputText.trim() ? 'pointer' : 'default',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            WebkitTapHighlightColor: 'transparent',
            userSelect: 'none',
            transition: 'background-color 0.15s, color 0.15s',
          }}
          aria-label="전송"
        >
          ↑
        </button>
      </div>
    </div>
  );
}

function MessageBubble({ msg, isOwn, senderName, showSender }) {
  const time = formatMessageTime(msg.createdAt);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isOwn ? 'flex-end' : 'flex-start',
        marginBottom: 4,
        animation: 'msgIn 0.15s ease both',
      }}
    >
      <style>{`
        @keyframes msgIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Sender name (for others) */}
      {showSender && (
        <span
          style={{
            fontSize: 11,
            color: '#64748b',
            marginBottom: 3,
            marginLeft: 50,
            fontWeight: 500,
          }}
        >
          {senderName}
        </span>
      )}

      <div
        style={{
          display: 'flex',
          flexDirection: isOwn ? 'row-reverse' : 'row',
          alignItems: 'flex-end',
          gap: 6,
          maxWidth: '80%',
        }}
      >
        {/* Avatar for others */}
        {!isOwn && (
          <Avatar
            name={senderName}
            size={34}
            style={{ marginBottom: 2, flexShrink: 0 }}
          />
        )}

        <div>
          {/* Bubble */}
          <div
            style={{
              padding: '10px 14px',
              borderRadius: isOwn ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              backgroundColor: isOwn ? '#0f766e' : '#fff',
              color: isOwn ? '#fff' : '#1e293b',
              fontSize: 15,
              lineHeight: 1.5,
              boxShadow: isOwn
                ? '0 1px 4px rgba(15,118,110,0.25)'
                : '0 1px 4px rgba(0,0,0,0.08)',
              wordBreak: 'break-word',
              opacity: msg.isTemp ? 0.7 : 1,
            }}
          >
            {msg.content}
          </div>

          {/* Time */}
          <div
            style={{
              fontSize: 10,
              color: '#94a3b8',
              marginTop: 3,
              textAlign: isOwn ? 'right' : 'left',
              paddingLeft: isOwn ? 0 : 4,
              paddingRight: isOwn ? 4 : 0,
            }}
          >
            {time}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatRoom;
