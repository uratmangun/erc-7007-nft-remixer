use actix_web::{web, App, HttpResponse, HttpServer, Responder};
use ark_bls12_381::{Bls12_381, Fr};
use ark_ff::PrimeField;
use ark_groth16::{Groth16, Proof, ProvingKey, VerifyingKey};
use ark_relations::r1cs::{ConstraintSynthesizer, ConstraintSystem, SynthesisError};
use ark_serialize::{CanonicalSerialize, CanonicalDeserialize};
use serde::{Deserialize, Serialize};
use std::io::Cursor;
use sha3::{Digest, Keccak256};
use rand::thread_rng;

// Define your circuit
#[derive(Clone)]
struct MyCircuit {
    prompt: Option<Fr>,
    image: Option<Fr>,
    author: Option<Fr>,
    request_id: Option<Fr>,
}

impl ConstraintSynthesizer<Fr> for MyCircuit {
    fn generate_constraints(self, cs: &mut ark_relations::r1cs::ConstraintSystemRef<Fr>) -> Result<(), SynthesisError> {
        let prompt = cs.new_witness_variable(|| self.prompt.ok_or(SynthesisError::AssignmentMissing))?;
        let image = cs.new_witness_variable(|| self.image.ok_or(SynthesisError::AssignmentMissing))?;
        let author = cs.new_witness_variable(|| self.author.ok_or(SynthesisError::AssignmentMissing))?;
        let request_id = cs.new_input_variable(|| self.request_id.ok_or(SynthesisError::AssignmentMissing))?;

        // Example constraint: prompt + image + author = request_id
        cs.enforce_constraint(
            lc!() + prompt + image + author,
            lc!() + CS::one(),
            lc!() + request_id,
        )?;

        Ok(())
    }
}

#[derive(Serialize, Deserialize)]
struct ProofResponse {
    proof: Vec<u8>,
    public_inputs: Vec<u8>,
}

#[derive(Serialize, Deserialize)]
struct Inputs {
    prompt: String,
    image: String,
    author: String,
    request_id: String,
}

fn generate_circuit_proof(inputs: &Inputs) -> Result<Proof<Bls12_381>, Box<dyn std::error::Error>> {
    let rng = &mut thread_rng();

    // Convert inputs to field elements
    let prompt = Fr::from_str(&inputs.prompt).unwrap();
    let image = Fr::from_str(&inputs.image).unwrap();
    let author = Fr::from_str(&inputs.author).unwrap();
    let request_id = Fr::from_str(&inputs.request_id).unwrap();

    // Create the circuit
    let circuit = MyCircuit {
        prompt: Some(prompt),
        image: Some(image),
        author: Some(author),
        request_id: Some(request_id),
    };

    // Generate proving and verifying keys
    let params = Groth16::<Bls12_381>::generate_random_parameters(circuit.clone(), rng)?;

    // Generate the proof
    let proof = Groth16::<Bls12_381>::create_random_proof(circuit, &params, rng)?;

    Ok(proof)
}

fn serialize_proof(proof: &Proof<Bls12_381>) -> Vec<u8> {
    let mut serialized = Vec::new();
    proof.serialize_uncompressed(&mut serialized).unwrap();
    serialized
}

fn serialize_public_inputs(public_inputs: &[Fr]) -> Vec<u8> {
    let mut serialized = Vec::new();
    for input in public_inputs {
        input.serialize_uncompressed(&mut serialized).unwrap();
    }
    serialized
}

fn hash_inputs(prompt: &str, aigc_data: &AIGCData) -> Vec<u8> {
    let mut hasher = Keccak256::new();
    hasher.update(prompt.as_bytes());
    hasher.update(&aigc_data.image);
    hasher.update(aigc_data.author.as_bytes());
    hasher.update(&aigc_data.request_id.to_be_bytes());
    hasher.finalize().to_vec()
}

#[derive(Serialize, Deserialize)]
struct AIGCData {
    image: Vec<u8>,
    author: String,
    request_id: u64,
}

async fn generate_proof(inputs: web::Json<Inputs>) -> impl Responder {
    match generate_circuit_proof(&inputs.into_inner()) {
        Ok(proof) => {
            // Serialize the proof and public inputs
            let proof_bytes = serialize_proof(&proof);
            let public_inputs_bytes = serialize_public_inputs(&[Fr::from_str(&inputs.request_id).unwrap()]);

            // Return the serialized data
            HttpResponse::Ok().json(ProofResponse {
                proof: proof_bytes,
                public_inputs: public_inputs_bytes,
            })
        }
        Err(err) => HttpResponse::InternalServerError().body(format!("Error generating proof: {}", err)),
    }
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    println!("Starting server on http://127.0.0.1:8084");
    // Start the web server
    HttpServer::new(|| {
        App::new()
            .route("/generate-proof", web::post().to(generate_proof))
    })
    .bind("127.0.0.1:8084")?
    .run()
    .await
}
