package com.messenger.controller;

import com.messenger.common.ApiResponse;
import com.messenger.entity.MsgMessage;
import com.messenger.entity.MsgRoom;
import com.messenger.entity.MsgUser;
import com.messenger.mapper.MessageMapper;
import com.messenger.mapper.RoomMapper;
import com.messenger.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class RoomController {

    private final RoomMapper roomMapper;
    private final MessageMapper messageMapper;
    private final UserMapper userMapper;

    @GetMapping("/rooms")
    public ResponseEntity<ApiResponse<List<MsgRoom>>> getRooms(Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        List<MsgRoom> rooms = roomMapper.findRoomsByUserId(userId);
        return ResponseEntity.ok(ApiResponse.success(rooms));
    }

    @PostMapping("/rooms/direct")
    public ResponseEntity<ApiResponse<MsgRoom>> getOrCreateDirectRoom(
            @RequestBody Map<String, Long> body,
            Authentication authentication) {

        Long myId = (Long) authentication.getPrincipal();
        Long targetUserId = body.get("targetUserId");

        if (targetUserId == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("targetUserId가 필요합니다."));
        }
        if (myId.equals(targetUserId)) {
            return ResponseEntity.badRequest().body(ApiResponse.error("자기 자신과 DM을 시작할 수 없습니다."));
        }

        MsgUser targetUser = userMapper.findById(targetUserId);
        if (targetUser == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("대상 사용자를 찾을 수 없습니다."));
        }

        // Check if direct room already exists
        MsgRoom existing = roomMapper.findDirectRoom(myId, targetUserId);
        if (existing != null) {
            existing.setOtherNickname(targetUser.getNickname());
            return ResponseEntity.ok(ApiResponse.success(existing));
        }

        // Create new direct room
        MsgRoom room = MsgRoom.builder()
                .roomType("DIRECT")
                .name(null)
                .createdBy(myId)
                .build();
        roomMapper.insert(room);
        roomMapper.addMember(room.getId(), myId);
        roomMapper.addMember(room.getId(), targetUserId);

        room.setOtherNickname(targetUser.getNickname());
        return ResponseEntity.ok(ApiResponse.success("DM 방이 생성되었습니다.", room));
    }

    @GetMapping("/rooms/{roomId}/messages")
    public ResponseEntity<ApiResponse<List<MsgMessage>>> getMessages(
            @PathVariable Long roomId,
            @RequestParam(defaultValue = "50") int limit,
            Authentication authentication) {

        Long userId = (Long) authentication.getPrincipal();

        if (!roomMapper.isMember(roomId, userId)) {
            return ResponseEntity.status(403).body(ApiResponse.error("해당 채팅방에 접근 권한이 없습니다."));
        }

        List<MsgMessage> messages = messageMapper.findByRoomId(roomId, limit);
        return ResponseEntity.ok(ApiResponse.success(messages));
    }

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> listUsers(Authentication authentication) {
        Long myId = (Long) authentication.getPrincipal();
        List<MsgUser> users = userMapper.findAll();

        List<Map<String, Object>> result = users.stream()
                .map(u -> {
                    Map<String, Object> userMap = new HashMap<>();
                    userMap.put("id", u.getId());
                    userMap.put("nickname", u.getNickname());
                    userMap.put("avatarColor", u.getAvatarColor());
                    userMap.put("role", u.getRole());
                    userMap.put("lastSeenAt", u.getLastSeenAt());
                    userMap.put("isMe", u.getId().equals(myId));
                    return userMap;
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.success(result));
    }
}
