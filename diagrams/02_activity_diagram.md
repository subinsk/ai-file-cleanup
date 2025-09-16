# Activity Diagram - AI File Management System

## Mermaid Diagram

```mermaid
flowchart TD
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
    UU --> BB
```

## ASCII Art Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    AI File Management System                    │
│                       Activity Diagram                         │
└─────────────────────────────────────────────────────────────────┘

    [User Opens App] 
           │
           ▼
    [Load Dashboard]
           │
           ▼
    [Enter Directory Path]
           │
           ▼
    [Click Start Scan]
           │
           ▼
    [Validate Directory] ──No──→ [Show Error] ──┐
           │ Yes                                │
           ▼                                    │
    [Create Scan Session]                       │
           │                                    │
           ▼                                    │
    [Start Background Process]                  │
           │                                    │
           ▼                                    │
    [Scan Directory Recursively]                │
           │                                    │
           ▼                                    │
    ┌─────────────────────────────────────────┐  │
    │         Process Each File               │  │
    │  ┌─────────────────────────────────┐   │  │
    │  │  Calculate Hash                 │   │  │
    │  └─────────────────────────────────┘   │  │
    │  ┌─────────────────────────────────┐   │  │
    │  │  Classify File Type             │   │  │
    │  └─────────────────────────────────┘   │  │
    │  ┌─────────────────────────────────┐   │  │
    │  │  Extract Metadata               │   │  │
    │  └─────────────────────────────────┘   │  │
    │  ┌─────────────────────────────────┐   │  │
    │  │  Store in Database              │   │  │
    │  └─────────────────────────────────┘   │  │
    └─────────────────────────────────────────┘  │
           │                                    │
           ▼                                    │
    [More Files?] ──Yes──→ [Process Next] ────┘
           │ No
           ▼
    [Run Duplicate Detection]
           │
           ▼
    [Compare File Hashes]
           │
           ▼
    [Group Similar Files]
           │
           ▼
    [Calculate Similarity Scores]
           │
           ▼
    [Create Duplicate Groups]
           │
           ▼
    [Update Status: Completed]
           │
           ▼
    [Send WebSocket Update]
           │
           ▼
    [Display Results in UI]
           │
           ▼
    [User Reviews Duplicates]
           │
           ▼
    [User Wants Cleanup?] ──No──→ [End Process]
           │ Yes
           ▼
    [User Selects Cleanup Rules]
           │
           ▼
    [Preview Cleanup Actions]
           │
           ▼
    [User Confirms?] ──No──→ [Select Rules]
           │ Yes
           ▼
    [Execute Cleanup]
           │
           ▼
    [Move Files to Backup]
           │
           ▼
    [Delete Duplicate Files]
           │
           ▼
    [Update Database]
           │
           ▼
    [Send Cleanup Complete]
           │
           ▼
    [Refresh UI with Results]
           │
           ▼
    [End Process]

┌─────────────────────────────────────────────────────────────────┐
│                    Parallel Processes                          │
└─────────────────────────────────────────────────────────────────┘

    [WebSocket Connection] ──→ [Send Real-time Updates]
           │                           │
           ▼                           ▼
    [Scan Active?] ──Yes──→ [Send Progress Update] ──┐
           │ No                                        │
           ▼                                          │
    [Close WebSocket]                                  │
                                                      │
    [Error Occurs?] ──Yes──→ [Log Error] ────────────┘
           │ No
           ▼
    [Continue Processing]
```

## Draw.io Instructions

### Step 1: Create Main Flow
1. Open Draw.io
2. Use **Activity Diagram** template
3. Create the main flow from "User Opens Application" to "End Process"
4. Use **Start** and **End** nodes (circles)
5. Use **Activity** nodes (rounded rectangles) for actions
6. Use **Decision** nodes (diamonds) for conditions

### Step 2: Add Decision Points
Create decision diamonds for:
- Directory Valid?
- More Files?
- User Wants Cleanup?
- User Confirms?
- Scan Active?
- Error Occurs?

### Step 3: Add Parallel Processes
- Create a **Fork** node after "Start Background Scan Process"
- Add parallel branch for WebSocket updates
- Use **Join** node before "End Process"

### Step 4: Add Error Handling
- Create error handling branch from main process
- Include error logging and notification steps
- Merge back to main flow or end process

### Step 5: Add Swimlanes (Optional)
Create swimlanes for:
- **User Interface**: User interactions and UI updates
- **Backend Service**: File processing and database operations
- **ML Service**: File classification and duplicate detection
- **WebSocket Service**: Real-time communication

### Step 6: Add Annotations
- Add notes for complex processes
- Use **Note** shapes to explain business rules
- Add timing constraints where relevant

## Key Activities to Include

### User Activities
- Open Application
- Enter Directory Path
- Start Scan
- Review Results
- Select Cleanup Rules
- Confirm Cleanup

### System Activities
- Validate Directory
- Create Scan Session
- Scan Files
- Calculate Hashes
- Classify Files
- Detect Duplicates
- Execute Cleanup
- Send Notifications

### Error Handling
- Directory Validation Errors
- File Processing Errors
- Database Errors
- Cleanup Errors
