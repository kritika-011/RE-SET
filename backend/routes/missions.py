from collections import defaultdict
from datetime import datetime, timedelta, timezone
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.orm import Session

from database import get_db
from models import Mission, User

router = APIRouter()

MIN_MISSIONS_FOR_INSIGHTS = 3


class MissionCompleteRequest(BaseModel):
    user_id: int
    mood: Literal["overwhelmed", "exhausted", "bored", "stuck"]
    minutes: int = Field(gt=0, le=60)
    resetType: Literal["Quick Reset", "Standard Reset", "Deep Reset"]
    energy_before: int | None = Field(default=None, ge=1, le=5)
    stress_before: int | None = Field(default=None, ge=1, le=5)
    focus_before: int | None = Field(default=None, ge=1, le=5)
    goal: (
        Literal["calm", "energized", "clear", "focus", "stop_procrastinating", "break"]
        | None
    ) = None
    context: Literal["home", "campus", "work", "outdoors"] | None = None
    feedback: (
        Literal["much_better", "a_little_better", "about_the_same", "not_really"] | None
    ) = None
    energy_after: int | None = Field(default=None, ge=1, le=5)
    stress_after: int | None = Field(default=None, ge=1, le=5)
    focus_after: int | None = Field(default=None, ge=1, le=5)


class MissionHistoryItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    mood: str
    minutes: int
    resetType: str
    feedback: str | None = None
    completed_at: datetime


class MissionCompleteResponse(MissionHistoryItem):
    stress_change: int | None = None
    energy_change: int | None = None
    focus_change: int | None = None


class StreakResponse(BaseModel):
    streak: int


class InsightsResponse(BaseModel):
    totalResets: int
    currentStreak: int
    moodCounts: dict[str, int]
    mostCommonMood: str | None
    bestResetType: dict | None
    bestDuration: dict | None
    avgStressChange: float | None
    avgEnergyChange: float | None
    avgFocusChange: float | None
    hasEnoughData: bool
    patternInsight: str | None


def _calculate_streak(missions: list[Mission]) -> int:
    completed_dates = sorted({m.completed_at.date() for m in missions}, reverse=True)
    if not completed_dates:
        return 0

    today = datetime.now(timezone.utc).date()
    if completed_dates[0] < today - timedelta(days=1):
        return 0

    streak = 1
    for i in range(1, len(completed_dates)):
        if completed_dates[i - 1] - completed_dates[i] == timedelta(days=1):
            streak += 1
        else:
            break
    return streak


def _stress_change(m: Mission) -> int | None:
    if m.stress_before is None or m.stress_after is None:
        return None
    return m.stress_before - m.stress_after


def _energy_change(m: Mission) -> int | None:
    if m.energy_before is None or m.energy_after is None:
        return None
    return m.energy_after - m.energy_before


def _focus_change(m: Mission) -> int | None:
    if m.focus_before is None or m.focus_after is None:
        return None
    return m.focus_after - m.focus_before


def _avg(values: list[int]) -> float | None:
    return round(sum(values) / len(values), 2) if values else None


@router.post("/missions/complete", response_model=MissionCompleteResponse)
def complete_mission(payload: MissionCompleteRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == payload.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    mission = Mission(
        user_id=payload.user_id,
        mood=payload.mood,
        minutes=payload.minutes,
        resetType=payload.resetType,
        energy_before=payload.energy_before,
        stress_before=payload.stress_before,
        focus_before=payload.focus_before,
        goal=payload.goal,
        context=payload.context,
        feedback=payload.feedback,
        energy_after=payload.energy_after,
        stress_after=payload.stress_after,
        focus_after=payload.focus_after,
    )
    db.add(mission)
    db.commit()
    db.refresh(mission)

    return MissionCompleteResponse(
        id=mission.id,
        mood=mission.mood,
        minutes=mission.minutes,
        resetType=mission.resetType,
        feedback=mission.feedback,
        completed_at=mission.completed_at,
        stress_change=_stress_change(mission),
        energy_change=_energy_change(mission),
        focus_change=_focus_change(mission),
    )


@router.get("/missions/history/{user_id}", response_model=list[MissionHistoryItem])
def get_history(user_id: int, db: Session = Depends(get_db)):
    return (
        db.query(Mission)
        .filter(Mission.user_id == user_id)
        .order_by(Mission.completed_at.desc())
        .all()
    )


@router.get("/missions/streak/{user_id}", response_model=StreakResponse)
def get_streak(user_id: int, db: Session = Depends(get_db)):
    missions = db.query(Mission).filter(Mission.user_id == user_id).all()
    return StreakResponse(streak=_calculate_streak(missions))


@router.get("/missions/insights/{user_id}", response_model=InsightsResponse)
def get_insights(user_id: int, db: Session = Depends(get_db)):
    missions = db.query(Mission).filter(Mission.user_id == user_id).all()

    total = len(missions)
    streak = _calculate_streak(missions)

    mood_counts: dict[str, int] = defaultdict(int)
    for m in missions:
        mood_counts[m.mood] += 1
    most_common_mood = max(mood_counts, key=mood_counts.get) if mood_counts else None

    stress_by_reset_type: dict[str, list[int]] = defaultdict(list)
    stress_by_duration: dict[int, list[int]] = defaultdict(list)
    focus_by_reset_type: dict[str, list[int]] = defaultdict(list)
    all_stress_changes = []
    all_energy_changes = []
    all_focus_changes = []

    for m in missions:
        sc = _stress_change(m)
        ec = _energy_change(m)
        fc = _focus_change(m)
        if sc is not None:
            stress_by_reset_type[m.resetType].append(sc)
            stress_by_duration[m.minutes].append(sc)
            all_stress_changes.append(sc)
        if ec is not None:
            all_energy_changes.append(ec)
        if fc is not None:
            focus_by_reset_type[m.resetType].append(fc)
            all_focus_changes.append(fc)

    best_reset_type = None
    if stress_by_reset_type:
        best_type = max(stress_by_reset_type, key=lambda k: _avg(stress_by_reset_type[k]))
        best_reset_type = {
            "resetType": best_type,
            "avgStressChange": _avg(stress_by_reset_type[best_type]),
        }

    best_duration = None
    if stress_by_duration:
        best_minutes = max(stress_by_duration, key=lambda k: _avg(stress_by_duration[k]))
        best_duration = {
            "minutes": best_minutes,
            "avgStressChange": _avg(stress_by_duration[best_minutes]),
        }

    has_enough_data = total >= MIN_MISSIONS_FOR_INSIGHTS

    pattern_insight = None
    if has_enough_data and focus_by_reset_type:
        best_focus_type = max(focus_by_reset_type, key=lambda k: _avg(focus_by_reset_type[k]))
        best_focus_avg = _avg(focus_by_reset_type[best_focus_type])
        if best_focus_avg is not None and best_focus_avg > 0:
            pattern_insight = (
                f"Your history suggests {best_focus_type.lower()}s tend to produce "
                f"your biggest focus improvements (+{best_focus_avg} on average)."
            )

    return InsightsResponse(
        totalResets=total,
        currentStreak=streak,
        moodCounts=dict(mood_counts),
        mostCommonMood=most_common_mood,
        bestResetType=best_reset_type,
        bestDuration=best_duration,
        avgStressChange=_avg(all_stress_changes),
        avgEnergyChange=_avg(all_energy_changes),
        avgFocusChange=_avg(all_focus_changes),
        hasEnoughData=has_enough_data,
        patternInsight=pattern_insight,
    )
