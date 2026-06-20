package com.messenger.mapper;

import com.messenger.entity.MsgRoom;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

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
}
