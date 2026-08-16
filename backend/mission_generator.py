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
    "overwhelmed": "quiet, green spaces and a slower pace.",
    "exhausted": "short distances, spots with sunlight, and light easy activity.",
    "bored": "unfamiliar streets and a discovery/observation challenge.",
    "stuck": "sensory prompts involving colors or sounds.",
}

GOAL_LABELS = {
    "calm": "Calm down",
    "energized": "Get energized",
    "clear": "Clear my head",
    "focus": "Focus",
    "stop_procrastinating": "Stop procrastinating",
    "break": "Take a break",
}

CONTEXT_LABELS = {
    "home": "at home",
    "campus": "on campus",
    "work": "at work",
    "outdoors": "already outdoors",
}

STUCK_ACTIVITY_STYLES = {
    "coding": (
        "They're stuck on a coding problem. Include a step that has them "
        "physically step away from the screen/editor, and a step where they "
        "write down the ONE next smallest concrete action before returning."
    ),
    "studying": (
        "They're stuck studying. Include a step that has them close their "
        "notes/laptop, and a step where they name the single next small task "
        "before returning."
    ),
    "assignment": (
        "They're stuck on an assignment. Include a step that has them step "
        "away from their desk, and a step where they identify just the next "
        "small piece of the assignment before returning."
    ),
    "work": (
        "They're stuck on a work task. Include a step that has them leave "
        "their desk, and a step where they name the next concrete action "
        "before returning."
    ),
    "cant_start": (
        "They can't get started on something. Keep it very short and "
        "low-friction — the goal is just breaking inertia, not deep "
        "reflection."
    ),
    "overwhelmed": (
        "Everything feels like too much right now. Keep it calm, slow, and "
        "simple — no problem-solving, just a physical reset."
    ),
}

SAFETY_CLAUSE = (
    "Safety requirements: Do not suggest anything dangerous, involving "
    "driving or vehicles, unsafe or restricted areas, interactions with "
    "strangers, climbing, roads or traffic, or extreme physical exertion. "
    "Nothing should require special equipment. Keep every step realistic "
    "for someone taking a short break near where they already are."
)

RESET_TYPES = {
    "quick": {
        "label": "Quick Reset",
        "step_instruction": (
            "Generate exactly 2-3 steps. Keep it direct and simple with no "
            "exploratory or wandering steps — this is for someone with a "
            "short break."
        ),
    },
    "standard": {
        "label": "Standard Reset",
        "step_instruction": (
            "Generate exactly 4-5 steps, including exactly one "
            "reflection/pause step where they stand or sit still for about "
            "60 seconds."
        ),
    },
    "deep": {
        "label": "Deep Reset",
        "step_instruction": (
            "Generate exactly 5-6 steps, including one longer "
            "reflection/pause step of 90 seconds or more, and one more "
            "exploratory or discovery-style step than a Standard Reset "
            "would have."
        ),
    },
}


def _get_reset_key(minutes: int) -> str:
    if minutes <= 10:
        return "quick"
    if minutes <= 15:
        return "standard"
    return "deep"


