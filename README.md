# Real-Time Chat Application

A real-time chat application built using React, Spring Boot, MongoDB, and WebSocket technology. Users can create or join chat rooms, exchange messages in real time, and access persisted message history.

## Features

- **Create Chat Rooms:** Create a room and share its room ID with other participants.
- **Join Chat Rooms:** Join an existing room using its room ID.
- **Real-Time Messaging:** Exchange messages using WebSocket communication with STOMP.
- **Message Persistence:** Store chat messages in MongoDB and retrieve message history.
- **Message History:** Fetch previous messages using paginated REST APIs.
- **File Attachments:** Support for file attachments with attachment metadata.
- **Responsive User Interface:** Interactive chat interface built with React.

## Tech Stack

### Frontend
- React
- Vite
- JavaScript
- Tailwind CSS
- Axios
- STOMP.js
- SockJS

### Backend
- Java
- Spring Boot
- Spring WebSocket
- STOMP
- Spring Data MongoDB
- Maven

### Database
- MongoDB

## Project Structure

```text
realtime-chat-app/
├── front-chat/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── config/
│   │   ├── context/
│   │   └── services/
│   ├── package.json
│   └── vite.config.js
│
└── chat-app-backend/
    └── chat-app-backend/
        ├── pom.xml
        ├── mvnw
        └── src/
            └── main/
                ├── java/
                └── resources/
```

## Getting Started

### Prerequisites

Make sure you have the following installed:

- Java 17 or the version configured in the backend's `pom.xml`
- Node.js and npm
- MongoDB running locally or a MongoDB Atlas database
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/Muskansingh111/realtime-chat-app.git
cd realtime-chat-app
```

### 2. Configure the Backend

Navigate to the Spring Boot project directory:

```bash
cd chat-app-backend/chat-app-backend
```

Configure your MongoDB connection and any other required settings in `src/main/resources/application.properties`.

**Security note:** Keep database credentials and other secrets outside version control. Use environment variables for sensitive configuration.

### 3. Run the Backend

On Windows PowerShell:

```powershell
.\mvnw.cmd spring-boot:run
```

The backend will run on the port configured by the application, typically `8080` for local development.

### 4. Run the Frontend

Open a second terminal from the repository root:

```bash
cd front-chat
npm install
npm run dev
```

Open the local URL printed by Vite in your terminal, typically:

`http://localhost:5173`

Ensure the frontend API base URL and WebSocket endpoint point to the running backend.

## How to Use

1. Open the application in your browser.
2. Create a new chat room or enter an existing room ID.
3. Share the room ID with another participant.
4. Join the same room from another browser or device.
5. Exchange messages in real time.
6. View previous messages when the application loads chat history.
7. Use the attachment feature to share files, where supported by the configured backend.

## Architecture Overview

The application uses a React frontend to communicate with a Spring Boot backend.

- **REST APIs** handle room operations and message-history retrieval.
- **WebSocket with STOMP** enables real-time message exchange.
- **MongoDB** stores room data and message history.
- **File storage services** handle uploaded attachments.

## Author

**Muskan Singh**

GitHub: https://github.com/Muskansingh111

---

*Built as a full-stack project to explore real-time communication, REST APIs, WebSocket messaging, and database persistence.*
