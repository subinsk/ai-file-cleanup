# Deployment Diagram - AI File Management System

## Mermaid Diagram

```mermaid
graph TB
    %% Physical Infrastructure
    subgraph "Production Server"
        subgraph "Docker Host"
            subgraph "Frontend Container"
                ReactApp[React Application<br/>Port: 3000]
                NginxFrontend[Nginx<br/>Port: 80/443]
            end
            
            subgraph "Backend Container"
                FastAPI[FastAPI Application<br/>Port: 8000]
                MLModels[ML Models<br/>DistilBERT, CNN, EasyOCR]
            end
            
            subgraph "Database Container"
                PostgreSQL[PostgreSQL Database<br/>Port: 5432]
                Redis[Redis Cache<br/>Port: 6379]
            end
            
            subgraph "Monitoring Container"
                Prometheus[Prometheus<br/>Port: 9090]
                Grafana[Grafana<br/>Port: 3001]
            end
        end
        
        subgraph "File System"
            DataVolume[Data Volume<br/>/var/lib/postgresql/data]
            MLModelVolume[ML Model Volume<br/>/app/ml_models]
            LogVolume[Log Volume<br/>/app/logs]
        end
    end

    %% External Connections
    subgraph "External Systems"
        User[User Browser]
        CDN[CDN/Static Assets]
        DockerRegistry[Docker Registry]
    end

    %% Network Connections
    User -->|HTTPS| NginxFrontend
    NginxFrontend -->|HTTP| ReactApp
    NginxFrontend -->|HTTP| FastAPI
    
    FastAPI -->|SQL| PostgreSQL
    FastAPI -->|Redis Protocol| Redis
    FastAPI -->|File I/O| DataVolume
    FastAPI -->|Model Access| MLModelVolume
    
    MLModels -->|Model Files| MLModelVolume
    MLModels -->|Logs| LogVolume
    
    PostgreSQL -->|Data Files| DataVolume
    Redis -->|Cache Files| DataVolume
    
    Prometheus -->|Metrics| FastAPI
    Prometheus -->|Metrics| PostgreSQL
    Prometheus -->|Metrics| Redis
    Grafana -->|Dashboard| Prometheus
    
    DockerRegistry -->|Pull Images| Docker Host
    CDN -->|Static Assets| User

    %% Container Orchestration
    subgraph "Docker Compose"
        ComposeFile[docker-compose.yml]
        ComposeFile --> FrontendContainer
        ComposeFile --> BackendContainer
        ComposeFile --> DatabaseContainer
        ComposeFile --> MonitoringContainer
    end
```

## ASCII Art Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    AI File Management System                    │
│                     Deployment Diagram                         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      Production Server                         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        Docker Host                             │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ Frontend        │  │ Backend         │  │ Database        │
│ Container       │  │ Container       │  │ Container       │
│─────────────────│  │─────────────────│  │─────────────────│
│ React App       │  │ FastAPI         │  │ PostgreSQL      │
│ Port: 3000      │  │ Port: 8000      │  │ Port: 5432      │
│ Nginx           │  │ ML Models       │  │ Data Volume     │
│ Port: 80/443    │  │ DistilBERT      │  │ /var/lib/...    │
└─────────────────┘  │ CNN, EasyOCR    │  └─────────────────┘
                     │ Model Volume    │
                     │ /app/ml_models  │
                     └─────────────────┘

┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ Redis           │  │ Monitoring      │  │ File System     │
│ Container       │  │ Container       │  │                 │
│─────────────────│  │─────────────────│  │─────────────────│
│ Redis Cache     │  │ Prometheus      │  │ Data Volume     │
│ Port: 6379      │  │ Port: 9090      │  │ /var/lib/...    │
│ Cache Files     │  │ Grafana         │  │ ML Model Volume │
│ /data           │  │ Port: 3001      │  │ /app/ml_models  │
└─────────────────┘  └─────────────────┘  │ Log Volume      │
                                         │ /app/logs       │
                                         └─────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      External Systems                          │
└─────────────────────────────────────────────────────────────────┘

    [User Browser] ──HTTPS──→ [CDN] ──→ [Docker Registry]

Network Connections:
- User Browser → Nginx (HTTPS:443)
- Nginx → React App (HTTP:3000)
- Nginx → FastAPI (HTTP:8000)
- FastAPI → PostgreSQL (SQL:5432)
- FastAPI → Redis (Protocol:6379)
- FastAPI → File System (I/O)
- ML Models → Model Volume (I/O)
- PostgreSQL → Data Volume (I/O)
- Redis → Data Volume (I/O)
- Prometheus → All Services (Metrics)
- Grafana → Prometheus (Dashboard)
- Docker Registry → Docker Host (Pull Images)
- CDN → User Browser (Static Assets)
```

## Draw.io Instructions

### Step 1: Create Deployment Nodes
1. Open Draw.io
2. Use **Deployment Diagram** template
3. Create **Node** shapes for physical/virtual machines
4. Use **Artifact** shapes for software components
5. Use **Device** shapes for external systems

### Step 2: Create Server Structure
- **Production Server**: Main deployment node
- **Docker Host**: Virtual machine node
- **Container Nodes**: Individual containers
- **File System**: Storage nodes

### Step 3: Add Components to Nodes
- Place software components inside appropriate nodes
- Use **Artifact** shapes for applications
- Add port numbers and configuration details
- Use different colors for different component types

### Step 4: Add Communication Paths
- Use **Communication Path** lines between nodes
- Label connections with protocol names
- Show data flow directions with arrows
- Add network topology information

### Step 5: Add Deployment Specifications
- Add **Deployment Specification** shapes
- Include version numbers and configurations
- Add resource requirements (CPU, Memory, Storage)
- Include environment variables and settings

### Step 6: Add External Dependencies
- Show external systems (CDN, Registry, Users)
- Add network boundaries and security zones
- Include load balancers and firewalls
- Show monitoring and logging connections

## Deployment Architecture

### Container Configuration
```yaml
# Frontend Container
- Image: nginx:alpine
- Ports: 80, 443
- Volumes: /usr/share/nginx/html
- Environment: REACT_APP_API_URL

# Backend Container  
- Image: python:3.11-slim
- Ports: 8000
- Volumes: /app/ml_models, /app/logs
- Environment: DATABASE_URL, REDIS_URL

# Database Container
- Image: postgres:15
- Ports: 5432
- Volumes: /var/lib/postgresql/data
- Environment: POSTGRES_DB, POSTGRES_USER

# Redis Container
- Image: redis:7-alpine
- Ports: 6379
- Volumes: /data
```

### Network Architecture
- **Frontend**: Nginx reverse proxy
- **Backend**: FastAPI with async support
- **Database**: PostgreSQL with connection pooling
- **Cache**: Redis for session and data caching
- **Monitoring**: Prometheus + Grafana

### Security Considerations
- HTTPS termination at Nginx
- Container isolation
- Network segmentation
- Secret management
- Access control

### Scalability Features
- Horizontal scaling with load balancer
- Database read replicas
- Redis clustering
- Container orchestration
- Auto-scaling policies
