import json
import logging
import os
import re
from concurrent.futures import ThreadPoolExecutor
from concurrent.futures import TimeoutError as FutureTimeoutError

import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise RuntimeError(
        "GEMINI_API_KEY is not set. Add it to backend/.env before starting the app."
    )

genai.configure(api_key=GEMINI_API_KEY)

MODEL_NAME = "gemini-flash-latest"
REQUEST_TIMEOUT_SECONDS = 15

_executor = ThreadPoolExecutor(max_workers=4)

MOOD_STYLES = {
    "overwhelmed": (
        "quiet, green spaces, a slower pace, and include exactly one pause step "
        "where they stand or sit still."
    ),
    "exhausted": (
        "a short distance, spots with sunlight, light easy activity, and one "
        "simple visual challenge (something to spot or notice)."
    ),
    "bored": (
        "unfamiliar streets, a discovery/observation challenge, and one "
        "photo-style prompt (something to notice as if framing a photo)."
    ),
    "stuck": (
        "sensory prompts involving colors or sounds, and one light creative task."
    ),
}

FALLBACK_MISSIONS = {
    "overwhelmed": {
        "steps": [
            {"clue": "Walk toward the nearest patch of green — a tree, a park, a strip of grass."},
            {"clue": "Take the quieter of two possible routes, even if it's slightly longer."},
            {"clue": "Find somewhere to sit or stand still for 60 seconds and just breathe."},
            {"clue": "Walk back a different way than you came."},
        ],
        "estimatedMinutes": 15,
    },
    "exhausted": {
        "steps": [
            {"clue": "Step outside and find a spot in direct sunlight."},
            {"clue": "Walk to the nearest corner or landmark, no further."},
            {"clue": "Spot three things that are the same color."},
            {"clue": "Head back at an easy, unhurried pace."},
        ],
        "estimatedMinutes": 10,
    },
    "bored": {
        "steps": [
            {"clue": "Turn down a street you don't normally walk on."},
            {"clue": "Find something you've never noticed before on this block."},
            {"clue": "Imagine framing a photo of the most interesting thing you see — don't take it, just notice it."},
            {"clue": "Take a different route back than the one you came from."},
        ],
        "estimatedMinutes": 15,
    },
    "stuck": {
        "steps": [
            {"clue": "Step outside and name the first three colors you notice."},
            {"clue": "Stand still and listen for the farthest sound you can hear."},
            {"clue": "Pick a small object nearby and invent an unlikely backstory for it."},
            {"clue": "Walk for two minutes without deciding the route in advance — just turn when it feels right."},
        ],
        "estimatedMinutes": 10,
    },
}


def _build_prompt(mood: str, minutes: int, strict: bool = False) -> str:
    style = MOOD_STYLES[mood]
    strict_instruction = (
        "\nIMPORTANT: Your entire response must be a single valid JSON object and "
        "nothing else. No markdown, no code fences, no commentary, no leading or "
        "trailing text of any kind."
        if strict
        else ""
    )
    return f"""You are generating a short outdoor movement mission for a mental reset app.

Mood: {mood}
Minutes available: {minutes}
Route style for this mood: {style}

Generate 3-5 short, real-world walking/movement challenges appropriate for someone
feeling "{mood}" with {minutes} minutes available, following the route style above.

Return ONLY valid JSON, with no markdown formatting and no explanation, in exactly
this shape:

{{
  "steps": [{{"clue": "..."}}],
  "estimatedMinutes": {minutes}
}}{strict_instruction}
"""


def _strip_code_fences(text: str) -> str:
    cleaned = text.strip()
    cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
    cleaned = re.sub(r"\s*```$", "", cleaned)
    return cleaned.strip()


def _call_gemini(prompt: str) -> str:
    model = genai.GenerativeModel(MODEL_NAME)
    response = model.generate_content(prompt)
    return response.text


def _call_gemini_with_timeout(prompt: str, timeout: int = REQUEST_TIMEOUT_SECONDS) -> str:
    future = _executor.submit(_call_gemini, prompt)
    try:
        return future.result(timeout=timeout)
    except FutureTimeoutError as exc:
        raise TimeoutError(f"Gemini call timed out after {timeout}s") from exc


def _validate_shape(data) -> bool:
    if not isinstance(data, dict):
        return False
    steps = data.get("steps")
    if not isinstance(steps, list) or len(steps) == 0:
        return False
    for step in steps:
        if not isinstance(step, dict):
            return False
        clue = step.get("clue")
        if not isinstance(clue, str) or not clue.strip():
            return False
    if not isinstance(data.get("estimatedMinutes"), int):
        return False
    return True


def _attempt(mood: str, minutes: int, strict: bool) -> dict:
    prompt = _build_prompt(mood, minutes, strict=strict)
    raw = _call_gemini_with_timeout(prompt)
    cleaned = _strip_code_fences(raw)
    data = json.loads(cleaned)
    if not _validate_shape(data):
        raise ValueError("Parsed JSON did not match the expected mission shape")
    return data


def generate_mission(mood: str, minutes: int) -> dict:
    if mood not in MOOD_STYLES:
        raise ValueError(f"Unknown mood: {mood}")

    try:
        data = _attempt(mood, minutes, strict=False)
        logger.info("mission_request mood=%s minutes=%s outcome=success", mood, minutes)
        return data
    except Exception as exc:
        logger.warning(
            "mission_request mood=%s minutes=%s outcome=retry reason=%s",
            mood, minutes, exc,
        )

    try:
        data = _attempt(mood, minutes, strict=True)
        logger.info(
            "mission_request mood=%s minutes=%s outcome=success_after_retry",
            mood, minutes,
        )
        return data
    except Exception as exc:
        logger.error(
            "mission_request mood=%s minutes=%s outcome=fallback reason=%s",
            mood, minutes, exc,
        )
        return FALLBACK_MISSIONS[mood]
