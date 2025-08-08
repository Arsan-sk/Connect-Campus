import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupSimpleAuth, requireAuth } from "./simple-auth";
import {
  insertUserSchema,
  insertRoomSchema,
  insertMessageSchema,
  insertFileSchema,
  type User,
} from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";

// Set up file uploads
const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});

// WebSocket connection tracking
const userConnections = new Map<number, WebSocket>();
const roomConnections = new Map<number, Set<WebSocket>>();

export function registerRoutes(app: Express): Server {
  // Setup authentication routes first
  setupSimpleAuth(app);

  // User management routes
  app.get("/api/users/search/:query", requireAuth, async (req: any, res) => {
    try {
      const { query } = req.params;
      if (!query || typeof query !== "string") {
        return res.status(400).json({ message: "Search query required" });
      }
      
      const users = await storage.searchUsers(query);
      // Remove sensitive data and add friendship status
      const sanitizedUsers = await Promise.all(users.map(async (user) => {
        const isFriend = await storage.areFriends(req.user.id, user.id);
        return {
          id: user.id,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          profileImageUrl: user.profileImageUrl,
          bio: user.bio,
          status: user.status,
          isFriend,
        };
      }));
      
      res.json(sanitizedUsers);
    } catch (error) {
      console.error("Error searching users:", error);
      res.status(500).json({ message: "Failed to search users" });
    }
  });

  app.get("/api/users/:id", requireAuth, async (req: any, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Remove sensitive data
      const sanitizedUser = {
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
        bio: user.bio,
        status: user.status,
      };

      res.json(sanitizedUser);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.patch("/api/users/:id", requireAuth, async (req: any, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId) || userId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const updates = insertUserSchema.partial().parse(req.body);
      const updatedUser = await storage.updateUser(userId, updates);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        id: updatedUser.id,
        username: updatedUser.username,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        profileImageUrl: updatedUser.profileImageUrl,
        bio: updatedUser.bio,
        status: updatedUser.status,
      });
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Friend management routes
  app.get("/api/friends", requireAuth, async (req: any, res) => {
    try {
      const friends = await storage.getFriends(req.user.id);
      const sanitizedFriends = friends.map(friend => ({
        id: friend.id,
        username: friend.username,
        firstName: friend.firstName,
        lastName: friend.lastName,
        profileImageUrl: friend.profileImageUrl,
        bio: friend.bio,
        status: friend.status,
      }));
      res.json(sanitizedFriends);
    } catch (error) {
      console.error("Error fetching friends:", error);
      res.status(500).json({ message: "Failed to fetch friends" });
    }
  });

  app.post("/api/friends/request", requireAuth, async (req: any, res) => {
    try {
      const { addresseeId } = req.body;
      if (!addresseeId || isNaN(parseInt(addresseeId))) {
        return res.status(400).json({ message: "Valid addressee ID required" });
      }

      const friendship = await storage.sendFriendRequest(req.user.id, parseInt(addresseeId));
      res.status(201).json(friendship);
    } catch (error) {
      console.error("Error sending friend request:", error);
      res.status(500).json({ message: "Failed to send friend request" });
    }
  });

  app.get("/api/friends/requests", requireAuth, async (req: any, res) => {
    try {
      const requests = await storage.getFriendRequests(req.user.id);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching friend requests:", error);
      res.status(500).json({ message: "Failed to fetch friend requests" });
    }
  });

  app.post("/api/friends/requests/:id/accept", requireAuth, async (req: any, res) => {
    try {
      const requestId = parseInt(req.params.id);
      if (isNaN(requestId)) {
        return res.status(400).json({ message: "Invalid request ID" });
      }

      const friendship = await storage.acceptFriendRequest(requestId);
      if (!friendship) {
        return res.status(404).json({ message: "Friend request not found" });
      }

      res.json(friendship);
    } catch (error) {
      console.error("Error accepting friend request:", error);
      res.status(500).json({ message: "Failed to accept friend request" });
    }
  });

  app.post("/api/friends/requests/:id/reject", requireAuth, async (req: any, res) => {
    try {
      const requestId = parseInt(req.params.id);
      if (isNaN(requestId)) {
        return res.status(400).json({ message: "Invalid request ID" });
      }

      const friendship = await storage.rejectFriendRequest(requestId);
      if (!friendship) {
        return res.status(404).json({ message: "Friend request not found" });
      }

      res.json(friendship);
    } catch (error) {
      console.error("Error rejecting friend request:", error);
      res.status(500).json({ message: "Failed to reject friend request" });
    }
  });

  // Room management routes
  app.get("/api/rooms/public", requireAuth, async (req: any, res) => {
    try {
      const rooms = await storage.getPublicRooms();
      res.json(rooms);
    } catch (error) {
      console.error("Error fetching public rooms:", error);
      res.status(500).json({ message: "Failed to fetch public rooms" });
    }
  });
  
  app.get("/api/rooms/my", requireAuth, async (req: any, res) => {
    try {
      const rooms = await storage.getRooms(req.user.id);
      res.json(rooms);
    } catch (error) {
      console.error("Error fetching user rooms:", error);
      res.status(500).json({ message: "Failed to fetch user rooms" });
    }
  });

  app.get("/api/rooms", requireAuth, async (req: any, res) => {
    try {
      const rooms = await storage.getRooms(req.user.id);
      res.json(rooms);
    } catch (error) {
      console.error("Error fetching rooms:", error);
      res.status(500).json({ message: "Failed to fetch rooms" });
    }
  });

  app.post("/api/rooms", requireAuth, async (req: any, res) => {
    try {
      const roomData = insertRoomSchema.parse({
        ...req.body,
        creatorId: req.user.id,
      });

      const room = await storage.createRoom(roomData);
      res.status(201).json(room);
    } catch (error) {
      console.error("Error creating room:", error);
      res.status(500).json({ message: "Failed to create room" });
    }
  });

  app.get("/api/rooms/:id", requireAuth, async (req: any, res) => {
    try {
      const roomId = parseInt(req.params.id);
      if (isNaN(roomId)) {
        return res.status(400).json({ message: "Invalid room ID" });
      }

      const room = await storage.getRoom(roomId);
      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }

      res.json(room);
    } catch (error) {
      console.error("Error fetching room:", error);
      res.status(500).json({ message: "Failed to fetch room" });
    }
  });

  app.post("/api/rooms/:id/join", requireAuth, async (req: any, res) => {
    try {
      const roomId = parseInt(req.params.id);
      if (isNaN(roomId)) {
        return res.status(400).json({ message: "Invalid room ID" });
      }

      const member = await storage.addUserToRoom(roomId, req.user.id);
      res.status(201).json(member);
    } catch (error) {
      console.error("Error joining room:", error);
      res.status(500).json({ message: "Failed to join room" });
    }
  });

  app.get("/api/rooms/:id/members", requireAuth, async (req: any, res) => {
    try {
      const roomId = parseInt(req.params.id);
      if (isNaN(roomId)) {
        return res.status(400).json({ message: "Invalid room ID" });
      }

      const members = await storage.getRoomMembers(roomId);
      const sanitizedMembers = members.map(member => ({
        id: member.id,
        username: member.username,
        firstName: member.firstName,
        lastName: member.lastName,
        profileImageUrl: member.profileImageUrl,
        bio: member.bio,
        status: member.status,
      }));
      
      res.json(sanitizedMembers);
    } catch (error) {
      console.error("Error fetching room members:", error);
      res.status(500).json({ message: "Failed to fetch room members" });
    }
  });

  // Subject and subcategory routes
  app.get("/api/subjects", requireAuth, async (req: any, res) => {
    try {
      const subjects = await storage.getSubjects();
      res.json(subjects);
    } catch (error) {
      console.error("Error fetching subjects:", error);
      res.status(500).json({ message: "Failed to fetch subjects" });
    }
  });

  app.post("/api/subjects", requireAuth, async (req: any, res) => {
    try {
      const { name } = req.body;
      if (!name || typeof name !== "string") {
        return res.status(400).json({ message: "Subject name required" });
      }

      const subject = await storage.createSubject(name);
      res.status(201).json(subject);
    } catch (error) {
      console.error("Error creating subject:", error);
      res.status(500).json({ message: "Failed to create subject" });
    }
  });

  app.get("/api/subcategories", requireAuth, async (req: any, res) => {
    try {
      const { subjectId } = req.query;
      const subcategories = await storage.getSubcategories(
        subjectId ? parseInt(subjectId as string) : undefined
      );
      res.json(subcategories);
    } catch (error) {
      console.error("Error fetching subcategories:", error);
      res.status(500).json({ message: "Failed to fetch subcategories" });
    }
  });

  app.post("/api/subcategories", requireAuth, async (req: any, res) => {
    try {
      const { name, subjectId } = req.body;
      if (!name || !subjectId || isNaN(parseInt(subjectId))) {
        return res.status(400).json({ message: "Name and valid subject ID required" });
      }

      const subcategory = await storage.createSubcategory(name, parseInt(subjectId));
      res.status(201).json(subcategory);
    } catch (error) {
      console.error("Error creating subcategory:", error);
      res.status(500).json({ message: "Failed to create subcategory" });
    }
  });

  // Message routes
  app.get("/api/messages", requireAuth, async (req: any, res) => {
    try {
      const { roomId, recipientId } = req.query;
      
      let messages;
      if (roomId) {
        messages = await storage.getMessages(parseInt(roomId as string));
      } else if (recipientId) {
        messages = await storage.getDirectMessages(req.user.id, parseInt(recipientId as string));
      } else {
        return res.status(400).json({ message: "Room ID or recipient ID required" });
      }

      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post("/api/messages", requireAuth, async (req: any, res) => {
    try {
      const messageData = insertMessageSchema.parse({
        ...req.body,
        senderId: req.user.id,
      });

      const message = await storage.createMessage(messageData);
      
      // Broadcast to WebSocket connections
      if (message.roomId) {
        const roomConnections = roomConnections.get(message.roomId);
        if (roomConnections) {
          const messagePayload = JSON.stringify({
            type: "new_message",
            data: message,
          });
          
          roomConnections.forEach(ws => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(messagePayload);
            }
          });
        }
      } else if (message.recipientId) {
        const recipientWs = userConnections.get(message.recipientId);
        const senderWs = userConnections.get(message.senderId);
        
        const messagePayload = JSON.stringify({
          type: "new_message",
          data: message,
        });
        
        [recipientWs, senderWs].forEach(ws => {
          if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(messagePayload);
          }
        });
      }

      res.status(201).json(message);
    } catch (error) {
      console.error("Error creating message:", error);
      res.status(500).json({ message: "Failed to create message" });
    }
  });

  // Chat routes
  app.get("/api/chats", requireAuth, async (req: any, res) => {
    try {
      // Get direct messages for the current user
      const directMessages = await storage.getDirectMessageChats(req.user.id);
      res.json(directMessages);
    } catch (error) {
      console.error("Error fetching chats:", error);
      res.status(500).json({ message: "Failed to fetch chats" });
    }
  });

  app.get("/api/chats/:chatId/messages", requireAuth, async (req: any, res) => {
    try {
      const chatId = parseInt(req.params.chatId);
      if (isNaN(chatId)) {
        return res.status(400).json({ message: "Invalid chat ID" });
      }

      // For now, treat chatId as recipientId for direct messages
      const messages = await storage.getDirectMessages(req.user.id, chatId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching chat messages:", error);
      res.status(500).json({ message: "Failed to fetch chat messages" });
    }
  });

  app.post("/api/chats/:chatId/messages", requireAuth, async (req: any, res) => {
    try {
      const chatId = parseInt(req.params.chatId);
      if (isNaN(chatId)) {
        return res.status(400).json({ message: "Invalid chat ID" });
      }

      const messageData = insertMessageSchema.parse({
        content: req.body.content,
        senderId: req.user.id,
        recipientId: chatId, // For direct messages
        status: "sent",
      });

      const message = await storage.createMessage(messageData);
      
      // Get the complete message with sender information
      const messageWithSender = await storage.getDirectMessages(req.user.id, chatId);
      const fullMessage = messageWithSender.find(m => m.id === message.id);
      
      // Broadcast to WebSocket connections
      const recipientWs = userConnections.get(chatId);
      const senderWs = userConnections.get(req.user.id);
      
      const messagePayload = JSON.stringify({
        type: "new_message",
        data: fullMessage || message,
      });
      
      // Mark as delivered if recipient is online
      if (recipientWs && recipientWs.readyState === WebSocket.OPEN) {
        await storage.markMessageAsDelivered(message.id);
        message.status = "delivered";
        message.deliveredAt = new Date();
      }
      
      [recipientWs, senderWs].forEach(ws => {
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(messagePayload);
        }
      });

      res.status(201).json(fullMessage || message);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Message status routes
  app.post("/api/messages/:messageId/read", requireAuth, async (req: any, res) => {
    try {
      const messageId = parseInt(req.params.messageId);
      if (isNaN(messageId)) {
        return res.status(400).json({ message: "Invalid message ID" });
      }

      const message = await storage.markMessageAsRead(messageId);
      if (!message) {
        return res.status(404).json({ message: "Message not found" });
      }

      // Notify sender via WebSocket
      const senderWs = userConnections.get(message.senderId);
      if (senderWs && senderWs.readyState === WebSocket.OPEN) {
        senderWs.send(JSON.stringify({
          type: "message_read",
          data: { messageId: message.id, readAt: message.readAt },
        }));
      }

      res.json(message);
    } catch (error) {
      console.error("Error marking message as read:", error);
      res.status(500).json({ message: "Failed to mark message as read" });
    }
  });

  app.post("/api/chats/:chatId/read", requireAuth, async (req: any, res) => {
    try {
      const chatId = parseInt(req.params.chatId);
      if (isNaN(chatId)) {
        return res.status(400).json({ message: "Invalid chat ID" });
      }

      // Mark all messages from this user as read
      await storage.markChatMessagesAsRead(req.user.id, chatId);

      // Notify sender via WebSocket
      const senderWs = userConnections.get(chatId);
      if (senderWs && senderWs.readyState === WebSocket.OPEN) {
        senderWs.send(JSON.stringify({
          type: "chat_messages_read",
          data: { chatId: req.user.id, readAt: new Date() },
        }));
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error marking chat messages as read:", error);
      res.status(500).json({ message: "Failed to mark chat messages as read" });
    }
  });


  // Updated file routes
  app.get("/api/files/my", requireAuth, async (req: any, res) => {
    try {
      const files = await storage.getFiles(undefined, req.user.id);
      res.json(files);
    } catch (error) {
      console.error("Error fetching user files:", error);
      res.status(500).json({ message: "Failed to fetch user files" });
    }
  });

  app.get("/api/files/shared", requireAuth, async (req: any, res) => {
    try {
      const files = await storage.getSharedFiles(req.user.id);
      res.json(files);
    } catch (error) {
      console.error("Error fetching shared files:", error);
      res.status(500).json({ message: "Failed to fetch shared files" });
    }
  });

  // File routes
  app.post("/api/files", requireAuth, upload.single("file"), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const fileData = insertFileSchema.parse({
        fileName: req.file.originalname,
        originalName: req.file.originalname,
        filePath: req.file.path,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        uploadedById: req.user.id,
        roomId: req.body.roomId ? parseInt(req.body.roomId) : null,
        subjectId: req.body.subjectId ? parseInt(req.body.subjectId) : null,
        subcategoryId: req.body.subcategoryId ? parseInt(req.body.subcategoryId) : null,
        description: req.body.description || null,
        isPublic: req.body.isPublic === "true",
      });

      const file = await storage.createFile(fileData);
      res.status(201).json(file);
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({ message: "Failed to upload file" });
    }
  });

  app.get("/api/files", requireAuth, async (req: any, res) => {
    try {
      const { roomId, uploadedById, subjectId, subcategoryId } = req.query;
      
      let files;
      if (subjectId) {
        files = await storage.getFilesBySubject(parseInt(subjectId as string));
      } else if (subcategoryId) {
        files = await storage.getFilesBySubcategory(parseInt(subcategoryId as string));
      } else {
        files = await storage.getFiles(
          roomId ? parseInt(roomId as string) : undefined,
          uploadedById ? parseInt(uploadedById as string) : undefined
        );
      }

      res.json(files);
    } catch (error) {
      console.error("Error fetching files:", error);
      res.status(500).json({ message: "Failed to fetch files" });
    }
  });

  app.get("/api/files/:id/download", requireAuth, async (req: any, res) => {
    try {
      const fileId = parseInt(req.params.id);
      if (isNaN(fileId)) {
        return res.status(400).json({ message: "Invalid file ID" });
      }

      const file = await storage.getFile(fileId);
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }

      const filePath = path.resolve(file.filePath);
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: "File not found on disk" });
      }

      res.download(filePath, file.originalName);
    } catch (error) {
      console.error("Error downloading file:", error);
      res.status(500).json({ message: "Failed to download file" });
    }
  });

  // Status routes
  app.post("/api/status", requireAuth, async (req: any, res) => {
    try {
      const { status, roomId } = req.body;
      if (!status || typeof status !== "string") {
        return res.status(400).json({ message: "Status required" });
      }

      const userStatus = await storage.updateUserStatus(
        req.user.id,
        status,
        roomId ? parseInt(roomId) : undefined
      );
      
      res.json(userStatus);
    } catch (error) {
      console.error("Error updating status:", error);
      res.status(500).json({ message: "Failed to update status" });
    }
  });

  const httpServer = createServer(app);

  // Set up WebSocket server
  const wss = new WebSocketServer({ 
    server: httpServer, 
    path: "/ws" 
  });

  wss.on("connection", (ws: WebSocket, req) => {
    console.log("New WebSocket connection");

    ws.on("message", async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        switch (message.type) {
          case "authenticate":
            // In a real app, you'd verify the auth token here
            const userId = message.userId;
            if (userId) {
              userConnections.set(userId, ws);
              ws.send(JSON.stringify({ type: "authenticated", userId }));
            }
            break;
            
          case "join_room":
            const roomId = message.roomId;
            if (roomId) {
              if (!roomConnections.has(roomId)) {
                roomConnections.set(roomId, new Set());
              }
              roomConnections.get(roomId)!.add(ws);
              ws.send(JSON.stringify({ type: "joined_room", roomId }));
            }
            break;
            
          case "leave_room":
            const leaveRoomId = message.roomId;
            if (leaveRoomId && roomConnections.has(leaveRoomId)) {
              roomConnections.get(leaveRoomId)!.delete(ws);
            }
            break;
            
          case "message":
            // Handle incoming chat messages via WebSocket
            const { content, recipientId, senderId } = message.data;
            if (!content || !recipientId || !senderId) {
              ws.send(JSON.stringify({ type: "error", message: "Invalid message data" }));
              break;
            }
            
            try {
              const messageData = insertMessageSchema.parse({
                content,
                senderId,
                recipientId,
                status: "sent",
              });
              
              const newMessage = await storage.createMessage(messageData);
              
              // Get the complete message with sender information
              const messagesWithSender = await storage.getDirectMessages(senderId, recipientId);
              const fullMessage = messagesWithSender.find(m => m.id === newMessage.id);
              
              // Broadcast to WebSocket connections
              const recipientWs = userConnections.get(recipientId);
              const senderWs = userConnections.get(senderId);
              
              const messagePayload = JSON.stringify({
                type: "new_message",
                data: fullMessage || newMessage,
              });
              
              // Mark as delivered if recipient is online
              if (recipientWs && recipientWs.readyState === WebSocket.OPEN) {
                await storage.markMessageAsDelivered(newMessage.id);
                newMessage.status = "delivered";
                newMessage.deliveredAt = new Date();
              }
              
              // Send to both sender and recipient
              [recipientWs, senderWs].forEach(wsConnection => {
                if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
                  wsConnection.send(messagePayload);
                }
              });
              
              // Send confirmation to sender
              ws.send(JSON.stringify({
                type: "message_sent",
                data: fullMessage || newMessage,
              }));
              
            } catch (error) {
              console.error("Error processing WebSocket message:", error);
              ws.send(JSON.stringify({ type: "error", message: "Failed to send message" }));
            }
            break;
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
      }
    });

    ws.on("close", () => {
      // Clean up connections
      for (const [userId, connection] of userConnections.entries()) {
        if (connection === ws) {
          userConnections.delete(userId);
          break;
        }
      }
      
      for (const [roomId, connections] of roomConnections.entries()) {
        connections.delete(ws);
        if (connections.size === 0) {
          roomConnections.delete(roomId);
        }
      }
    });
  });

  return httpServer;

  function updateMessageStatus(ws, messageId, status) {
    if (status === "delivered") {
      storage.markMessageAsDelivered(messageId);
    } else if (status === "read") {
      storage.markMessageAsRead(messageId);
    }
    broadcastMessageStatus(messageId, status);
  }

  function broadcastMessageStatus(messageId, status) {
    const messagePayload = JSON.stringify({
      type: "update_message_status",
      data: { messageId, status },
    });
    userConnections.forEach((ws, userId) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(messagePayload);
      }
    });
  }
}