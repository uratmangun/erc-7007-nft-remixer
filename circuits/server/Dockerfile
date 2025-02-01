# Build stage
FROM node:18-slim as builder

# Install dependencies for circom
RUN apt-get update && \
    apt-get install -y \
    curl \
    build-essential \
    git \
    pkg-config \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Rust
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"

# Install circom
RUN git clone https://github.com/iden3/circom.git && \
    cd circom && \
    cargo build --release && \
    cargo install --path circom

# Install snarkjs globally
RUN npm install -g snarkjs

# Set up app directory
WORKDIR /usr/src/app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source
COPY . .

# Build circuit
WORKDIR /usr/src/app/circuits
RUN npm init -y && \
    npm install circomlib && \
    cp ../panda.circom . && \
    circom panda.circom --r1cs --wasm -l node_modules/circomlib/circuits && \
    snarkjs powersoftau new bn128 12 pot12_0000.ptau -v && \
    snarkjs powersoftau contribute pot12_0000.ptau pot12_0001.ptau --name="First contribution" -v -e="random text" && \
    snarkjs powersoftau prepare phase2 pot12_0001.ptau pot12_final.ptau -v && \
    snarkjs groth16 setup panda.r1cs pot12_final.ptau panda_0000.zkey && \
    snarkjs zkey contribute panda_0000.zkey panda.zkey --name="1st Contributor" -e="random text" && \
    snarkjs zkey export verificationkey panda.zkey verification_key.json

# Runtime stage
FROM oven/bun:1

# Install snarkjs globally
RUN bun install -g snarkjs

WORKDIR /app

# Create work directory
RUN mkdir work

# Copy package files and install production dependencies
COPY package*.json ./
RUN bun install --production

# Copy built files from builder
COPY --from=builder /usr/src/app/index.js .
COPY --from=builder /usr/src/app/circuits/panda_js ./panda_js
COPY --from=builder /usr/src/app/circuits/panda.r1cs .
COPY --from=builder /usr/src/app/circuits/panda.zkey .
COPY --from=builder /usr/src/app/circuits/verification_key.json .

EXPOSE 8084

CMD ["bun", "run", "index.js"]
