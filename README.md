# Motion Voice Nav

Motion Voice Nav adalah ekstensi browser untuk navigasi halaman web menggunakan perintah suara. Ekstensi ini juga menyediakan mode motion opsional untuk scroll dengan gerakan kepala melalui kamera dan server Python lokal.

## Tampilan

![Sampel popup](sampel%201.png)

![Sampel penggunaan](Sampel%202.png)

## Fitur Utama

- Navigasi halaman dengan suara: atas, bawah, kanan, kiri, puncak, dan dasar.
- Manajemen tab: tab baru, tutup tab, geser tab, dan pindah tab berdasarkan nama.
- Pencarian cepat: buka website atau cari kata kunci.
- Kontrol media dan browser: putar, jeda, layar penuh, dan diamkan.
- Klik pintar: ucapkan `Klik`, lalu sebut nomor target.
- Input keyboard: ketik teks, salin, tempel, enter, dan spasi.
- Motion control opsional dengan kamera untuk scroll menggunakan gerakan kepala.

## Instalasi Ekstensi

1. Buka Chrome atau browser Chromium lain.
2. Masuk ke `chrome://extensions`.
3. Aktifkan `Developer mode`.
4. Klik `Load unpacked`.
5. Pilih folder project ini.
6. Pin ekstensi `Motion Voice Nav` agar mudah dibuka.

## Cara Penggunaan Suara

1. Klik ikon ekstensi.
2. Klik `Buka Mesin Pendeteksi`.
3. Berikan izin microphone saat diminta.
4. Ucapkan perintah, misalnya `Bawah`, `Atas`, `Cari musik jazz`, atau `Buka youtube`.

## Mengaktifkan Motion Control

Motion control membutuhkan Python karena kamera diproses oleh server lokal di folder `MotionServer`.

Cara paling mudah:

1. Install Python 3.10 atau lebih baru dari [python.org](https://www.python.org/downloads/).
2. Saat instalasi Python, centang `Add python.exe to PATH`.
3. Jalankan `Install_Motion_Dependencies.bat` satu kali untuk menginstall dependency.
4. Jalankan `Mulai_AI.bat` untuk menyalakan server kamera.
5. Jika diminta memilih kamera, jawab `y` pada jendela kamera yang benar.
6. Buka mesin pendeteksi dari popup ekstensi.
7. Gunakan gerakan kepala untuk scroll: atas, bawah, kanan, atau kiri.

Server motion berjalan secara lokal di `localhost:8765`.

## Instalasi Manual Dependency Python

Jika tidak ingin memakai file `.bat`, jalankan perintah berikut dari root project:

```bash
cd MotionServer
py -m pip install -r requirements.txt
py motion_server.py
```

Dependency yang digunakan:

- `opencv-python`
- `websockets`

## File Bantuan

- `Install_Motion_Dependencies.bat`: install dependency Python untuk motion control.
- `Mulai_AI.bat`: menjalankan server kamera.
- `Reset_Kamera.bat`: menghapus pilihan kamera tersimpan dan membuka ulang pencarian kamera.

## Troubleshooting

- Jika microphone tidak aktif, cek izin situs/ekstensi di browser.
- Jika motion tidak merespons, pastikan `Mulai_AI.bat` sedang berjalan.
- Jika kamera yang terpilih salah, jalankan `Reset_Kamera.bat`.
- Jika perintah `py` tidak dikenali, reinstall Python dan centang `Add python.exe to PATH`.
