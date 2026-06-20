package com.messenger.controller;

import com.messenger.common.ApiResponse;
import com.messenger.entity.MsgInviteToken;
import com.messenger.entity.MsgUser;
import com.messenger.mapper.InviteMapper;
import com.messenger.mapper.RoomMapper;
import com.messenger.mapper.UserMapper;
import com.messenger.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserMapper userMapper;
    private final InviteMapper inviteMapper;
    private final RoomMapper roomMapper;
    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordEncoder passwordEncoder;

    private static final List<String> AVATAR_COLORS = List.of(
            "#4A90D9", "#E74C3C", "#2ECC71", "#F39C12", "#9B59B6",
            "#1ABC9C", "#E67E22", "#3498DB", "#E91E63", "#00BCD4"
    );

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<Map<String, Object>>> register(@RequestBody Map<String, String> body) {
        String nickname = body.get("nickname");
        String password = body.get("password");
        String inviteToken = body.get("inviteToken");

        if (nickname == null || nickname.isBlank() || password == null || password.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("닉네임과 비밀번호를 입력하세요."));
        }
        if (inviteToken == null || inviteToken.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("초대 토큰이 필요합니다."));
        }

        // Validate invite token
        MsgInviteToken token = inviteMapper.findByToken(inviteToken);
        if (token == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("유효하지 않은 초대 토큰입니다."));
        }
        if (token.getExpiresAt() != null && token.getExpiresAt().isBefore(LocalDateTime.now())) {
            return ResponseEntity.badRequest().body(ApiResponse.error("만료된 초대 토큰입니다."));
        }
        if (token.getUseCount() >= token.getMaxUses()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("초대 토큰 사용 횟수를 초과했습니다."));
        }

        // Check nickname uniqueness
        if (userMapper.findByNickname(nickname) != null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("이미 사용 중인 닉네임입니다."));
        }

        // Determine role: first user becomes ADMIN
        int userCount = userMapper.countAll();
        String role = (userCount == 0) ? "ADMIN" : "USER";

        // Pick avatar color based on current count
        String avatarColor = AVATAR_COLORS.get(userCount % AVATAR_COLORS.size());

        // Hash password and insert user
        MsgUser user = MsgUser.builder()
                .nickname(nickname)
                .passwordHash(passwordEncoder.encode(password))
                .inviteTokenUsed(inviteToken)
                .avatarColor(avatarColor)
                .role(role)
                .isActive(true)
                .build();
        userMapper.insert(user);

        // Increment invite token use_count
        inviteMapper.incrementUseCount(inviteToken);

        // Add user to global group room (id=1)
        roomMapper.addMember(1L, user.getId());

        // Generate tokens
        String accessToken = jwtTokenProvider.generateToken(user.getId(), user.getNickname(), user.getRole());
        String refreshToken = jwtTokenProvider.generateRefreshToken(user.getId(), user.getNickname(), user.getRole());

        Map<String, Object> data = buildAuthResponse(user, accessToken, refreshToken);
        return ResponseEntity.ok(ApiResponse.success("회원가입 성공", data));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<Map<String, Object>>> login(@RequestBody Map<String, String> body) {
        String nickname = body.get("nickname");
        String password = body.get("password");

        if (nickname == null || password == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("닉네임과 비밀번호를 입력하세요."));
        }

        MsgUser user = userMapper.findByNickname(nickname);
        if (user == null || !passwordEncoder.matches(password, user.getPasswordHash())) {
            return ResponseEntity.badRequest().body(ApiResponse.error("닉네임 또는 비밀번호가 올바르지 않습니다."));
        }
        if (!user.isActive()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("비활성화된 계정입니다."));
        }

        userMapper.updateLastSeen(user.getId());

        String accessToken = jwtTokenProvider.generateToken(user.getId(), user.getNickname(), user.getRole());
        String refreshToken = jwtTokenProvider.generateRefreshToken(user.getId(), user.getNickname(), user.getRole());

        Map<String, Object> data = buildAuthResponse(user, accessToken, refreshToken);
        return ResponseEntity.ok(ApiResponse.success("로그인 성공", data));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<Map<String, Object>>> refresh(@RequestBody Map<String, String> body) {
        String refreshToken = body.get("refreshToken");
        if (refreshToken == null || !jwtTokenProvider.validateToken(refreshToken)) {
            return ResponseEntity.badRequest().body(ApiResponse.error("유효하지 않은 리프레시 토큰입니다."));
        }

        Long userId = jwtTokenProvider.getUserIdFromToken(refreshToken);
        String nickname = jwtTokenProvider.getNicknameFromToken(refreshToken);
        String role = jwtTokenProvider.getRoleFromToken(refreshToken);

        MsgUser user = userMapper.findById(userId);
        if (user == null || !user.isActive()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("사용자를 찾을 수 없습니다."));
        }

        String newAccessToken = jwtTokenProvider.generateToken(userId, nickname, role);
        String newRefreshToken = jwtTokenProvider.generateRefreshToken(userId, nickname, role);

        Map<String, Object> data = buildAuthResponse(user, newAccessToken, newRefreshToken);
        return ResponseEntity.ok(ApiResponse.success("토큰 갱신 성공", data));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout() {
        return ResponseEntity.ok(ApiResponse.success("로그아웃 성공", null));
    }

    private Map<String, Object> buildAuthResponse(MsgUser user, String accessToken, String refreshToken) {
        Map<String, Object> userInfo = new HashMap<>();
        userInfo.put("id", user.getId());
        userInfo.put("nickname", user.getNickname());
        userInfo.put("avatarColor", user.getAvatarColor());
        userInfo.put("role", user.getRole());
        userInfo.put("isActive", user.isActive());
        userInfo.put("createdAt", user.getCreatedAt());

        Map<String, Object> data = new HashMap<>();
        data.put("accessToken", accessToken);
        data.put("refreshToken", refreshToken);
        data.put("user", userInfo);
        return data;
    }
}
