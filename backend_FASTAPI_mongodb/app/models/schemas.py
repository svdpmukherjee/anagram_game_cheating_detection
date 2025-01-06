from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any
from datetime import datetime

class ValidWord(BaseModel):
    word: str
    length: int
    reward: Optional[int] = None
    validatedAt: Optional[datetime] = None
    isValid: Optional[bool] = None
    
class Metadata(BaseModel):
    browser: str
    platform: Optional[str] = None
    screenSize: Dict[str, int]

class AntiCheatingMessage(BaseModel):
    id: int
    text: str
    shownAt: Optional[datetime] = None

class GameEventDetails(BaseModel):
    word: Optional[str] = None
    wordLength: Optional[int] = None
    isValid: Optional[bool] = None
    timeSpent: Optional[int] = None
    timeSinceLastAction: Optional[int] = None
    timeElapsed: Optional[int] = None
    wordCount: Optional[int] = None
    words: Optional[List[ValidWord]] = None
    reason: Optional[str] = None
    timeInList: Optional[int] = None
    theoryId: Optional[int] = None
    providedMeaning: Optional[str] = None
    anagram: Optional[str] = None
    wordIndex: Optional[int] = None

class GameEvent(BaseModel):
    sessionId: str
    prolificId: str
    phase: str  # "tutorial", "main_game", "meaning_check"
    currentTheoryId: Optional[int] = None
    anagramShown: Optional[str] = None
    eventType: str  # Possible values defined in documentation
    details: Optional[GameEventDetails] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class WordSubmission(BaseModel):
    sessionId: str
    prolificId: str
    phase: str
    anagramShown: str 
    submittedWords: List[ValidWord]
    totalReward: int
    timeSpent: int
    # Make all these fields optional
    submittedAt: Optional[datetime] = None
    completedAt: Optional[datetime] = None
    validatedAt: Optional[datetime] = None

class SessionInit(BaseModel):
    prolificId: str
    metadata: Metadata

class WordMeaningCheck(BaseModel):
    word: str
    providedMeaning: str
    isCorrect: Optional[bool] = None
    
class WordMeaning(BaseModel):
    word: str
    providedMeaning: str
    isCorrect: Optional[bool] = None
    submittedAt: Optional[datetime] = None

class WordMeaningSubmission(BaseModel):
    sessionId: str
    prolificId: str
    wordMeanings: List[WordMeaning]
    completedAt: datetime
    totalTimeSpent: Optional[int] = None
    
class GameInit(BaseModel):
    currentTheory: Optional[AntiCheatingMessage]
    word: str
    solutions: Dict[str, List[str]]
    timeSettings: Dict[str, int]
    totalAnagrams: int

class GameResponse(BaseModel):
    word: str
    solutions: Dict[str, List[str]]