@echo off
echo Menghidupkan Mesin AI Kamera...
cd /d "%~dp0MotionServer"
start "Motion AI Server" py motion_server.py
exit
