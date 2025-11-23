# AI File Cleanup - Technical Report

## Executive Summary

AI File Cleanup is an intelligent file deduplication system that leverages artificial intelligence and machine learning to identify and manage duplicate files across different formats. The system provides both web and desktop applications, enabling users to efficiently clean up their storage by detecting exact duplicates, similar images, and semantically similar text documents using advanced ML models.

---

## Table of Contents

1. [Introduction](#introduction)
2. [Use Cases](#use-cases)
3. [Technology Stack](#technology-stack)
4. [Technology Deep Dive](#technology-deep-dive)
5. [System Architecture](#system-architecture)
6. [Conclusion](#conclusion)

---

## 1. Introduction

### 1.1 Problem Statement

Modern digital workflows generate vast amounts of files, leading to storage bloat from duplicate and near-duplicate files. Traditional deduplication tools rely on simple file name or hash comparisons, missing semantically similar content. This system addresses these limitations by using AI-powered similarity detection.

### 1.2 Solution Overview

AI File Cleanup combines traditional hash-based duplicate detection with machine learning models to identify:

- **Exact duplicates** using SHA-256 hashing
- **Similar images** using perceptual hashing and CLIP embeddings
- **Similar text documents** using DistilBERT embeddings
- **PDF content similarity** through text extraction and comparison

### 1.3 Key Differentiators

- **AI-Powered Detection**: Goes beyond simple file comparison to understand content semantics
- **Multi-Format Support**: Handles images, text files, PDFs, and various document formats
- **Dual Deployment**: Web application for cloud access and desktop app for local processing
- **Safe Operations**: Files are moved to trash/recycle bin, not permanently deleted
- **Vector Database**: Uses PostgreSQL with pgvector for efficient similarity search

---

## 2. Use Cases

### 2.1 Personal File Management

**Scenario**: A user has accumulated thousands of photos, documents, and files over years, with many duplicates scattered across different folders.

**Solution**:

- Upload or scan directories containing files
- System identifies exact duplicates and similar images (e.g., same photo with different resolutions)
- User reviews grouped duplicates and safely removes unnecessary copies
- Storage space is reclaimed without losing important files

**Benefits**:

- Reclaim storage space
- Organize digital assets
- Reduce backup storage costs

### 2.2 Professional Document Cleanup

**Scenario**: A professional has multiple versions of documents, reports, and presentations with slight variations stored in different locations.

**Solution**:

- Process document collections (PDFs, Word files, text documents)
- System detects semantically similar documents using text embeddings
- Identifies documents that are near-duplicates (e.g., draft versions, edited copies)
- User can keep the most recent or preferred version

**Benefits**:

- Maintain clean document repositories
- Avoid confusion from multiple versions
- Improve document organization

### 2.3 Media Library Deduplication

**Scenario**: A content creator or photographer has duplicate images across different projects, backups, and edited versions.

**Solution**:

- Scan image collections
- System uses CLIP embeddings to find visually similar images
- Perceptual hashing identifies exact duplicates and near-duplicates
- Group images by similarity for review

**Benefits**:

- Clean up photo libraries
- Identify best quality versions
- Optimize storage for large media collections

### 2.4 Development Project Cleanup

**Scenario**: A developer has multiple project backups, configuration files, and code files with duplicates across different directories.

**Solution**:

- Process project directories
- System identifies duplicate code files, config files, and backups
- Text similarity detection finds files with similar content
- Safe cleanup of redundant files

**Benefits**:

- Clean project structures
- Reduce repository size
- Improve development workflow

### 2.5 Enterprise Storage Optimization

**Scenario**: An organization needs to optimize storage costs by identifying duplicate files across shared drives and user directories.

**Solution**:

- Process large file collections
- Batch processing handles thousands of files
- Generate reports on duplicate groups
- Administrators can review and approve cleanup operations

**Benefits**:

- Reduce storage costs
- Improve data governance
- Optimize backup processes

### 2.6 Desktop Application Use Case

**Scenario**: A user wants to process local files without uploading to cloud services, maintaining privacy and working offline.

**Solution**:

- Desktop application scans local directories
- License key activation for secure access
- All processing happens locally
- Files are moved to system trash/recycle bin

**Benefits**:

- Privacy: files never leave the device
- Offline operation
- No internet required
- Native file system integration

---

## 3. Technology Stack

### 3.1 Frontend Technologies

#### Web Application

- **Next.js 14** (App Router) - React framework with server-side rendering
- **React 18** - UI library for building interactive interfaces
- **TypeScript** - Type-safe JavaScript for better code quality
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - High-quality React component library
- **NextAuth.js** - Authentication and session management
- **Zustand** - Lightweight state management
- **TanStack Query** - Data fetching and caching

#### Desktop Application

- **Electron 28** - Cross-platform desktop app framework
- **Vite** - Fast build tool and dev server
- **React 18** - Same UI framework as web app
- **TypeScript** - Type safety across platforms
- **Webpack** - Module bundler for Electron main process

### 3.2 Backend Technologies

#### API Service

- **FastAPI** - Modern Python web framework with automatic API documentation
- **Python 3.10+** - Programming language
- **Pydantic** - Data validation using Python type annotations
- **Prisma (Python Client)** - Type-safe database ORM
- **JWT** - JSON Web Tokens for authentication
- **bcrypt** - Password hashing
- **python-magic** - MIME type detection

#### ML Service

- **FastAPI** - API framework for ML endpoints
- **PyTorch 2.8.0** - Deep learning framework
- **Transformers 4.47.0** - Hugging Face library for pre-trained models
- **Pillow** - Image processing library
- **DistilBERT** - Text embedding model
- **CLIP** - Vision-language model for image embeddings

### 3.3 Database & Storage

- **PostgreSQL 15+** - Relational database
- **pgvector** - Vector similarity search extension
- **Prisma** - Database ORM and migration tool
- **Docker** - Containerization for local development

### 3.4 Development & DevOps

- **TurboRepo** - Monorepo build system
- **pnpm** - Fast, disk space efficient package manager
- **Docker Compose** - Multi-container Docker applications
- **TypeScript** - Type checking across the stack
- **ESLint & Prettier** - Code quality and formatting

### 3.5 Deployment Platforms

- **Vercel** - Web application hosting (Next.js)
- **Render** - Backend API and ML service hosting
- **Neon** - Managed PostgreSQL with pgvector
- **Electron Builder** - Desktop app packaging (Windows, macOS, Linux)

---

## 4. Technology Deep Dive

### 4.1 Frontend Architecture

#### Next.js App Router

Next.js 14's App Router provides server-side rendering, static site generation, and API routes. The application uses:

- **Server Components** for initial page loads
- **Client Components** for interactive features
- **Route Handlers** for API proxy endpoints
- **Middleware** for authentication and route protection

#### State Management

- **Zustand** provides lightweight global state for UI state
- **TanStack Query** manages server state, caching, and synchronization
- **React Context** for theme and user session

#### UI Components

The application uses shadcn/ui components built on Radix UI primitives, providing:

- Accessible components out of the box
- Customizable styling with Tailwind CSS
- Consistent design system

### 4.2 Backend Architecture

#### FastAPI Framework

FastAPI is chosen for its:

- **Automatic API Documentation** (OpenAPI/Swagger)
- **Type Safety** with Pydantic models
- **Async/Await Support** for high performance
- **Dependency Injection** for clean code organization

#### Security Layers

The API implements multiple security layers:

1. **JWT Authentication** - Token-based auth with httpOnly cookies
2. **Rate Limiting** - 3-tier rate limiting (general, auth, uploads)
3. **Input Validation** - Multi-layer validation with Pydantic
4. **CORS Protection** - Whitelist-based CORS configuration
5. **File Upload Security** - MIME type validation, size limits, path traversal prevention

#### Database Layer

- **Prisma ORM** provides type-safe database access
- **Connection Pooling** for efficient database connections
- **Migrations** for schema version control
- **pgvector** extension enables vector similarity search

### 4.3 Machine Learning Pipeline

#### Text Embedding (DistilBERT)

- **Model**: DistilBERT-base-uncased from Hugging Face
- **Purpose**: Generate 768-dimensional embeddings for text files
- **Process**:
  1. Extract text content from files (TXT, PDF, CSV)
  2. Tokenize and process through DistilBERT
  3. Generate embeddings
  4. Store in PostgreSQL with pgvector
  5. Use cosine similarity to find similar documents

#### Image Embedding (CLIP)

- **Model**: CLIP (Contrastive Language-Image Pre-training)
- **Purpose**: Generate 512-dimensional embeddings for images
- **Process**:
  1. Load and preprocess images
  2. Generate embeddings using CLIP vision encoder
  3. Store in PostgreSQL with pgvector
  4. Use cosine similarity for image similarity search

#### Perceptual Hashing

- **Algorithm**: Perceptual hash (pHash) for images
- **Purpose**: Fast exact duplicate detection
- **Process**:
  1. Generate pHash for each image
  2. Compare hashes for exact matches
  3. Used as first-pass filter before ML processing

#### Vector Similarity Search

- **Database**: PostgreSQL with pgvector extension
- **Method**: Cosine similarity using vector operators
- **Indexing**: HNSW (Hierarchical Navigable Small World) index for fast search
- **Threshold**: Configurable similarity threshold (default: 0.85)

### 4.4 File Processing Pipeline

#### Upload & Validation

1. **File Upload** - Multipart form data upload
2. **Validation** - File type, size, and MIME type checks
3. **Storage** - Temporary storage in secure directories
4. **Metadata Extraction** - File name, size, type, timestamps

#### Hash Calculation

1. **SHA-256** - Cryptographic hash for exact duplicate detection
2. **Perceptual Hash** - For image similarity (first pass)
3. **Hash Comparison** - Fast lookup in database

#### Content Extraction

1. **Text Files** - Direct content extraction
2. **PDF Files** - Text extraction using PyPDF2 or similar
3. **Images** - Load and preprocess for ML models
4. **CSV Files** - Parse and extract text content

#### ML Processing

1. **Batch Processing** - Group files by type for efficient processing
2. **Embedding Generation** - Call ML service for embeddings
3. **Caching** - Cache embeddings by SHA-256 to avoid reprocessing
4. **Vector Storage** - Store embeddings in PostgreSQL

#### Duplicate Detection

1. **Exact Duplicates** - SHA-256 hash matching
2. **Image Similarity** - Vector similarity search on CLIP embeddings
3. **Text Similarity** - Vector similarity search on DistilBERT embeddings
4. **Grouping** - Cluster similar files into duplicate groups

### 4.5 Database Schema

#### Core Tables

- **users** - User accounts and authentication
- **license_keys** - Desktop app license management
- **uploads** - Upload session tracking
- **files** - File metadata and hashes
- **file_embeddings** - Vector embeddings (text and image)
- **dedupe_groups** - Duplicate file groupings

#### Vector Storage

- **embedding** - 768-dimensional vector for text (DistilBERT)
- **embeddingImg** - 512-dimensional vector for images (CLIP)
- **pgvector** extension enables efficient similarity queries

### 4.6 Desktop Application Architecture

#### Electron Structure

- **Main Process** - Node.js process managing windows and system integration
- **Renderer Process** - React application running in Chromium
- **Preload Script** - Secure bridge between main and renderer processes

#### Local Processing

- **File System Access** - Native file system operations
- **Directory Scanning** - Recursive directory traversal
- **License Validation** - API-based license key verification
- **Trash Operations** - Native OS trash/recycle bin integration

#### Security

- **Context Isolation** - Isolated renderer process
- **Node Integration** - Disabled in renderer for security
- **IPC Communication** - Secure inter-process communication

---

## 5. System Architecture

### 5.1 High-Level Architecture Diagram

<!-- UML Diagram Placeholder: System Architecture -->

![System Architecture Diagram](diagrams/system-architecture.png)

_Figure 1: High-level system architecture showing web app, desktop app, API service, ML service, and database relationships._

### 5.2 Component Architecture

<!-- UML Diagram Placeholder: Component Diagram -->

![Component Architecture Diagram](diagrams/component-architecture.png)

_Figure 2: Component architecture showing internal structure of each service and their interactions._

### 5.3 Data Flow Diagram

<!-- UML Diagram Placeholder: Data Flow -->

![Data Flow Diagram](diagrams/data-flow.png)

_Figure 3: Data flow from file upload through processing, ML inference, and duplicate detection._

### 5.4 Sequence Diagram - File Deduplication

<!-- UML Diagram Placeholder: Sequence Diagram -->

![Sequence Diagram](diagrams/sequence-deduplication.png)

_Figure 4: Sequence diagram showing the complete file deduplication workflow from user upload to results display._

### 5.5 Deployment Architecture

<!-- UML Diagram Placeholder: Deployment Diagram -->

![Deployment Architecture Diagram](diagrams/deployment-architecture.png)

_Figure 5: Production deployment architecture showing Vercel, Render, and Neon services._

### 5.6 Database Schema Diagram

<!-- UML Diagram Placeholder: Database Schema -->

![Database Schema Diagram](diagrams/database-schema.png)

_Figure 6: Entity-relationship diagram showing database tables, relationships, and vector storage._

---

## 6. Conclusion

### 6.1 Summary

AI File Cleanup represents a modern approach to file deduplication, combining traditional hash-based methods with cutting-edge machine learning models. The system successfully addresses the challenge of identifying not just exact duplicates, but semantically similar content across different file formats.

### 6.2 Key Achievements

- **AI-Powered Detection**: Successfully implements ML-based similarity detection for images and text
- **Multi-Platform Support**: Provides both web and desktop applications
- **Scalable Architecture**: Microservices architecture allows independent scaling
- **Security**: Comprehensive security measures protect user data
- **User Experience**: Intuitive interfaces for both technical and non-technical users

### 6.3 Technical Highlights

- **Vector Database**: Efficient similarity search using PostgreSQL with pgvector
- **Model Caching**: Embedding caching reduces computational overhead
- **Batch Processing**: Optimized ML inference for multiple files
- **Type Safety**: End-to-end TypeScript and Pydantic validation
- **Modern Stack**: Latest versions of frameworks and libraries

### 6.4 Future Enhancements

- **Video Deduplication**: Extend ML models to video content
- **Audio Similarity**: Add audio file duplicate detection
- **Real-time Processing**: WebSocket-based progress updates
- **Advanced Analytics**: Detailed reports and statistics
- **Enterprise Features**: Team workspaces and collaboration tools

### 6.5 Final Notes

This system demonstrates the practical application of machine learning in solving real-world problems. By combining traditional software engineering practices with modern AI/ML capabilities, we've created a robust, scalable, and user-friendly solution for file management.

---

**Document Version**: 1.0  
**Last Updated**: January 2025  
**Author**: AI File Cleanup Team
