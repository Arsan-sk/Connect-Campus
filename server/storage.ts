import {
  users,
  rooms,
  roomMembers,
  messages,
  files,
  friendships,
  subjects,
  subcategories,
  statuses,
  type User,
  type InsertUser,
  type Room,
  type InsertRoom,
  type Message,
  type InsertMessage,
  type File,
  type InsertFile,
  type Friendship,
  type InsertFriendship,
  type Subject,
  type Subcategory,
  type RoomMember,
  type Status,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, desc, asc, like, inArray } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined>;
  searchUsers(query: string): Promise<User[]>;

  // Friend operations
  sendFriendRequest(requesterId: number, addresseeId: number): Promise<Friendship>;
  acceptFriendRequest(friendshipId: number): Promise<Friendship | undefined>;
  rejectFriendRequest(friendshipId: number): Promise<Friendship | undefined>;
  getFriends(userId: number): Promise<User[]>;
  getFriendRequests(userId: number): Promise<Friendship[]>;
  getSentFriendRequests(userId: number): Promise<Friendship[]>;

  // Room operations
  createRoom(room: InsertRoom): Promise<Room>;
  getRooms(userId: number): Promise<Room[]>;
  getRoom(id: number): Promise<Room | undefined>;
  updateRoom(id: number, updates: Partial<InsertRoom>): Promise<Room | undefined>;
  deleteRoom(id: number): Promise<boolean>;
  addUserToRoom(roomId: number, userId: number, role?: string): Promise<RoomMember>;
  removeUserFromRoom(roomId: number, userId: number): Promise<boolean>;
  getRoomMembers(roomId: number): Promise<User[]>;

  // Message operations
  createMessage(message: InsertMessage): Promise<Message>;
  getMessages(roomId?: number, recipientId?: number, senderId?: number): Promise<Message[]>;
  getDirectMessages(userId1: number, userId2: number): Promise<Message[]>;
  updateMessage(id: number, updates: Partial<InsertMessage>): Promise<Message | undefined>;
  deleteMessage(id: number): Promise<boolean>;

  // File operations
  createFile(file: InsertFile): Promise<File>;
  getFiles(roomId?: number, uploadedById?: number): Promise<File[]>;
  getFile(id: number): Promise<File | undefined>;
  updateFile(id: number, updates: Partial<InsertFile>): Promise<File | undefined>;
  deleteFile(id: number): Promise<boolean>;
  getFilesBySubject(subjectId: number): Promise<File[]>;
  getFilesBySubcategory(subcategoryId: number): Promise<File[]>;

  // Subject and subcategory operations
  getSubjects(): Promise<Subject[]>;
  createSubject(name: string): Promise<Subject>;
  getSubcategories(subjectId?: number): Promise<Subcategory[]>;
  createSubcategory(name: string, subjectId: number): Promise<Subcategory>;

  // Status operations
  updateUserStatus(userId: number, status: string, roomId?: number): Promise<Status>;
  getUserStatuses(userIds: number[]): Promise<Status[]>;
  deleteUserStatus(userId: number, roomId?: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async searchUsers(query: string): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(
        or(
          like(users.username, `%${query}%`),
          like(users.firstName, `%${query}%`),
          like(users.lastName, `%${query}%`)
        )
      )
      .limit(20);
  }

  // Friend operations
  async sendFriendRequest(requesterId: number, addresseeId: number): Promise<Friendship> {
    const [friendship] = await db
      .insert(friendships)
      .values({ requesterId, addresseeId })
      .returning();
    return friendship;
  }

  async acceptFriendRequest(friendshipId: number): Promise<Friendship | undefined> {
    const [friendship] = await db
      .update(friendships)
      .set({ status: "accepted", updatedAt: new Date() })
      .where(eq(friendships.id, friendshipId))
      .returning();
    return friendship;
  }

  async rejectFriendRequest(friendshipId: number): Promise<Friendship | undefined> {
    const [friendship] = await db
      .update(friendships)
      .set({ status: "rejected", updatedAt: new Date() })
      .where(eq(friendships.id, friendshipId))
      .returning();
    return friendship;
  }

  async getFriends(userId: number): Promise<User[]> {
    const friendshipsList = await db
      .select()
      .from(friendships)
      .where(
        and(
          or(eq(friendships.requesterId, userId), eq(friendships.addresseeId, userId)),
          eq(friendships.status, "accepted")
        )
      );

    const friendIds = friendshipsList.map((f) =>
      f.requesterId === userId ? f.addresseeId : f.requesterId
    );

    if (friendIds.length === 0) return [];

    return await db.select().from(users).where(inArray(users.id, friendIds));
  }

  async getFriendRequests(userId: number): Promise<Friendship[]> {
    return await db
      .select()
      .from(friendships)
      .where(
        and(eq(friendships.addresseeId, userId), eq(friendships.status, "pending"))
      );
  }

  async getSentFriendRequests(userId: number): Promise<Friendship[]> {
    return await db
      .select()
      .from(friendships)
      .where(
        and(eq(friendships.requesterId, userId), eq(friendships.status, "pending"))
      );
  }

  // Room operations
  async createRoom(room: InsertRoom): Promise<Room> {
    const [newRoom] = await db.insert(rooms).values(room).returning();
    
    // Add creator as admin
    await db.insert(roomMembers).values({
      roomId: newRoom.id,
      userId: room.creatorId,
      role: "admin",
    });

    return newRoom;
  }

  async getRooms(userId: number): Promise<Room[]> {
    const userRooms = await db
      .select({ room: rooms })
      .from(rooms)
      .innerJoin(roomMembers, eq(rooms.id, roomMembers.roomId))
      .where(eq(roomMembers.userId, userId));

    return userRooms.map((ur) => ur.room);
  }

  async getRoom(id: number): Promise<Room | undefined> {
    const [room] = await db.select().from(rooms).where(eq(rooms.id, id));
    return room;
  }

  async updateRoom(id: number, updates: Partial<InsertRoom>): Promise<Room | undefined> {
    const [updatedRoom] = await db
      .update(rooms)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(rooms.id, id))
      .returning();
    return updatedRoom;
  }

  async deleteRoom(id: number): Promise<boolean> {
    const result = await db.delete(rooms).where(eq(rooms.id, id));
    return result.rowCount > 0;
  }

  async addUserToRoom(roomId: number, userId: number, role = "member"): Promise<RoomMember> {
    const [member] = await db
      .insert(roomMembers)
      .values({ roomId, userId, role })
      .returning();
    return member;
  }

  async removeUserFromRoom(roomId: number, userId: number): Promise<boolean> {
    const result = await db
      .delete(roomMembers)
      .where(and(eq(roomMembers.roomId, roomId), eq(roomMembers.userId, userId)));
    return result.rowCount > 0;
  }

  async getRoomMembers(roomId: number): Promise<User[]> {
    const members = await db
      .select({ user: users })
      .from(users)
      .innerJoin(roomMembers, eq(users.id, roomMembers.userId))
      .where(eq(roomMembers.roomId, roomId));

    return members.map((m) => m.user);
  }

  // Message operations
  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db.insert(messages).values(message).returning();
    return newMessage;
  }

  async getMessages(roomId?: number, recipientId?: number, senderId?: number): Promise<Message[]> {
    let query = db.select().from(messages);

    if (roomId) {
      query = query.where(eq(messages.roomId, roomId));
    } else if (recipientId && senderId) {
      query = query.where(
        or(
          and(eq(messages.senderId, senderId), eq(messages.recipientId, recipientId)),
          and(eq(messages.senderId, recipientId), eq(messages.recipientId, senderId))
        )
      );
    }

    return await query.orderBy(desc(messages.createdAt));
  }

  async getDirectMessages(userId1: number, userId2: number): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(
        and(
          or(
            and(eq(messages.senderId, userId1), eq(messages.recipientId, userId2)),
            and(eq(messages.senderId, userId2), eq(messages.recipientId, userId1))
          ),
          eq(messages.roomId, null)
        )
      )
      .orderBy(asc(messages.createdAt));
  }

  async updateMessage(id: number, updates: Partial<InsertMessage>): Promise<Message | undefined> {
    const [updatedMessage] = await db
      .update(messages)
      .set(updates)
      .where(eq(messages.id, id))
      .returning();
    return updatedMessage;
  }

  async deleteMessage(id: number): Promise<boolean> {
    const result = await db.delete(messages).where(eq(messages.id, id));
    return result.rowCount > 0;
  }

  // File operations
  async createFile(file: InsertFile): Promise<File> {
    const [newFile] = await db.insert(files).values(file).returning();
    return newFile;
  }

  async getFiles(roomId?: number, uploadedById?: number): Promise<File[]> {
    let query = db.select().from(files);

    if (roomId) {
      query = query.where(eq(files.roomId, roomId));
    }
    if (uploadedById) {
      query = query.where(eq(files.uploadedById, uploadedById));
    }

    return await query.orderBy(desc(files.createdAt));
  }

  async getFile(id: number): Promise<File | undefined> {
    const [file] = await db.select().from(files).where(eq(files.id, id));
    return file;
  }

  async updateFile(id: number, updates: Partial<InsertFile>): Promise<File | undefined> {
    const [updatedFile] = await db
      .update(files)
      .set(updates)
      .where(eq(files.id, id))
      .returning();
    return updatedFile;
  }

  async deleteFile(id: number): Promise<boolean> {
    const result = await db.delete(files).where(eq(files.id, id));
    return result.rowCount > 0;
  }

  async getFilesBySubject(subjectId: number): Promise<File[]> {
    return await db
      .select()
      .from(files)
      .where(eq(files.subjectId, subjectId))
      .orderBy(desc(files.createdAt));
  }

  async getFilesBySubcategory(subcategoryId: number): Promise<File[]> {
    return await db
      .select()
      .from(files)
      .where(eq(files.subcategoryId, subcategoryId))
      .orderBy(desc(files.createdAt));
  }

  // Subject and subcategory operations
  async getSubjects(): Promise<Subject[]> {
    return await db.select().from(subjects).orderBy(asc(subjects.name));
  }

  async createSubject(name: string): Promise<Subject> {
    const [subject] = await db.insert(subjects).values({ name }).returning();
    return subject;
  }

  async getSubcategories(subjectId?: number): Promise<Subcategory[]> {
    let query = db.select().from(subcategories);
    
    if (subjectId) {
      query = query.where(eq(subcategories.subjectId, subjectId));
    }
    
    return await query.orderBy(asc(subcategories.name));
  }

  async createSubcategory(name: string, subjectId: number): Promise<Subcategory> {
    const [subcategory] = await db
      .insert(subcategories)
      .values({ name, subjectId })
      .returning();
    return subcategory;
  }

  // Status operations
  async updateUserStatus(userId: number, status: string, roomId?: number): Promise<Status> {
    // Delete existing status for this user/room combination
    await db
      .delete(statuses)
      .where(
        roomId
          ? and(eq(statuses.userId, userId), eq(statuses.roomId, roomId))
          : and(eq(statuses.userId, userId), eq(statuses.roomId, null))
      );

    // Insert new status
    const [newStatus] = await db
      .insert(statuses)
      .values({ userId, status, roomId, lastSeen: new Date() })
      .returning();
    return newStatus;
  }

  async getUserStatuses(userIds: number[]): Promise<Status[]> {
    if (userIds.length === 0) return [];
    
    return await db
      .select()
      .from(statuses)
      .where(inArray(statuses.userId, userIds))
      .orderBy(desc(statuses.lastSeen));
  }

  async deleteUserStatus(userId: number, roomId?: number): Promise<boolean> {
    const result = await db
      .delete(statuses)
      .where(
        roomId
          ? and(eq(statuses.userId, userId), eq(statuses.roomId, roomId))
          : eq(statuses.userId, userId)
      );
    return result.rowCount > 0;
  }
}

export const storage = new DatabaseStorage();