FALLBACK_MISSIONS = {
    "overwhelmed": {
        "quick": {
            "steps": [
                {"clue": "Step outside and walk straight to the nearest patch of green you can see."},
                {"clue": "Stand still there for 30 seconds and take three slow breaths before heading back."},
            ],
        },
        "standard": {
            "steps": [
                {"clue": "Walk toward the nearest patch of green — a tree, a park, a strip of grass."},
                {"clue": "Take the quieter of two possible routes, even if it's slightly longer."},
                {"clue": "Find somewhere to sit or stand still for 60 seconds and just breathe."},
                {"clue": "Walk back a different way than you came."},
            ],
        },
        "deep": {
            "steps": [
                {"clue": "Walk toward the nearest patch of green — a tree, a park, a strip of grass."},
                {"clue": "Take the quieter of two possible routes, even if it's slightly longer."},
                {"clue": "Notice one small detail in the greenery you'd normally walk past — a leaf shape, a bird, a texture."},
                {"clue": "Find somewhere to sit or stand still for 90 seconds, close your eyes, and just breathe."},
                {"clue": "Walk back a different way than you came."},
            ],
        },
    },
    "exhausted": {
        "quick": {
            "steps": [
                {"clue": "Step outside and find the nearest spot in direct sunlight."},
                {"clue": "Stand there for 30 seconds, then head back at an easy pace."},
            ],
        },
        "standard": {
            "steps": [
                {"clue": "Step outside and find a spot in direct sunlight."},
                {"clue": "Rest there for 60 seconds, letting the light warm your face."},
                {"clue": "Walk to the nearest corner or landmark, no further."},
                {"clue": "Head back at an easy, unhurried pace."},
            ],
        },
        "deep": {
            "steps": [
                {"clue": "Step outside and find a spot in direct sunlight."},
                {"clue": "Rest there for 90 seconds, letting the light warm your face and your shoulders drop."},
                {"clue": "Walk to the nearest corner or landmark, no further."},
                {"clue": "Spot three things that are the same color along the way."},
                {"clue": "Head back at an easy, unhurried pace."},
            ],
        },
    },
    "bored": {
        "quick": {
            "steps": [
                {"clue": "Turn down the nearest street you don't normally walk on."},
                {"clue": "Spot one thing you've never noticed there before, then head back."},
            ],
        },
        "standard": {
            "steps": [
                {"clue": "Turn down a street you don't normally walk on."},
                {"clue": "Find something you've never noticed before on this block."},
                {"clue": "Pause for 60 seconds and just take in the details around you."},
                {"clue": "Take a different route back than the one you came from."},
            ],
        },
        "deep": {
            "steps": [
                {"clue": "Turn down a street you don't normally walk on."},
                {"clue": "Find something you've never noticed before on this block."},
                {"clue": "Imagine framing a photo of the most interesting thing you see — don't take it, just notice it."},
                {"clue": "Explore one more turn or side street you haven't tried before."},
                {"clue": "Pause for 90 seconds somewhere along the way and just take in the details around you."},
                {"clue": "Take a different route back than the one you came from."},
            ],
        },
    },
    "stuck": {
        "quick": {
            "steps": [
                {"clue": "Step outside and name the first three colors you notice."},
                {"clue": "Head back, listening for the loudest sound you hear along the way."},
            ],
        },
        "standard": {
            "steps": [
                {"clue": "Step outside and name the first three colors you notice."},
                {"clue": "Stand still for 60 seconds and listen for the farthest sound you can hear."},
                {"clue": "Pick a small object nearby and invent an unlikely backstory for it."},
                {"clue": "Walk for two minutes without deciding the route in advance — just turn when it feels right."},
            ],
        },
        "deep": {
            "steps": [
                {"clue": "Step outside and name the first three colors you notice."},
                {"clue": "Stand still for 90 seconds and listen for the farthest sound you can hear."},
                {"clue": "Pick a small object nearby and invent an unlikely backstory for it."},
                {"clue": "Find a texture you've never touched on purpose — bark, brick, a leaf — and notice it closely."},
                {"clue": "Walk for two minutes without deciding the route in advance — just turn when it feels right."},
            ],
        },
    },
}


def _build_prompt(
    mood: str,
    minutes: int,
    reset_key: str,
    strict: bool = False,
    energy: int | None = None,
    stress: int | None = None,
    focus: int | None = None,
    goal: str | None = None,
    context: str | None = None,
    stuck_activity: str | None = None,
) -> str:
    style = MOOD_STYLES[mood]
    reset = RESET_TYPES[reset_key]
    strict_instruction = (
        "\nIMPORTANT: Your entire response must be a single valid JSON object and "
        "nothing else. No markdown, no code fences, no commentary, no leading or "
        "trailing text of any kind."
        if strict
        else ""
    )

    checkin_lines = []
    if energy is not None:
        checkin_lines.append(f"- Energy: {energy}/5")
    if stress is not None:
        checkin_lines.append(f"- Stress: {stress}/5")
    if focus is not None:
        checkin_lines.append(f"- Focus: {focus}/5")
    if goal:
        checkin_lines.append(f"- Desired outcome: {GOAL_LABELS.get(goal, goal)}")
    if context:
        checkin_lines.append(f"- Currently: {CONTEXT_LABELS.get(context, context)}")
    checkin_block = (
        "\nCheck-in:\n" + "\n".join(checkin_lines) + "\n" if checkin_lines else ""
    )

    stuck_instruction = STUCK_ACTIVITY_STYLES.get(stuck_activity) if stuck_activity else None
    stuck_block = (
        f"\nThey used the 'I'm stuck' shortcut. {stuck_instruction}\n"
        if stuck_instruction
        else ""
    )

    return f"""You are generating a short outdoor movement mission for a mental reset app.

Mood: {mood}
Minutes available: {minutes}
Reset type: {reset['label']}
Route style for this mood: {style}
Step requirements for this reset type: {reset['step_instruction']}
{checkin_block}{stuck_block}
Generate real-world walking/movement challenges appropriate for someone
feeling "{mood}" with {minutes} minutes available, following both the route
style and the step requirements above. If check-in details are given above,
let them shape the tone and focus of the mission.

Return ONLY valid JSON, with no markdown formatting and no explanation, in exactly
this shape:

{{
  "steps": [{{"clue": "..."}}],
  "estimatedMinutes": {minutes},
  "resetType": "{reset['label']}"
}}{strict_instruction}

{SAFETY_CLAUSE}
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
    return True


def _attempt(
    mood: str,
    minutes: int,
    reset_key: str,
    strict: bool,
    energy: int | None = None,
    stress: int | None = None,
    focus: int | None = None,
    goal: str | None = None,
    context: str | None = None,
    stuck_activity: str | None = None,
) -> dict:
    prompt = _build_prompt(
        mood, minutes, reset_key, strict=strict,
        energy=energy, stress=stress, focus=focus,
        goal=goal, context=context, stuck_activity=stuck_activity,
    )
    raw = _call_gemini_with_timeout(prompt)
    cleaned = _strip_code_fences(raw)
    data = json.loads(cleaned)
    if not _validate_shape(data):
        raise ValueError("Parsed JSON did not match the expected mission shape")
    return data


def _build_reroll_prompt(mood: str, original_clue: str) -> str:
    style = MOOD_STYLES[mood]
    return f"""You are generating a single replacement step for an outdoor
