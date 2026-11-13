@echo off
echo Starting BENEFICIALai Backend Server...
cd /d "%~dp0"

python -m pip install fastapi uvicorn python-multipart pydantic python-dotenv
python main.py

pause
