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
public class MsgInviteToken {
    private Long id;
    private String token;
    private String label;
    private Long createdBy;
    private int maxUses;
    private int useCount;
    private LocalDateTime expiresAt;
    private LocalDateTime createdAt;
}
