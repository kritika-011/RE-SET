import logging
from typing import Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from mission_generator import generate_mission

logger = logging.getLogger(__name__)

router = APIRouter()


class MissionRequest(BaseModel):
    mood: Literal["overwhelmed", "exhausted", "bored", "stuck"]
    minutes: int = Field(gt=0, le=60)


class MissionStep(BaseModel):
    clue: str = Field(min_length=1)


class MissionResponse(BaseModel):
    steps: list[MissionStep] = Field(min_length=1)
    estimatedMinutes: int


@router.post("/generate-mission", response_model=MissionResponse)
def generate_mission_endpoint(payload: MissionRequest):
    try:
        return generate_mission(payload.mood, payload.minutes)
    except Exception as exc:
        logger.exception(
            "Unhandled error generating mission mood=%s minutes=%s",
            payload.mood,
            payload.minutes,
        )
        raise HTTPException(
            status_code=500,
            detail="Failed to generate mission. Please try again.",
        ) from exc
