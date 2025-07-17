import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  insertRoomSchema, 
  insertMessageSchema, 
  insertSubjectSchema,
  insertSubcategorySchema,
  insertFriendshipSchema 
} from "@shared/schema";

// Configure multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(process.cwd(), 'uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  }),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  }
});

// WebSocket connection management
const wsConnections = new Map<string, WebSocket>();

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // User routes
  app.put('/api/users/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { username, bio, status } = req.body;
      
      const updatedUser = await storage.updateUserProfile(userId, {
        username,
        bio,
        status,
      });
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  app.get('/api/users/search', isAuthenticated, async (req: any, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ message: "Query parameter required" });
      }
      
      const users = await storage.searchUsers(q);
      res.json(users);
    } catch (error) {
      console.error("Error searching users:", error);
      res.status(500).json({ message: "Failed to search users" });
    }
  });

  // Friend routes
  app.post('/api/friends/request', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const data = insertFriendshipSchema.parse({
        requesterId: userId,
        addresseeId: req.body.addresseeId,
      });
      
      const friendship = await storage.sendFriendRequest(data.requesterId, data.addresseeId);
      res.json(friendship);
    } catch (error) {
      console.error("Error sending friend request:", error);
      res.status(500).json({ message: "Failed to send friend request" });
    }
  });

  app.get('/api/friends/requests', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const requests = await storage.getFriendRequests(userId);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching friend requests:", error);
      res.status(500).json({ message: "Failed to fetch friend requests" });
    }
  });

  app.post('/api/friends/requests/:id/accept', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.acceptFriendRequest(parseInt(id));
      res.json({ success: true });
    } catch (error) {
      console.error("Error accepting friend request:", error);
      res.status(500).json({ message: "Failed to accept friend request" });
    }
  });

  app.post('/api/friends/requests/:id/reject', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.rejectFriendRequest(parseInt(id));
      res.json({ success: true });
    } catch (error) {
      console.error("Error rejecting friend request:", error);
      res.status(500).json({ message: "Failed to reject friend request" });
    }
  });

  app.get('/api/friends', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const friends = await storage.getFriends(userId);
      res.json(friends);
    } catch (error) {
      console.error("Error fetching friends:", error);
      res.status(500).json({ message: "Failed to fetch friends" });
    }
  });

  // Room routes
  app.post('/api/rooms', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const data = insertRoomSchema.parse({
        ...req.body,
        creatorId: userId,
      });
      
      const room = await storage.createRoom(data);
      res.json(room);
    } catch (error) {
      console.error("Error creating room:", error);
      res.status(500).json({ message: "Failed to create room" });
    }
  });

  app.get('/api/rooms', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const rooms = await storage.getUserRooms(userId);
      res.json(rooms);
    } catch (error) {
      console.error("Error fetching rooms:", error);
      res.status(500).json({ message: "Failed to fetch rooms" });
    }
  });

  app.get('/api/rooms/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const room = await storage.getRoomById(parseInt(id));
      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }
      res.json(room);
    } catch (error) {
      console.error("Error fetching room:", error);
      res.status(500).json({ message: "Failed to fetch room" });
    }
  });

  app.post('/api/rooms/:id/members', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { userId, role } = req.body;
      
      await storage.addRoomMember(parseInt(id), userId, role);
      res.json({ success: true });
    } catch (error) {
      console.error("Error adding room member:", error);
      res.status(500).json({ message: "Failed to add room member" });
    }
  });

  app.get('/api/rooms/:id/members', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const members = await storage.getRoomMembers(parseInt(id));
      res.json(members);
    } catch (error) {
      console.error("Error fetching room members:", error);
      res.status(500).json({ message: "Failed to fetch room members" });
    }
  });

  // Subject routes
  app.post('/api/rooms/:id/subjects', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const data = insertSubjectSchema.parse({
        roomId: parseInt(id),
        name: req.body.name,
      });
      
      const subject = await storage.createSubject(data);
      res.json(subject);
    } catch (error) {
      console.error("Error creating subject:", error);
      res.status(500).json({ message: "Failed to create subject" });
    }
  });

  app.get('/api/rooms/:id/subjects', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const subjects = await storage.getRoomSubjects(parseInt(id));
      res.json(subjects);
    } catch (error) {
      console.error("Error fetching subjects:", error);
      res.status(500).json({ message: "Failed to fetch subjects" });
    }
  });

  app.post('/api/subjects/:id/subcategories', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const data = insertSubcategorySchema.parse({
        subjectId: parseInt(id),
        name: req.body.name,
      });
      
      const subcategory = await storage.createSubcategory(data);
      res.json(subcategory);
    } catch (error) {
      console.error("Error creating subcategory:", error);
      res.status(500).json({ message: "Failed to create subcategory" });
    }
  });

  app.get('/api/subjects/:id/subcategories', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const subcategories = await storage.getSubjectSubcategories(parseInt(id));
      res.json(subcategories);
    } catch (error) {
      console.error("Error fetching subcategories:", error);
      res.status(500).json({ message: "Failed to fetch subcategories" });
    }
  });

  // Message routes
  app.get('/api/rooms/:id/messages', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { limit = 50, offset = 0 } = req.query;
      
      const messages = await storage.getRoomMessages(
        parseInt(id),
        parseInt(limit as string),
        parseInt(offset as string)
      );
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.get('/api/messages/direct/:userId', isAuthenticated, async (req: any, res) => {
    try {
      const currentUserId = req.user.claims.sub;
      const { userId } = req.params;
      const { limit = 50, offset = 0 } = req.query;
      
      const messages = await storage.getDirectMessages(
        currentUserId,
        userId,
        parseInt(limit as string),
        parseInt(offset as string)
      );
      res.json(messages);
    } catch (error) {
      console.error("Error fetching direct messages:", error);
      res.status(500).json({ message: "Failed to fetch direct messages" });
    }
  });

  // File routes
  app.post('/api/files/upload', isAuthenticated, upload.single('file'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const file = req.file;
      const { roomId, subjectId, subcategoryId, fileName } = req.body;
      
      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      const fileData = {
        originalName: file.originalname,
        fileName: fileName || file.originalname,
        fileType: file.mimetype,
        fileSize: file.size,
        filePath: file.path,
        uploaderId: userId,
        roomId: roomId ? parseInt(roomId) : null,
        subjectId: subjectId ? parseInt(subjectId) : null,
        subcategoryId: subcategoryId ? parseInt(subcategoryId) : null,
      };
      
      const uploadedFile = await storage.createFile(fileData);
      res.json(uploadedFile);
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({ message: "Failed to upload file" });
    }
  });

  app.get('/api/rooms/:id/files', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { subjectId, subcategoryId } = req.query;
      
      const files = await storage.getRoomFiles(
        parseInt(id),
        subjectId ? parseInt(subjectId as string) : undefined,
        subcategoryId ? parseInt(subcategoryId as string) : undefined
      );
      res.json(files);
    } catch (error) {
      console.error("Error fetching files:", error);
      res.status(500).json({ message: "Failed to fetch files" });
    }
  });

  app.get('/api/files/search', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { q } = req.query;
      
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ message: "Query parameter required" });
      }
      
      const files = await storage.searchFiles(q, userId);
      res.json(files);
    } catch (error) {
      console.error("Error searching files:", error);
      res.status(500).json({ message: "Failed to search files" });
    }
  });

  app.delete('/api/files/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      
      await storage.deleteFile(parseInt(id), userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting file:", error);
      res.status(500).json({ message: "Failed to delete file" });
    }
  });

  // Call routes
  app.post('/api/calls', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { calleeId, roomId, callType } = req.body;
      
      const call = await storage.createCall(userId, calleeId, roomId, callType);
      res.json(call);
    } catch (error) {
      console.error("Error creating call:", error);
      res.status(500).json({ message: "Failed to create call" });
    }
  });

  app.get('/api/calls', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const calls = await storage.getUserCalls(userId);
      res.json(calls);
    } catch (error) {
      console.error("Error fetching calls:", error);
      res.status(500).json({ message: "Failed to fetch calls" });
    }
  });

  // Status routes
  app.post('/api/status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { content, type } = req.body;
      
      const status = await storage.createStatus(userId, content, type);
      res.json(status);
    } catch (error) {
      console.error("Error creating status:", error);
      res.status(500).json({ message: "Failed to create status" });
    }
  });

  app.get('/api/status/feed', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const statuses = await storage.getFriendsStatuses(userId);
      res.json(statuses);
    } catch (error) {
      console.error("Error fetching status feed:", error);
      res.status(500).json({ message: "Failed to fetch status feed" });
    }
  });

  const httpServer = createServer(app);

  // WebSocket server setup
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws: WebSocket, req) => {
    console.log('WebSocket client connected');

    ws.on('message', async (message: string) => {
      try {
        const data = JSON.parse(message);
        
        switch (data.type) {
          case 'join':
            wsConnections.set(data.userId, ws);
            break;
            
          case 'message':
            // Create message in database
            const newMessage = await storage.createMessage({
              content: data.content,
              senderId: data.senderId,
              roomId: data.roomId,
              recipientId: data.recipientId,
              messageType: data.messageType || 'text',
            });
            
            // Broadcast to room members or direct message recipient
            if (data.roomId) {
              const members = await storage.getRoomMembers(data.roomId);
              members.forEach(member => {
                const memberWs = wsConnections.get(member.userId);
                if (memberWs && memberWs.readyState === WebSocket.OPEN) {
                  memberWs.send(JSON.stringify({
                    type: 'message',
                    message: newMessage,
                  }));
                }
              });
            } else if (data.recipientId) {
              const recipientWs = wsConnections.get(data.recipientId);
              if (recipientWs && recipientWs.readyState === WebSocket.OPEN) {
                recipientWs.send(JSON.stringify({
                  type: 'message',
                  message: newMessage,
                }));
              }
            }
            break;
            
          case 'typing':
            // Broadcast typing indicator
            if (data.roomId) {
              const members = await storage.getRoomMembers(data.roomId);
              members.forEach(member => {
                if (member.userId !== data.userId) {
                  const memberWs = wsConnections.get(member.userId);
                  if (memberWs && memberWs.readyState === WebSocket.OPEN) {
                    memberWs.send(JSON.stringify({
                      type: 'typing',
                      userId: data.userId,
                      roomId: data.roomId,
                      isTyping: data.isTyping,
                    }));
                  }
                }
              });
            }
            break;
            
          case 'call':
            // Handle call signaling
            const targetWs = wsConnections.get(data.targetUserId);
            if (targetWs && targetWs.readyState === WebSocket.OPEN) {
              targetWs.send(JSON.stringify(data));
            }
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      // Remove connection from map
      for (const [userId, connection] of wsConnections.entries()) {
        if (connection === ws) {
          wsConnections.delete(userId);
          break;
        }
      }
      console.log('WebSocket client disconnected');
    });
  });

  return httpServer;
}
