
package com.realtime.chat.chat_app_backend.controllers;

import com.realtime.chat.chat_app_backend.entities.Message;
import com.realtime.chat.chat_app_backend.entities.Room;
import com.realtime.chat.chat_app_backend.payload.MessageRequest;
import com.realtime.chat.chat_app_backend.repositories.RoomRepository;

import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

import java.time.LocalDateTime;

@Controller
public class ChatController {

    private final RoomRepository roomRepository;

    public ChatController(RoomRepository roomRepository) {
        this.roomRepository = roomRepository;
    }

    @MessageMapping("/sendMessage/{roomId}")
    @SendTo("/topic/room/{roomId}")
    public Message sendMessage(
            @DestinationVariable String roomId,
            @Payload MessageRequest request) {

        Room room = roomRepository.findByRoomId(roomId);

        if (room == null) {
            throw new IllegalArgumentException("Room not found");
        }

        boolean hasText = request.getContent() != null
                && !request.getContent().isBlank();

        boolean hasAttachment = request.getAttachmentUrl() != null
                && !request.getAttachmentUrl().isBlank()
                && request.getAttachmentName() != null
                && !request.getAttachmentName().isBlank();

        if (!hasText && !hasAttachment) {
            throw new IllegalArgumentException(
                    "Message or attachment is required");
        }

        Message message = new Message();

        message.setSender(request.getSender());
        message.setContent(request.getContent());
        message.setTimeStamp(LocalDateTime.now());

        message.setAttachmentUrl(request.getAttachmentUrl());
        message.setAttachmentName(request.getAttachmentName());
        message.setAttachmentType(request.getAttachmentType());
        message.setAttachmentSize(request.getAttachmentSize());

        room.getMessageList().add(message);
        roomRepository.save(room);

        return message;
    }
}
