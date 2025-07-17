import {
  users,
  rooms,
  messages,
  files,
  subjects,
  subcategories,
  friendships,
  roomMembers,
  messageStatus,
  calls,
  statuses,
  statusReactions,
  type User,
  type UpsertUser,
  type InsertRoom,
  type InsertMessage,
  type InsertFile,
  type InsertSubject,
  type InsertSubcategory,
  type InsertFriendship,
  type Room,
  type Message,
  type File,
  type Subject,
  type Subcategory,
  type Friendship,
  type RoomMember,
  type MessageStatus,
  type Call,
  type Status,
  type StatusReaction,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, desc, asc, sql, inArray } from "drizzle-orm";

export interface IStorage {
  // User operations - mandatory for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // User management
  updateUserProfile(id: string, data: Partial<User>): Promise<User>;
  searchUsers(query: string): Promise<User[]>;
  
  // Friend operations
  sendFriendRequest(requesterId: string, addresseeId: string): Promise<Friendship>;
  getFriendRequests(userId: string): Promise<Friendship[]>;
  acceptFriendRequest(friendshipId: number): Promise<void>;
  rejectFriendRequest(friendshipId: number): Promise<void>;
  getFriends(userId: string): Promise<User[]>;
  areFriends(userId1: string, userId2: string): Promise<boolean>;
  
  // Room operations
  createRoom(room: InsertRoom): Promise<Room>;
  getUserRooms(userId: string): Promise<Room[]>;
  getRoomById(id: number): Promise<Room | undefined>;
  updateRoom(id: number, data: Partial<Room>): Promise<Room>;
  addRoomMember(roomId: number, userId: string, role?: string): Promise<void>;
  removeRoomMember(roomId: number, userId: string): Promise<void>;
  getRoomMembers(roomId: number): Promise<RoomMember[]>;
  
  // Subject/Subcategory operations
  createSubject(subject: InsertSubject): Promise<Subject>;
  createSubcategory(subcategory: InsertSubcategory): Promise<Subcategory>;
  getRoomSubjects(roomId: number): Promise<Subject[]>;
  getSubjectSubcategories(subjectId: number): Promise<Subcategory[]>;
  updateSubject(id: number, name: string): Promise<Subject>;
  updateSubcategory(id: number, name: string): Promise<Subcategory>;
  deleteSubject(id: number): Promise<void>;
  deleteSubcategory(id: number): Promise<void>;
  
  // Message operations
  createMessage(message: InsertMessage): Promise<Message>;
  getRoomMessages(roomId: number, limit?: number, offset?: number): Promise<Message[]>;
  getDirectMessages(userId1: string, userId2: string, limit?: number, offset?: number): Promise<Message[]>;
  updateMessage(id: number, content: string): Promise<Message>;
  deleteMessage(id: number, userId: string): Promise<void>;
  updateMessageStatus(messageId: number, userId: string, status: string): Promise<void>;
  
  // File operations
  createFile(file: InsertFile): Promise<File>;
  getRoomFiles(roomId: number, subjectId?: number, subcategoryId?: number): Promise<File[]>;
  getUserFiles(userId: string): Promise<File[]>;
  getFileById(id: number): Promise<File | undefined>;
  deleteFile(id: number, userId: string): Promise<void>;
  searchFiles(query: string, userId: string): Promise<File[]>;
  
  // Call operations
  createCall(callerId: string, calleeId?: string, roomId?: number, callType?: string): Promise<Call>;
  updateCallStatus(id: number, status: string, endedAt?: Date): Promise<void>;
  getUserCalls(userId: string): Promise<Call[]>;
  
