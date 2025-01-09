use axum::{ 
    routing::{get, post},
    Router, Json,
};
use serde::{Serialize, Deserialize};
use std::net::SocketAddr;
use tokio_postgres::{NoTls, Error};
use dotenv::dotenv;
use std::env;
use tower_http::cors::{Any, CorsLayer};

#[derive(Serialize)]
struct Provider {
    id: i32,
    medical_condition: String,
    doctor: String,
    hospital: String,
    insurance_provider: String,
    location: String,
}
#[derive(Deserialize)]
#[derive(Debug)]
struct AppointmentData {
    full_name: String,
    age: i32,
    gender: String,
    blood_group: String,
    phone_number: String,
    email: String,
    urgency: String,
    medical_condition: String,
    doctor: String,
    hospital: String,
    insurance_provider: String,
}

#[tokio::main]
async fn main() -> Result<(), Error> {
    dotenv().ok(); // Load .env file

    // Retrieve database URL from environment variables
    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");

    // Set up database connection
    let (client, connection) = tokio_postgres::connect(&database_url, NoTls).await?;
    tokio::spawn(async move {
        if let Err(e) = connection.await {
            eprintln!("connection error: {}", e);
        }
    });

    // Set up CORS
    let cors = CorsLayer::new()
        .allow_origin(Any) // Allow requests from any origin
        .allow_methods(Any) // Allow all HTTP methods (GET, POST, etc.)
        .allow_headers(Any); // Allow all headers

    // Define the routes
    let app = Router::new()
        .route("/api/providers", get(get_providers))
        .route("/api/save_appointment", post(save_appointment)) // Added POST route for saving appointments
        .layer(cors); // Attach the CORS layer

    // Define the server address
    let addr = SocketAddr::from(([127, 0, 0, 1], 3000));
    println!("Server running at http://{}", addr);

    // Run the server
    axum::Server::bind(&addr)
        .serve(app.into_make_service())
        .await
        .unwrap();

    Ok(())
}

// Fetch the provider data from the database
async fn get_providers() -> Json<Vec<Provider>> {
    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let (client, connection) = tokio_postgres::connect(&database_url, NoTls)
        .await
        .expect("Failed to connect to database");

    tokio::spawn(async move {
        if let Err(e) = connection.await {
            eprintln!("connection error: {}", e);
        }
    });

    let rows = client
        .query("SELECT * FROM healthcare_providers", &[]) // Adjusted table name
        .await
        .expect("Failed to fetch data");

    let providers: Vec<Provider> = rows
        .iter()
        .map(|row| Provider {
            id: row.get(0),
            medical_condition: row.get(1),
            doctor: row.get(2),
            hospital: row.get(3),
            insurance_provider: row.get(4),
            location: row.get(5),
        })
        .collect();

    Json(providers)
}

// Save appointment data into the database
async fn save_appointment(Json(payload): Json<AppointmentData>) -> Json<String> {
    println!("Received payload: {:?}", payload); // Debugging the incoming payload
    
    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let (client, connection) = tokio_postgres::connect(&database_url, NoTls)
        .await
        .expect("Failed to connect to database");

    tokio::spawn(async move {
        if let Err(e) = connection.await {
            eprintln!("connection error: {}", e);
        }
    });

    let query = r#"
        INSERT INTO save_health (
            full_name, age, gender, blood_group, phone_number, email, urgency,
            medical_condition, doctor, hospital, insurance_provider
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    "#;

    // Printing the query and payload for debugging
    println!("Executing query with values: 
        {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}", 
        payload.full_name,
        payload.age,
        payload.gender,
        payload.blood_group,
        payload.phone_number,
        payload.email,
        payload.urgency,
        payload.medical_condition,
        payload.doctor,
        payload.hospital,
        payload.insurance_provider);

    let result = client
        .execute(
            query,
            &[ 
                &payload.full_name,
                &payload.age,
                &payload.gender,
                &payload.blood_group,
                &payload.phone_number,
                &payload.email,
                &payload.urgency,
                &payload.medical_condition,
                &payload.doctor,
                &payload.hospital,
                &payload.insurance_provider,
            ],
        )
        .await;

    match result {
        Ok(rows_affected) => {
            println!("Rows affected: {}", rows_affected);
            Json("Appointment saved successfully".to_string())
        }
        Err(err) => {
            eprintln!("Error saving appointment: {:?}", err);
            Json(format!("Error saving appointment: {}", err))
        }
    }
}

