# EduChat - Academic Collaboration Platform

## Overview

EduChat is a WhatsApp-like communication platform specifically designed for academic collaboration, file organization, and structured group learning. The application provides both 1-on-1 chats and organized study rooms with comprehensive file management capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The client-side application is built using:
- **React 18** with TypeScript for type safety and modern React patterns
- **Wouter** for lightweight client-side routing
- **TanStack Query** for server state management and caching
- **Tailwind CSS** for utility-first styling
- **shadcn/ui** component library for consistent UI components
- **Vite** as the build tool for fast development and optimized production builds

### Backend Architecture
The server-side follows a Node.js Express architecture:
- **Express.js** as the web framework
- **TypeScript** throughout the entire codebase for type consistency
- **Drizzle ORM** for database operations with type-safe queries
- **Neon Database** (PostgreSQL) for data persistence
- **WebSocket** integration for real-time messaging
- **Multer** for file upload handling
- **Replit Authentication** for user management

### Data Storage Solutions
- **PostgreSQL** (via Neon Database) as the primary database
- **File System** storage for uploaded files
- **Session Storage** using PostgreSQL tables for authentication
- **In-memory WebSocket** connection management

## Key Components

### Authentication System
- **Replit OAuth Integration**: Uses OpenID Connect for seamless authentication
- **Session Management**: PostgreSQL-backed sessions with configurable TTL
- **User Profile Management**: Username, bio, profile images, and status tracking

### Real-time Communication
- **WebSocket Server**: Handles real-time messaging, typing indicators, and presence
- **Message Status**: Read receipts with delivery and seen indicators
- **File Sharing**: Support for multiple file types with metadata

### Room Management
- **Study Rooms**: Organized spaces with creator permissions
- **Subject Organization**: Hierarchical structure with subjects and subcategories
- **Member Management**: Role-based access control
- **File Organization**: Structured file storage by subject and category

### Social Features
- **Friend System**: Instagram-like friend requests and acceptance
- **User Discovery**: Search functionality for finding other users
- **Privacy Controls**: Friend-based communication initiation

## Data Flow

### Authentication Flow
1. User initiates login via Replit OAuth
2. Server validates credentials and creates/updates user record
3. Session established with PostgreSQL storage
4. Client receives user data and authentication state

### Messaging Flow
1. User composes message in React component
2. WebSocket sends message to server
3. Server persists message to PostgreSQL
4. Server broadcasts to relevant room/chat participants
5. Real-time updates trigger UI updates via TanStack Query

### File Upload Flow
1. Client selects file and provides metadata (name, subject, subcategory)
2. Multer processes file upload to server filesystem
3. File metadata stored in PostgreSQL with path reference
4. WebSocket notification sent to room participants
5. File appears in organized file explorer structure

## External Dependencies

### Database Services
- **Neon Database**: Serverless PostgreSQL for production scaling
- **Drizzle Kit**: Database migration and schema management

### Authentication
- **Replit OAuth**: OpenID Connect integration for user authentication
- **Session Management**: connect-pg-simple for PostgreSQL session storage

### Real-time Features
- **WebSocket (ws)**: Native WebSocket implementation for real-time communication
- **Socket Connection Management**: In-memory mapping of user connections

### UI Framework
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library for consistent iconography

### Development Tools
- **Vite**: Fast build tool with HMR
- **TypeScript**: Type safety across frontend and backend
- **ESBuild**: Fast production bundling

## Deployment Strategy

### Development Environment
- **Replit Integration**: Native support for Replit development environment
- **Hot Module Replacement**: Vite-powered development with instant updates
- **Environment Variables**: Secure configuration management for database and auth

### Production Build
- **Frontend**: Vite builds optimized static assets to `dist/public`
- **Backend**: ESBuild bundles server code to `dist/index.js`
- **Database Migrations**: Drizzle handles schema deployment
- **Session Storage**: PostgreSQL tables for production session management

### Architecture Decisions

#### Chosen Technologies and Rationale

**PostgreSQL over NoSQL**: 
- Requirement for complex relationships between users, rooms, subjects, and files
- ACID compliance needed for message ordering and file metadata
- Strong typing support with Drizzle ORM

**WebSocket over Socket.io**:
- Lighter weight for real-time messaging requirements
- Direct browser WebSocket API compatibility
- Simpler connection management for the use case

**TanStack Query over Redux**:
- Better suited for server state management
- Built-in caching and synchronization
- Reduced boilerplate for data fetching patterns

**Replit Auth over Custom Auth**:
- Seamless integration with Replit platform
- Reduced security maintenance overhead
- OpenID Connect standard compliance

**Tailwind over styled-components**:
- Utility-first approach speeds development
- Better performance (no runtime CSS-in-JS)
- Consistent design system enforcement

The architecture prioritizes developer experience, type safety, and real-time capabilities while maintaining simplicity and scalability for educational use cases.