movement mission in a mental reset app.

Mood: {mood}
Route style for this mood: {style}

The person didn't like this step: "{original_clue}"

Generate ONE new short, real-world walking/movement clue that fits the same
mood and route style, but is clearly different from the one above.

Return ONLY valid JSON, with no markdown formatting and no explanation, in
exactly this shape:

{{"clue": "..."}}

{SAFETY_CLAUSE}
"""


def _reroll_fallback_clue(mood: str, original_clue: str) -> str:
    for reset_key in ("standard", "quick", "deep"):
        for step in FALLBACK_MISSIONS[mood][reset_key]["steps"]:
            if step["clue"] != original_clue:
                return step["clue"]
    return "Take a slow lap around where you're standing and notice one new thing."


def reroll_clue(mood: str, original_clue: str) -> dict:
    if mood not in MOOD_STYLES:
        raise ValueError(f"Unknown mood: {mood}")

    try:
        prompt = _build_reroll_prompt(mood, original_clue)
        raw = _call_gemini_with_timeout(prompt)
        cleaned = _strip_code_fences(raw)
        data = json.loads(cleaned)
        clue = data.get("clue")
        if not isinstance(clue, str) or not clue.strip():
            raise ValueError("Reroll response did not contain a valid clue")
        logger.info("clue_reroll mood=%s outcome=success", mood)
        return {"clue": clue}
    except Exception as exc:
        logger.warning("clue_reroll mood=%s outcome=fallback reason=%s", mood, exc)
        return {"clue": _reroll_fallback_clue(mood, original_clue)}


def generate_mission(
    mood: str,
    minutes: int,
    energy: int | None = None,
    stress: int | None = None,
    focus: int | None = None,
    goal: str | None = None,
    context: str | None = None,
    stuck_activity: str | None = None,
) -> dict:
    if mood not in MOOD_STYLES:
        raise ValueError(f"Unknown mood: {mood}")

    reset_key = _get_reset_key(minutes)
    reset_label = RESET_TYPES[reset_key]["label"]
    checkin_kwargs = dict(
        energy=energy, stress=stress, focus=focus,
        goal=goal, context=context, stuck_activity=stuck_activity,
    )

    try:
        data = _attempt(mood, minutes, reset_key, strict=False, **checkin_kwargs)
        logger.info(
            "mission_request mood=%s minutes=%s resetType=%s outcome=success",
            mood, minutes, reset_label,
        )
        data["estimatedMinutes"] = minutes
        data["resetType"] = reset_label
        return data
    except Exception as exc:
        logger.warning(
            "mission_request mood=%s minutes=%s resetType=%s outcome=retry reason=%s",
            mood, minutes, reset_label, exc,
        )

    try:
        data = _attempt(mood, minutes, reset_key, strict=True, **checkin_kwargs)
        logger.info(
            "mission_request mood=%s minutes=%s resetType=%s outcome=success_after_retry",
            mood, minutes, reset_label,
        )
        data["estimatedMinutes"] = minutes
        data["resetType"] = reset_label
        return data
    except Exception as exc:
        logger.error(
            "mission_request mood=%s minutes=%s resetType=%s outcome=fallback reason=%s",
            mood, minutes, reset_label, exc,
        )
        fallback_steps = FALLBACK_MISSIONS[mood][reset_key]["steps"]
        return {
            "steps": fallback_steps,
            "estimatedMinutes": minutes,
            "resetType": reset_label,
        }
