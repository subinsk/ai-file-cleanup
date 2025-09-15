# 🔧 Troubleshooting Guide - AI File Management System

## 🚨 **Common Installation Issues**

### **1. Python Package Installation Errors**

#### **Problem**: PyTorch or other ML packages fail to install
```bash
ERROR: Could not find a version that satisfies the requirement torch==2.1.0
```

#### **Solutions**:
```bash
# Option 1: Use Docker (Recommended)
docker-compose up -d

# Option 2: Use minimal requirements
cd backend
pip install -r requirements-minimal.txt

# Option 3: Install packages individually
pip install torch>=2.6.0
pip install fastapi uvicorn sqlalchemy
```

### **2. Build Wheel Errors**

#### **Problem**: `Getting requirements to build wheel did not run successfully`
```bash
KeyError: '__version__'
```

#### **Solutions**:
```bash
# Update pip and setuptools
pip install --upgrade pip setuptools wheel

# Use pre-compiled wheels
pip install --only-binary=all -r requirements.txt

# Or use Docker to avoid local compilation
docker-compose up -d
```

### **3. System Dependencies Missing**

#### **Problem**: `python-magic` or other system libraries fail
```bash
ERROR: Failed building wheel for python-magic
```

#### **Solutions**:
```bash
# Windows: Install Visual C++ Build Tools
# Download from: https://visualstudio.microsoft.com/visual-cpp-build-tools/

# Linux: Install system dependencies
sudo apt-get update
sudo apt-get install libmagic1 libgl1-mesa-glx

# macOS: Install with Homebrew
brew install libmagic

# Or use Docker (avoids system dependencies)
docker-compose up -d
```

## 🐳 **Docker Installation (Recommended)**

### **Quick Start with Docker**
```bash
# Windows
install-docker.bat

# Unix/Linux/macOS
chmod +x install-docker.sh
./install-docker.sh
```

### **Manual Docker Setup**
```bash
# Build and start services
docker-compose up -d --build

# Check service status
docker-compose ps

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 🔍 **Service Health Checks**

### **Check if services are running**
```bash
# Check Docker containers
docker-compose ps

# Check individual service health
curl http://localhost:8000/health
curl http://localhost:3000
```

### **Common Service Issues**

#### **Backend not starting**
```bash
# Check backend logs
docker-compose logs backend

# Common fixes
docker-compose restart backend
docker-compose down && docker-compose up -d
```

#### **Database connection issues**
```bash
# Check database logs
docker-compose logs postgres

# Reset database
docker-compose down -v
docker-compose up -d
```

#### **Frontend not loading**
```bash
# Check frontend logs
docker-compose logs frontend

# Rebuild frontend
docker-compose up -d --build frontend
```

## 🛠️ **Development Setup Issues**

### **Local Python Environment**

#### **Create virtual environment**
```bash
# Windows
python -m venv venv
venv\Scripts\activate
pip install -r requirements-minimal.txt

# Unix/Linux/macOS
python3 -m venv venv
source venv/bin/activate
pip install -r requirements-minimal.txt
```

#### **Environment variables**
```bash
# Create .env file
echo "DATABASE_URL=postgresql://postgres:password@localhost:5432/ai_file_cleanup" > .env
echo "REDIS_URL=redis://localhost:6379" >> .env
echo "JWT_SECRET=your-secret-key" >> .env
```

### **Node.js Frontend Issues**

#### **Install frontend dependencies**
```bash
cd frontend
npm install

# If npm install fails
rm -rf node_modules package-lock.json
npm install
```

#### **Frontend build issues**
```bash
# Clear cache and rebuild
npm run build

# Or start development server
npm start
```

## 📊 **Performance Issues**

### **Memory Issues**
```bash
# Increase Docker memory limits
# In docker-compose.yml, add:
deploy:
  resources:
    limits:
      memory: 4G
```

### **Slow ML Model Loading**
```bash
# Pre-download models
docker-compose exec backend python -c "
from transformers import AutoTokenizer, AutoModel
AutoTokenizer.from_pretrained('distilbert-base-uncased')
AutoModel.from_pretrained('distilbert-base-uncased')
"
```

## 🔒 **Security Issues**

### **JWT Secret Configuration**
```bash
# Generate secure JWT secret
python -c "import secrets; print(secrets.token_urlsafe(32))"

# Update .env file
echo "JWT_SECRET=your-generated-secret" >> .env
```

### **Database Security**
```bash
# Change default passwords
echo "POSTGRES_PASSWORD=your-secure-password" >> .env
```

## 📝 **Log Analysis**

### **View Application Logs**
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### **Common Log Patterns**

#### **Database Connection Errors**
```
sqlalchemy.exc.OperationalError: could not connect to server
```
**Fix**: Check if PostgreSQL is running and accessible

#### **Redis Connection Errors**
```
redis.exceptions.ConnectionError: Error connecting to Redis
```
**Fix**: Check if Redis is running and accessible

#### **ML Model Loading Errors**
```
OSError: [Errno 2] No such file or directory: 'model.bin'
```
**Fix**: Models will be downloaded automatically on first use

## 🆘 **Getting Help**

### **System Information**
```bash
# Collect system info for debugging
docker --version
docker-compose --version
python --version
node --version
```

### **Test System Health**
```bash
# Run comprehensive tests
python comprehensive_test.py

# Run verification
python verify_setup.py
```

### **Reset Everything**
```bash
# Complete reset
docker-compose down -v
docker system prune -f
docker-compose up -d --build
```

## ✅ **Success Indicators**

### **System is working when you see:**
- ✅ All Docker containers show "Up" status
- ✅ http://localhost:3000 loads the frontend
- ✅ http://localhost:8000/health returns "healthy"
- ✅ http://localhost:8000/docs shows API documentation
- ✅ No error messages in `docker-compose logs`

### **Quick Test**
```bash
# Test API endpoints
curl http://localhost:8000/health
curl http://localhost:8000/api/health

# Test frontend
curl http://localhost:3000
```

---

**💡 Pro Tip**: If you encounter persistent issues, use Docker installation as it avoids most local environment problems and provides a consistent, tested environment.
