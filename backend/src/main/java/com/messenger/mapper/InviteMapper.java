package com.messenger.mapper;

import com.messenger.entity.MsgInviteToken;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface InviteMapper {
    MsgInviteToken findByToken(@Param("token") String token);
    void insert(MsgInviteToken token);
    void incrementUseCount(@Param("token") String token);
    List<MsgInviteToken> findAll();
}
