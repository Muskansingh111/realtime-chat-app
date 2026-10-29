
import React, { useCallback, useEffect, useRef, useState } from "react";
import { MdAttachFile, MdSend } from "react-icons/md";
import { useNavigate } from "react-router";
import SockJS from "sockjs-client";
import { Stomp } from "@stomp/stompjs";
import toast from "react-hot-toast";

import useChatContext from "../context/ChatContext";
import { baseURL } from "../config/AxiosHelper";
import { getMessagess } from "../services/RoomService";
import { timeAgo } from "../config/helper";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ChatPage = () => {
  const {
    roomId,
    currentUser,
    connected,
    setConnected,
    setRoomId,
    setCurrentUser,
  } = useChatContext();

  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const chatBoxRef = useRef(null);
  const fileInputRef = useRef(null);
  const clientRef = useRef(null);
  const sendingRef = useRef(false);

  const apiBase = baseURL.replace(/\/$/, "");

  // Redirect when the user is not connected to a room.
  useEffect(() => {
    if (!connected) {
      navigate("/");
    }
  }, [connected, navigate]);

  // Load previous messages.
  useEffect(() => {
    if (!connected || !roomId) return;

    let active = true;

    async function loadMessages() {
      try {
        const history = await getMessagess(roomId);

        if (active) {
          setMessages(Array.isArray(history) ? history : []);
        }
      } catch (error) {
        console.error("Could not load message history:", error);
        if (active) toast.error("Could not load chat history");
      }
    }

    loadMessages();

    return () => {
      active = false;
    };
  }, [connected, roomId]);

  // Scroll to the latest message.
  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTo({
        top: chatBoxRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  // Connect to the room's WebSocket.
  useEffect(() => {
    if (!connected || !roomId) return;

    let active = true;
    let subscription = null;

    const socket = new SockJS(`${apiBase}/chat`);
    const client = Stomp.over(socket);

    clientRef.current = client;
    client.debug = () => {};

    client.connect(
      {},
      () => {
        if (!active) {
          client.disconnect();
          return;
        }

        toast.success("Chat connected");

        subscription = client.subscribe(
          `/topic/room/${roomId}`,
          (frame) => {
            if (!active) return;

            try {
              const receivedMessage = JSON.parse(frame.body);

              setMessages((previous) => {
                // Prevent duplicates if the backend supplies a stable ID.
                if (receivedMessage.id != null) {
                  const exists = previous.some(
                    (item) => item.id === receivedMessage.id
                  );
                  if (exists) return previous;
                }

                return [...previous, receivedMessage];
              });
            } catch (error) {
              console.error("Invalid message received:", error);
            }
          }
        );
      },
      
    (error) => {
     console.error("WebSocket connection failed:", error);
     if (active) {
        toast.error(
        "WebSocket failed. Check Console and backend logs."
    );
  }
}
    );

    return () => {
      active = false;

      if (subscription) {
        subscription.unsubscribe();
      }

      if (client.connected) {
        client.disconnect();
      } else {
        socket.close();
      }

      if (clientRef.current === client) {
        clientRef.current = null;
      }
    };
  }, [connected, roomId, apiBase]);

  // Send text or attachment metadata through STOMP.
  const publishMessage = useCallback(
    (message) => {
      const client = clientRef.current;

      if (!client || !client.connected) {
        throw new Error("Chat is not connected");
      }

      client.send(
        `/app/sendMessage/${roomId}`,
        {},
        JSON.stringify({
          ...message,
          sender: currentUser,
          roomId,
        })
      );
    },
    [currentUser, roomId]
  );

  // Send a normal text message.
  const sendMessage = useCallback(() => {
    const content = input.trim();

    if (!content || !connected || !roomId || sendingRef.current) {
      return;
    }

    try {
      publishMessage({ content });
      setInput("");
    } catch (error) {
      console.error("Could not send message:", error);
      toast.error(error.message || "Message could not be sent");
    }
  }, [input, connected, roomId, publishMessage]);

  // Upload a selected file, then share its metadata with the room.
  const uploadAttachment = async (file) => {
    if (!file || isUploading) return;

    if (file.size > MAX_FILE_SIZE) {
      toast.error("File size must be 10 MB or less");
      return;
    }

    setIsUploading(true);
    const toastId = "file-upload";

    try {
      toast.loading("Uploading file...", { id: toastId });

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${apiBase}/api/v1/files`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "File upload failed");
      }

      const uploadedFile = await response.json();

      // Publish only after the file upload succeeds.
      publishMessage({
        content: `Shared a file: ${uploadedFile.fileName}`,
        attachmentUrl: uploadedFile.fileUrl,
        attachmentName: uploadedFile.fileName,
        attachmentType: uploadedFile.contentType,
        attachmentSize: uploadedFile.fileSize,
      });

      toast.success("File shared successfully", { id: toastId });
    } catch (error) {
      console.error("Attachment upload failed:", error);
      toast.error(error.message || "File upload failed", {
        id: toastId,
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Leave the room.
  const handleLogout = () => {
    const client = clientRef.current;

    if (client?.connected) {
      client.disconnect();
    }

    clientRef.current = null;
    setConnected(false);
    setRoomId("");
    setCurrentUser("");
    navigate("/");
  };

  return (
    <div>
      {/* Header */}
      <header className="fixed top-0 z-10 w-full dark:bg-gray-900 py-5 shadow flex justify-around items-center">
        <h1 className="text-xl font-semibold">
          Room : <span>{roomId}</span>
        </h1>

        <h1 className="text-xl font-semibold">
          User : <span>{currentUser}</span>
        </h1>

        <button
          type="button"
          onClick={handleLogout}
          className="dark:bg-red-500 dark:hover:bg-red-700 px-3 py-2 rounded-full"
        >
          Leave Room
        </button>
      </header>

      {/* Message history */}
      <main
        ref={chatBoxRef}
        className="pt-24 pb-28 px-10 w-2/3 dark:bg-slate-600 mx-auto h-screen overflow-auto"
      >
        {messages.map((message, index) => {
          const mine = message.sender === currentUser;

          return (
            <div
              key={message.id ?? `${message.timeStamp}-${index}`}
              className={`flex ${mine ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`my-2 ${
                  mine ? "bg-green-800" : "bg-gray-800"
                } p-2 max-w-xs rounded`}
              >
                <div className="flex gap-2">
                  {/* Initials avatar */}
                  <div
                    title={message.sender}
                    className={`h-10 w-10 shrink-0 rounded-full flex items-center justify-center text-white font-bold ${
                      mine ? "bg-emerald-600" : "bg-indigo-600"
                    }`}
                  >
                    {message.sender
                      ?.trim()
                      .split(/\s+/)
                      .slice(0, 2)
                      .map((part) => part[0]?.toUpperCase())
                      .join("") || "U"}
                  </div>

                  <div className="flex min-w-0 flex-col gap-1">
                    <p className="text-sm font-bold">{message.sender}</p>

                    {message.content && (
                      <p className="break-words">{message.content}</p>
                    )}

                    {/* Attachment link */}
                    {message.attachmentUrl && (
                      <a
                        href={`${apiBase}${message.attachmentUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-300 underline break-all"
                      >
                        {message.attachmentName || "Open attachment"}
                      </a>
                    )}

                    {message.attachmentSize != null && (
                      <p className="text-xs text-gray-300">
                        {(message.attachmentSize / 1024).toFixed(1)} KB
                      </p>
                    )}

                    <p className="text-xs text-gray-400">
                      {message.timeStamp
                        ? timeAgo(message.timeStamp)
                        : "Just now"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </main>

      {/* Message composer */}
      <div className="fixed bottom-4 w-full h-16">
        <div className="h-full pr-10 gap-4 flex items-center justify-between rounded-full w-1/2 mx-auto dark:bg-gray-900">
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.repeat) {
                event.preventDefault();
                sendMessage();
              }
            }}
            type="text"
            placeholder="Type your message here..."
            className="w-full dark:bg-gray-800 px-5 py-2 rounded-full h-full focus:outline-none"
          />

          <div className="flex gap-1">
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/*,.pdf,.txt,.csv,.zip,.doc,.docx,.xls,.xlsx"
              onChange={(event) => {
                const file = event.target.files?.[0];

                if (file) {
                  uploadAttachment(file);
                }

                // Allow selecting the same file again.
                event.target.value = "";
              }}
            />

            <button
              type="button"
              aria-label="Attach file"
              disabled={isUploading || !connected}
              onClick={() => fileInputRef.current?.click()}
              className="dark:bg-purple-600 disabled:opacity-50 h-10 w-10 flex justify-center items-center rounded-full"
            >
              <MdAttachFile size={20} />
            </button>

            <button
              type="button"
              aria-label="Send message"
              onClick={sendMessage}
              disabled={!input.trim() || !connected}
              className="dark:bg-green-600 disabled:opacity-50 h-10 w-10 flex justify-center items-center rounded-full"
            >
              <MdSend size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
