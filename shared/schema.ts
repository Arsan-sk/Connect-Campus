import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
  uuid,
  real
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table - mandatory for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table - mandatory for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  username: varchar("username").unique(),
  bio: text("bio"),
  status: varchar("status").default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Friend relationships
export const friendships = pgTable("friendships", {
  id: serial("id").primaryKey(),
  requesterId: varchar("requester_id").notNull().references(() => users.id),
  addresseeId: varchar("addressee_id").notNull().references(() => users.id),
  status: varchar("status").notNull().default("pending"), // pending, accepted, rejected
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Rooms (group chats)
export const rooms = pgTable("rooms", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  description: text("description"),
  imageUrl: varchar("image_url"),
  creatorId: varchar("creator_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Room members
export const roomMembers = pgTable("room_members", {
  id: serial("id").primaryKey(),
  roomId: integer("room_id").notNull().references(() => rooms.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  role: varchar("role").default("member"), // creator, admin, member
  joinedAt: timestamp("joined_at").defaultNow(),
});

// Subjects within rooms
export const subjects = pgTable("subjects", {
  id: serial("id").primaryKey(),
  roomId: integer("room_id").notNull().references(() => rooms.id),
  name: varchar("name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Subcategories within subjects
export const subcategories = pgTable("subcategories", {
  id: serial("id").primaryKey(),
  subjectId: integer("subject_id").notNull().references(() => subjects.id),
  name: varchar("name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Messages
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  content: text("content"),
  senderId: varchar("sender_id").notNull().references(() => users.id),
  roomId: integer("room_id").references(() => rooms.id),
  recipientId: varchar("recipient_id").references(() => users.id), // for direct messages
  messageType: varchar("message_type").notNull().default("text"), // text, file, voice, system
  fileId: integer("file_id").references(() => files.id),
  replyToId: integer("reply_to_id").references(() => messages.id),
  isDeleted: boolean("is_deleted").default(false),
  deletedAt: timestamp("deleted_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Files
export const files = pgTable("files", {
  id: serial("id").primaryKey(),
  originalName: varchar("original_name").notNull(),
  fileName: varchar("file_name").notNull(),
  fileType: varchar("file_type").notNull(),
  fileSize: real("file_size").notNull(),
  filePath: varchar("file_path").notNull(),
  uploaderId: varchar("uploader_id").notNull().references(() => users.id),
  roomId: integer("room_id").references(() => rooms.id),
  subjectId: integer("subject_id").references(() => subjects.id),
  subcategoryId: integer("subcategory_id").references(() => subcategories.id),
  isDeleted: boolean("is_deleted").default(false),
  deletedAt: timestamp("deleted_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Message status (read receipts)
export const messageStatus = pgTable("message_status", {
  id: serial("id").primaryKey(),
  messageId: integer("message_id").notNull().references(() => messages.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  status: varchar("status").notNull().default("sent"), // sent, delivered, read
  statusAt: timestamp("status_at").defaultNow(),
});

// Voice calls
export const calls = pgTable("calls", {
  id: serial("id").primaryKey(),
  callerId: varchar("caller_id").notNull().references(() => users.id),
  calleeId: varchar("callee_id").references(() => users.id),
  roomId: integer("room_id").references(() => rooms.id),
  callType: varchar("call_type").notNull(), // voice, video, group
  status: varchar("status").notNull().default("pending"), // pending, active, ended, missed
  startedAt: timestamp("started_at"),
  endedAt: timestamp("ended_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Status/achievements
export const statuses = pgTable("statuses", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  type: varchar("type").notNull().default("achievement"), // achievement, update
  isDeleted: boolean("is_deleted").default(false),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Status reactions
export const statusReactions = pgTable("status_reactions", {
  id: serial("id").primaryKey(),
  statusId: integer("status_id").notNull().references(() => statuses.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  reaction: varchar("reaction").notNull().default("like"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  sentFriendRequests: many(friendships, { relationName: "requester" }),
  receivedFriendRequests: many(friendships, { relationName: "addressee" }),
  createdRooms: many(rooms),
  roomMemberships: many(roomMembers),
  messages: many(messages),
  files: many(files),
  statuses: many(statuses),
  statusReactions: many(statusReactions),
  calls: many(calls),
}));

export const friendshipsRelations = relations(friendships, ({ one }) => ({
  requester: one(users, {
    fields: [friendships.requesterId],
    references: [users.id],
    relationName: "requester",
  }),
  addressee: one(users, {
    fields: [friendships.addresseeId],
    references: [users.id],
    relationName: "addressee",
  }),
}));

export const roomsRelations = relations(rooms, ({ one, many }) => ({
  creator: one(users, {
    fields: [rooms.creatorId],
    references: [users.id],
  }),
  members: many(roomMembers),
  subjects: many(subjects),
  messages: many(messages),
  files: many(files),
}));

export const roomMembersRelations = relations(roomMembers, ({ one }) => ({
  room: one(rooms, {
    fields: [roomMembers.roomId],
    references: [rooms.id],
  }),
  user: one(users, {
    fields: [roomMembers.userId],
    references: [users.id],
  }),
}));

export const subjectsRelations = relations(subjects, ({ one, many }) => ({
  room: one(rooms, {
    fields: [subjects.roomId],
    references: [rooms.id],
  }),
  subcategories: many(subcategories),
  files: many(files),
}));

export const subcategoriesRelations = relations(subcategories, ({ one, many }) => ({
  subject: one(subjects, {
    fields: [subcategories.subjectId],
    references: [subjects.id],
  }),
  files: many(files),
}));

export const messagesRelations = relations(messages, ({ one, many }) => ({
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
  room: one(rooms, {
    fields: [messages.roomId],
    references: [rooms.id],
  }),
  recipient: one(users, {
    fields: [messages.recipientId],
    references: [users.id],
  }),
  file: one(files, {
    fields: [messages.fileId],
    references: [files.id],
  }),
  replyTo: one(messages, {
    fields: [messages.replyToId],
    references: [messages.id],
  }),
  statuses: many(messageStatus),
}));

export const filesRelations = relations(files, ({ one }) => ({
  uploader: one(users, {
    fields: [files.uploaderId],
    references: [users.id],
  }),
  room: one(rooms, {
    fields: [files.roomId],
    references: [rooms.id],
  }),
  subject: one(subjects, {
    fields: [files.subjectId],
    references: [subjects.id],
  }),
  subcategory: one(subcategories, {
    fields: [files.subcategoryId],
    references: [subcategories.id],
  }),
}));

export const statusesRelations = relations(statuses, ({ one, many }) => ({
  user: one(users, {
    fields: [statuses.userId],
    references: [users.id],
  }),
  reactions: many(statusReactions),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertRoomSchema = createInsertSchema(rooms).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export const insertFileSchema = createInsertSchema(files).omit({
  id: true,
  createdAt: true,
});

export const insertSubjectSchema = createInsertSchema(subjects).omit({
  id: true,
  createdAt: true,
});

export const insertSubcategorySchema = createInsertSchema(subcategories).omit({
  id: true,
  createdAt: true,
});

export const insertFriendshipSchema = createInsertSchema(friendships).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertRoom = z.infer<typeof insertRoomSchema>;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type InsertFile = z.infer<typeof insertFileSchema>;
export type InsertSubject = z.infer<typeof insertSubjectSchema>;
export type InsertSubcategory = z.infer<typeof insertSubcategorySchema>;
export type InsertFriendship = z.infer<typeof insertFriendshipSchema>;

export type Room = typeof rooms.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type File = typeof files.$inferSelect;
export type Subject = typeof subjects.$inferSelect;
export type Subcategory = typeof subcategories.$inferSelect;
export type Friendship = typeof friendships.$inferSelect;
export type RoomMember = typeof roomMembers.$inferSelect;
export type MessageStatus = typeof messageStatus.$inferSelect;
export type Call = typeof calls.$inferSelect;
export type Status = typeof statuses.$inferSelect;
export type StatusReaction = typeof statusReactions.$inferSelect;
