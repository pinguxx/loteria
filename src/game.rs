use rand::seq::SliceRandom;
use rand::Rng;
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GameSettings {
    #[serde(default = "default_win_pattern")]
    pub win_pattern: String, // "full", "line", "four_corners", "center"
    #[serde(default = "default_caller_mode")]
    pub caller_mode: String, // "auto", "manual"
    #[serde(default = "default_speed_seconds")]
    pub speed_seconds: u64, // e.g. 7
    #[serde(default = "default_verse_audio")]
    pub verse_audio: bool,
}

fn default_win_pattern() -> String {
    "full".to_string()
}
fn default_caller_mode() -> String {
    "auto".to_string()
}
fn default_speed_seconds() -> u64 {
    7
}
fn default_verse_audio() -> bool {
    true
}

impl Default for GameSettings {
    fn default() -> Self {
        Self {
            win_pattern: default_win_pattern(),
            caller_mode: default_caller_mode(),
            speed_seconds: default_speed_seconds(),
            verse_audio: default_verse_audio(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Player {
    pub id: String,
    pub name: String,
    pub tabla: [u8; 16],
    pub beans: Vec<u8>,
    pub wins: u32,
    pub ready: bool,
    #[serde(default = "default_connected")]
    pub connected: bool,
    #[serde(default)]
    pub conn_id: String,
}

fn default_connected() -> bool {
    true
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum RoomState {
    Lobby,
    Playing,
    Ended,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WinnerInfo {
    pub id: String,
    pub name: String,
    pub tabla: [u8; 16],
    pub win_pattern: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SanitizedPlayer {
    pub id: String,
    pub name: String,
    #[serde(rename = "isHost")]
    pub is_host: bool,
    #[serde(rename = "beansCount")]
    pub beans_count: usize,
    pub wins: u32,
    pub ready: bool,
    pub connected: bool,
}

#[derive(Debug, Clone)]
pub struct Room {
    pub code: String,
    pub host_id: String,
    pub state: RoomState,
    pub settings: GameSettings,
    pub deck: Vec<u8>,
    pub drawn_cards: Vec<u8>,
    pub current_card: Option<u8>,
    pub winner: Option<WinnerInfo>,
    pub players: HashMap<String, Player>,
    // Generation counter used to cancel old game loops when starting new games/rounds
    pub game_generation: u64,
}

impl Room {
    pub fn new(code: String, host_id: String, host_name: String, settings: GameSettings) -> Self {
        let mut players = HashMap::new();
        let host_player = Player {
            id: host_id.clone(),
            name: host_name,
            tabla: generate_random_tabla(),
            beans: Vec::new(),
            wins: 0,
            ready: true,
            connected: true,
            conn_id: host_id.clone(),
        };
        players.insert(host_id.clone(), host_player);

        Self {
            code,
            host_id,
            state: RoomState::Lobby,
            settings,
            deck: Vec::new(),
            drawn_cards: Vec::new(),
            current_card: None,
            winner: None,
            players,
            game_generation: 0,
        }
    }

    pub fn sanitize_players(&self) -> Vec<SanitizedPlayer> {
        self.players
            .values()
            .map(|p| SanitizedPlayer {
                id: p.id.clone(),
                name: p.name.clone(),
                is_host: p.id == self.host_id,
                beans_count: p.beans.len(),
                wins: p.wins,
                ready: p.ready,
                connected: p.connected,
            })
            .collect()
    }
}


pub fn generate_room_code() -> String {
    const CHARS: &[u8] = b"ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let mut rng = rand::thread_rng();
    (0..5)
        .map(|_| {
            let idx = rng.gen_range(0..CHARS.len());
            CHARS[idx] as char
        })
        .collect()
}

pub fn generate_random_tabla() -> [u8; 16] {
    let mut ids: Vec<u8> = (1..=54).collect();
    let mut rng = rand::thread_rng();
    ids.shuffle(&mut rng);
    let mut tabla = [0u8; 16];
    tabla.copy_from_slice(&ids[..16]);
    tabla
}

pub fn generate_shuffled_deck() -> Vec<u8> {
    let mut ids: Vec<u8> = (1..=54).collect();
    let mut rng = rand::thread_rng();
    ids.shuffle(&mut rng);
    ids
}

pub fn check_win_pattern(tabla: &[u8; 16], drawn_cards: &[u8], win_pattern: &str) -> bool {
    let drawn_set: HashSet<u8> = drawn_cards.iter().copied().collect();
    let is_marked = |r: usize, c: usize| -> bool { drawn_set.contains(&tabla[r * 4 + c]) };

    match win_pattern {
        "full" => (0..16).all(|i| drawn_set.contains(&tabla[i])),
        "four_corners" => is_marked(0, 0) && is_marked(0, 3) && is_marked(3, 0) && is_marked(3, 3),
        "center" => is_marked(1, 1) && is_marked(1, 2) && is_marked(2, 1) && is_marked(2, 2),
        "line" => {
            // Horizontal rows (4)
            for r in 0..4 {
                if is_marked(r, 0) && is_marked(r, 1) && is_marked(r, 2) && is_marked(r, 3) {
                    return true;
                }
            }
            // Vertical cols (4)
            for c in 0..4 {
                if is_marked(0, c) && is_marked(1, c) && is_marked(2, c) && is_marked(3, c) {
                    return true;
                }
            }
            // Diagonal top-left to bottom-right
            if is_marked(0, 0) && is_marked(1, 1) && is_marked(2, 2) && is_marked(3, 3) {
                return true;
            }
            // Diagonal top-right to bottom-left
            if is_marked(0, 3) && is_marked(1, 2) && is_marked(2, 1) && is_marked(3, 0) {
                return true;
            }
            false
        }
        _ => false,
    }
}
