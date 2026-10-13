# 🎴 ¡Lotería Mexicana Online Multijugador! 🇲🇽

Un juego web multijugador en tiempo real de la tradicional **Lotería Mexicana**, completo con las 54 cartas oficiales, versos tradicionales ("cantos"), fichas de frijolitos interactivos y verificación de victoria en el servidor.

---

## 🌟 Características Principales

1. **Mazo Tradicional Completo (54 Cartas)**:
   - Todas las 54 cartas numeradas (desde *El Gallo* hasta *La Rana*).
   - Incluye los versos y dichos tradicionales de cada carta (ej. *"El que le cantó a San Pedro no le volverá a cantar"*).

2. **Multijugador en Tiempo Real**:
   - Creación de salas con códigos de 5 caracteres (ej. `MEX72`).
   - Comparte un enlace directo de invitación con un solo clic (`?room=CODIGO`).
   - Lista interactiva de jugadores en la sala y marcador en vivo.

3. **Modos de Victoria Personalizables**:
   - 🏆 **Tabla Llena**: Las 16 cartas del tablero.
   - 📏 **Cualquier Línea**: 4 cartas en horizontal, vertical o diagonal.
   - 📐 **Cuatro Esquinas**: Las 4 esquinas de la tabla.
   - 🎯 **Centro / Pozo**: El cuadrado 2×2 en el centro del tablero.

4. **The Caller / El Cantor (Paced Automatically or Manually)**:
   - Configurable calling intervals with comfortable pacing: Fast (5s), Normal Recommended (7s), Relaxed (9s), or Chill (12s) so the entire verse can be read and heard without rushing.
   - Manual host-controlled draw button ("Next Card") option.
   - History reel showing recent cards so nobody misses a call.

5. **Audio Effects, Voice & Language Switcher**:
   - **Bilingual Interface**: English by default, with an instant one-click toggle button (`🌐 Español` / `🌐 English`) in the top navigation bar.
   - **Voice Chant**: Natural cadence voice locution via *SpeechSynthesis* with clear 0.95x pacing.
   - **Respectful & Classic Imagery**: Card #26 respectfully updated to **El Niño** ("The Boy" 👦) with the beloved classic riddle (*"El niño travieso, que se comió el azúcar"*).
   - **3D Pinto Beans**: Tactile sound effects on placing/removing beans.
   - **Fanfare & Confetti**: Triumphant brass fanfare and canvas confetti explosion on winning calls.
   - Quick mute toggles for sound FX and caller voice.

6. **Tablas Interactivas y Frijolitos**:
   - Cada jugador recibe una tabla de 16 cartas aleatorias y puede **barajarla** en la sala de espera hasta obtener la combinación que prefiera.
   - Toca cualquier casilla para colocar un frijolito (*pinto bean*) con rotación natural y sombra 3D.
   - Botón gigante palpitante **¡LOTERÍA!**.

7. **Verificación en el Servidor (Antitrampas)**:
   - El servidor valida matemáticamente que todas las cartas reclamadas hayan salido y que coincidan con la regla de la sala antes de proclamar al ganador.
   - Si alguien grita antes de tiempo, suena un aviso amistoso y la partida continúa.

8. **Reacciones en Vivo**:
   - Envía reacciones rápidas (🫘, 🇲🇽, 🎺, 🎉, 😱, 🔥, 👏) que flotan por la pantalla de todos los jugadores en tiempo real.

---

## 🚀 Cómo Jugar / How to Play

### 1. Iniciar el Servidor en Rust / Start the Rust Server

El backend ahora está escrito completamente en **Rust** (con Tokio y Axum) para un rendimiento ultrarrápido y mínimo uso de memoria:

```powershell
# Ejecutar directamente con Cargo en modo Release:
cargo run --release

# O ejecutar el binario standalone ya compilado:
.\target\release\loteria.exe
```

El servidor estará disponible en:
- **En tu computadora**: [http://localhost:3000](http://localhost:3000)
- **En tu red local (móviles/tablets en el mismo WiFi)**: `http://TU_IP_LOCAL:3000` (el servidor imprime tu IP exacta al arrancar).

### 2. Crear una Sala
1. Entra a [http://localhost:3000](http://localhost:3000).
2. Escribe tu nombre o apodo.
3. Elige el modo de ganar (Tabla Llena, Línea, 4 Esquinas o Centro).
4. Elige si prefieres que las cartas salgan automáticamente (con el selector de velocidad) o avance manual por el anfitrión.
5. Haz clic en **¡Crear Sala y Jugar! / Create Room & Play!**.

### 3. Unir a tus amigos o familia
1. Pasa el código de 5 letras a los demás jugadores o presiona **Copiar Enlace**.
2. Los demás entran desde sus teléfonos o navegadores en la pestaña **Unirse a Sala**.
3. Cada jugador puede pulsar **"🔀 Cambiar Tabla / Shuffle Board"** para elegir una combinación que le guste.
4. El anfitrión presiona **¡COMENZAR PARTIDA! / START GAME!**.

### 4. ¡A jugar!
- El cantor anunciará las cartas una por una.
- Toca las cartas en tu tabla para ponerles un frijolito.
- En dispositivos móviles (como Samsung Galaxy S26), la barra compacta de la carta cantada queda fijada en la parte superior sin tapar la cuadrícula.
- Cuando completes el patrón, ¡presiona el botón gigante **¡LOTERÍA!** para que el servidor valide tu victoria!

---

## 📁 Estructura del Proyecto (Rust Backend + Native Web Client)

```
c:\dev\loteria\
├── src/
│   ├── main.rs          # Servidor Axum, rutas HTTP y orquestador estático
│   ├── cards.rs         # Mazo de 54 cartas estático con versos bilingües y emojis
│   ├── game.rs          # Estado de salas, jugadores, tablas y verificación matemática de victoria
│   └── ws.rs            # Protocolo WebSocket en tiempo real, difusión de eventos y temporizadores Tokio
├── public/
│   ├── index.html       # Interfaz responsiva (bilingüe EN/ES con selector)
│   ├── style.css        # Diseño adaptativo optimizado para móviles (pantallas modernas como Samsung S26)
│   ├── app.js           # Cliente WebSocket nativo ligero (sin dependencias de Socket.IO)
│   └── audio.js         # Efectos sonoros Web Audio API y voz SpeechSynthesis pausada
├── Cargo.toml           # Configuración de Rust (Axum, Tokio, Tower-HTTP, Serde)
├── cloudflared.exe      # Binario para túnel público seguro si se desea jugar fuera de la red local
└── README.md
```

