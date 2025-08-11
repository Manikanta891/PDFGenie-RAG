// Utility functions for chunking, embedding, and similarity search
const axios = require('axios');

// Split text into chunks of ~512 tokens (approx 2000 chars)
function chunkText(text, maxChunkSize = 2000) {
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    chunks.push(text.slice(start, start + maxChunkSize));
    start += maxChunkSize;
  }
  return chunks;
}

// Call Vertex AI Embedding API for a batch of texts
async function getEmbeddings(texts, apiKey, projectId, location = 'us-central1') {
  // Vertex AI endpoint for text embedding (adjust as needed)
  const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/textembedding-gecko:predict`;
  const responses = [];
  for (const text of texts) {
    const res = await axios.post(
      url,
      { instances: [{ content: text }] },
      { headers: { 'Authorization': `Bearer ${apiKey}` } }
    );
    responses.push(res.data.predictions[0].embeddings.values);
  }
  return responses;
}

// Compute cosine similarity between two vectors
function cosineSimilarity(vecA, vecB) {
  const dot = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const normA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const normB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dot / (normA * normB);
}

// Find top N most similar chunks
function findMostSimilarChunks(questionEmbedding, chunkEmbeddings, topN = 5) {
  const similarities = chunkEmbeddings.map((emb, idx) => ({
    idx,
    score: cosineSimilarity(questionEmbedding, emb)
  }));
  similarities.sort((a, b) => b.score - a.score);
  return similarities.slice(0, topN).map(s => s.idx);
}

module.exports = {
  chunkText,
  getEmbeddings,
  cosineSimilarity,
  findMostSimilarChunks
};
