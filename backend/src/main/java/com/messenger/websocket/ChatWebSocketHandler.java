package com.messenger.websocket;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.messenger.entity.MsgMessage;
import com.messenger.mapper.MessageMapper;
import com.messenger.mapper.RoomMapper;
import com.messenger.security.JwtTokenProvider;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Component
public class ChatWebSocketHandler extends TextWebSocketHandler {

    private final JwtTokenProvider jwtTokenProvider;
    private final RoomMapper roomMapper;
    private final MessageMapper messageMapper;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate;

    /** FCF 백엔드 내부 알림 엔드포인트 기본 URL */
    @Value("${fcf.base-url:http://localhost:8080}")
    private String fcfBaseUrl;

    /** FCF 내부 통신 시크릿 */
    @Value("${fcf.internal-secret:fcf-messenger-internal-2024}")
    private String fcfInternalSecret;

    // sessionId -> SessionInfo
    private final Map<String, SessionInfo> sessions = new ConcurrentHashMap<>();

    public ChatWebSocketHandler(JwtTokenProvider jwtTokenProvider,
                                RoomMapper roomMapper,
                                MessageMapper messageMapper) {
        this.jwtTokenProvider = jwtTokenProvider;
        this.roomMapper = roomMapper;
        this.messageMapper = messageMapper;
        this.objectMapper = new ObjectMapper();
        this.objectMapper.registerModule(new JavaTimeModule());
        this.objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        this.restTemplate = new RestTemplate();
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        String token = extractToken(session);
        if (token == null || !jwtTokenProvider.validateToken(token)) {
            log.warn("WebSocket connection rejected: invalid or missing token");
            session.close(CloseStatus.NOT_ACCEPTABLE);
            return;
        }

        Long userId = jwtTokenProvider.getUserIdFromToken(token);
        String nickname = jwtTokenProvider.getNicknameFromToken(token);

        SessionInfo info = new SessionInfo(session, userId, nickname, null);
        sessions.put(session.getId(), info);
        log.debug("WebSocket connected: sessionId={}, userId={}, nickname={}", session.getId(), userId, nickname);
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        SessionInfo info = sessions.get(session.getId());
        if (info == null) {
            session.close(CloseStatus.NOT_ACCEPTABLE);
            return;
        }

        JsonNode payload;
        try {
            payload = objectMapper.readTree(message.getPayload());
        } catch (Exception e) {
            log.warn("Invalid JSON from session {}: {}", session.getId(), e.getMessage());
            return;
        }

        String type = payload.has("type") ? payload.get("type").asText() : "";

        switch (type) {
            case "JOIN" -> handleJoin(session, info, payload);
            case "SEND" -> handleSend(session, info, payload);
            case "LEAVE" -> handleLeave(session, info);
            default -> log.warn("Unknown message type: {}", type);
        }
    }

    private void handleJoin(WebSocketSession session, SessionInfo info, JsonNode payload) throws IOException {
        if (!payload.has("roomId")) return;
        Long roomId = payload.get("roomId").asLong();

        if (!roomMapper.isMember(roomId, info.getUserId())) {
            sendError(session, "Not a member of this room");
            return;
        }

        info.setCurrentRoomId(roomId);
        log.debug("User {} joined room {}", info.getNickname(), roomId);

        // Broadcast JOIN to all members in the room
        Map<String, Object> joinMsg = new HashMap<>();
        joinMsg.put("type", "JOIN");
        joinMsg.put("roomId", roomId);
        joinMsg.put("userId", info.getUserId());
        joinMsg.put("nickname", info.getNickname());
        joinMsg.put("timestamp", LocalDateTime.now().toString());

        broadcastToRoom(roomId, joinMsg, null);
    }

    private void handleSend(WebSocketSession session, SessionInfo info, JsonNode payload) throws IOException {
        if (!payload.has("roomId") || !payload.has("content")) return;

        Long roomId = payload.get("roomId").asLong();
        String content = payload.get("content").asText().trim();

        if (content.isEmpty()) return;

        if (!roomMapper.isMember(roomId, info.getUserId())) {
            sendError(session, "Not a member of this room");
            return;
        }

        // Save message to DB
        MsgMessage msg = MsgMessage.builder()
                .roomId(roomId)
                .senderId(info.getUserId())
                .content(content)
                .build();
        messageMapper.insert(msg);

        // Build broadcast payload
        Map<String, Object> msgPayload = new HashMap<>();
        msgPayload.put("type", "MESSAGE");
        msgPayload.put("id", msg.getId());
        msgPayload.put("roomId", roomId);
        msgPayload.put("senderId", info.getUserId());
        msgPayload.put("senderNickname", info.getNickname());
        msgPayload.put("content", content);
        msgPayload.put("createdAt", LocalDateTime.now().toString());

        // Broadcast to all room members regardless of their currentRoomId
        broadcastToRoomMembers(roomId, msgPayload);

        // 오프라인 멤버에게 FCM 푸시 알림 발송
        sendFcmNotification(roomId, info.getUserId(), info.getNickname(), content);
    }

