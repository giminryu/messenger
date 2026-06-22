package com.messenger.mapper;

import com.messenger.entity.MsgRoom;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

import java.util.List;

@Mapper
public interface RoomMapper {
    MsgRoom findById(@Param("id") Long id);
    void insert(MsgRoom room);
    void addMember(@Param("roomId") Long roomId, @Param("userId") Long userId);
    List<MsgRoom> findRoomsByUserId(@Param("userId") Long userId);
    MsgRoom findDirectRoom(@Param("userId1") Long userId1, @Param("userId2") Long userId2);
    boolean isMember(@Param("roomId") Long roomId, @Param("userId") Long userId);
    void updateLastRead(@Param("roomId") Long roomId, @Param("userId") Long userId);

    /**
     * 채팅방 멤버들의 FCF 사용자 ID 목록 조회
     * 메시지 수신 알림 발송 시 FCF 백엔드에 전달할 대상 ID 목록에 사용
     *
     * @param roomId    채팅방 ID
     * @param excludeUserId 제외할 메신저 사용자 ID (발신자)
     * @return FCF 사용자 ID 목록
     */
    List<Long> findMemberFcfUserIds(@Param("roomId") Long roomId, @Param("excludeUserId") Long excludeUserId);
}