  // Status operations
  createStatus(userId: string, content: string, type?: string): Promise<Status>;
  getUserStatuses(userId: string): Promise<Status[]>;
  getFriendsStatuses(userId: string): Promise<Status[]>;
  addStatusReaction(statusId: number, userId: string, reaction: string): Promise<void>;
  removeStatusReaction(statusId: number, userId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations - mandatory for Replit Auth
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // User management
  async updateUserProfile(id: string, data: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async searchUsers(query: string): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(
        or(
          sql`${users.username} ILIKE ${`%${query}%`}`,
          sql`${users.firstName} ILIKE ${`%${query}%`}`,
          sql`${users.lastName} ILIKE ${`%${query}%`}`
        )
      )
      .limit(20);
  }

  // Friend operations
  async sendFriendRequest(requesterId: string, addresseeId: string): Promise<Friendship> {
    const [friendship] = await db
      .insert(friendships)
      .values({
        requesterId,
        addresseeId,
        status: "pending",
      })
      .returning();
    return friendship;
  }

  async getFriendRequests(userId: string): Promise<Friendship[]> {
    return await db
      .select()
      .from(friendships)
      .where(and(eq(friendships.addresseeId, userId), eq(friendships.status, "pending")))
      .orderBy(desc(friendships.createdAt));
  }

  async acceptFriendRequest(friendshipId: number): Promise<void> {
    await db
      .update(friendships)
      .set({ status: "accepted", updatedAt: new Date() })
      .where(eq(friendships.id, friendshipId));
  }

  async rejectFriendRequest(friendshipId: number): Promise<void> {
    await db
      .update(friendships)
      .set({ status: "rejected", updatedAt: new Date() })
      .where(eq(friendships.id, friendshipId));
  }

  async getFriends(userId: string): Promise<User[]> {
    const friendIds = await db
      .select({
        friendId: sql<string>`CASE 
          WHEN ${friendships.requesterId} = ${userId} THEN ${friendships.addresseeId}
          ELSE ${friendships.requesterId}
        END`.as("friendId"),
      })
      .from(friendships)
      .where(
        and(
          or(
            eq(friendships.requesterId, userId),
            eq(friendships.addresseeId, userId)
          ),
          eq(friendships.status, "accepted")
        )
      );

    if (friendIds.length === 0) return [];

    return await db
      .select()
      .from(users)
      .where(inArray(users.id, friendIds.map(f => f.friendId)));
  }

  async areFriends(userId1: string, userId2: string): Promise<boolean> {
    const [friendship] = await db
      .select()
      .from(friendships)
      .where(
        and(
          or(
            and(eq(friendships.requesterId, userId1), eq(friendships.addresseeId, userId2)),
            and(eq(friendships.requesterId, userId2), eq(friendships.addresseeId, userId1))
          ),
          eq(friendships.status, "accepted")
        )
      );
    return !!friendship;
  }

  // Room operations
  async createRoom(room: InsertRoom): Promise<Room> {
    const [newRoom] = await db.insert(rooms).values(room).returning();
    
    // Add creator as member with creator role
    await db.insert(roomMembers).values({
      roomId: newRoom.id,
      userId: room.creatorId,
      role: "creator",
    });

    return newRoom;
  }

  async getUserRooms(userId: string): Promise<Room[]> {
    return await db
      .select({
        id: rooms.id,
        name: rooms.name,
        description: rooms.description,
        imageUrl: rooms.imageUrl,
        creatorId: rooms.creatorId,
        createdAt: rooms.createdAt,
        updatedAt: rooms.updatedAt,
      })
      .from(rooms)
      .innerJoin(roomMembers, eq(rooms.id, roomMembers.roomId))
      .where(eq(roomMembers.userId, userId))
      .orderBy(desc(rooms.updatedAt));
  }

  async getRoomById(id: number): Promise<Room | undefined> {
    const [room] = await db.select().from(rooms).where(eq(rooms.id, id));
    return room;
  }

  async updateRoom(id: number, data: Partial<Room>): Promise<Room> {
    const [room] = await db
      .update(rooms)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(rooms.id, id))
      .returning();
    return room;
  }

