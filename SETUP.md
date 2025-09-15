# AI File Management System - Setup Guide

## 🚀 Quick Start

### Prerequisites
- **Docker & Docker Compose** (latest version)
- **Git** (for cloning the repository)
- **Windows 10/11** or **macOS/Linux**

### 1. Clone and Setup
```bash
git clone <repository-url>
cd ai-file-cleanup
```

### 2. Start the System
**Windows:**
```cmd
start.bat
```

**macOS/Linux:**
```bash
chmod +x start.sh
./start.sh
```

### 3. Access the Application
- **Frontend Dashboard**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## 🏗️ Architecture Overview

### Backend (FastAPI + Python)
- **API Server**: FastAPI with async support
- **Database**: PostgreSQL for metadata storage
- **Cache**: Redis for real-time features
- **ML Models**: DistilBERT, CNN, EasyOCR
- **WebSocket**: Real-time updates

### Frontend (React + TypeScript)
- **UI Framework**: Material-UI (MUI)
- **State Management**: React hooks
- **Real-time**: WebSocket integration
- **Responsive**: Mobile-friendly design

### AI/ML Components
- **Text Classification**: DistilBERT for document analysis
- **Image Classification**: CNN for image categorization
- **Duplicate Detection**: Hash-based + perceptual hashing
- **Content Analysis**: EasyOCR for scanned documents

## 📁 Project Structure

```
ai-file-cleanup/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── api/            # API routes
│   │   ├── core/           # Configuration & database
│   │   ├── models/         # Database models
│   │   ├── schemas/        # Pydantic schemas
│   │   ├── services/       # Business logic
│   │   │   └── ml_models/  # ML model implementations
│   │   └── main.py         # FastAPI app
│   ├── requirements.txt    # Python dependencies
│   └── Dockerfile
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── services/       # API services
│   │   ├── hooks/          # Custom hooks
│   │   └── App.tsx         # Main app component
│   ├── package.json        # Node dependencies
│   └── Dockerfile
├── docker-compose.yml      # Docker orchestration
├── start.bat              # Windows startup script
├── start.sh               # Unix startup script
└── README.md
```

## 🔧 Configuration

### Environment Variables

**Backend (.env):**
```env
DATABASE_URL=postgresql://postgres:password@postgres:5432/ai_file_cleanup
REDIS_URL=redis://redis:6379
JWT_SECRET=your-secret-key-change-in-production
MAX_FILE_SIZE=104857600
ENABLE_GPU=false
```

**Frontend (.env):**
```env
REACT_APP_API_URL=http://localhost:8000
REACT_APP_WS_URL=ws://localhost:8000
```

### Database Schema
- **files**: File metadata and classification results
- **duplicates**: Duplicate file relationships
- **scan_sessions**: Scan operation tracking

## 🧪 Testing

### Backend Testing
```bash
cd backend
pip install -r requirements.txt
pytest
```

### Frontend Testing
```bash
cd frontend
npm install
npm test
```

### Integration Testing
```bash
# Start services
docker-compose up -d

# Run API tests
curl http://localhost:8000/health

# Test WebSocket
# Use browser dev tools or WebSocket client
```

## 🚀 Deployment

### Production Deployment
1. **Update environment variables** for production
2. **Configure reverse proxy** (nginx)
3. **Set up SSL certificates**
4. **Configure database backups**
5. **Set up monitoring and logging**

### Docker Production
```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Deploy
docker-compose -f docker-compose.prod.yml up -d
```

## 📊 Features

### ✅ Implemented Features
- [x] **Directory Scanning**: Recursive file scanning with ML classification
- [x] **Duplicate Detection**: Hash-based and perceptual similarity
- [x] **Real-time Dashboard**: Live progress updates via WebSocket
- [x] **File Classification**: AI-powered categorization
- [x] **Cleanup Operations**: Automated duplicate removal
- [x] **Statistics**: Space usage and duplicate analytics
- [x] **Responsive UI**: Mobile-friendly interface

### 🔄 In Progress
- [ ] **Security Layer**: Authentication and authorization
- [ ] **Audit System**: Operation logging and tracking
- [ ] **Advanced ML**: Fine-tuned models for better accuracy
- [ ] **Cloud Integration**: AWS S3, Google Drive support

### 📋 Planned Features
- [ ] **Mobile App**: React Native application
- [ ] **Batch Processing**: Large-scale file operations
- [ ] **Custom Rules**: User-defined cleanup rules
- [ ] **API Integrations**: Third-party service connections

## 🐛 Troubleshooting

### Common Issues

**1. Docker Services Won't Start**
```bash
# Check Docker is running
docker --version
docker-compose --version

# Clean up and restart
docker-compose down
docker system prune -f
docker-compose up -d
```

**2. Database Connection Issues**
```bash
# Check PostgreSQL logs
docker-compose logs postgres

# Reset database
docker-compose down -v
docker-compose up -d
```

**3. Frontend Build Issues**
```bash
# Clear node modules
cd frontend
rm -rf node_modules package-lock.json
npm install
npm start
```

**4. ML Model Loading Issues**
```bash
# Check model downloads
docker-compose logs backend

# Clear model cache
docker-compose exec backend rm -rf /app/ml_models/*
```

### Performance Optimization

**1. Large File Processing**
- Increase `MAX_FILE_SIZE` in environment
- Use SSD storage for better I/O performance
- Consider file streaming for very large files

**2. Memory Usage**
- Adjust Docker memory limits
- Use model quantization for smaller memory footprint
- Implement file batching for large directories

**3. Database Performance**
- Add database indexes for frequently queried fields
- Use connection pooling
- Implement database partitioning for large datasets

## 📈 Monitoring

### Health Checks
- **Backend**: `GET /health`
- **Database**: Connection status
- **Redis**: Cache status
- **WebSocket**: Connection count

### Metrics to Monitor
- **File Processing Rate**: Files per second
- **Duplicate Detection Accuracy**: True positive rate
- **Storage Space Saved**: Bytes recovered
- **System Performance**: CPU, memory, disk usage

## 🔒 Security Considerations

### Current Security Features
- **Input Validation**: Pydantic schemas
- **SQL Injection Protection**: SQLAlchemy ORM
- **CORS Configuration**: Restricted origins
- **File Type Validation**: MIME type checking

### Recommended Security Enhancements
- **Authentication**: JWT-based user authentication
- **Authorization**: Role-based access control
- **Audit Logging**: Comprehensive operation tracking
- **Data Encryption**: At-rest and in-transit encryption
- **Rate Limiting**: API request throttling

## 📞 Support

### Getting Help
1. **Check logs**: `docker-compose logs [service]`
2. **Review documentation**: API docs at `/docs`
3. **Test connectivity**: Health check endpoints
4. **Verify configuration**: Environment variables

### Development
- **Backend**: Python 3.11+, FastAPI, SQLAlchemy
- **Frontend**: React 18+, TypeScript, Material-UI
- **ML**: PyTorch, Transformers, OpenCV
- **DevOps**: Docker, Docker Compose

---

**🎉 Congratulations!** You now have a fully functional AI File Management System running locally. The system can scan directories, detect duplicates using machine learning, and provide real-time monitoring through a modern web interface.
