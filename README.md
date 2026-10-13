# 🎴 Online Multiplayer Mexican Lotería! 🇲🇽

A real-time multiplayer web game of traditional **Mexican Lotería**, built with a high-performance **Rust** backend (Axum, Tokio, WebSockets) and a responsive, bilingual client. Features all 54 official cards, traditional verses ("cantos"), 3D interactive pinto beans, mobile-optimized board view, and server-side anti-cheat win validation.

---

## 🇺🇸 English Guide

### 🌟 Key Features

1. **Complete Traditional Deck (54 Cards)**:
   - All 54 numbered cards (from *El Gallo* #1 to *La Rana* #54).
   - Traditional verses and riddles with full English translations (e.g. *"El que le cantó a San Pedro..."* / *"He who crowed to Saint Peter won't crow to him again"*).
   - Card #26 respectfully modernized as **El Niño** ("The Boy" 👦) with the classic rhyme (*"El niño travieso, que se comió el azúcar"*).

2. **Real-Time Multiplayer**:
   - Create private game rooms with quick 5-character codes (e.g. `MEX72`).
   - One-click shareable invite links (`?room=CODE`).
   - Live lobby player list and real-time bean counter scoreboard.

3. **Customizable Win Patterns**:
   - 🏆 **Full Board**: Cover all 16 cards on your tabla.
   - 📏 **Any Line**: 4 cards in a row (horizontal, vertical, or diagonal).
   - 📐 **Four Corners**: The 4 outermost corner cards.
   - 🎯 **Center / Pot**: The 2×2 square in the center of the board.

4. **Paced Caller / El Cantor**:
   - Configurable draw intervals: **Fast (5s)**, **Normal (7s)**, **Relaxed (9s)**, or **Chill (12s)** so verses can be fully read and enjoyed.
   - Host-controlled manual draw button ("Next Card") option.
   - Previous cards history reel so no player misses a call.

5. **Audio, Speech & Language Switcher**:
   - **Bilingual Interface**: English by default, with an instant one-click toggle (`🌐 Español` / `🌐 English`) in the navigation header.
   - **Voice Locution**: Spoken card chants via browser SpeechSynthesis with natural cadence.
   - **Tactile Sound Effects**: Custom audio effects for placing/removing beans, plus brass fanfare and confetti explosion on winning claims.

6. **Interactive Boards & Pinto Beans**:
   - Each player gets a randomized 16-card board with a **"🔀 Shuffle Board"** button in the lobby to pick a favorite layout.
   - Tap any card to place a 3D textured pinto bean.
   - Pulsing **¡LOTERÍA!** button.

7. **Mobile-Optimized (Samsung Galaxy & modern smartphones)**:
   - Sticky compact caller strip positioned above the board so you can mark cards without endless scrolling.
   - Unclipped rounded borders designed for curved screens.

8. **Server-Side Anti-Cheat Verification**:
   - Validates mathematically that all claimed cards were legitimately drawn by the caller and match the selected room rule before awarding victory.

---

### 🚀 How to Play

#### 1. Start the Server

```powershell
# Run directly with Cargo (Release mode):
cargo run --release

# Or execute the compiled standalone binary:
.\target\release\loteria.exe
```

Access the game:
- **On your PC**: [http://localhost:3000](http://localhost:3000)
- **On your local Wi-Fi (phones/tablets)**: `http://YOUR_LOCAL_IP:3000` (printed in the terminal at startup)

#### 2. Create a Room
1. Open [http://localhost:3000](http://localhost:3000).
2. Enter your name or nickname.
3. Select your winning rule (Full Board, Any Line, 4 Corners, Center).
4. Choose Automatic (with speed setting) or Manual caller mode.
5. Click **Create Room & Play!**.

#### 3. Invite Players
1. Share the 5-letter code or click **Copy** to share the direct link.
2. Other players join from their mobile devices or desktop browsers on the **Join Room** tab.
3. Players can click **"🔀 Shuffle Board"** in the waiting lobby until they like their card set.
4. The host clicks **START GAME!**.

#### 4. Play the Round!
- The caller announces cards one by one.
- Tap matching cards on your board to place a pinto bean.
- When you complete the pattern, hit **¡LOTERÍA!** to claim the win!

---

### 📁 Project Structure

```
c:\dev\loteria\
├── src/
│   ├── main.rs          # Axum router, HTTP API and static file serving
│   ├── cards.rs         # 54-card dataset (bilingual verses & emojis)
│   ├── game.rs          # Room state, tablas, deck shuffling & win verification
│   └── ws.rs            # Real-time WebSocket protocol and async Tokio timers
├── public/
│   ├── index.html       # Responsive web interface (bilingual EN/ES)
│   ├── style.css        # Adaptive mobile styles (Samsung S26 optimized)
│   ├── app.js           # Lightweight native WebSocket client
│   └── audio.js         # Web Audio API sound effects and voice caller
├── Dockerfile           # Multi-stage production container for cloud hosting
├── .dockerignore
├── .gitignore
├── Cargo.toml           # Rust dependencies (Axum, Tokio, Tower-HTTP, Serde)
└── README.md
```

---

## 🇲🇽 Guía en Español

### 🌟 Características Principales

1. **Mazo Tradicional Completo (54 Cartas)**:
   - Todas las 54 cartas oficiales numeradas (desde *El Gallo* #1 hasta *La Rana* #54).
   - Incluye los versos y dichos populares tradicionales traducidos (ej. *"El que le cantó a San Pedro no le volverá a cantar"*).
   - Carta #26 respetuosamente modernizada como **El Niño** (👦) con su verso clásico (*"El niño travieso, que se comió el azúcar"*).

2. **Multijugador en Tiempo Real**:
   - Creación de salas privadas con códigos de 5 letras (ej. `MEX72`).
   - Enlace directo de invitación compartible en un clic (`?room=CODIGO`).
   - Marcador interactivo en vivo con conteo de frijolitos colocados por cada jugador.

3. **Modos de Victoria Personalizables**:
   - 🏆 **Tabla Llena**: Cubre las 16 cartas de la tabla.
   - 📏 **Cualquier Línea**: 4 cartas en horizontal, vertical o diagonal.
   - 📐 **Cuatro Esquinas**: Las 4 esquinas exteriores de la tabla.
   - 🎯 **Centro / Pozo**: El cuadrado 2×2 en el centro del tablero.

4. **El Cantor (Automático o Manual con Ritmo Ajustable)**:
   - Intervalos configurables: **Rápido (5s)**, **Normal (7s)**, **Relajado (9s)** o **Tranquilo (12s)** para escuchar el verso completo sin prisas.
   - Modo manual controlado por el anfitrión ("Siguiente Carta").
   - Historial de cartas recientes en pantalla para que nadie pierda el paso.

5. **Audio, Voz y Selector de Idioma**:
   - **Interfaz Bilingüe**: En inglés por defecto con botón de cambio instantáneo (`🌐 Español` / `🌐 English`) en la barra superior.
   - **Voz del Cantor**: Locución de cartas y versos mediante SpeechSynthesis del navegador.
   - **Frijolitos 3D y Fanfarria**: Efectos táctiles al poner o quitar frijoles, fanfarria mexicana y explosión de confeti al ganar.

6. **Optimizado para Móviles (Samsung Galaxy y teléfonos modernos)**:
   - Barra compacta fija con la carta actual en la parte superior para marcar frijolitos sin desplazamientos excesivos.
   - Bordes redondeados ajustados para pantallas curvas.

7. **Verificación en el Servidor (Antitrampas)**:
   - El servidor valida matemáticamente que todas las cartas cantadas coincidan con el patrón antes de proclamar al ganador.

---

### 🚀 Cómo Jugar

#### 1. Iniciar el Servidor

```powershell
# Ejecutar directamente con Cargo en modo Release:
cargo run --release

# O ejecutar el ejecutable compilado:
.\target\release\loteria.exe
```

El juego estará disponible en:
- **En tu computadora**: [http://localhost:3000](http://localhost:3000)
- **En tu red local (móviles/tablets)**: `http://TU_IP_LOCAL:3000` (el servidor imprime tu IP al iniciar)

#### 2. Crear una Sala
1. Entra a [http://localhost:3000](http://localhost:3000).
2. Escribe tu nombre o apodo.
3. Selecciona la condición de victoria (Tabla Llena, Línea, 4 Esquinas, Centro).
4. Elige si prefieres avance automático o manual.
5. Haz clic en **¡Crear Sala y Jugar!**.

#### 3. Unir a tus Amigos y Familia
1. Comparte el código de 5 letras o haz clic en **Copiar**.
2. Los demás entran desde sus teléfonos en la pestaña **Unirse a Sala**.
3. Cada jugador puede presionar **"🔀 Cambiar Tabla"** en la sala de espera hasta obtener su tablero preferido.
4. El anfitrión presiona **¡COMENZAR PARTIDA!**.

#### 4. ¡A Jugar!
- El cantor anunciará las cartas una por una.
- Toca las cartas de tu tabla para ponerles un frijolito.
- Al completar el objetivo, ¡presiona rápidamente el botón **¡LOTERÍA!** para ganar la ronda!

---

## ☁️ Free Cloud Deployment / Despliegue Gratuito en la Nube

This project includes a production multi-stage [`Dockerfile`](file:///c:/dev/loteria/Dockerfile) and is ready for 24/7 free hosting on [Render.com](https://render.com), [Fly.io](https://fly.io), or [Koyeb](https://koyeb.com):

1. Push to your GitHub repository: [github.com/pinguxx/loteria](https://github.com/pinguxx/loteria).
2. On **Render.com**, click **New +** → **Web Service** and select `loteria`.
3. Select the **Free** instance tier and click **Create Web Service**.
