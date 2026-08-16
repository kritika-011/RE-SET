from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String

from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class Mission(Base):
    __tablename__ = "missions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    mood = Column(String, nullable=False)
    minutes = Column(Integer, nullable=False)
    resetType = Column(String, nullable=False)

    # Check-in state, captured before the mission was generated
    energy_before = Column(Integer, nullable=True)
    stress_before = Column(Integer, nullable=True)
    focus_before = Column(Integer, nullable=True)
    goal = Column(String, nullable=True)
    context = Column(String, nullable=True)

    # Feedback, captured after the mission was completed
    feedback = Column(String, nullable=True)
    energy_after = Column(Integer, nullable=True)
    stress_after = Column(Integer, nullable=True)
    focus_after = Column(Integer, nullable=True)

    completed_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
