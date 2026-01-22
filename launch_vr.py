#!/usr/bin/env python3
import subprocess
import socket
import webbrowser
import time
import sys
import os

def get_local_ip():
    """Obtient l'adresse IP locale (pas 127.0.0.1)"""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except:
        return "localhost"

def main():
    print("🚀 Lancement du serveur WebXR VR...")
    print()
    
    ip = get_local_ip()
    port = 5173
    url = f"http://{ip}:{port}"
    
    print(f"✅ Serveur disponible à: {url}")
    print()
    print("📱 Sur ton casque VR ou autre appareil, ouvre:")
    print(f"   {url}")
    print()
    print("⏹️  Appuie sur Ctrl+C pour arrêter le serveur")
    print()
    
    # Lancer npm run dev
    try:
        subprocess.run([sys.executable, "-m", "pip", "install", "-q", "requests"], check=False)
        subprocess.run("npm run dev", shell=True, cwd=os.getcwd())
    except KeyboardInterrupt:
        print("\n\n👋 Serveur arrêté")
        sys.exit(0)

if __name__ == "__main__":
    main()
