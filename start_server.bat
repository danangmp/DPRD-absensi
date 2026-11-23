@echo off
title Presensi Digital DPRD Surakarta
cd /d D:\ABSENSI_PROJECT
echo ========================================================
echo   Menjalankan Server Presensi Digital DPRD Surakarta
echo   URL: http://localhost:8080
echo ========================================================
echo.
echo JANGAN TUTUP JENDELA INI SELAMA APLIKASI DIGUNAKAN!
echo.
C:\xampp\php\php.exe -S 0.0.0.0:8080 -t D:\ABSENSI_PROJECT
pause
