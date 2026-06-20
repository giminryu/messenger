package com.messenger.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MsgUser {
    private Long id;
    private String nickname;
    private String passwordHash;
    private String inviteTokenUsed;
    private String avatarColor;
    private boolean isActive;
    private String role;
    private LocalDateTime lastSeenAt;
    private LocalDateTime createdAt;
}
