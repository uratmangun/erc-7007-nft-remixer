import Together from "together-ai";

const together = new Together({ apiKey: process.env.TOGETHER_API_KEY });

const response = await together.images.create({
    model: "black-forest-labs/FLUX.1-schnell-Free",
    prompt: "[]",
    width: 256,
    height: 256,
    steps: 1,
    n: 1,
    response_format: "base64"});
console.log(response.data[0].b64_json);