  async addRoomMember(roomId: number, userId: string, role = "member"): Promise<void> {
    await db.insert(roomMembers).values({
      roomId,
      userId,
      role,
    });
  }

  async removeRoomMember(roomId: number, userId: string): Promise<void> {
    await db
      .delete(roomMembers)
      .where(and(eq(roomMembers.roomId, roomId), eq(roomMembers.userId, userId)));
  }

  async getRoomMembers(roomId: number): Promise<RoomMember[]> {
    return await db
      .select()
      .from(roomMembers)
      .where(eq(roomMembers.roomId, roomId))
      .orderBy(asc(roomMembers.joinedAt));
  }

  // Subject/Subcategory operations
  async createSubject(subject: InsertSubject): Promise<Subject> {
    const [newSubject] = await db.insert(subjects).values(subject).returning();
    return newSubject;
  }

  async createSubcategory(subcategory: InsertSubcategory): Promise<Subcategory> {
    const [newSubcategory] = await db.insert(subcategories).values(subcategory).returning();
    return newSubcategory;
  }

  async getRoomSubjects(roomId: number): Promise<Subject[]> {
    return await db
      .select()
      .from(subjects)
      .where(eq(subjects.roomId, roomId))
      .orderBy(asc(subjects.name));
  }

  async getSubjectSubcategories(subjectId: number): Promise<Subcategory[]> {
    return await db
      .select()
      .from(subcategories)
      .where(eq(subcategories.subjectId, subjectId))
      .orderBy(asc(subcategories.name));
  }

  async updateSubject(id: number, name: string): Promise<Subject> {
    const [subject] = await db
      .update(subjects)
      .set({ name })
      .where(eq(subjects.id, id))
      .returning();
    return subject;
  }

  async updateSubcategory(id: number, name: string): Promise<Subcategory> {
    const [subcategory] = await db
      .update(subcategories)
      .set({ name })
      .where(eq(subcategories.id, id))
      .returning();
    return subcategory;
  }

  async deleteSubject(id: number): Promise<void> {
    await db.delete(subjects).where(eq(subjects.id, id));
  }

  async deleteSubcategory(id: number): Promise<void> {
    await db.delete(subcategories).where(eq(subcategories.id, id));
  }

