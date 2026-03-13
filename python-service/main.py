from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import torch
import clip
from PIL import Image
import requests
import io
import os
import logging
from contextlib import asynccontextmanager

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load CLIP model on startup
model = None
preprocess = None
device = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global model, preprocess, device
    device = "cuda" if torch.cuda.is_available() else "cpu"
    logger.info(f"Loading CLIP model on {device}...")
    model, preprocess = clip.load("ViT-B/32", device=device)
    logger.info("CLIP model loaded.")
    yield

app = FastAPI(title="GDG TechChallenge CLIP Service", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict to your Vercel domain in production
    allow_methods=["POST"],
    allow_headers=["*"],
)

def load_image_from_url(url: str) -> Image.Image:
    """Download image from URL."""
    resp = requests.get(url, timeout=15)
    resp.raise_for_status()
    return Image.open(io.BytesIO(resp.content)).convert("RGB")

def compute_embedding(image: Image.Image) -> torch.Tensor:
    """Compute CLIP image embedding."""
    with torch.no_grad():
        tensor = preprocess(image).unsqueeze(0).to(device)
        features = model.encode_image(tensor)
        features = features / features.norm(dim=-1, keepdim=True)  # Normalize
    return features

def cosine_similarity(a: torch.Tensor, b: torch.Tensor) -> float:
    """Compute cosine similarity between two normalized embeddings."""
    return float((a * b).sum().item())

@app.get("/health")
async def health():
    return {"status": "ok", "device": device, "model": "ViT-B/32"}

@app.post("/compare")
async def compare_images(
    file: UploadFile = File(...),
    reference_url: str = Form(...)
):
    """
    Compare an uploaded image against a reference image URL.
    Returns a similarity score between 0.0 and 1.0.
    """
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")

    # Validate uploaded file
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File exceeds 5MB limit")

    try:
        # Load uploaded image
        uploaded_image = Image.open(io.BytesIO(contents)).convert("RGB")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image: {e}")

    try:
        # Load reference image from URL
        reference_image = load_image_from_url(reference_url)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to fetch reference image: {e}")

    try:
        uploaded_emb = compute_embedding(uploaded_image)
        reference_emb = compute_embedding(reference_image)
        similarity = cosine_similarity(uploaded_emb, reference_emb)

        # CLIP cosine similarity ranges from -1 to 1; clamp and normalize to [0, 1]
        similarity = max(0.0, min(1.0, (similarity + 1) / 2))

        logger.info(f"Similarity: {similarity:.4f}")
        return {
            "similarity": round(similarity, 4),
            "passed": similarity >= float(os.getenv("SIMILARITY_THRESHOLD", "0.80"))
        }
    except Exception as e:
        logger.error(f"Embedding error: {e}")
        raise HTTPException(status_code=500, detail="Failed to compute similarity")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", "8000")))
