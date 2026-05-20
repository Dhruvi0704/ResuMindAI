"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateTFIDFSimilarity = calculateTFIDFSimilarity;
exports.getSemanticSimilarity = getSemanticSimilarity;
exports.generateHash = generateHash;
var generative_ai_1 = require("@google/generative-ai");
var apiKey = process.env.GEMINI_API_KEY;
var genAI = null;
if (apiKey) {
    genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
}
/**
 * Cleans text: lowercase, remove special chars, extra spaces.
 */
function cleanText(text) {
    if (!text)
        return "";
    return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}
/**
 * Calculates Term Frequency (TF)
 */
function getTermFrequency(words) {
    var tf = {};
    for (var _i = 0, words_1 = words; _i < words_1.length; _i++) {
        var word = words_1[_i];
        tf[word] = (tf[word] || 0) + 1;
    }
    var totalTerms = words.length;
    for (var word in tf) {
        tf[word] = tf[word] / totalTerms;
    }
    return tf;
}
/**
 * Calculates Inverse Document Frequency (IDF) - simplified for just 2 docs
 */
function getInverseDocumentFrequency(docsWords) {
    var idf = {};
    var totalDocs = docsWords.length;
    var allWords = Array.from(new Set(docsWords.flat()));
    for (var _i = 0, allWords_1 = allWords; _i < allWords_1.length; _i++) {
        var word = allWords_1[_i];
        var docCount = 0;
        for (var _a = 0, docsWords_1 = docsWords; _a < docsWords_1.length; _a++) {
            var doc = docsWords_1[_a];
            if (doc.includes(word))
                docCount++;
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
function calculateTFIDFSimilarity(doc1, doc2) {
    if (!doc1 || !doc2)
        return 0;
    var words1 = cleanText(doc1).split(" ");
    var words2 = cleanText(doc2).split(" ");
    if (words1.length === 0 || words2.length === 0)
        return 0;
    var tf1 = getTermFrequency(words1);
    var tf2 = getTermFrequency(words2);
    var idf = getInverseDocumentFrequency([words1, words2]);
    // Calculate TF-IDF vectors
    var vector1 = {};
    var vector2 = {};
    var allWords = Array.from(new Set(__spreadArray(__spreadArray([], words1, true), words2, true)));
    for (var _i = 0, allWords_2 = allWords; _i < allWords_2.length; _i++) {
        var word = allWords_2[_i];
        vector1[word] = (tf1[word] || 0) * (idf[word] || 0);
        vector2[word] = (tf2[word] || 0) * (idf[word] || 0);
    }
    // Calculate dot product
    var dotProduct = 0;
    var mag1 = 0;
    var mag2 = 0;
    for (var _a = 0, allWords_3 = allWords; _a < allWords_3.length; _a++) {
        var word = allWords_3[_a];
        dotProduct += vector1[word] * vector2[word];
        mag1 += vector1[word] * vector1[word];
        mag2 += vector2[word] * vector2[word];
    }
    mag1 = Math.sqrt(mag1);
    mag2 = Math.sqrt(mag2);
    if (mag1 === 0 || mag2 === 0)
        return 0;
    return dotProduct / (mag1 * mag2);
}
/**
 * Fetches text embeddings using Gemini and calculates cosine similarity.
 * Returns a value between 0 and 1.
 */
function getSemanticSimilarity(text1, text2) {
    return __awaiter(this, void 0, void 0, function () {
        var model, _a, result1, result2, vec1, vec2, error_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!genAI || !text1 || !text2)
                        return [2 /*return*/, calculateTFIDFSimilarity(text1, text2)];
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    model = genAI.getGenerativeModel({ model: "text-embedding-004" });
                    return [4 /*yield*/, Promise.all([
                            model.embedContent(text1.substring(0, 8000)), // Limit to avoid massive tokens
                            model.embedContent(text2.substring(0, 8000))
                        ])];
                case 2:
                    _a = _b.sent(), result1 = _a[0], result2 = _a[1];
                    vec1 = result1.embedding.values;
                    vec2 = result2.embedding.values;
                    return [2 /*return*/, calculateCosineSimilarity(vec1, vec2)];
                case 3:
                    error_1 = _b.sent();
                    console.error("Embedding API failed, falling back to TFIDF:", error_1);
                    return [2 /*return*/, calculateTFIDFSimilarity(text1, text2)]; // Fallback
                case 4: return [2 /*return*/];
            }
        });
    });
}
/**
 * Helper to calculate cosine similarity of two arrays of numbers.
 */
function calculateCosineSimilarity(vec1, vec2) {
    if (vec1.length !== vec2.length)
        return 0;
    var dotProduct = 0;
    var mag1 = 0;
    var mag2 = 0;
    for (var i = 0; i < vec1.length; i++) {
        dotProduct += vec1[i] * vec2[i];
        mag1 += vec1[i] * vec1[i];
        mag2 += vec2[i] * vec2[i];
    }
    mag1 = Math.sqrt(mag1);
    mag2 = Math.sqrt(mag2);
    if (mag1 === 0 || mag2 === 0)
        return 0;
    return dotProduct / (mag1 * mag2);
}
/**
 * Deterministic hash generator for caching results.
 */
function generateHash(str) {
    var hash = 0;
    for (var i = 0, len = str.length; i < len; i++) {
        var chr = str.charCodeAt(i);
        hash = (hash << 5) - hash + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash.toString();
}
