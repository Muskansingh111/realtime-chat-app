package com.realtime.chat.chat_app_backend.entities;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Message {
    private String sender ;
    private String content ;
    private LocalDateTime timeStamp ;

    // Attachment metadata; null for ordinary text messages
    private String attachmentUrl;
    private String attachmentName;
    private String attachmentType;
    private Long  attachmentSize;

    public Message(String sender, String content) {
        this.sender = sender;
        this.content = content;
        this.timeStamp = LocalDateTime.now() ;
    }
}
