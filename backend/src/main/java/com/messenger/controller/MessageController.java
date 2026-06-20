package com.messenger.controller;

import com.messenger.common.ApiResponse;
import com.messenger.mapper.RoomMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/rooms")
@RequiredArgsConstructor
public class MessageController {

    private final RoomMapper roomMapper;

    @PostMapping("/{roomId}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(
            @PathVariable Long roomId,
            Authentication authentication) {

        Long userId = (Long) authentication.getPrincipal();

        if (!roomMapper.isMember(roomId, userId)) {
            return ResponseEntity.status(403).body(ApiResponse.error("해당 채팅방에 접근 권한이 없습니다."));
        }

        roomMapper.updateLastRead(roomId, userId);
        return ResponseEntity.ok(ApiResponse.success("읽음 처리 완료", null));
    }
}