  // Message operations
  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db.insert(messages).values(message).returning();
    return newMessage;
  }

  async getRoomMessages(roomId: number, limit = 50, offset = 0): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(and(eq(messages.roomId, roomId), eq(messages.isDeleted, false)))
      .orderBy(desc(messages.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getDirectMessages(userId1: string, userId2: string, limit = 50, offset = 0): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(
        and(
          or(
            and(eq(messages.senderId, userId1), eq(messages.recipientId, userId2)),
            and(eq(messages.senderId, userId2), eq(messages.recipientId, userId1))
          ),
          eq(messages.isDeleted, false)
        )
      )
      .orderBy(desc(messages.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async updateMessage(id: number, content: string): Promise<Message> {
    const [message] = await db
      .update(messages)
      .set({ content })
      .where(eq(messages.id, id))
      .returning();
    return message;
  }

  async deleteMessage(id: number, userId: string): Promise<void> {
    await db
      .update(messages)
      .set({ isDeleted: true, deletedAt: new Date() })
      .where(and(eq(messages.id, id), eq(messages.senderId, userId)));
  }

  async updateMessageStatus(messageId: number, userId: string, status: string): Promise<void> {
    await db
      .insert(messageStatus)
      .values({
        messageId,
        userId,
        status,
      })
      .onConflictDoUpdate({
        target: [messageStatus.messageId, messageStatus.userId],
        set: { status, statusAt: new Date() },
      });
  }

  // File operations
  async createFile(file: InsertFile): Promise<File> {
    const [newFile] = await db.insert(files).values(file).returning();
    return newFile;
  }

  async getRoomFiles(roomId: number, subjectId?: number, subcategoryId?: number): Promise<File[]> {
    let query = db
      .select()
      .from(files)
      .where(and(eq(files.roomId, roomId), eq(files.isDeleted, false)));

    if (subjectId) {
      query = query.where(eq(files.subjectId, subjectId));
    }

    if (subcategoryId) {
      query = query.where(eq(files.subcategoryId, subcategoryId));
    }

    return await query.orderBy(desc(files.createdAt));
  }

  async getUserFiles(userId: string): Promise<File[]> {
    return await db
      .select()
      .from(files)
      .where(and(eq(files.uploaderId, userId), eq(files.isDeleted, false)))
      .orderBy(desc(files.createdAt));
  }

  async getFileById(id: number): Promise<File | undefined> {
    const [file] = await db.select().from(files).where(eq(files.id, id));
    return file;
  }

  async deleteFile(id: number, userId: string): Promise<void> {
    await db
      .update(files)
      .set({ isDeleted: true, deletedAt: new Date() })
      .where(and(eq(files.id, id), eq(files.uploaderId, userId)));
  }

  async searchFiles(query: string, userId: string): Promise<File[]> {
    return await db
      .select()
      .from(files)
      .where(
        and(
          eq(files.uploaderId, userId),
          eq(files.isDeleted, false),
          or(
            sql`${files.originalName} ILIKE ${`%${query}%`}`,
            sql`${files.fileName} ILIKE ${`%${query}%`}`
          )
        )
      )
      .orderBy(desc(files.createdAt))
      .limit(20);
  }

  // Call operations
  async createCall(callerId: string, calleeId?: string, roomId?: number, callType = "voice"): Promise<Call> {
    const [call] = await db
      .insert(calls)
      .values({
        callerId,
        calleeId,
        roomId,
        callType,
        status: "pending",
      })
      .returning();
    return call;
  }

  async updateCallStatus(id: number, status: string, endedAt?: Date): Promise<void> {
    const updateData: any = { status };
    if (status === "active" && !endedAt) {
      updateData.startedAt = new Date();
    }
    if (endedAt) {
      updateData.endedAt = endedAt;
    }

    await db.update(calls).set(updateData).where(eq(calls.id, id));
  }

  async getUserCalls(userId: string): Promise<Call[]> {
    return await db
      .select()
      .from(calls)
      .where(or(eq(calls.callerId, userId), eq(calls.calleeId, userId)))
      .orderBy(desc(calls.createdAt))
      .limit(50);
  }

  // Status operations
  async createStatus(userId: string, content: string, type = "achievement"): Promise<Status> {
    const [status] = await db
      .insert(statuses)
      .values({
        userId,
        content,
        type,
      })
      .returning();
    return status;
  }

  async getUserStatuses(userId: string): Promise<Status[]> {
    return await db
      .select()
      .from(statuses)
      .where(and(eq(statuses.userId, userId), eq(statuses.isDeleted, false)))
      .orderBy(desc(statuses.createdAt))
      .limit(20);
  }

  async getFriendsStatuses(userId: string): Promise<Status[]> {
    const friends = await this.getFriends(userId);
    if (friends.length === 0) return [];

    return await db
      .select()
      .from(statuses)
      .where(
        and(
          inArray(statuses.userId, friends.map(f => f.id)),
          eq(statuses.isDeleted, false)
        )
      )
      .orderBy(desc(statuses.createdAt))
      .limit(50);
  }

  async addStatusReaction(statusId: number, userId: string, reaction: string): Promise<void> {
    await db
      .insert(statusReactions)
      .values({
        statusId,
        userId,
        reaction,
      })
      .onConflictDoUpdate({
        target: [statusReactions.statusId, statusReactions.userId],
        set: { reaction, createdAt: new Date() },
      });
  }

  async removeStatusReaction(statusId: number, userId: string): Promise<void> {
    await db
      .delete(statusReactions)
      .where(and(eq(statusReactions.statusId, statusId), eq(statusReactions.userId, userId)));
  }
}

export const storage = new DatabaseStorage();
