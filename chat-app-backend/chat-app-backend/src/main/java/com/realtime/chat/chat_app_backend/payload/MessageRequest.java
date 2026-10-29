
package com.realtime.chat.chat_app_backend.payload;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class MessageRequest {

    private String sender;
    private String content;
    private String roomId;

    private String attachmentUrl;
    private String attachmentName;
    private String attachmentType;
    private Long attachmentSize;
}
