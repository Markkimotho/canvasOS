"""
CanvasOS AI Gateway — Local Stable Diffusion inference via FastAPI.
Provides a compatible API for the @canvasos/ai LocalProvider.
"""
from __future__ import annotations

import base64
import io
import logging
import os
from typing import Optional

import torch
from diffusers import (
    StableDiffusionPipeline,
    StableDiffusionInpaintPipeline,
    AutoPipelineForText2Image,
)
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from pydantic import BaseModel, Field

logger = logging.getLogger("ai-gateway")
logging.basicConfig(level=logging.INFO)

app = FastAPI(title="CanvasOS AI Gateway", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tightened via env in production
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Model management
# ---------------------------------------------------------------------------

DEVICE = "mps" if torch.backends.mps.is_available() else ("cuda" if torch.cuda.is_available() else "cpu")
DEFAULT_MODEL = os.getenv("SD_MODEL", "stabilityai/stable-diffusion-2-1")

_txt2img_pipe: Optional[StableDiffusionPipeline] = None
_inpaint_pipe: Optional[StableDiffusionInpaintPipeline] = None


def get_txt2img() -> StableDiffusionPipeline:
    global _txt2img_pipe
    if _txt2img_pipe is None:
        logger.info("Loading txt2img model %s on %s …", DEFAULT_MODEL, DEVICE)
        _txt2img_pipe = AutoPipelineForText2Image.from_pretrained(
            DEFAULT_MODEL,
            torch_dtype=torch.float16 if DEVICE != "cpu" else torch.float32,
        ).to(DEVICE)
    return _txt2img_pipe


def get_inpaint() -> StableDiffusionInpaintPipeline:
    global _inpaint_pipe
    if _inpaint_pipe is None:
        inpaint_model = os.getenv("SD_INPAINT_MODEL", "stabilityai/stable-diffusion-2-inpainting")
        logger.info("Loading inpaint model %s on %s …", inpaint_model, DEVICE)
        _inpaint_pipe = StableDiffusionInpaintPipeline.from_pretrained(
            inpaint_model,
            torch_dtype=torch.float16 if DEVICE != "cpu" else torch.float32,
        ).to(DEVICE)
    return _inpaint_pipe


# ---------------------------------------------------------------------------
# Request / response schemas
# ---------------------------------------------------------------------------


class GenerateRequest(BaseModel):
    prompt: str
    negative_prompt: str = ""
    width: int = Field(512, ge=64, le=2048)
    height: int = Field(512, ge=64, le=2048)
    n: int = Field(1, ge=1, le=8)
    seed: Optional[int] = None
    num_inference_steps: int = Field(30, ge=1, le=150)
    guidance_scale: float = Field(7.5, ge=1.0, le=30.0)


class InpaintRequest(BaseModel):
    prompt: str
    negative_prompt: str = ""
    image_b64: str  # base64 PNG
    mask_b64: str   # base64 PNG — white = inpaint region
    width: int = Field(512, ge=64, le=2048)
    height: int = Field(512, ge=64, le=2048)
    seed: Optional[int] = None
    num_inference_steps: int = Field(30, ge=1, le=150)
    guidance_scale: float = Field(7.5, ge=1.0, le=30.0)


class ImageResult(BaseModel):
    b64: str


class GenerateResponse(BaseModel):
    images: list[ImageResult]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _b64_to_pil(b64: str) -> Image.Image:
    data = base64.b64decode(b64)
    return Image.open(io.BytesIO(data)).convert("RGB")


def _pil_to_b64(img: Image.Image) -> str:
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode()


def _generator(seed: Optional[int]):
    if seed is None:
        return None
    return torch.Generator(device=DEVICE).manual_seed(seed)


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@app.get("/health")
def health():
    return {"status": "ok", "device": DEVICE}


@app.post("/generate", response_model=GenerateResponse)
def generate(req: GenerateRequest):
    try:
        pipe = get_txt2img()
        generator = _generator(req.seed)
        result = pipe(
            prompt=req.prompt,
            negative_prompt=req.negative_prompt,
            width=req.width,
            height=req.height,
            num_images_per_prompt=req.n,
            num_inference_steps=req.num_inference_steps,
            guidance_scale=req.guidance_scale,
            generator=generator,
        )
        return GenerateResponse(images=[ImageResult(b64=_pil_to_b64(img)) for img in result.images])
    except Exception as exc:
        logger.error("Generate failed: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/inpaint", response_model=GenerateResponse)
def inpaint(req: InpaintRequest):
    try:
        pipe = get_inpaint()
        init_image = _b64_to_pil(req.image_b64).resize((req.width, req.height))
        mask_image = Image.open(io.BytesIO(base64.b64decode(req.mask_b64))).convert("L").resize((req.width, req.height))
        generator = _generator(req.seed)
        result = pipe(
            prompt=req.prompt,
            negative_prompt=req.negative_prompt,
            image=init_image,
            mask_image=mask_image,
            num_inference_steps=req.num_inference_steps,
            guidance_scale=req.guidance_scale,
            generator=generator,
        )
        return GenerateResponse(images=[ImageResult(b64=_pil_to_b64(img)) for img in result.images])
    except Exception as exc:
        logger.error("Inpaint failed: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc)) from exc


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", "8001")))
