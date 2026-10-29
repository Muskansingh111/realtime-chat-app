package com.realtime.chat.chat_app_backend.repositories;

import com.realtime.chat.chat_app_backend.entities.Room;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface RoomRepository extends MongoRepository<Room,String> {
    //get a room using room id
    Room findByRoomId(String roomId) ;
    // Check whether a room already exists

   // boolean existsByRoomId(String roomId);

}
