package com.messenger.mapper;

import com.messenger.entity.MsgUser;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface UserMapper {
    MsgUser findById(@Param("id") Long id);
    MsgUser findByNickname(@Param("nickname") String nickname);
    void insert(MsgUser user);
    void updateLastSeen(@Param("id") Long id);
    int countAll();
    List<MsgUser> findAll();
}
