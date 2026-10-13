mod cards;
mod game;
mod ws;

use axum::extract::{State, WebSocketUpgrade};
use axum::response::{IntoResponse, Json};
use axum::routing::get;
use axum::Router;
use std::net::SocketAddr;
use tower_http::cors::{Any, CorsLayer};
use tower_http::services::ServeDir;

use crate::cards::CARDS;
use crate::ws::{handle_ws_connection, AppState};

async fn get_cards_api() -> impl IntoResponse {
    Json(&CARDS[..])
}

async fn ws_handler(
    ws: WebSocketUpgrade,
    State(state): State<AppState>,
) -> impl IntoResponse {
    ws.on_upgrade(move |socket| handle_ws_connection(socket, state))
}

#[tokio::main]
async fn main() {
    let port = std::env::var("PORT")
        .ok()
        .and_then(|p| p.parse::<u16>().ok())
        .unwrap_or(3000);

    let state = AppState::new();

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let app = Router::new()
        .route("/api/cards", get(get_cards_api))
        .route("/ws", get(ws_handler))
        .fallback_service(ServeDir::new("public"))
        .layer(cors)
        .with_state(state);

    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();

    println!("\n========================================");
    println!("🦀 LOTERÍA MEXICANA ONLINE (RUST) 🇲🇽");
    println!("========================================");
    println!("> Local:   http://localhost:{}", port);
    println!("> Server:  http://0.0.0.0:{}", port);
    println!("========================================\n");

    axum::serve(listener, app).await.unwrap();
}
