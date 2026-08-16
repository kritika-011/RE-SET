import logging
from typing import Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from mission_generator import generate_mission, reroll_clue

logger = logging.getLogger(__name__)

router = APIRouter()


class MissionRequest(BaseModel):
    mood: Literal["overwhelmed", "exhausted", "bored", "stuck"]
    minutes: int = Field(gt=0, le=60)
    energy: int | None = Field(default=None, ge=1, le=5)
    stress: int | None = Field(default=None, ge=1, le=5)
    focus: int | None = Field(default=None, ge=1, le=5)
    goal: (
        Literal["calm", "energized", "clear", "focus", "stop_procrastinating", "break"]
        | None
    ) = None
    context: Literal["home", "campus", "work", "outdoors"] | None = None
    stuckActivity: (
        Literal["coding", "studying", "assignment", "work", "cant_start", "overwhelmed"]
        | None
    ) = None


class MissionStep(BaseModel):
    clue: str = Field(min_length=1)


class MissionResponse(BaseModel):
    steps: list[MissionStep] = Field(min_length=1)
    estimatedMinutes: int
    resetType: Literal["Quick Reset", "Standard Reset", "Deep Reset"]


class RerollRequest(BaseModel):
    mood: Literal["overwhelmed", "exhausted", "bored", "stuck"]
    originalClue: str = Field(min_length=1)


class RerollResponse(BaseModel):
    clue: str = Field(min_length=1)


@router.post("/generate-mission", response_model=MissionResponse)
def generate_mission_endpoint(payload: MissionRequest):
    try:
        return generate_mission(
            payload.mood,
            payload.minutes,
            energy=payload.energy,
            stress=payload.stress,
            focus=payload.focus,
            goal=payload.goal,
            context=payload.context,
            stuck_activity=payload.stuckActivity,
        )
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


@router.post("/generate-mission/reroll-step", response_model=RerollResponse)
def reroll_step_endpoint(payload: RerollRequest):
    try:
        return reroll_clue(payload.mood, payload.originalClue)
    except Exception as exc:
        logger.exception("Unhandled error rerolling clue mood=%s", payload.mood)
        raise HTTPException(
            status_code=500,
            detail="Failed to reroll clue. Please try again.",
        ) from exc
