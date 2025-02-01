import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const execAsync = promisify(exec)
const app = new Hono()
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Ensure work directory exists
await fs.mkdir('work', { recursive: true })

// Helper function to convert hex to decimal string
function hexToDec(hex) {
  return BigInt(hex).toString()
}

app.post('/proof', async (c) => {
  try {
    const body = await c.req.json()
    const { prompt, aigc_data } = body
    const { image, author, request_id } = aigc_data

    // Convert hex strings to field elements
    const inputs = {
      prompt: hexToDec(prompt),
      image: hexToDec(image),
      author: hexToDec(author),
      requestId: hexToDec(request_id)
    }

    // Write input to file
    await fs.writeFile('work/input.json', JSON.stringify(inputs))

    // Create a CommonJS version of witness calculator
    const wcContent = await fs.readFile('panda_js/witness_calculator.js', 'utf8')
    const esWcContent = `
      const builder = async function (code, options) {
        ${wcContent.split('module.exports = async function builder(code, options) {')[1]}
      export default builder;
    `
    await fs.writeFile('work/witness_calculator.js', esWcContent)

    // Create a temporary witness generation script that uses ES modules
    const witnessGenScript = `
      import { readFileSync, writeFileSync } from 'fs';
      import { join } from 'path';
      import { fileURLToPath } from 'url';
      import { dirname } from 'path';
      
      const __dirname = dirname(fileURLToPath(import.meta.url));
      
      const wasmPath = process.argv[2];
      const inputPath = process.argv[3];
      const wtnsPath = process.argv[4];
      
      const wc = await import('./witness_calculator.js');
      const buffer = readFileSync(wasmPath);
      const input = JSON.parse(readFileSync(inputPath, 'utf8'));
      
      const calculator = await wc.default(buffer);
      const wtns = await calculator.calculateWTNSBin(input, 0);
      
      writeFileSync(wtnsPath, Buffer.from(wtns));
    `;

    await fs.writeFile('work/generate_witness.js', witnessGenScript)

    // Generate witness
    await execAsync('node work/generate_witness.js panda_js/panda.wasm work/input.json work/witness.wtns')

    // Generate proof
    await execAsync('snarkjs groth16 prove panda.zkey work/witness.wtns work/proof.json work/public.json')

    // Verify the proof
    await execAsync('snarkjs groth16 verify verification_key.json work/public.json work/proof.json')

    // Read the generated proof and public inputs
    const proof = JSON.parse(await fs.readFile('work/proof.json', 'utf-8'))
    const publicInputs = JSON.parse(await fs.readFile('work/public.json', 'utf-8'))

    return c.json({
      public_hash: publicInputs.publicSignals[0],
      proof: JSON.stringify(proof, null, 1),
      public_inputs: publicInputs.publicSignals,
      verified: true
    })
  } catch (error) {
    console.error('Error generating proof:', error)
    return c.json({ error: error.message }, 500)
  }
})

app.post('/verify', async (c) => {
  try {
    const { proof, public_inputs } = await c.req.json()

    // Write proof and public inputs to files
    await fs.writeFile('work/proof.json', JSON.stringify(proof))
    await fs.writeFile('work/public.json', JSON.stringify({ publicSignals: public_inputs }))

    try {
      await execAsync('snarkjs groth16 verify verification_key.json work/public.json work/proof.json')
      return c.json({ verified: true })
    } catch (error) {
      console.error('Verification failed:', error)
      return c.json({ verified: false, error: 'Verification failed' })
    }
  } catch (error) {
    console.error('Error in verification:', error)
    return c.json({ error: error.message }, 500)
  }
})

const port = 8084
console.log(`Server is running on port ${port}`)

serve({
  fetch: app.fetch,
  port
})
