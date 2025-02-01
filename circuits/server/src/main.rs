use actix_web::{web, App, HttpServer, HttpResponse, Responder};
use serde::{Deserialize, Serialize};
use log::{info, error};
use num_bigint::BigInt;
use poseidon_rs::{Poseidon, Fr};
use ff_ce::PrimeField;
use hex;
use std::process::Command;
use serde_json::json;
use std::fs;

#[derive(Debug, Serialize, Deserialize)]
struct AIGCData {
    image: String,
    author: String,    // Ethereum address as hex string
    request_id: String, // uint256 as hex string
}

#[derive(Debug, Serialize, Deserialize)]
struct ProofInput {
    prompt: String,
    aigc_data: AIGCData,
}

#[derive(Debug, Serialize)]
struct ProofResponse {
    public_hash: String,
    proof: String,
    public_inputs: Vec<String>,
    verified: bool,  // Add verification status
}

#[derive(Debug, Serialize, Deserialize)]
struct ProofData {
    #[serde(rename = "pi_a")]
    pi_a: Vec<String>,
    #[serde(rename = "pi_b")]
    pi_b: Vec<Vec<String>>,
    #[serde(rename = "pi_c")]
    pi_c: Vec<String>,
    protocol: String,
    curve: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct VerificationRequest {
    proof: ProofData,
    public_inputs: Vec<String>,
}

#[derive(Debug, Serialize)]
struct VerificationResponse {
    verified: bool,
    error: Option<String>,
}

async fn generate_proof(input: &[Fr]) -> Result<(String, bool), String> {  // Modified return type to include verification status
    info!("Generating proof for inputs: {:?}", input);

    // Ensure work directory exists
    if !std::path::Path::new("work").exists() {
        fs::create_dir("work").map_err(|e| format!("Failed to create work directory: {}", e))?;
    }

    // Create input JSON for the circuit - ensure proper hex formatting
    let prompt_hex = input[0].to_string()
        .trim_matches('"')
        .trim_start_matches("Fr(0x")
        .trim_end_matches(')')
        .to_string();
    
    let image_hex = input[1].to_string()
        .trim_matches('"')
        .trim_start_matches("Fr(0x")
        .trim_end_matches(')')
        .to_string();

    let author_hex = input[2].to_string()
        .trim_matches('"')
        .trim_start_matches("Fr(0x")
        .trim_end_matches(')')
        .to_string();

    let request_id_hex = input[3].to_string()
        .trim_matches('"')
        .trim_start_matches("Fr(0x")
        .trim_end_matches(')')
        .to_string();

    // Ensure hex strings are properly formatted (64 characters) with 0x prefix
    let prompt_hex = format!("0x{:0>64}", prompt_hex.trim_start_matches("0x"));
    let image_hex = format!("0x{:0>64}", image_hex.trim_start_matches("0x"));
    let author_hex = format!("0x{:0>64}", author_hex.trim_start_matches("0x"));
    let request_id_hex = format!("0x{:0>64}", request_id_hex.trim_start_matches("0x"));

    let input_json = json!({
        "prompt": prompt_hex,
        "image": image_hex,
        "author": author_hex,
        "requestId": request_id_hex
    });

    info!("Writing input to work/input.json: {}", input_json);

    // Write input to a temporary file
    fs::write("work/input.json", input_json.to_string())
        .map_err(|e| format!("Failed to write input file: {}", e))?;

    // Check if required files exist
    if !std::path::Path::new("panda_js/panda.wasm").exists() {
        return Err("panda.wasm not found. Please ensure circuit is compiled".to_string());
    }

    // Generate witness using panda.wasm with increased memory and detailed error logging
    info!("Generating witness using panda.wasm");
    let output = Command::new("node")
        .args(&[
            "--max-old-space-size=8192",  // Increased memory
            "panda_js/generate_witness.js",
            "panda_js/panda.wasm",
            "work/input.json",
            "work/witness.wtns"
        ])
        .output()
        .map_err(|e| format!("Failed to execute witness generation: {}", e))?;

    if !output.status.success() {
        error!("Witness generation stderr: {}", String::from_utf8_lossy(&output.stderr));
        error!("Witness generation stdout: {}", String::from_utf8_lossy(&output.stdout));
        return Err(format!("Witness generation failed: {}", String::from_utf8_lossy(&output.stderr)));
    }

    info!("Generating proof using snarkjs");
    // Check if zkey exists
    if !std::path::Path::new("panda.zkey").exists() {
        return Err("panda.zkey not found. Please ensure trusted setup is complete".to_string());
    }

    // Generate proof using snarkjs
    let output = Command::new("snarkjs")
        .args(&[
            "groth16",
            "prove",
            "panda.zkey",
            "work/witness.wtns",
            "work/proof.json",
            "work/public.json"
        ])
        .output()
        .map_err(|e| format!("Failed to generate proof: {}", e))?;

    if !output.status.success() {
        error!("Proof generation stderr: {}", String::from_utf8_lossy(&output.stderr));
        error!("Proof generation stdout: {}", String::from_utf8_lossy(&output.stdout));
        return Err(format!("Proof generation failed: {}", String::from_utf8_lossy(&output.stderr)));
    }

    // Verify the proof
    info!("Verifying proof");
    if !std::path::Path::new("verification_key.json").exists() {
        return Err("verification_key.json not found. Please ensure verification key is present".to_string());
    }

    let verify_output = Command::new("snarkjs")
        .args(&[
            "groth16",
            "verify",
            "verification_key.json",
            "work/public.json",
            "work/proof.json"
        ])
        .output()
        .map_err(|e| format!("Failed to verify proof: {}", e))?;

    let is_verified = verify_output.status.success();
    if !is_verified {
        error!("Proof verification failed");
        error!("Verification stderr: {}", String::from_utf8_lossy(&verify_output.stderr));
        error!("Verification stdout: {}", String::from_utf8_lossy(&verify_output.stdout));
    }

    info!("Reading proof from work/proof.json");
    // Read and return the proof
    let proof = fs::read_to_string("work/proof.json")
        .map_err(|e| format!("Failed to read proof: {}", e))?;

    Ok((proof, is_verified))
}

async fn calculate_proof(input: web::Json<ProofInput>) -> impl Responder {
    info!("Received proof request: {:?}", input);

    // Initialize Poseidon hasher
    let poseidon = Poseidon::new();
    
    // Helper function to calculate hash
    fn calculate_hash(input: &str, poseidon: &Poseidon) -> Result<Fr, String> {
        // Convert hex string to BigInt
        let input_hex = if input.starts_with("0x") {
            &input[2..]
        } else {
            input
        };
        
        let input_bigint = BigInt::parse_bytes(input_hex.as_bytes(), 16)
            .ok_or_else(|| format!("Failed to parse input as BigInt: {}", input_hex))?;
        
        // Convert to field element
        let input_fr = Fr::from_str(&input_bigint.to_string())
            .ok_or_else(|| format!("Failed to convert to field element"))?;
        
        // Calculate hash
        let hash = poseidon.hash(vec![input_fr])
            .map_err(|e| format!("Failed to calculate hash: {}", e))?;
        
        Ok(hash)
    }
    
    // Calculate hash for prompt
    let prompt_fr = match calculate_hash(&input.prompt, &poseidon) {
        Ok(fr) => fr,
        Err(e) => {
            error!("Failed to calculate prompt hash: {}", e);
            return HttpResponse::BadRequest().body(format!("Failed to calculate prompt hash: {}", e));
        }
    };
    
    // Calculate hash for image
    let image_fr = match calculate_hash(&input.aigc_data.image, &poseidon) {
        Ok(fr) => fr,
        Err(e) => {
            error!("Failed to calculate image hash: {}", e);
            return HttpResponse::BadRequest().body(format!("Failed to calculate image hash: {}", e));
        }
    };

    // Calculate hash for author
    let author_fr = match calculate_hash(&input.aigc_data.author, &poseidon) {
        Ok(fr) => fr,
        Err(e) => {
            error!("Failed to calculate author hash: {}", e);
            return HttpResponse::BadRequest().body(format!("Failed to calculate author hash: {}", e));
        }
    };

    // Calculate hash for request_id
    let request_id_fr = match calculate_hash(&input.aigc_data.request_id, &poseidon) {
        Ok(fr) => fr,
        Err(e) => {
            error!("Failed to calculate request_id hash: {}", e);
            return HttpResponse::BadRequest().body(format!("Failed to calculate request_id hash: {}", e));
        }
    };
    
    // First calculate hash of AIGCData (image, author, requestId)
    let aigc_inputs = vec![image_fr, author_fr, request_id_fr];
    let aigc_hash = match poseidon.hash(aigc_inputs) {
        Ok(hash) => hash,
        Err(e) => {
            error!("Failed to calculate AIGC hash: {}", e);
            return HttpResponse::BadRequest().body(format!("Failed to calculate AIGC hash: {}", e));
        }
    };

    // Then calculate final public hash (hash of prompt and aigcData hash)
    let final_inputs = vec![prompt_fr, aigc_hash];
    let public_hash = match poseidon.hash(final_inputs) {
        Ok(hash) => hash,
        Err(e) => {
            error!("Failed to calculate public hash: {}", e);
            return HttpResponse::BadRequest().body(format!("Failed to calculate public hash: {}", e));
        }
    };

    // Convert public hash to hex string with 0x prefix
    let public_hash_hex = format!("0x{}", hex::encode(public_hash.to_string().as_bytes()));
    
    // Generate ZK proof
    let (proof, is_verified) = match generate_proof(&[prompt_fr, image_fr, author_fr, request_id_fr]).await {
        Ok((p, v)) => (p, v),
        Err(e) => {
            error!("Failed to generate proof: {}", e);
            return HttpResponse::InternalServerError().body(format!("Failed to generate proof: {}", e));
        }
    };
    
    let response = ProofResponse {
        public_hash: public_hash_hex.clone(),
        proof,
        public_inputs: vec![public_hash_hex],
        verified: is_verified,
    };
    
    HttpResponse::Ok().json(response)
}

async fn verify_proof(input: web::Json<VerificationRequest>) -> impl Responder {
    info!("Received verification request");

    // Create temporary files for proof and public inputs
    if !std::path::Path::new("work").exists() {
        if let Err(e) = fs::create_dir("work") {
            error!("Failed to create work directory: {}", e);
            return HttpResponse::InternalServerError().body(format!("Failed to create work directory: {}", e));
        }
    }

    // Parse the proof data
    let proof_json = serde_json::json!({
        "pi_a": input.proof.pi_a,
        "pi_b": input.proof.pi_b,
        "pi_c": input.proof.pi_c,
        "protocol": input.proof.protocol,
        "curve": input.proof.curve
    });

    info!("Writing proof to file: {}", proof_json.to_string());
    if let Err(e) = fs::write("work/proof.json", proof_json.to_string()) {
        error!("Failed to write proof file: {}", e);
        return HttpResponse::InternalServerError().body(format!("Failed to write proof file: {}", e));
    }

    // Write public inputs to file
    let public_inputs_json = json!({
        "publicSignals": input.public_inputs
    });
    info!("Writing public inputs to file: {}", public_inputs_json.to_string());
    if let Err(e) = fs::write("work/public.json", public_inputs_json.to_string()) {
        error!("Failed to write public inputs file: {}", e);
        return HttpResponse::InternalServerError().body(format!("Failed to write public inputs file: {}", e));
    }

    // Check if verification key exists
    if !std::path::Path::new("verification_key.json").exists() {
        error!("Verification key not found");
        return HttpResponse::BadRequest().json(VerificationResponse {
            verified: false,
            error: Some("verification_key.json not found".to_string()),
        });
    }

    // Verify the proof
    let verify_output = match Command::new("snarkjs")
        .args(&[
            "groth16",
            "verify",
            "verification_key.json",
            "work/public.json",
            "work/proof.json"
        ])
        .output() {
            Ok(output) => output,
            Err(e) => {
                error!("Failed to execute verification command: {}", e);
                return HttpResponse::InternalServerError().json(VerificationResponse {
                    verified: false,
                    error: Some(format!("Failed to execute verification command: {}", e)),
                });
            }
        };

    let is_verified = verify_output.status.success();
    let error_message = if !is_verified {
        let stderr = String::from_utf8_lossy(&verify_output.stderr);
        let stdout = String::from_utf8_lossy(&verify_output.stdout);
        error!("Proof verification failed");
        error!("Verification stderr: {}", stderr);
        error!("Verification stdout: {}", stdout);
        Some(format!("Verification failed: {}", stderr))
    } else {
        None
    };

    HttpResponse::Ok().json(VerificationResponse {
        verified: is_verified,
        error: error_message,
    })
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    env_logger::init();
    
    info!("Starting server at http://0.0.0.0:8084");
    info!("Checking directory contents:");
    if let Ok(entries) = fs::read_dir(".") {
        for entry in entries {
            if let Ok(entry) = entry {
                info!("Found: {:?}", entry.path());
            }
        }
    }
    
    let server = HttpServer::new(|| {
        App::new()
            .route("/proof", web::post().to(calculate_proof))
            .route("/verify", web::post().to(verify_proof))
    })
    .bind("0.0.0.0:8084")
    .map_err(|e| {
        error!("Failed to bind to port 8084: {}", e);
        e
    })?;

    info!("Server bound successfully to port 8084");
    
    server.run()
        .await
        .map_err(|e| {
            error!("Server error: {}", e);
            e
        })
}