@echo off
REM Generate Prisma Python client

REM Activate venv
if exist venv\Scripts\activate.bat (
    call venv\Scripts\activate.bat
)

REM Generate Prisma client using Python CLI with schema from db package
python -m prisma generate --schema ..\..\packages\db\prisma\schema.prisma

