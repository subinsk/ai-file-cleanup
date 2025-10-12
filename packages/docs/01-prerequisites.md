# Prerequisites

Before you begin, ensure you have the following installed on your system:

## Required Software

### 1. Node.js (v18 or higher)

Download and install from [nodejs.org](https://nodejs.org/)

**Verify installation:**

```bash
node --version
# Should output: v18.x.x or higher

npm --version
# Should output: 9.x.x or higher
```

### 2. pnpm (Package Manager)

We use pnpm for efficient package management in our monorepo.

**Install pnpm:**

```bash
npm install -g pnpm
```

**Verify installation:**

```bash
pnpm --version
# Should output: 8.x.x or higher
```

### 3. Python (v3.10 or higher)

Required for the API and ML services.

**Download:**

- Windows: [python.org](https://www.python.org/downloads/)
- macOS: `brew install python@3.11`
- Linux: Usually pre-installed

**Verify installation:**

```bash
python --version
# Should output: Python 3.10.x or higher

pip --version
# Should output: pip 23.x.x or higher
```

### 4. Docker Desktop

Required for running PostgreSQL with pgvector extension.

**Download:**

- Windows/macOS: [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/)
- Linux: Follow [docs.docker.com/engine/install](https://docs.docker.com/engine/install/)

**Verify installation:**

```bash
docker --version
# Should output: Docker version 20.x.x or higher

docker compose version
# Should output: Docker Compose version v2.x.x or higher
```

### 5. Git

For version control and cloning the repository.

**Download:**

- Windows: [git-scm.com](https://git-scm.com/download/win)
- macOS: `brew install git` or Xcode Command Line Tools
- Linux: `sudo apt install git` or `sudo yum install git`

**Verify installation:**

```bash
git --version
# Should output: git version 2.x.x or higher
```

## Optional Tools

### VS Code

Recommended IDE with excellent TypeScript and Python support.

- Download: [code.visualstudio.com](https://code.visualstudio.com/)

**Recommended Extensions:**

- ESLint
- Prettier
- Python
- Prisma

### Postman or Thunder Client

For testing API endpoints during development.

---

## System Requirements

### Minimum Requirements

- **OS:** Windows 10, macOS 11, or Linux (Ubuntu 20.04+)
- **RAM:** 8 GB
- **Storage:** 5 GB free space
- **Internet:** Required for downloading dependencies

### Recommended Requirements

- **OS:** Windows 11, macOS 13+, or Linux (Latest)
- **RAM:** 16 GB or more
- **Storage:** 10 GB free space
- **Internet:** Broadband connection

---

## Next Steps

Once all prerequisites are installed, proceed to [Installation Guide](./02-installation.md).
