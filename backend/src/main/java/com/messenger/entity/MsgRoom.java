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
public class MsgRoom {
    private Long id;
    private String roomType;
    private String name;
    private Long createdBy;
    private LocalDateTime createdAt;

    // Transient fields for DIRECT rooms and room list display
    private String otherNickname;
    private int unreadCount;
    private String lastMessage;
    private LocalDateTime lastMessageAt;
}
