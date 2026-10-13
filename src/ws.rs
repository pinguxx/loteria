use axum::extract::ws::{Message, WebSocket};
use futures_util::{SinkExt, StreamExt};
use serde::Deserialize;
use serde_json::{json, Value};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::{mpsc, RwLock};

use crate::cards::{get_card, Card};
use crate::game::{
    check_win_pattern, generate_random_tabla, generate_room_code, generate_shuffled_deck,
    GameSettings, Player, Room, RoomState, WinnerInfo,
};

pub type RoomSockets = HashMap<String, mpsc::UnboundedSender<Message>>;

#[derive(Clone)]
pub struct AppState {
    pub rooms: Arc<RwLock<HashMap<String, Room>>>,
    pub sockets: Arc<RwLock<HashMap<String, RoomSockets>>>,
}

impl AppState {
    pub fn new() -> Self {
        Self {
            rooms: Arc::new(RwLock::new(HashMap::new())),
            sockets: Arc::new(RwLock::new(HashMap::new())),
        }
    }
}


// Client Inbound Message Envelope
#[derive(Debug, Deserialize)]
#[serde(tag = "type")]
pub enum ClientMessage {
    #[serde(rename = "create_room")]
    CreateRoom {
        #[serde(rename = "playerName")]
        player_name: String,
        settings: Option<GameSettings>,
    },
    #[serde(rename = "join_room")]
    JoinRoom {
        #[serde(rename = "roomCode")]
        room_code: String,
        #[serde(rename = "playerName")]
        player_name: String,
    },
    #[serde(rename = "shuffle_tabla")]
    ShuffleTabla {
        #[serde(rename = "roomCode")]
        room_code: String,
    },
    #[serde(rename = "update_settings")]
    UpdateSettings {
        #[serde(rename = "roomCode")]
        room_code: String,
        settings: GameSettings,
    },
    #[serde(rename = "start_game")]
    StartGame {
        #[serde(rename = "roomCode")]
        room_code: String,
    },
    #[serde(rename = "manual_draw")]
    ManualDraw {
        #[serde(rename = "roomCode")]
        room_code: String,
    },
    #[serde(rename = "toggle_pause")]
    TogglePause {
        #[serde(rename = "roomCode")]
        room_code: String,
    },
    #[serde(rename = "toggle_bean")]
    ToggleBean {
        #[serde(rename = "roomCode")]
        room_code: String,
        #[serde(rename = "cardIndex")]
        card_index: u8,
    },
    #[serde(rename = "claim_loteria")]
    ClaimLoteria {
        #[serde(rename = "roomCode")]
        room_code: String,
    },
    #[serde(rename = "restart_round")]
    RestartRound {
        #[serde(rename = "roomCode")]
        room_code: String,
    },
    #[serde(rename = "send_reaction")]
    SendReaction {
        #[serde(rename = "roomCode")]
        room_code: String,
        emoji: String,
        #[serde(rename = "playerName")]
        player_name: String,
    },
}

// Helper to broadcast JSON events to all players in a room
pub async fn broadcast_event(state: &AppState, room_code: &str, event_name: &str, data: Value) {
    let msg = json!({
        "event": event_name,
        "data": data
    })
    .to_string();

    let sockets = state.sockets.read().await;
    if let Some(room_map) = sockets.get(room_code) {
        for tx in room_map.values() {
            let _ = tx.send(Message::Text(msg.clone()));
        }
    }
}

// Send JSON event directly to a single socket
pub fn send_event(tx: &mpsc::UnboundedSender<Message>, event_name: &str, data: Value) {
    let msg = json!({
        "event": event_name,
        "data": data
    })
    .to_string();
    let _ = tx.send(Message::Text(msg));
}

// Broadcast the current full room state
pub async fn broadcast_room_state(state: &AppState, room_code: &str) {
    let rooms = state.rooms.read().await;
    let room = match rooms.get(room_code) {
        Some(r) => r,
        None => return,
    };

    let sanitized_players = room.sanitize_players();
    let recent_cards: Vec<u8> = room.drawn_cards.iter().rev().take(6).copied().collect();
    let current_card_data: Option<&'static Card> = room.current_card.and_then(get_card);

    let state_payload = json!({
        "roomCode": room.code,
        "hostId": room.host_id,
        "state": match room.state {
            RoomState::Lobby => "lobby",
            RoomState::Playing => "playing",
            RoomState::Ended => "ended",
        },
        "settings": {
            "winPattern": room.settings.win_pattern,
            "callerMode": room.settings.caller_mode,
            "speedSeconds": room.settings.speed_seconds,
            "verseAudio": room.settings.verse_audio,
        },
        "players": sanitized_players,
        "currentCard": current_card_data,
        "drawnCount": room.drawn_cards.len(),
        "totalCards": 54,
        "recentCards": recent_cards,
        "winner": room.winner
    });

    drop(rooms);
    broadcast_event(state, room_code, "room_state", state_payload).await;
}

