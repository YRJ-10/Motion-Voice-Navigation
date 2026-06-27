@echo off
echo Menginstall dependency Motion Server...
cd /d "%~dp0MotionServer"
py -m pip install -r requirements.txt
echo.
echo Selesai. Jika tidak ada error, jalankan Mulai_AI.bat untuk mengaktifkan motion.
pause