    private void handleLeave(WebSocketSession session, SessionInfo info) throws IOException {
        if (info.getCurrentRoomId() == null) return;

        Long roomId = info.getCurrentRoomId();
        Map<String, Object> leaveMsg = new HashMap<>();
        leaveMsg.put("type", "LEAVE");
        leaveMsg.put("roomId", roomId);
        leaveMsg.put("userId", info.getUserId());
        leaveMsg.put("nickname", info.getNickname());
        leaveMsg.put("timestamp", LocalDateTime.now().toString());

        info.setCurrentRoomId(null);
        broadcastToRoom(roomId, leaveMsg, session.getId());
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        SessionInfo info = sessions.remove(session.getId());
        if (info != null && info.getCurrentRoomId() != null) {
            Long roomId = info.getCurrentRoomId();
            Map<String, Object> leaveMsg = new HashMap<>();
            leaveMsg.put("type", "LEAVE");
            leaveMsg.put("roomId", roomId);
            leaveMsg.put("userId", info.getUserId());
            leaveMsg.put("nickname", info.getNickname());
            leaveMsg.put("timestamp", LocalDateTime.now().toString());

            broadcastToRoom(roomId, leaveMsg, session.getId());
            log.debug("WebSocket disconnected: userId={}, roomId={}", info.getUserId(), roomId);
        }
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) throws Exception {
        log.error("WebSocket transport error for session {}: {}", session.getId(), exception.getMessage());
        sessions.remove(session.getId());
    }

    /**
     * Broadcast to all sessions that are currently joined to this room.
     */
    private void broadcastToRoom(Long roomId, Map<String, Object> payload, String excludeSessionId) {
        String json;
        try {
            json = objectMapper.writeValueAsString(payload);
        } catch (Exception e) {
            log.error("Failed to serialize message", e);
            return;
        }

        for (Map.Entry<String, SessionInfo> entry : sessions.entrySet()) {
            if (excludeSessionId != null && entry.getKey().equals(excludeSessionId)) continue;
            SessionInfo s = entry.getValue();
            if (roomId.equals(s.getCurrentRoomId()) && s.getSession().isOpen()) {
                try {
                    s.getSession().sendMessage(new TextMessage(json));
                } catch (IOException e) {
                    log.warn("Failed to send to session {}: {}", entry.getKey(), e.getMessage());
                }
            }
        }
    }

    /**
     * Broadcast to all sessions whose user is a member of the room (regardless of currentRoomId).
     * Used for new messages so users get notifications even when in a different room.
     */
    private void broadcastToRoomMembers(Long roomId, Map<String, Object> payload) {
        String json;
        try {
            json = objectMapper.writeValueAsString(payload);
        } catch (Exception e) {
            log.error("Failed to serialize message", e);
            return;
        }

        for (Map.Entry<String, SessionInfo> entry : sessions.entrySet()) {
            SessionInfo s = entry.getValue();
            if (!s.getSession().isOpen()) continue;
            try {
                if (roomMapper.isMember(roomId, s.getUserId())) {
                    s.getSession().sendMessage(new TextMessage(json));
                }
            } catch (IOException e) {
                log.warn("Failed to send to session {}: {}", entry.getKey(), e.getMessage());
            }
        }
    }

    /**
     * FCF 백엔드 내부 알림 엔드포인트를 호출하여 FCM 푸시 알림 발송
     * 채팅방 멤버 중 발신자를 제외한 전원에게 발송 (수신 여부는 FCF가 판단)
     *
     * @param roomId         채팅방 ID
     * @param senderUserId   발신자 메신저 사용자 ID (제외 대상)
     * @param senderNickname 발신자 닉네임 (알림 제목으로 사용)
     * @param content        메시지 내용
     */
    private void sendFcmNotification(Long roomId, Long senderUserId, String senderNickname, String content) {
        try {
            List<Long> targetFcfUserIds = roomMapper.findMemberFcfUserIds(roomId, senderUserId);
            if (targetFcfUserIds.isEmpty()) return;

            Map<String, Object> payload = new HashMap<>();
            payload.put("senderNickname", senderNickname);
            payload.put("content", content.length() > 100 ? content.substring(0, 100) + "..." : content);
            payload.put("targetFcfUserIds", targetFcfUserIds);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("X-Internal-Secret", fcfInternalSecret);

            restTemplate.postForEntity(
                    fcfBaseUrl + "/api/internal/messenger/notify",
                    new HttpEntity<>(payload, headers),
                    Map.class
            );
        } catch (Exception e) {
            log.warn("FCM 알림 발송 요청 실패 — roomId: {}, error: {}", roomId, e.getMessage());
        }
    }

    private void sendError(WebSocketSession session, String errorMessage) throws IOException {
        Map<String, Object> error = new HashMap<>();
        error.put("type", "ERROR");
        error.put("message", errorMessage);
        session.sendMessage(new TextMessage(objectMapper.writeValueAsString(error)));
    }

    private String extractToken(WebSocketSession session) {
        String query = session.getUri() != null ? session.getUri().getQuery() : null;
        if (query == null) return null;
        for (String param : query.split("&")) {
            String[] kv = param.split("=", 2);
            if (kv.length == 2 && "token".equals(kv[0])) {
                return kv[1];
            }
        }
        return null;
    }

    // Inner class to hold session metadata
    public static class SessionInfo {
        private final WebSocketSession session;
        private final Long userId;
        private final String nickname;
        private Long currentRoomId;

        public SessionInfo(WebSocketSession session, Long userId, String nickname, Long currentRoomId) {
            this.session = session;
            this.userId = userId;
            this.nickname = nickname;
            this.currentRoomId = currentRoomId;
        }

        public WebSocketSession getSession() { return session; }
        public Long getUserId() { return userId; }
        public String getNickname() { return nickname; }
        public Long getCurrentRoomId() { return currentRoomId; }
        public void setCurrentRoomId(Long currentRoomId) { this.currentRoomId = currentRoomId; }
    }
}
