import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
let genAI: GoogleGenerativeAI | null = null;
if (apiKey) {
  genAI = new GoogleGenerativeAI(apiKey);
}

/**
 * Cleans text: lowercase, remove special chars, extra spaces.
 */
function cleanText(text: string): string {
  if (!text) return "";
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Calculates Term Frequency (TF)
 */
function getTermFrequency(words: string[]): Record<string, number> {
  const tf: Record<string, number> = {};
  for (const word of words) {
    tf[word] = (tf[word] || 0) + 1;
  }
  const totalTerms = words.length;
  for (const word in tf) {
    tf[word] = tf[word] / totalTerms;
  }
  return tf;
}

/**
 * Calculates Inverse Document Frequency (IDF) - simplified for just 2 docs
 */
function getInverseDocumentFrequency(docsWords: string[][]): Record<string, number> {
  const idf: Record<string, number> = {};
  const totalDocs = docsWords.length;
  
  const allWords = Array.from(new Set(docsWords.flat()));
  for (const word of allWords) {
    let docCount = 0;
    for (const doc of docsWords) {
      if (doc.includes(word)) docCount++;
    }
    // Add 1 to avoid division by zero and smooth it
    idf[word] = Math.log((totalDocs) / (docCount));
  }
  return idf;
}

/**
 * Calculates Cosine Similarity between two text blocks based on TF-IDF.
 * Useful for experience/project text matching vs JD.
 */
export function calculateTFIDFSimilarity(doc1: string, doc2: string): number {
  if (!doc1 || !doc2) return 0;
  
  const words1 = cleanText(doc1).split(" ");
  const words2 = cleanText(doc2).split(" ");
  
  if (words1.length === 0 || words2.length === 0) return 0;

  const tf1 = getTermFrequency(words1);
  const tf2 = getTermFrequency(words2);
  
  const idf = getInverseDocumentFrequency([words1, words2]);

  // Calculate TF-IDF vectors
  const vector1: Record<string, number> = {};
  const vector2: Record<string, number> = {};
  
  const allWords = Array.from(new Set([...words1, ...words2]));
  for (const word of allWords) {
    vector1[word] = (tf1[word] || 0) * (idf[word] || 0);
    vector2[word] = (tf2[word] || 0) * (idf[word] || 0);
  }

  // Calculate dot product
  let dotProduct = 0;
  let mag1 = 0;
  let mag2 = 0;
  
  for (const word of allWords) {
    dotProduct += vector1[word] * vector2[word];
    mag1 += vector1[word] * vector1[word];
    mag2 += vector2[word] * vector2[word];
  }
  
  mag1 = Math.sqrt(mag1);
  mag2 = Math.sqrt(mag2);
  
  if (mag1 === 0 || mag2 === 0) return 0;
  
  return dotProduct / (mag1 * mag2);
}

/**
 * Fetches text embeddings using Gemini and calculates cosine similarity.
 * Returns a value between 0 and 1.
 */
export async function getSemanticSimilarity(text1: string, text2: string): Promise<number> {
  if (!genAI || !text1 || !text2) return calculateTFIDFSimilarity(text1, text2);
  
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
    
    // Batch request for both embeddings
    const [result1, result2] = await Promise.all([
      model.embedContent(text1.substring(0, 4000) ), // Limit to avoid massive tokens
      model.embedContent(text2.substring(0, 4000) )
    ]);
    
    const vec1 = result1.embedding.values;
    const vec2 = result2.embedding.values;
    
    return calculateCosineSimilarity(vec1, vec2);
  } catch (error) {
    console.error("Embedding API failed, falling back to TFIDF:", error);
    return calculateTFIDFSimilarity(text1, text2); // Fallback
  }
}

/**
 * Helper to calculate cosine similarity of two arrays of numbers.
 */
function calculateCosineSimilarity(vec1: number[], vec2: number[]): number {
  if (vec1.length !== vec2.length) return 0;
  
  let dotProduct = 0;
  let mag1 = 0;
  let mag2 = 0;
  
  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    mag1 += vec1[i] * vec1[i];
    mag2 += vec2[i] * vec2[i];
  }
  
  mag1 = Math.sqrt(mag1);
  mag2 = Math.sqrt(mag2);
  
  if (mag1 === 0 || mag2 === 0) return 0;
  return dotProduct / (mag1 * mag2);
}

/**
 * Deterministic hash generator for caching results.
 */
export function generateHash(str: string): string {
  let hash = 0;
  for (let i = 0, len = str.length; i < len; i++) {
    let chr = str.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash.toString();
}
