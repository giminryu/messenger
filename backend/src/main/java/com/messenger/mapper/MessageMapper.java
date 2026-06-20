package com.messenger.mapper;

import com.messenger.entity.MsgMessage;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface MessageMapper {
    void insert(MsgMessage msg);
    List<MsgMessage> findByRoomId(@Param("roomId") Long roomId, @Param("limit") int limit);
    MsgMessage findLastMessage(@Param("roomId") Long roomId);
    int countUnread(@Param("roomId") Long roomId, @Param("userId") Long userId);
}
