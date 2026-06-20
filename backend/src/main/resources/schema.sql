CREATE TABLE IF NOT EXISTS msg_users (
    id BIGSERIAL PRIMARY KEY,
    nickname VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    invite_token_used VARCHAR(255),
    avatar_color VARCHAR(20) DEFAULT '#4A90D9',
    role VARCHAR(20) NOT NULL DEFAULT 'USER',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_seen_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS msg_invite_tokens (
    id BIGSERIAL PRIMARY KEY,
    token VARCHAR(255) NOT NULL UNIQUE,
    label VARCHAR(255),
    created_by BIGINT REFERENCES msg_users(id),
    max_uses INT NOT NULL DEFAULT 1,
    use_count INT NOT NULL DEFAULT 0,
    expires_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS msg_rooms (
    id BIGSERIAL PRIMARY KEY,
    room_type VARCHAR(20) NOT NULL DEFAULT 'GROUP',
    name VARCHAR(255),
    created_by BIGINT REFERENCES msg_users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS msg_room_members (
    room_id BIGINT NOT NULL REFERENCES msg_rooms(id),
    user_id BIGINT NOT NULL REFERENCES msg_users(id),
    joined_at TIMESTAMP NOT NULL DEFAULT NOW(),
    last_read_at TIMESTAMP,
    PRIMARY KEY (room_id, user_id)
);

CREATE TABLE IF NOT EXISTS msg_messages (
    id BIGSERIAL PRIMARY KEY,
    room_id BIGINT NOT NULL REFERENCES msg_rooms(id),
    sender_id BIGINT NOT NULL REFERENCES msg_users(id),
    content TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

INSERT INTO msg_rooms (id, room_type, name, created_by)
VALUES (1, 'GROUP', '전체 채팅방', NULL)
ON CONFLICT DO NOTHING;