// Draw the next card in a room
pub async fn draw_next_card(state: &AppState, room_code: &str) -> bool {
    let mut rooms = state.rooms.write().await;
    let room = match rooms.get_mut(room_code) {
        Some(r) => r,
        None => return false,
    };

    if room.state != RoomState::Playing {
        return false;
    }

    if room.deck.is_empty() {
        room.state = RoomState::Ended;
        drop(rooms);
        broadcast_event(
            state,
            room_code,
            "deck_exhausted",
            json!({ "message": "¡Se acabaron las cartas del mazo!" }),
        )
        .await;
        broadcast_room_state(state, room_code).await;
        return false;
    }

    let next_card_id = room.deck.pop().unwrap();
    room.current_card = Some(next_card_id);
    room.drawn_cards.push(next_card_id);

    let card_data = get_card(next_card_id);
    let drawn_count = room.drawn_cards.len();
    let recent_cards: Vec<u8> = room.drawn_cards.iter().rev().take(6).copied().collect();

    drop(rooms);

    broadcast_event(
        state,
        room_code,
        "card_drawn",
        json!({
            "card": card_data,
            "drawnCount": drawn_count,
            "recentCards": recent_cards
        }),
    )
    .await;

    broadcast_room_state(state, room_code).await;
    true
}

// Start room game and spawn auto-draw task if mode is auto
pub async fn start_game_session(state: &AppState, room_code: &str) {
    let mut rooms = state.rooms.write().await;
    let room = match rooms.get_mut(room_code) {
        Some(r) => r,
        None => return,
    };

    room.state = RoomState::Playing;
    room.deck = generate_shuffled_deck();
    room.drawn_cards.clear();
    room.current_card = None;
    room.winner = None;
    room.game_generation += 1;

    for player in room.players.values_mut() {
        player.beans.clear();
    }

    let settings = room.settings.clone();
    let generation = room.game_generation;
    drop(rooms);

    broadcast_event(
        state,
        room_code,
        "game_started",
        json!({ "settings": settings }),
    )
    .await;

    broadcast_room_state(state, room_code).await;

    let state_clone = state.clone();
    let code_clone = room_code.to_string();

    tokio::spawn(async move {
        tokio::time::sleep(tokio::time::Duration::from_millis(1500)).await;

        // Verify generation before drawing first card
        {
            let rooms = state_clone.rooms.read().await;
            if let Some(r) = rooms.get(&code_clone) {
                if r.game_generation != generation || r.state != RoomState::Playing {
                    return;
                }
            } else {
                return;
            }
        }

        if !draw_next_card(&state_clone, &code_clone).await {
            return;
        }

        if settings.caller_mode == "auto" {
            let interval = tokio::time::Duration::from_secs(settings.speed_seconds.max(4));
            loop {
                tokio::time::sleep(interval).await;
                let rooms = state_clone.rooms.read().await;
                if let Some(r) = rooms.get(&code_clone) {
                    if r.game_generation != generation || r.state != RoomState::Playing {
                        break;
                    }
                } else {
                    break;
                }
                drop(rooms);

                if !draw_next_card(&state_clone, &code_clone).await {
                    break;
                }
            }
        }
    });
}

