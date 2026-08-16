from fastapi import APIRouter

from mission_generator import GEMINI_API_KEY

router = APIRouter()


@router.get("/health")
def health():
    return {"status": "ok", "gemini_configured": bool(GEMINI_API_KEY)}
