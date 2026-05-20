#!/usr/bin/env python3
"""
ATS Semantic Analysis Microservice
Uses Sentence-BERT (SBERT) for semantic similarity analysis
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from sentence_transformers import SentenceTransformer
import logging
import sys

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Global model variable
model = None
MODEL_NAME = 'sentence-transformers/all-MiniLM-L6-v2'


def load_model():
    """Load the SBERT model on startup"""
    global model
    try:
        logger.info(f"Loading SBERT model: {MODEL_NAME}")
        logger.info("This may take a few minutes on first run (downloading ~500MB)...")
        model = SentenceTransformer(MODEL_NAME)
        logger.info("✓ Model loaded successfully!")
        return True
    except Exception as e:
        logger.error(f"Failed to load model: {str(e)}")
        return False


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    if model is None:
        return jsonify({
            'status': 'unhealthy',
            'error': 'Model not loaded'
        }), 503
    
    return jsonify({
        'status': 'healthy',
        'model': MODEL_NAME,
        'ready': True
    }), 200


@app.route('/embeddings', methods=['POST'])
def get_embeddings():
    """
    Generate SBERT embeddings for input texts
    
    Request body:
    {
        "inputs": ["text1", "text2", ...]
    }
    
    Response:
    [
        [0.123, 0.456, ...],  // 384-dimensional embedding for text1
        [0.789, 0.012, ...]   // 384-dimensional embedding for text2
    ]
    """
    if model is None:
        return jsonify({
            'error': 'Model not loaded. Please restart the service.'
        }), 503
    
    try:
        # Get input texts from request
        data = request.get_json()
        
        if not data or 'inputs' not in data:
            return jsonify({
                'error': 'Missing "inputs" field in request body'
            }), 400
        
        inputs = data['inputs']
        
        if not isinstance(inputs, list):
            return jsonify({
                'error': '"inputs" must be a list of strings'
            }), 400
        
        if len(inputs) == 0:
            return jsonify({
                'error': '"inputs" list cannot be empty'
            }), 400
        
        # Validate all inputs are strings
        if not all(isinstance(text, str) for text in inputs):
            return jsonify({
                'error': 'All inputs must be strings'
            }), 400
        
        # Log request
        logger.info(f"Generating embeddings for {len(inputs)} text(s)")
        logger.debug(f"Text lengths: {[len(text) for text in inputs]}")
        
        # Generate embeddings
        embeddings = model.encode(inputs, convert_to_numpy=True)
        
        # Convert to list for JSON serialization
        embeddings_list = embeddings.tolist()
        
        logger.info(f"✓ Generated {len(embeddings_list)} embeddings")
        
        return jsonify(embeddings_list), 200
        
    except Exception as e:
        logger.error(f"Error generating embeddings: {str(e)}")
        return jsonify({
            'error': f'Failed to generate embeddings: {str(e)}'
        }), 500


@app.route('/', methods=['GET'])
def index():
    """Root endpoint with service information"""
    return jsonify({
        'service': 'ATS Semantic Analysis Service',
        'model': MODEL_NAME,
        'version': '1.0.0',
        'endpoints': {
            'health': '/health',
            'embeddings': '/embeddings (POST)'
        }
    }), 200


if __name__ == '__main__':
    # Load model on startup
    logger.info("=" * 60)
    logger.info("ATS Semantic Analysis Microservice")
    logger.info("=" * 60)
    
    if not load_model():
        logger.error("Failed to load model. Exiting.")
        sys.exit(1)
    
    # Start Flask server
    logger.info("Starting Flask server on http://localhost:5001")
    logger.info("Press CTRL+C to stop the server")
    logger.info("=" * 60)
    
    app.run(
        host='0.0.0.0',
        port=5001,
        debug=False,  # Set to True for development
        threaded=True
    )
