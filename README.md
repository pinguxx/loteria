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

9. **📱 Lobby QR Code**:
   - Tap the **📱 QR** button in the lobby to reveal a high-contrast QR code. Players at a party can point their phone camera to join directly without typing room codes.

10. **💰 Virtual Betting Chips & "El Pozo"**:
    - Optional buy-in per round (Free Play, 5, 10, or 20 chips). Players start with 50 chips.
    - Each round's buy-ins accumulate into the live Pot ("Pozo"). The player who claims ¡LOTERÍA! takes the entire jackpot!

11. **🎨 Papel Picado Themes & Skins**:
    - Click the **🎨** theme icon in the header to switch between:
      - **🇲🇽 Fiesta Clásica**: Vibrant traditional Mexican market colors.
      - **💀 Día de los Muertos**: Midnight purple, sugar skulls, and glowing cempasúchil marigolds.
      - **📜 Vintage Feria 1950s**: Aged rustic cardboard paper with nostalgic feria flags.

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
4. Choose Automatic or Manual caller mode and chip buy-in.
5. Click **Create Room & Play!**.

#### 3. Invite Players
1. Share the 5-letter code, click **Copy** for the link, or click **📱 QR** for friends to scan on their phones.
2. Other players join from their mobile devices or desktop browsers on the **Join Room** tab.
3. Players can click **"🔀 Shuffle Board"** in the waiting lobby until they like their card set.
4. The host clicks **START GAME!**.

#### 4. Play the Round!
- The caller announces cards one by one.
- Tap matching cards on your board to place a pinto bean.
- When you complete the pattern, hit **¡LOTERÍA!** to claim the win and collect the pot!

---

### 📁 Project Structure

```
c:\dev\loteria\
├── src/
│   ├── main.rs          # Axum router, HTTP API and static file serving
│   ├── cards.rs         # 54-card dataset (bilingual verses & emojis)
│   ├── game.rs          # Room state, tablas, chips/pot, deck shuffling & win verification
│   └── ws.rs            # Real-time WebSocket protocol and async Tokio timers
├── public/
│   ├── index.html       # Responsive web interface (bilingual EN/ES, themes)
│   ├── style.css        # Adaptive mobile styles (Fiesta, Muertos, Vintage skins)
│   ├── app.js           # Lightweight native WebSocket client & game logic
│   ├── audio.js         # Web Audio API sound effects, coin jingles & voice caller
│   └── qrcode.min.js    # 100% offline standalone QR code generator
├── Dockerfile           # Multi-stage production container for cloud hosting
├── render.yaml          # 1-click Render.com Blueprint configuration
├── .dockerignore
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
   - **Frijolitos 3D, Monedas y Fanfarria**: Efectos táctiles al poner o quitar frijoles, tintineo de monedas al ganar el pozo, fanfarria y lluvia de confeti.

6. **📱 Código QR para Unirse en Segundos**:
   - Presiona el botón **📱 QR** en la sala de espera para mostrar el código QR. Cualquier persona puede escanearlo con la cámara de su teléfono para entrar de inmediato sin escribir el código.

7. **💰 Fichas de Apuesta y "El Pozo"**:
   - Opcional: El anfitrión puede activar partidas con fichas (5, 10 o 20 fichas de entrada). Todos inician con 50 fichas.
   - Las fichas de entrada se acumulan en **El Pozo** en tiempo real. ¡El jugador que grita ¡LOTERÍA! se lleva todo el premio!

8. **🎨 Temas de Papel Picado**:
   - Haz clic en el icono **🎨** de la barra de navegación para alternar entre:
     - **🇲🇽 Fiesta Clásica**: El ambiente tradicional de mercado mexicano.
     - **💀 Día de los Muertos**: Fondo noche púrpura, calaveras y tonos cempasúchil.
     - **📜 Feria Vintage 1950**: Aspecto nostálgico de cartón envejecido y tipografías clásicas.

9. **Optimizado para Móviles (Samsung Galaxy y teléfonos modernos)**:
   - Barra compacta fija con la carta actual en la parte superior para marcar frijolitos sin desplazamientos excesivos.

10. **Verificación en el Servidor (Antitrampas)**:
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
4. Elige si prefieres avance automático o manual y la entrada de fichas.
5. Haz clic en **¡Crear Sala y Jugar!**.

#### 3. Unir a tus Amigos y Familia
1. Comparte el código de 5 letras, haz clic en **Copiar**, o abre el **📱 QR** para que lo escaneen con su celular.
2. Los demás entran desde sus teléfonos en la pestaña **Unirse a Sala**.
3. Cada jugador puede presionar **"🔀 Cambiar Tabla"** en la sala de espera hasta obtener su tablero preferido.
4. El anfitrión presiona **¡COMENZAR PARTIDA!**.

#### 4. ¡A Jugar!
- El cantor anunciará las cartas una por una.
- Toca las cartas de tu tabla para ponerles un frijolito.
- Al completar el objetivo, ¡presiona rápidamente el botón **¡LOTERÍA!** para ganar la ronda y llevarte el pozo acumulado!

---

## ☁️ Free Cloud Deployment to Render.com / Despliegue en Render.com

This repository includes a [`Dockerfile`](file:///c:/dev/loteria/Dockerfile) and a [`render.yaml`](file:///c:/dev/loteria/render.yaml) blueprint ready for 100% free hosting:

### English:
1. Push your repository to GitHub: `git push origin main`.
2. Go to [dashboard.render.com](https://dashboard.render.com) and click **New +** → **Blueprint** (or **Web Service**).
3. Connect your repository (`pinguxx/loteria`).
4. Render automatically detects the `Dockerfile` and `render.yaml`.
5. Select the **Free** instance tier and click **Apply** / **Deploy**.
6. Within 2–3 minutes, you'll receive your free public URL (e.g. `https://loteria-mexicana.onrender.com`) accessible from any phone or computer in the world!

### Español:
1. Sube tus cambios a GitHub: `git push origin main`.
2. Ve a [dashboard.render.com](https://dashboard.render.com) y haz clic en **New +** → **Blueprint** (o **Web Service**).
3. Conecta tu repositorio (`pinguxx/loteria`).
4. Render detectará automáticamente el `Dockerfile` y `render.yaml`.
5. Selecciona el plan **Free** y presiona **Apply** / **Deploy**.
6. ¡En 2 a 3 minutos tendrás tu enlace público gratuito (ej. `https://loteria-mexicana.onrender.com`) para jugar con amigos y familia en cualquier lugar del mundo!
