@echo off
echo Menghapus ingatan memori kamera sebelumnya...
cd /d "%~dp0MotionServer"
if exist kamera.txt del kamera.txt
echo.
echo Membuka ulang Asisten Pencari Kamera...
start "Motion AI Server" py motion_server.py
exit
