@echo off
REM Generate Prisma clients (both JS and Python)

REM Activate venv
if exist venv\Scripts\activate.bat (
    call venv\Scripts\activate.bat
)

REM Generate Prisma clients using the schema from db package
prisma generate --schema=..\..\packages\db\prisma\schema.prisma

