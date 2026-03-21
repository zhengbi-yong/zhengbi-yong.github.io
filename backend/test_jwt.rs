use blog_core::auth::JwtService;

fn main() {
    let jwt = JwtService::new("secret-number-1-32-chars-long!!");
    match jwt {
        Ok(_) => println!("JwtService created successfully"),
        Err(e) => println!("Failed to create JwtService: {:?}", e),
    }
}
