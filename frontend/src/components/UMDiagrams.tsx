import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Container,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Button,
  Menu,
  MenuItem,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Download as DownloadIcon,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon
} from '@mui/icons-material';
import mermaid from 'mermaid';
import { exportAsImage, exportAsPDF, getDiagramTitle, sanitizeFilename } from '../utils/exportUtils';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`diagram-tabpanel-${index}`}
      aria-labelledby={`diagram-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `diagram-tab-${index}`,
    'aria-controls': `diagram-tabpanel-${index}`,
  };
}

const UMLDiagrams: React.FC = () => {
  const [value, setValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportAnchorEl, setExportAnchorEl] = useState<null | HTMLElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const diagramRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Mermaid diagram definitions
  const diagrams = useMemo(() => [
    {
      title: 'Class Diagram',
      description: 'Shows the static structure of the system with classes, attributes, methods, and relationships.',
      mermaid: `classDiagram
    %% Core Application Classes
    class FastAPIApp {
        +app: FastAPI
        +lifespan()
        +root()
        +health_check()
        +websocket_endpoint()
    }

    class WebSocketManager {
        -connections: Dict[str, WebSocket]
        +connect(websocket, session_id)
        +disconnect(websocket, session_id)
        +send_personal_message(message, websocket)
        +broadcast_scan_progress(session_id, data)
        +broadcast_cleanup_status(cleanup_id, data)
    }

    %% Database Models
    class File {
        +id: UUID
        +path: str
        +name: str
        +size: int
        +file_type: str
        +category: str
        +hash_md5: str
        +hash_sha256: str
        +perceptual_hash: str
        +content_hash: str
        +confidence_score: float
        +is_duplicate: str
        +scan_session_id: UUID
        +created_at: datetime
        +modified_at: datetime
        +scanned_at: datetime
        +to_dict()
    }

    class Duplicate {
        +id: UUID
        +file_id: UUID
        +duplicate_file_id: UUID
        +duplicate_group_id: UUID
        +similarity_score: float
        +detection_method: str
        +is_primary: str
        +created_at: datetime
        +to_dict()
    }

    class ScanSession {
        +id: UUID
        +directory_path: str
        +status: str
        +files_processed: int
        +files_total: int
        +duplicates_found: int
        +errors_count: int
        +progress_percentage: float
        +started_at: datetime
        +completed_at: datetime
        +error_message: str
        +update_progress(files_processed, files_total, duplicates_found)
        +mark_completed()
        +mark_failed(error_message)
        +to_dict()
    }

    %% Service Classes
    class ScannerService {
        +classifier: SimpleClassifier
        +duplicate_detector: DuplicateDetector
        +supported_extensions: set
        +scan_directory(session_id, directory_path, db)
        +_get_files_recursive(directory_path)
        +_is_supported_file(file_path)
        +_process_file(file_path, session_id, db)
        +_calculate_hash(file_path, algorithm)
        +_detect_all_duplicates(processed_files, db)
        +_update_session_status(session_id, status, db)
        +_update_session_progress(session_id, files_processed, files_total, duplicates_found, progress, db)
    }

    class DuplicateService {
        +similarity_threshold: float
        +get_duplicate_groups(db, session_id, limit, offset)
        +get_duplicate_stats(db, session_id)
        +detect_duplicates_for_file(file_id, db)
        +_create_duplicate_group(group_id, duplicates, db)
        +_find_hash_duplicates(file, db)
        +_find_perceptual_duplicates(file, db)
        +_find_content_duplicates(file, db)
        +_file_to_info(file)
    }

    class CleanupService {
        +trash_dir: str
        +archive_dir: str
        +execute_cleanup(cleanup_id, request, db)
        +_delete_duplicates(rule, db)
        +_move_to_trash(rule, db)
        +_archive_old_files(rule, db)
        +_organize_by_type(rule, db)
        +_delete_file(file_id, db)
        +_ensure_directories()
    }

    %% ML Model Classes
    class SimpleClassifier {
        +categories: dict
        +classify_file(file_path)
        +get_file_info(file_path)
        +_classify_by_mime_type(mime_type)
    }

    class DuplicateDetector {
        +find_duplicates(file_paths)
        +_calculate_file_hash(file_path)
        +_compare_files(file1, file2)
    }

    %% API Routes (Unified)
    class APIRoutes {
        +scanner_service: ScannerService
        +duplicate_service: DuplicateService
        +cleanup_service: CleanupService
        +start_scan(request, background_tasks, db)
        +get_scan_status(session_id, db)
        +get_scan_sessions(limit, offset, db)
        +get_duplicates(session_id, limit, offset, db)
        +get_duplicate_stats(session_id, db)
        +execute_cleanup(request, background_tasks, db)
        +get_cleanup_status(cleanup_id)
        +get_scan_history(db)
        +get_scan_by_id(scan_id, db)
    }

    %% Frontend Components
    class App {
        +theme: Theme
        +Navigation()
        +Routes()
    }

    class Dashboard {
        +scanHistory: array
        +loading: boolean
        +error: string
        +loadScanHistory()
        +handleScanSelect(scanId)
    }

    class NewScanPage {
        +directoryPath: string
        +scanning: boolean
        +handleScanStart()
        +handleDirectorySelect()
    }

    class ScanDetailPage {
        +scanId: string
        +scanData: object
        +duplicates: array
        +stats: object
        +loadScanDetails()
    }

    class ScanHistoryPanel {
        +scanHistory: array
        +onScanSelect: function
        +onRefresh: function
        +loading: boolean
        +render()
    }

    class DuplicatePanel {
        +duplicates: array
        +onRefresh: function
        +render()
    }

    class CleanupPanel {
        +onCleanup: function
        +duplicates: array
        +loading: boolean
        +render()
    }

    class StatsPanel {
        +stats: object
        +render()
    }

    class UMLDiagrams {
        +value: number
        +loading: boolean
        +error: string
        +exportAnchorEl: HTMLElement
        +isExporting: boolean
        +diagrams: array
        +renderDiagrams()
        +handleExportAs(format)
        +handleExportClick()
    }

    %% Utility Classes
    class ApiService {
        +baseURL: string
        +healthCheck()
        +startScan(directoryPath)
        +getScanStatus(sessionId)
        +getDuplicates(sessionId, limit, offset)
        +getDuplicateStats(sessionId)
        +executeCleanup(cleanupRules)
        +getScanHistory()
        +getScanById(scanId)
    }

    class WebSocketHook {
        +socket: WebSocket
        +isConnected: boolean
        +connect(url)
        +disconnect()
        +sendMessage(message)
    }

    class ExportUtils {
        +exportAsImage(element, options)
        +exportAsPDF(element, options)
        +getDiagramTitle(diagrams, index)
        +sanitizeFilename(filename)
    }

    %% Relationships
    FastAPIApp --> WebSocketManager
    FastAPIApp --> APIRoutes

    APIRoutes --> ScannerService
    APIRoutes --> DuplicateService
    APIRoutes --> CleanupService

    ScannerService --> File
    ScannerService --> ScanSession
    ScannerService --> SimpleClassifier
    ScannerService --> DuplicateDetector

    DuplicateService --> File
    DuplicateService --> Duplicate

    CleanupService --> File
    CleanupService --> Duplicate

    SimpleClassifier --> File
    DuplicateDetector --> File

    App --> Dashboard
    App --> NewScanPage
    App --> ScanDetailPage
    App --> UMLDiagrams

    Dashboard --> ScanHistoryPanel
    ScanDetailPage --> DuplicatePanel
    ScanDetailPage --> CleanupPanel
    ScanDetailPage --> StatsPanel

    NewScanPage --> ApiService
    ScanDetailPage --> ApiService
    Dashboard --> ApiService

    NewScanPage --> WebSocketHook
    ScanDetailPage --> WebSocketHook

    UMLDiagrams --> ExportUtils

    %% Database Relationships
    File --> ScanSession
    Duplicate --> File`
    },
    {
      title: 'Activity Diagram',
      description: 'Shows the flow of activities and processes from user interaction to completion.',
      mermaid: `flowchart TD
    A[User Opens Application] --> B[Load Dashboard]
    B --> C[User Enters Directory Path]
    C --> D[User Clicks Start Scan]
    D --> E[Validate Directory Path]
    E --> F{Directory Valid?}
    F -->|No| G[Show Error Message]
    G --> C
    F -->|Yes| H[Create Scan Session]
    H --> I[Initialize File Service]
    I --> J[Start Background Scan Process]
    J --> K[Scan Directory Recursively]
    K --> L[Process Each File]
    L --> M[Calculate File Hash]
    M --> N[Classify File Type]
    N --> O[Extract File Metadata]
    O --> P[Store File in Database]
    P --> Q{More Files?}
    Q -->|Yes| L
    Q -->|No| R[Run Duplicate Detection]
    R --> S[Compare File Hashes]
    S --> T[Group Similar Files]
    T --> U[Calculate Similarity Scores]
    U --> V[Create Duplicate Groups]
    V --> W[Update Scan Status to Completed]
    W --> X[Send WebSocket Update]
    X --> Y[Display Results in UI]
    Y --> Z[User Reviews Duplicates]
    Z --> AA{User Wants Cleanup?}
    AA -->|No| BB[End Process]
    AA -->|Yes| CC[User Selects Cleanup Rules]
    CC --> DD[Preview Cleanup Actions]
    DD --> EE{User Confirms?}
    EE -->|No| CC
    EE -->|Yes| FF[Execute Cleanup]
    FF --> GG[Move Files to Backup]
    GG --> HH[Delete Duplicate Files]
    HH --> II[Update Database]
    II --> JJ[Send Cleanup Complete Notification]
    JJ --> KK[Refresh UI with Results]
    KK --> BB

    %% Parallel Processes
    J --> LL[WebSocket Connection]
    LL --> MM[Send Real-time Updates]
    MM --> NN{Scan Active?}
    NN -->|Yes| OO[Send Progress Update]
    OO --> MM
    NN -->|No| PP[Close WebSocket]

    %% Error Handling
    J --> QQ{Error Occurs?}
    QQ -->|Yes| RR[Log Error]
    RR --> SS[Update Scan Status to Failed]
    SS --> TT[Send Error Notification]
    TT --> UU[Display Error in UI]
    UU --> BB`
    },
    {
      title: 'Component Diagram',
      description: 'Shows the high-level components and their relationships in the system architecture.',
      mermaid: `graph TB
    %% External Systems
    subgraph "External Systems"
        User[User Browser]
        FileSystem[File System]
        Docker[Docker Engine]
    end

    %% Frontend Layer
    subgraph "Frontend Layer"
        ReactApp[React Application]
        subgraph "UI Components"
            Dashboard[Dashboard]
            NewScanPage[New Scan Page]
            ScanDetailPage[Scan Detail Page]
            UMLDiagrams[UML Diagrams]
            ScanHistoryPanel[Scan History Panel]
            DuplicatePanel[Duplicate Panel]
            CleanupPanel[Cleanup Panel]
            StatsPanel[Stats Panel]
        end
        subgraph "Utilities"
            ApiService[API Service]
            WebSocketHook[WebSocket Hook]
            ExportUtils[Export Utils]
        end
        MaterialUI[Material-UI Components]
    end

    %% API Gateway Layer
    subgraph "API Gateway Layer"
        Nginx[Nginx Reverse Proxy]
        FastAPI[FastAPI Application]
        CORS[CORS Middleware]
        APIRoutes[Unified API Routes]
    end

    %% Business Logic Layer
    subgraph "Business Logic Layer"
        ScannerService[Scanner Service]
        DuplicateService[Duplicate Service]
        CleanupService[Cleanup Service]
        WebSocketManager[WebSocket Manager]
    end

    %% ML Models Layer
    subgraph "ML Models Layer"
        SimpleClassifier[Simple File Classifier]
        DuplicateDetector[Hash-based Duplicate Detector]
        MagicLibrary[Python Magic Library]
    end

    %% Data Access Layer
    subgraph "Data Access Layer"
        Database[PostgreSQL Database]
        subgraph "Database Models"
            FileModel[File Model]
            DuplicateModel[Duplicate Model]
            ScanSessionModel[Scan Session Model]
        end
        FileStorage[File System Storage]
        TrashDir[Trash Directory]
        ArchiveDir[Archive Directory]
    end

    %% Container Layer
    subgraph "Container Layer"
        FrontendContainer[Frontend Container<br/>React + Nginx]
        BackendContainer[Backend Container<br/>FastAPI + Python]
        DatabaseContainer[Database Container<br/>PostgreSQL]
    end

    %% Connections - External to Frontend
    User --> Nginx
    Nginx --> ReactApp

    %% Frontend Internal Connections
    ReactApp --> Dashboard
    ReactApp --> NewScanPage
    ReactApp --> ScanDetailPage
    ReactApp --> UMLDiagrams
    
    Dashboard --> ScanHistoryPanel
    ScanDetailPage --> DuplicatePanel
    ScanDetailPage --> CleanupPanel
    ScanDetailPage --> StatsPanel
    
    Dashboard --> ApiService
    NewScanPage --> ApiService
    ScanDetailPage --> ApiService
    NewScanPage --> WebSocketHook
    ScanDetailPage --> WebSocketHook
    UMLDiagrams --> ExportUtils

    %% Frontend to Backend
    ApiService --> FastAPI
    WebSocketHook --> FastAPI

    %% API Layer
    FastAPI --> CORS
    FastAPI --> APIRoutes
    FastAPI --> WebSocketManager

    %% Business Logic Connections
    APIRoutes --> ScannerService
    APIRoutes --> DuplicateService
    APIRoutes --> CleanupService

    %% Service to ML Connections
    ScannerService --> SimpleClassifier
    ScannerService --> DuplicateDetector
    SimpleClassifier --> MagicLibrary

    %% Service to Data Connections
    ScannerService --> FileModel
    ScannerService --> ScanSessionModel
    ScannerService --> FileSystem
    
    DuplicateService --> FileModel
    DuplicateService --> DuplicateModel
    
    CleanupService --> FileModel
    CleanupService --> DuplicateModel
    CleanupService --> FileSystem
    CleanupService --> TrashDir
    CleanupService --> ArchiveDir

    %% Database Connections
    FileModel --> Database
    DuplicateModel --> Database
    ScanSessionModel --> Database

    %% Container Connections
    ReactApp --> FrontendContainer
    FastAPI --> BackendContainer
    Database --> DatabaseContainer

    Docker --> FrontendContainer
    Docker --> BackendContainer
    Docker --> DatabaseContainer

    %% Real-time Communication
    WebSocketManager -.->|Real-time Updates| WebSocketHook`
    },
    {
      title: 'Deployment Diagram',
      description: 'Shows the physical deployment architecture with servers, containers, and networks.',
      mermaid: `graph TB
    %% External Users
    User[👤 User<br/>Web Browser]
    Admin[👨‍💼 Admin<br/>Monitoring Dashboard]

    %% Load Balancer / Reverse Proxy
    subgraph "Edge Infrastructure"
        LB[🔄 Load Balancer<br/>Nginx/HAProxy<br/>Port: 80/443]
        SSL[🔒 SSL Termination<br/>TLS Certificates]
    end

    %% Production Environment
    subgraph "Production Server"
        subgraph "Container Orchestration"
            DockerCompose[📋 Docker Compose<br/>Orchestration Layer]
        end
        
        subgraph "Application Containers"
            subgraph "Frontend Pod"
                ReactApp[⚛️ React App<br/>Node.js<br/>Port: 3000]
                NginxFrontend[🌐 Nginx<br/>Static Assets<br/>Port: 80]
            end
            
            subgraph "Backend Pod"
                FastAPI[🐍 FastAPI Server<br/>Python 3.11<br/>Port: 8000]
                Workers[👷 Background Workers<br/>Celery/AsyncIO]
            end
            
            subgraph "ML Services Pod"
                MLInference[🧠 ML Inference Service<br/>PyTorch/TensorFlow<br/>Port: 8001]
                ModelCache[💾 Model Cache<br/>In-Memory Models]
            end
        end
        
        subgraph "Data Layer"
            subgraph "Database Pod"
                PostgreSQL[🐘 PostgreSQL 15<br/>Primary Database<br/>Port: 5432]
                Redis[📦 Redis 7<br/>Session & Cache<br/>Port: 6379]
            end
            
            subgraph "Storage"
                DBVolume[💽 Database Volume<br/>/var/lib/postgresql]
                FileStorage[📁 File Storage<br/>/app/uploads]
                ModelStorage[🎯 Model Storage<br/>/app/models]
            end
        end
        
        subgraph "Monitoring Stack"
            Prometheus[📊 Prometheus<br/>Metrics Collection<br/>Port: 9090]
            Grafana[📈 Grafana<br/>Dashboards<br/>Port: 3001]
            Loki[📝 Loki<br/>Log Aggregation<br/>Port: 3100]
        end
    end

    %% External Services
    subgraph "External Services"
        Registry[🏪 Docker Registry<br/>Container Images]
        CDN[🌍 CDN<br/>Global Distribution]
        Backup[💾 Backup Service<br/>S3/Cloud Storage]
    end

    %% Network Connections - User Traffic
    User -->|HTTPS:443| SSL
    SSL -->|HTTP| LB
    LB -->|HTTP:80| NginxFrontend
    LB -->|HTTP:8000| FastAPI
    
    %% Internal Container Communication
    NginxFrontend -.->|Serves| ReactApp
    ReactApp -->|API Calls| FastAPI
    FastAPI -->|WebSocket| ReactApp
    
    %% Backend to Services
    FastAPI -->|SQL Queries| PostgreSQL
    FastAPI -->|Cache Operations| Redis
    FastAPI -->|ML Inference| MLInference
    Workers -->|Background Tasks| PostgreSQL
    
    %% ML Service Connections
    MLInference -->|Model Loading| ModelStorage
    MLInference -->|Cache Results| ModelCache
    
    %% Data Persistence
    PostgreSQL -->|Data Files| DBVolume
    Redis -->|Persistence| DBVolume
    FastAPI -->|File Uploads| FileStorage
    
    %% Monitoring Connections
    Prometheus -->|Scrape Metrics| FastAPI
    Prometheus -->|Scrape Metrics| PostgreSQL
    Prometheus -->|Scrape Metrics| Redis
    Prometheus -->|Scrape Metrics| MLInference
    Grafana -->|Query Metrics| Prometheus
    Loki -->|Collect Logs| FastAPI
    Admin -->|Monitor| Grafana
    
    %% External Service Connections
    Registry -->|Pull Images| DockerCompose
    CDN -->|Static Assets| User
    Backup -->|Database Backup| PostgreSQL
    Backup -->|File Backup| FileStorage
    
    %% Orchestration
    DockerCompose -.->|Manages| ReactApp
    DockerCompose -.->|Manages| FastAPI
    DockerCompose -.->|Manages| PostgreSQL
    DockerCompose -.->|Manages| Redis
    DockerCompose -.->|Manages| MLInference
    DockerCompose -.->|Manages| Prometheus
    DockerCompose -.->|Manages| Grafana

    %% Styling
    classDef userClass fill:#e1f5fe
    classDef frontendClass fill:#f3e5f5
    classDef backendClass fill:#e8f5e8
    classDef dataClass fill:#fff3e0
    classDef monitorClass fill:#fce4ec
    classDef infraClass fill:#e0f2f1
    
    class User,Admin userClass
    class ReactApp,NginxFrontend,LB,SSL frontendClass
    class FastAPI,Workers,MLInference,ModelCache backendClass
    class PostgreSQL,Redis,DBVolume,FileStorage,ModelStorage dataClass
    class Prometheus,Grafana,Loki monitorClass
    class DockerCompose,Registry,CDN,Backup infraClass`
    },
    {
      title: 'Use Case Diagram',
      description: 'Shows the system functionality from user perspective with actors and use cases.',
      mermaid: `graph TB
    %% Actors
    User[👤 User]
    Admin[👨‍💼 System Administrator]
    MLSystem[🤖 ML System]
    FileSystem[📁 File System]

    %% System Boundary
    subgraph "AI File Management System"
        %% Core Use Cases
        UC1[Scan Directory]
        UC2[View Scan Results]
        UC3[Detect Duplicates]
        UC4[View Duplicate Groups]
        UC5[Execute Cleanup]
        UC6[Preview Cleanup]
        UC7[Monitor Progress]
        UC8[View Statistics]
        
        %% File Management Use Cases
        UC9[Classify Files]
        UC10[Extract File Metadata]
        UC11[Calculate File Hashes]
        UC12[Compare File Similarity]
        
        %% System Management Use Cases
        UC13[Manage Scan Sessions]
        UC14[Configure Cleanup Rules]
        UC15[Backup Files]
        UC16[Restore Files]
        UC17[View System Health]
        UC18[Manage ML Models]
        
        %% Advanced Use Cases
        UC19[Schedule Scans]
        UC20[Export Reports]
        UC21[Configure Notifications]
        UC22[Manage User Preferences]
    end

    %% Actor-Use Case Relationships
    User --> UC1
    User --> UC2
    User --> UC4
    User --> UC5
    User --> UC6
    User --> UC7
    User --> UC8
    User --> UC13
    User --> UC14
    User --> UC19
    User --> UC20
    User --> UC21
    User --> UC22

    Admin --> UC17
    Admin --> UC18
    Admin --> UC13
    Admin --> UC14
    Admin --> UC15
    Admin --> UC16

    MLSystem --> UC3
    MLSystem --> UC9
    MLSystem --> UC10
    MLSystem --> UC11
    MLSystem --> UC12

    FileSystem --> UC1
    FileSystem --> UC5
    FileSystem --> UC15
    FileSystem --> UC16

    %% Use Case Relationships
    UC1 --> UC3
    UC1 --> UC7
    UC3 --> UC4
    UC3 --> UC9
    UC3 --> UC10
    UC3 --> UC11
    UC3 --> UC12
    UC4 --> UC5
    UC4 --> UC6
    UC5 --> UC15
    UC6 --> UC5
    UC7 --> UC2
    UC8 --> UC2
    UC13 --> UC1
    UC14 --> UC5
    UC15 --> UC16
    UC18 --> UC9
    UC18 --> UC10
    UC19 --> UC1
    UC20 --> UC8`
    },
    {
      title: 'Sequence Diagram',
      description: 'Shows the interaction between objects over time during scan and cleanup processes.',
      mermaid: `sequenceDiagram
    participant U as User
    participant UI as React UI
    participant API as FastAPI Routes
    participant SS as ScannerService
    participant SC as SimpleClassifier
    participant DD as DuplicateDetector
    participant DB as Database
    participant WS as WebSocketManager
    participant DS as DuplicateService
    participant CS as CleanupService
    participant FS as FileSystem

    %% Scan Process
    U->>UI: Navigate to NewScanPage
    U->>UI: Enter directory path
    U->>UI: Click "Start Scan"
    UI->>API: POST /api/scan/start {directory_path}
    API->>DB: Create ScanSession
    DB-->>API: Session created with UUID
    API->>SS: run_scan_task(session_id, directory_path)
    API-->>UI: Return {session_id, status: "started"}
    UI->>WS: Connect to WebSocket /ws/{session_id}
    
    %% Background Scanning Process
    SS->>DB: Update session status to "running"
    SS->>FS: Walk directory recursively
    FS-->>SS: Return file list
    SS->>DB: Update files_total count
    
    loop For each file
        SS->>FS: Read file stats and calculate hashes
        SS->>SC: classify_file(file_path)
        SC->>SC: Check extension and MIME type
        SC-->>SS: Return category
        SS->>DB: Store File record
        SS->>WS: broadcast_scan_progress()
        WS-->>UI: Real-time progress update
    end
    
    %% Duplicate Detection Phase
    SS->>DD: find_duplicates(file_paths)
    DD->>DD: Group files by size
    loop For each size group
        DD->>DD: Compare file hashes
        DD-->>SS: Return duplicate pairs
    end
    SS->>DB: Save Duplicate records
    SS->>DB: Update session status to "completed"
    SS->>WS: broadcast_scan_progress(status: "completed")
    WS-->>UI: Scan completion notification
    
    %% Navigation to Results
    U->>UI: Navigate to ScanDetailPage
    UI->>API: GET /api/scans/{scan_id}
    API->>DS: get_duplicate_groups(session_id)
    DS->>DB: Query duplicates for session
    DB-->>DS: Return duplicate groups
    API->>DS: get_duplicate_stats(session_id)
    DS->>DB: Calculate statistics
    DB-->>DS: Return stats
    DS-->>API: Return groups and stats
    API-->>UI: Return {scan, duplicates, stats}
    UI->>UI: Display results in panels
    
    %% Cleanup Process
    U->>UI: Select cleanup rules
    U->>UI: Click "Execute Cleanup"
    UI->>API: POST /api/cleanup/execute
    API->>CS: execute_cleanup(cleanup_id, rules)
    API-->>UI: Return {cleanup_id, status: "started"}
    
    %% Background Cleanup Process
    CS->>WS: broadcast_cleanup_status(status: "running")
    WS-->>UI: Cleanup started notification
    
    loop For each cleanup rule
        alt Delete Duplicates
            CS->>DB: Get duplicate groups
            CS->>FS: Delete duplicate files
            CS->>DB: Remove file records
        else Move to Trash
            CS->>FS: Move files to trash directory
            CS->>DB: Update file paths
        else Archive Files
            CS->>FS: Move files to archive
            CS->>DB: Update file records
        end
        CS->>WS: broadcast_cleanup_status(progress)
        WS-->>UI: Progress update
    end
    
    CS->>WS: broadcast_cleanup_status(status: "completed")
    WS-->>UI: Cleanup completion notification
    UI->>UI: Refresh duplicate display`
    },
    {
      title: 'State Diagram',
      description: 'Shows the different states of the system and transitions between them.',
      mermaid: `stateDiagram-v2
    [*] --> Idle
    
    Idle --> Scanning : Start Scan
    Scanning --> Processing : Files Found
    Processing --> Classifying : File Processed
    Classifying --> Detecting : Classification Complete
    Detecting --> Completed : Duplicates Found
    Detecting --> Failed : Detection Error
    Completed --> Idle : Scan Complete
    Failed --> Idle : Error Handled
    
    Scanning --> Cancelled : User Cancel
    Processing --> Cancelled : User Cancel
    Classifying --> Cancelled : User Cancel
    Detecting --> Cancelled : User Cancel
    Cancelled --> Idle : Cleanup Complete
    
    Completed --> CleanupPreview : User Selects Cleanup
    CleanupPreview --> CleanupExecuting : User Confirms
    CleanupPreview --> Completed : User Cancels
    CleanupExecuting --> CleanupCompleted : Cleanup Success
    CleanupExecuting --> CleanupFailed : Cleanup Error
    CleanupCompleted --> Idle : Process Complete
    CleanupFailed --> Completed : Error Handled
    
    %% Sub-states for Processing
    state Processing {
        [*] --> ReadingFile
        ReadingFile --> CalculatingHash : File Read
        CalculatingHash --> ExtractingMetadata : Hash Calculated
        ExtractingMetadata --> StoringData : Metadata Extracted
        StoringData --> [*] : Data Stored
    }
    
    %% Sub-states for Classifying
    state Classifying {
        [*] --> TextAnalysis
        TextAnalysis --> ImageAnalysis : Text Processed
        ImageAnalysis --> OCRProcessing : Image Processed
        OCRProcessing --> [*] : OCR Complete
    }
    
    %% Sub-states for Detecting
    state Detecting {
        [*] --> HashComparison
        HashComparison --> SimilarityCalculation : Hashes Compared
        SimilarityCalculation --> GroupCreation : Similarity Calculated
        GroupCreation --> [*] : Groups Created
    }
    
    %% Sub-states for Cleanup
    state CleanupExecuting {
        [*] --> BackupCreation
        BackupCreation --> FileDeletion : Backup Complete
        FileDeletion --> DatabaseUpdate : Files Deleted
        DatabaseUpdate --> [*] : Database Updated
    }`
    }
  ], []);

  const renderDiagrams = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      for (let i = 0; i < diagrams.length; i++) {
        const element = diagramRefs.current[i];
        if (element) {
          element.innerHTML = '';
          const { svg } = await mermaid.render(`diagram-${i}`, diagrams[i].mermaid);
          element.innerHTML = svg;
        }
      }
      setLoading(false);
    } catch (err) {
      console.error('Error rendering diagrams:', err);
      setError('Failed to render diagrams. Please try again.');
      setLoading(false);
    }
  }, [diagrams]);

  useEffect(() => {
    // Initialize Mermaid
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose',
      fontFamily: 'Arial, sans-serif',
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true
      },
      sequence: {
        diagramMarginX: 50,
        diagramMarginY: 10,
        boxTextMargin: 5,
        noteMargin: 10,
        messageMargin: 35
      }
    });

    // Render diagrams after a short delay to ensure DOM is ready
    const timer = setTimeout(() => {
      renderDiagrams();
    }, 100);

    return () => clearTimeout(timer);
  }, [value, renderDiagrams]);


  // Export handlers
  const handleExportClick = (event: React.MouseEvent<HTMLElement>) => {
    setExportAnchorEl(event.currentTarget);
  };

  const handleExportClose = () => {
    setExportAnchorEl(null);
  };

  const handleExportAs = async (format: 'png' | 'jpeg' | 'pdf') => {
    const currentDiagram = diagramRefs.current[value];
    if (!currentDiagram) {
      console.error('No diagram element found');
      return;
    }

    setIsExporting(true);
    setExportAnchorEl(null);

    try {
      const filename = sanitizeFilename(getDiagramTitle(diagrams, value));
      
      if (format === 'pdf') {
        await exportAsPDF(currentDiagram, { filename, scale: 2 });
      } else {
        await exportAsImage(currentDiagram, { filename, format, scale: 2, quality: 1.0 });
      }
    } catch (error) {
      console.error('Export failed:', error);
      setError('Failed to export diagram. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          UML Diagrams - AI File Management System
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Comprehensive UML diagrams showing the architecture, design, and behavior of the AI File Management System.
        </Typography>

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={value}
            onChange={handleChange}
            aria-label="UML diagrams tabs"
            variant="scrollable"
            scrollButtons="auto"
          >
            {diagrams.map((diagram, index) => (
              <Tab
                key={index}
                label={diagram.title}
                {...a11yProps(index)}
              />
            ))}
          </Tabs>
        </Box>

        {diagrams.map((diagram, index) => (
          <TabPanel key={index} value={value} index={index}>
            <Card>
              <CardHeader
                title={diagram.title}
                subheader={diagram.description}
                action={
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Export diagram">
                      <IconButton
                        onClick={handleExportClick}
                        disabled={loading || isExporting}
                        color="primary"
                      >
                        <DownloadIcon />
                      </IconButton>
                    </Tooltip>
                    <Menu
                      anchorEl={exportAnchorEl}
                      open={Boolean(exportAnchorEl)}
                      onClose={handleExportClose}
                      anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'right',
                      }}
                      transformOrigin={{
                        vertical: 'top',
                        horizontal: 'right',
                      }}
                    >
                      <MenuItem onClick={() => handleExportAs('png')}>
                        <ImageIcon sx={{ mr: 2 }} />
                        Export as PNG
                      </MenuItem>
                      <MenuItem onClick={() => handleExportAs('jpeg')}>
                        <ImageIcon sx={{ mr: 2 }} />
                        Export as JPEG
                      </MenuItem>
                      <MenuItem onClick={() => handleExportAs('pdf')}>
                        <PdfIcon sx={{ mr: 2 }} />
                        Export as PDF
                      </MenuItem>
                    </Menu>
                  </Box>
                }
              />
              <Divider />
              <CardContent>
                {loading && value === index && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                  </Box>
                )}
                
                {error && value === index && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                  </Alert>
                )}

                {isExporting && value === index && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Exporting diagram... Please wait.
                  </Alert>
                )}

                <Box
                  ref={(el: HTMLDivElement | null) => {
                    diagramRefs.current[index] = el;
                  }}
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    overflow: 'auto',
                    '& svg': {
                      maxWidth: '100%',
                      height: 'auto'
                    }
                  }}
                />
              </CardContent>
            </Card>
          </TabPanel>
        ))}
      </Paper>
    </Container>
  );
};

export default UMLDiagrams;
