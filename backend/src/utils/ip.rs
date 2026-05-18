use axum::http::HeaderMap;
use std::net::{IpAddr, SocketAddr};

pub fn ft_get_ip(headers: &HeaderMap, socket: SocketAddr) -> IpAddr {

    if let Some(forwarded) = headers.get("x-forwarded-for") {
        if let Ok(value) = forwarded.to_str() {
            if let Some(first_ip) = value.split(",").next() {
                if let Ok(ip) = first_ip.trim().parse::<IpAddr>() {
                    return ip
                }
            }
        }
    }

    if let Some(real_ip) = headers.get("x-real-ip") {
        if let Ok(value) = real_ip.to_str() {
            if let Ok(ip) = value.parse::<IpAddr>() {
                return ip
            }
        }
    }
    
    socket.ip()
}