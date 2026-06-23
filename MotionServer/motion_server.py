import cv2
import asyncio
import websockets
import json
import time
import threading

connected_clients = set()
server_loop = None

async def ws_handler(websocket):
    print("Ekstensi Chrome terhubung!")
    connected_clients.add(websocket)
    try:
        await asyncio.Future() # Biarkan koneksi tetap hidup
    except asyncio.CancelledError:
        pass
    finally:
        connected_clients.remove(websocket)
        print("Ekstensi Chrome terputus.")

async def start_server_async():
    # Cara modern untuk versi websockets terbaru
    async with websockets.serve(ws_handler, "localhost", 8765):
        await asyncio.Future()  # Jalankan selamanya

def start_server():
    global server_loop
    server_loop = asyncio.new_event_loop()
    asyncio.set_event_loop(server_loop)
    server_loop.run_until_complete(start_server_async())

def broadcast_command(cmd):
    if not connected_clients or not server_loop:
        return
    message = json.dumps({"type": "MOTION_COMMAND", "command": cmd})
    
    async def send_to_all():
        for ws in list(connected_clients):
            try:
                await ws.send(message)
            except Exception:
                pass
                
    asyncio.run_coroutine_threadsafe(send_to_all(), server_loop)

def main():
    print("Membuka server komunikasi...")
    server_thread = threading.Thread(target=start_server, daemon=True)
    server_thread.start()
    
    import os
    config_file = 'kamera.txt'
    cam_index = -1
    
    # Coba baca memori kamera sebelumnya
    if os.path.exists(config_file):
        with open(config_file, 'r') as f:
            try:
                saved_index = int(f.read().strip())
                print(f"\n[!] Memori Kamera Ditemukan: Nomor {saved_index}")
                cam_index = saved_index
            except:
                pass
                
    if cam_index == -1:
        print("\n--- MENCARI KAMERA ---")
        print("Mengecek satu per satu jalur USB Anda...")
        
        for i in range(5):
            cap = cv2.VideoCapture(i, cv2.CAP_DSHOW)
            if cap.isOpened():
                ret, frame = cap.read()
                if ret:
                    window_name = f"Tes Kamera Nomor {i}"
                    cv2.imshow(window_name, frame)
                    cv2.waitKey(100)
                    
                    print(f"\n[!] Sebuah jendela baru bernama '{window_name}' baru saja muncul.")
                    ans = input("Apakah di jendela itu muncul gambar wajah Anda dari WebCam? (y/n): ")
                    
                    cv2.destroyWindow(window_name)
                    
                    if ans.lower().strip() == 'y':
                        cam_index = i
                        # Simpan pilihan
                        with open(config_file, 'w') as f:
                            f.write(str(cam_index))
                        cap.release()
                        break
                cap.release()
                
    if cam_index == -1:
        print("\nAnda tidak memilih kamera apapun. Keluar...")
        return
        
    print(f"\nSip! Mengunci Kamera Nomor {cam_index}...")
    cap = cv2.VideoCapture(cam_index, cv2.CAP_DSHOW)
    
    # Inisialisasi Detektor Wajah Bawaan OpenCV
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    
    history = [] # Menyimpan (waktu, y, x)
    y_history_long = [] # Untuk baseline (mencegah false trigger saat kembali dari bawah)
    last_trigger_time = 0
    COOLDOWN = 1.5 
    THRESHOLD = 0.05 
    
    print("Siap! Aplikasi berjalan. Tekan 'q' pada jendela kamera untuk keluar.")
    
    while cap.isOpened():
        success, image = cap.read()
        if not success:
            continue

        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Deteksi wajah
        faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(100, 100))

        if len(faces) > 0:
            # Ambil wajah pertama/terbesar
            (x, y, w, h) = faces[0]
            
            # Titik pusat wajah (Y-axis & X-axis), dinormalisasi ke skala 0.0 - 1.0
            image_height, image_width = image.shape[:2]
            current_y = (y + h / 2) / image_height
            current_x = (x + w / 2) / image_width
            
            now = time.time()
            history.append((now, current_y, current_x))
            
            # Update baseline Y (menyimpan posisi Y wajah selama 10 detik terakhir)
            y_history_long.append((now, current_y))
            y_history_long = [h for h in y_history_long if now - h[0] <= 10.0]
            
            # Hitung nilai tengah (median) sebagai posisi "layar/netral"
            if len(y_history_long) > 10:
                sorted_y = sorted([h[1] for h in y_history_long])
                baseline_y = sorted_y[len(sorted_y) // 2]
            else:
                baseline_y = current_y
            
            history = [h for h in history if now - h[0] <= 0.35]
            
            if len(history) > 1 and (now - last_trigger_time > COOLDOWN):
                past_y = history[0][1]
                past_x = history[0][2]
                
                travel_y = current_y - past_y
                travel_x = current_x - past_x
                
                if abs(travel_y) > abs(travel_x):
                    # Bawah: Harus bergerak ke bawah (travel_y > THRESHOLD) DAN posisinya di bawah layar normal
                    if travel_y > THRESHOLD and current_y > baseline_y + 0.02:
                        print(f"[{time.strftime('%H:%M:%S')}] Mengangguk BAWAH")
                        broadcast_command('bawah')
                        last_trigger_time = now
                        history.clear()
                    # Atas: Harus bergerak ke atas (travel_y < -THRESHOLD) DAN posisinya di atas layar normal
                    elif travel_y < -THRESHOLD and current_y < baseline_y - 0.02:
                        print(f"[{time.strftime('%H:%M:%S')}] Mendongak ATAS")
                        broadcast_command('atas')
                        last_trigger_time = now
                        history.clear()
                else:
                    if travel_x > THRESHOLD:
                        print(f"[{time.strftime('%H:%M:%S')}] Menoleh KIRI")
                        broadcast_command('kiri')
                        last_trigger_time = now
                        history.clear()
                    elif travel_x < -THRESHOLD:
                        print(f"[{time.strftime('%H:%M:%S')}] Menoleh KANAN")
                        broadcast_command('kanan')
                        last_trigger_time = now
                        history.clear()

            cv2.rectangle(image, (x, y), (x+w, y+h), (255, 0, 0), 2)
            cx, cy = int(x + w/2), int(y + h/2)
            cv2.circle(image, (cx, cy), 8, (0, 255, 0), cv2.FILLED)
                
        cv2.imshow('Motion Server (AI Python)', cv2.flip(image, 1))
        
        if cv2.waitKey(5) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()
