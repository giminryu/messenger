package com.messenger.controller;

import com.messenger.common.ApiResponse;
import com.messenger.entity.MsgInviteToken;
import com.messenger.mapper.InviteMapper;
import com.messenger.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/invite")
@RequiredArgsConstructor
public class InviteController {

    private final InviteMapper inviteMapper;

    @GetMapping("/validate/{token}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> validateToken(@PathVariable String token) {
        MsgInviteToken inviteToken = inviteMapper.findByToken(token);

        Map<String, Object> result = new HashMap<>();
        if (inviteToken == null) {
            result.put("valid", false);
            result.put("reason", "존재하지 않는 토큰입니다.");
            return ResponseEntity.ok(ApiResponse.success(result));
        }
        if (inviteToken.getExpiresAt() != null && inviteToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            result.put("valid", false);
            result.put("reason", "만료된 토큰입니다.");
            result.put("label", inviteToken.getLabel());
            return ResponseEntity.ok(ApiResponse.success(result));
        }
        if (inviteToken.getUseCount() >= inviteToken.getMaxUses()) {
            result.put("valid", false);
            result.put("reason", "사용 횟수를 초과한 토큰입니다.");
            result.put("label", inviteToken.getLabel());
            return ResponseEntity.ok(ApiResponse.success(result));
        }

        result.put("valid", true);
        result.put("label", inviteToken.getLabel());
        result.put("usesRemaining", inviteToken.getMaxUses() - inviteToken.getUseCount());
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PostMapping("/create")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> createToken(
            @RequestBody Map<String, Object> body,
            Authentication authentication) {

        Long adminId = (Long) authentication.getPrincipal();
        String label = (String) body.getOrDefault("label", "초대 링크");
        int maxUses = body.containsKey("maxUses") ? ((Number) body.get("maxUses")).intValue() : 1;
        int expiresInDays = body.containsKey("expiresInDays") ? ((Number) body.get("expiresInDays")).intValue() : 7;

        String tokenValue = UUID.randomUUID().toString().replace("-", "");
        LocalDateTime expiresAt = expiresInDays > 0
                ? LocalDateTime.now().plusDays(expiresInDays)
                : null;

        MsgInviteToken inviteToken = MsgInviteToken.builder()
                .token(tokenValue)
                .label(label)
                .createdBy(adminId)
                .maxUses(maxUses)
                .useCount(0)
                .expiresAt(expiresAt)
                .build();
        inviteMapper.insert(inviteToken);

        Map<String, Object> result = new HashMap<>();
        result.put("id", inviteToken.getId());
        result.put("token", tokenValue);
        result.put("label", label);
        result.put("maxUses", maxUses);
        result.put("expiresAt", expiresAt);
        result.put("inviteUrl", "/register?invite=" + tokenValue);

        return ResponseEntity.ok(ApiResponse.success("초대 토큰이 생성되었습니다.", result));
    }

    @GetMapping("/list")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<MsgInviteToken>>> listTokens() {
        List<MsgInviteToken> tokens = inviteMapper.findAll();
        return ResponseEntity.ok(ApiResponse.success(tokens));
    }
}
