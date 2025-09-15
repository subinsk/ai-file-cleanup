# 🤖 AI File Management System

An intelligent file management system powered by AI that automatically scans directories, detects duplicates, and provides real-time monitoring through a modern web dashboard.

![System Architecture](https://img.shields.io/badge/Architecture-Microservices-blue)
![Python](https://img.shields.io/badge/Python-3.11+-green)
![React](https://img.shields.io/badge/React-18+-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-Latest-red)
![Docker](https://img.shields.io/badge/Docker-Ready-blue)

## ✨ Features

### 🧠 AI-Powered Intelligence
- **Smart File Classification**: DistilBERT and CNN models automatically categorize files
- **Advanced Duplicate Detection**: Hash-based, perceptual, and semantic similarity detection
- **Content Analysis**: EasyOCR for scanned document processing
- **Machine Learning**: Continuously improving accuracy through usage

### 🔄 Real-Time Operations
- **Live Dashboard**: Real-time progress tracking with WebSocket updates
- **Background Processing**: Non-blocking file operations
- **Progress Monitoring**: Detailed scan and cleanup progress
- **Instant Notifications**: Real-time status updates

### 🛠️ Powerful Tools
- **Directory Scanning**: Recursive scanning with intelligent filtering
- **Duplicate Cleanup**: Automated removal with safety controls
- **Space Analytics**: Detailed storage usage statistics
- **Batch Operations**: Process thousands of files efficiently

### 🎨 Modern Interface
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Material-UI**: Beautiful, accessible components
- **Dark/Light Theme**: User preference support
- **Intuitive Controls**: Easy-to-use interface

## 🚀 Quick Start

### Prerequisites
- **Docker & Docker Compose** (latest version)
- **Git** (for cloning)
- **8GB RAM** (recommended for ML models)

### 1. Clone and Start
```bash
# Clone the repository
git clone <repository-url>
cd ai-file-cleanup

# Start the system (Windows)
start.bat

# Or start manually
docker-compose up -d
```

### 2. Access the Application
- **🌐 Dashboard**: http://localhost:3000
- **📚 API Docs**: http://localhost:8000/docs
- **🔧 Health Check**: http://localhost:8000/health

### 3. Test the System
```bash
# Run the test suite
python test_system.py
```

## 🏗️ Architecture

### Backend (Python + FastAPI)
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   FastAPI       │    │   PostgreSQL    │    │     Redis       │
│   Web Server    │◄──►│   Database      │    │     Cache       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │
         ▼
┌─────────────────┐    ┌─────────────────┐
│   ML Models     │    │   WebSocket     │
│   - DistilBERT  │    │   Real-time     │
│   - CNN         │    │   Updates       │
│   - EasyOCR     │    └─────────────────┘
└─────────────────┘
```

### Frontend (React + TypeScript)
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React App     │    │   Material-UI   │    │   WebSocket     │
│   Components    │◄──►│   Components    │◄──►│   Client        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │
         ▼
┌─────────────────┐
│   API Service   │
│   HTTP Client   │
└─────────────────┘
```

## 📁 Project Structure

```
ai-file-cleanup/
├── 📁 backend/                    # FastAPI Backend
│   ├── 📁 app/
│   │   ├── 📁 api/               # API Routes & Endpoints
│   │   ├── 📁 core/              # Configuration & Database
│   │   ├── 📁 models/            # Database Models
│   │   ├── 📁 schemas/           # Pydantic Schemas
│   │   ├── 📁 services/          # Business Logic
│   │   │   └── 📁 ml_models/     # ML Model Implementations
│   │   └── 📄 main.py            # FastAPI Application
│   ├── 📄 requirements.txt       # Python Dependencies
│   └── 📄 Dockerfile
├── 📁 frontend/                   # React Frontend
│   ├── 📁 src/
│   │   ├── 📁 components/        # React Components
│   │   ├── 📁 services/          # API Services
│   │   ├── 📁 hooks/             # Custom Hooks
│   │   └── 📄 App.tsx            # Main App Component
│   ├── 📄 package.json           # Node Dependencies
│   └── 📄 Dockerfile
├── 📄 docker-compose.yml         # Docker Orchestration
├── 📄 start.bat                  # Windows Startup Script
├── 📄 start.sh                   # Unix Startup Script
├── 📄 test_system.py             # System Test Suite
└── 📄 SETUP.md                   # Detailed Setup Guide
```

## 🔧 Configuration

### Environment Variables

**Backend Configuration:**
```env
DATABASE_URL=postgresql://postgres:password@postgres:5432/ai_file_cleanup
REDIS_URL=redis://redis:6379
JWT_SECRET=your-secret-key-change-in-production
MAX_FILE_SIZE=104857600  # 100MB
ENABLE_GPU=false
```

**Frontend Configuration:**
```env
REACT_APP_API_URL=http://localhost:8000
REACT_APP_WS_URL=ws://localhost:8000
```

## 🧪 Testing

### Automated Testing
```bash
# Run the comprehensive test suite
python test_system.py

# Backend unit tests
cd backend && pytest

# Frontend tests
cd frontend && npm test
```

### Manual Testing
1. **Start the system**: `docker-compose up -d`
2. **Open dashboard**: http://localhost:3000
3. **Start a scan**: Enter a directory path and click "Start Scan"
4. **Monitor progress**: Watch real-time updates
5. **Review duplicates**: Check detected duplicate files
6. **Execute cleanup**: Remove duplicates safely

## 📊 Performance

### Benchmarks
- **File Processing**: ~100-500 files/second
- **Duplicate Detection**: ~50-200 files/second
- **Memory Usage**: ~2-4GB (with ML models)
- **Storage Overhead**: ~1-2% for metadata

### Optimization Tips
- **Use SSD storage** for better I/O performance
- **Increase Docker memory** limits for large datasets
- **Enable GPU acceleration** for faster ML processing
- **Use file batching** for very large directories

## 🔒 Security

### Current Security Features
- ✅ **Input Validation**: Pydantic schemas
- ✅ **SQL Injection Protection**: SQLAlchemy ORM
- ✅ **CORS Configuration**: Restricted origins
- ✅ **File Type Validation**: MIME type checking
- ✅ **Path Traversal Protection**: Secure file access

### Recommended Enhancements
- 🔄 **Authentication**: JWT-based user authentication
- 🔄 **Authorization**: Role-based access control
- 🔄 **Audit Logging**: Comprehensive operation tracking
- 🔄 **Data Encryption**: At-rest and in-transit encryption

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

# Deploy with production settings
docker-compose -f docker-compose.prod.yml up -d
```

## 📈 Monitoring

### Health Checks
- **Backend**: `GET /health`
- **Database**: Connection status monitoring
- **Redis**: Cache status verification
- **WebSocket**: Connection count tracking

### Key Metrics
- **File Processing Rate**: Files processed per second
- **Duplicate Detection Accuracy**: True positive rate
- **Storage Space Saved**: Total bytes recovered
- **System Performance**: CPU, memory, disk usage

## 🐛 Troubleshooting

### Common Issues

**Docker Services Won't Start**
```bash
# Check Docker status
docker --version
docker-compose --version

# Clean up and restart
docker-compose down
docker system prune -f
docker-compose up -d
```

**Database Connection Issues**
```bash
# Check PostgreSQL logs
docker-compose logs postgres

# Reset database
docker-compose down -v
docker-compose up -d
```

**Frontend Build Issues**
```bash
# Clear node modules
cd frontend
rm -rf node_modules package-lock.json
npm install
npm start
```

**ML Model Loading Issues**
```bash
# Check model downloads
docker-compose logs backend

# Clear model cache
docker-compose exec backend rm -rf /app/ml_models/*
```

## 🤝 Contributing

### Development Setup
1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes**
4. **Run tests**: `python test_system.py`
5. **Commit changes**: `git commit -m 'Add amazing feature'`
6. **Push to branch**: `git push origin feature/amazing-feature`
7. **Open a Pull Request**

### Code Style
- **Backend**: Follow PEP 8, use Black formatter
- **Frontend**: Use Prettier, follow ESLint rules
- **Documentation**: Update README and docstrings
- **Testing**: Add tests for new features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **FastAPI** for the excellent web framework
- **React** and **Material-UI** for the frontend
- **Hugging Face** for pre-trained ML models
- **Docker** for containerization
- **PostgreSQL** and **Redis** for data storage

## 📞 Support

### Getting Help
1. **Check the logs**: `docker-compose logs [service]`
2. **Review documentation**: API docs at `/docs`
3. **Run diagnostics**: `python test_system.py`
4. **Check issues**: GitHub Issues page

### Community
- **GitHub Discussions**: Ask questions and share ideas
- **Issues**: Report bugs and request features
- **Pull Requests**: Contribute improvements

---

**🎉 Congratulations!** You now have a fully functional AI File Management System. The system combines modern web technologies with advanced machine learning to provide intelligent file organization and duplicate detection.

**Ready to get started?** Run `start.bat` (Windows) or `./start.sh` (Unix) and open http://localhost:3000 to begin!