// WebSocket Connection Lifecycle Handler
pub async fn handle_ws_connection(socket: WebSocket, state: AppState) {
    let (mut ws_sender, mut ws_receiver) = socket.split();
    let (tx, mut rx) = mpsc::unbounded_channel::<Message>();

    // Forward outbound messages from channel to client
    let mut send_task = tokio::spawn(async move {
        while let Some(msg) = rx.recv().await {
            if ws_sender.send(msg).await.is_err() {
                break;
            }
        }
    });

    let conn_id = format!("{:x}", rand::random::<u128>());
    let mut current_room: Option<String> = None;

    // Process inbound messages from client
    let state_clone = state.clone();
    let conn_id_clone = conn_id.clone();
    let tx_clone = tx.clone();

    let mut recv_task = tokio::spawn(async move {
        while let Some(Ok(msg)) = ws_receiver.next().await {
            if let Message::Text(text) = msg {
                if let Ok(client_msg) = serde_json::from_str::<ClientMessage>(&text) {
                    match client_msg {
                        ClientMessage::CreateRoom {
                            player_name,
                            settings,
                        } => {
                            let mut code = generate_room_code();
                            {
                                let rooms = state_clone.rooms.read().await;
                                while rooms.contains_key(&code) {
                                    code = generate_room_code();
                                }
                            }

                            let room_settings = settings.unwrap_or_default();
                            let room = Room::new(
                                code.clone(),
                                conn_id_clone.clone(),
                                if player_name.trim().is_empty() {
                                    "Host".to_string()
                                } else {
                                    player_name.trim().to_string()
                                },
                                room_settings,
                            );

                            let player = room.players.get(&conn_id_clone).cloned().unwrap();

                            {
                                let mut rooms = state_clone.rooms.write().await;
                                rooms.insert(code.clone(), room);
                            }
                            {
                                let mut sockets = state_clone.sockets.write().await;
                                let room_sockets = sockets.entry(code.clone()).or_default();
                                room_sockets.insert(conn_id_clone.clone(), tx_clone.clone());
                            }

                            current_room = Some(code.clone());

                            send_event(
                                &tx_clone,
                                "room_created",
                                json!({
                                    "roomCode": code,
                                    "isHost": true,
                                    "player": player
                                }),
                            );

                            broadcast_room_state(&state_clone, &code).await;
                        }

                        ClientMessage::JoinRoom {
                            room_code,
                            player_name,
                        } => {
                            let code = room_code.trim().to_uppercase();
                            let mut rooms = state_clone.rooms.write().await;

                            if let Some(room) = rooms.get_mut(&code) {
                                if room.state == RoomState::Playing {
                                    send_event(
                                        &tx_clone,
                                        "join_error",
                                        json!({ "message": "The game is already in progress. Please wait for the next round." }),
                                    );
                                    continue;
                                }

                                let player_count = room.players.len();
                                let player = Player {
                                    id: conn_id_clone.clone(),
                                    name: if player_name.trim().is_empty() {
                                        format!("Player {}", player_count + 1)
                                    } else {
                                        player_name.trim().to_string()
                                    },
                                    tabla: generate_random_tabla(),
                                    beans: Vec::new(),
                                    wins: 0,
                                    ready: true,
                                };

                                let is_host = room.host_id == conn_id_clone;
                                room.players.insert(conn_id_clone.clone(), player.clone());
                                drop(rooms);

                                {
                                    let mut sockets = state_clone.sockets.write().await;
                                    let room_sockets = sockets.entry(code.clone()).or_default();
                                    room_sockets.insert(conn_id_clone.clone(), tx_clone.clone());
                                }

                                current_room = Some(code.clone());

                                send_event(
                                    &tx_clone,
                                    "joined_room",
                                    json!({
                                        "roomCode": code,
                                        "isHost": is_host,
                                        "player": player
                                    }),
                                );

                                broadcast_room_state(&state_clone, &code).await;
                            } else {
                                send_event(
                                    &tx_clone,
                                    "join_error",
                                    json!({ "message": "Room code not found." }),
                                );
                            }
                        }

                        ClientMessage::ShuffleTabla { room_code } => {
                            let mut rooms = state_clone.rooms.write().await;
                            if let Some(room) = rooms.get_mut(&room_code) {
                                if room.state == RoomState::Playing {
                                    continue;
                                }
                                if let Some(player) = room.players.get_mut(&conn_id_clone) {
                                    player.tabla = generate_random_tabla();
                                    player.beans.clear();
                                    let tabla = player.tabla;
                                    send_event(
                                        &tx_clone,
                                        "tabla_updated",
                                        json!({ "tabla": tabla }),
                                    );
                                }
                            }
                        }

                        ClientMessage::UpdateSettings {
                            room_code,
                            settings,
                        } => {
                            let mut rooms = state_clone.rooms.write().await;
                            if let Some(room) = rooms.get_mut(&room_code) {
                                if room.host_id == conn_id_clone {
                                    room.settings = settings;
                                    drop(rooms);
                                    broadcast_room_state(&state_clone, &room_code).await;
                                }
                            }
                        }

                        ClientMessage::StartGame { room_code } => {
                            let rooms = state_clone.rooms.read().await;
                            let is_host = rooms
                                .get(&room_code)
                                .map(|r| r.host_id == conn_id_clone)
                                .unwrap_or(false);
                            drop(rooms);

                            if is_host {
                                start_game_session(&state_clone, &room_code).await;
                            }
                        }

                        ClientMessage::ManualDraw { room_code } => {
                            let rooms = state_clone.rooms.read().await;
                            let is_host = rooms
                                .get(&room_code)
                                .map(|r| r.host_id == conn_id_clone)
                                .unwrap_or(false);
                            drop(rooms);

                            if is_host {
                                draw_next_card(&state_clone, &room_code).await;
                            }
                        }

                        ClientMessage::TogglePause { room_code } => {
                            let mut rooms = state_clone.rooms.write().await;
                            if let Some(room) = rooms.get_mut(&room_code) {
                                if room.host_id == conn_id_clone && room.state == RoomState::Playing {
                                    // Bump generation to pause any running background auto task
                                    room.game_generation += 1;
                                    drop(rooms);
                                    broadcast_event(
                                        &state_clone,
                                        &room_code,
                                        "game_paused",
                                        json!({ "isPaused": true }),
                                    )
                                    .await;
                                }
                            }
                        }

                        ClientMessage::ToggleBean {
                            room_code,
                            card_index,
                        } => {
                            let mut rooms = state_clone.rooms.write().await;
                            if let Some(room) = rooms.get_mut(&room_code) {
                                if let Some(player) = room.players.get_mut(&conn_id_clone) {
                                    if let Some(pos) =
                                        player.beans.iter().position(|&i| i == card_index)
                                    {
                                        player.beans.remove(pos);
                                    } else {
                                        player.beans.push(card_index);
                                    }
                                    drop(rooms);
                                    broadcast_room_state(&state_clone, &room_code).await;
                                }
                            }
                        }

                        ClientMessage::ClaimLoteria { room_code } => {
                            let mut rooms = state_clone.rooms.write().await;
                            if let Some(room) = rooms.get_mut(&room_code) {
                                if room.state != RoomState::Playing {
                                    continue;
                                }

                                if let Some(player) = room.players.get_mut(&conn_id_clone) {
                                    let is_valid = check_win_pattern(
                                        &player.tabla,
                                        &room.drawn_cards,
                                        &room.settings.win_pattern,
                                    );

                                    if is_valid {
                                        room.state = RoomState::Ended;
                                        room.game_generation += 1;
                                        player.wins += 1;

                                        let winner_info = WinnerInfo {
                                            id: player.id.clone(),
                                            name: player.name.clone(),
                                            tabla: player.tabla,
                                            win_pattern: room.settings.win_pattern.clone(),
                                        };
                                        room.winner = Some(winner_info.clone());

                                        let winner_name = player.name.clone();
                                        drop(rooms);

                                        broadcast_event(
                                            &state_clone,
                                            &room_code,
                                            "loteria_winner",
                                            json!({
                                                "winner": winner_info,
                                                "message": format!("¡{} has won shouting LOTERÍA!", winner_name)
                                            }),
                                        )
                                        .await;

                                        broadcast_room_state(&state_clone, &room_code).await;
                                    } else {
                                        let player_name = player.name.clone();
                                        drop(rooms);

                                        send_event(
                                            &tx_clone,
                                            "false_loteria",
                                            json!({
                                                "message": "Wait! You haven't completed the required pattern yet or marked uncalled cards."
                                            }),
                                        );

                                        broadcast_event(
                                            &state_clone,
                                            &room_code,
                                            "false_claim_alert",
                                            json!({ "playerName": player_name }),
                                        )
                                        .await;
                                    }
                                }
                            }
                        }

                        ClientMessage::RestartRound { room_code } => {
                            let rooms = state_clone.rooms.read().await;
                            let is_host = rooms
                                .get(&room_code)
                                .map(|r| r.host_id == conn_id_clone)
                                .unwrap_or(false);
                            drop(rooms);

                            if is_host {
                                start_game_session(&state_clone, &room_code).await;
                            }
                        }

                        ClientMessage::SendReaction {
                            room_code,
                            emoji,
                            player_name,
                        } => {
                            let reaction_id = format!("{:x}", rand::random::<u64>());
                            broadcast_event(
                                &state_clone,
                                &room_code,
                                "new_reaction",
                                json!({
                                    "emoji": emoji,
                                    "sender": player_name,
                                    "id": reaction_id
                                }),
                            )
                            .await;
                        }
                    }
                }
            }
        }

        // Handle disconnect
        if let Some(code) = current_room {
            let mut rooms = state_clone.rooms.write().await;
            if let Some(room) = rooms.get_mut(&code) {
                room.players.remove(&conn_id_clone);
                if room.players.is_empty() {
                    rooms.remove(&code);
                } else if room.host_id == conn_id_clone {
                    // Elect new host
                    let next_host = room.players.keys().next().cloned().unwrap();
                    room.host_id = next_host;
                }
            }
            drop(rooms);

            {
                let mut sockets = state_clone.sockets.write().await;
                if let Some(room_sockets) = sockets.get_mut(&code) {
                    room_sockets.remove(&conn_id_clone);
                    if room_sockets.is_empty() {
                        sockets.remove(&code);
                    }
                }
            }

            broadcast_room_state(&state_clone, &code).await;
        }
    });

    // Wait until either sending or receiving terminates
    tokio::select! {
        _ = (&mut send_task) => recv_task.abort(),
        _ = (&mut recv_task) => send_task.abort(),
    };
}
