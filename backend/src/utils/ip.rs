use axum::http::HeaderMap;
use std::net::{IpAddr, SocketAddr};

pub fn ft_get_ip(headers: &HeaderMap, socket: SocketAddr) -> IpAddr {
    maybe_x_forwarded_for(headers)
        .or_else(|| maybe_x_real_ip(headers))
        .unwrap_or_else(|| socket.ip())
}

const X_REAL_IP: &str = "x-real-ip";
const X_FORWARDED_FOR: &str = "x-forwarded-for";

fn maybe_x_forwarded_for(headers: &HeaderMap) -> Option<IpAddr> {
    headers
        .get(X_FORWARDED_FOR)
        .and_then(|hv| hv.to_str().ok())
        .and_then(|s| s.split(',').find_map(|s| s.trim().parse::<IpAddr>().ok()))
}

fn maybe_x_real_ip(headers: &HeaderMap) -> Option<IpAddr> {
    headers
        .get(X_REAL_IP)
        .and_then(|hv| hv.to_str().ok())
        .and_then(|s| s.parse::<IpAddr>().ok())
}
