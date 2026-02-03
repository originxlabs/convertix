use std::net::TcpStream;
use std::time::Duration;

pub async fn is_online() -> bool {
    tokio::task::spawn_blocking(|| {
        TcpStream::connect_timeout(
            &"1.1.1.1:53".parse().unwrap(),
            Duration::from_millis(800)
        ).is_ok()
    })
    .await
    .unwrap_or(false)
}
