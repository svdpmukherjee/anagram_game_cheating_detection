from typing import Dict, Any, List
from datetime import datetime
from bson import ObjectId
from fastapi import HTTPException
from ..utils.helpers import get_random_theory, validate_word, get_game_config
import logging

logger = logging.getLogger(__name__)

class GameService:
    def __init__(self, db):
        self.db = db

    async def initialize_session(self, prolific_id: str, metadata: Dict[str, Any]) -> str:
        """Initialize a new game session."""
        try:
            # Check if session already exists
            existing_session = await self.db.sessions.find_one({"prolificId": prolific_id})
            if existing_session:
                return str(existing_session["_id"])

            # Create new session
            session_data = {
                "prolificId": prolific_id,
                "createdAt": datetime.utcnow(),
                "metadata": metadata,
                "gameState": {
                    "completionStatus": {
                        "tutorial": {"completed": False},
                        "mainGame": {"completed": False},
                        "meaningCheck": {"completed": False}
                    },
                    "startTime": datetime.utcnow()
                }
            }

            result = await self.db.sessions.insert_one(session_data)
            return str(result.inserted_id)
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    async def initialize_game(self, session_id: str) -> Dict[str, Any]:
        """Initialize game with theory message and first anagram."""
        try:
            # Get game config
            config = await get_game_config(self.db)
            
            # Get random theory message
            theory = await get_random_theory(self.db)
            
            # Get first anagram from main game
            word = config["game_anagrams"][0]["word"]
            
            return {
                "theory": theory,
                "word": word,
                "totalAnagrams": len(config["game_anagrams"]),
                "timeSettings": config["time_settings"]
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

   
    async def initialize_tutorial(self, session_id: str) -> Dict[str, Any]:
        """Initialize tutorial game."""
        try:
            # Validate session_id format
            if not ObjectId.is_valid(session_id):
                raise HTTPException(status_code=422, detail="Invalid session ID format")
                
            # Convert string to ObjectId
            session_obj_id = ObjectId(session_id)
            
            # Find session
            session = await self.db.sessions.find_one({"_id": session_obj_id})
            if not session:
                raise HTTPException(status_code=404, detail="Session not found")

            # Get game config
            config = await self.db.game_config.find_one({})
            if not config:
                raise HTTPException(status_code=404, detail="Game configuration not found")

            tutorial_config = config.get("tutorial_anagrams")
            if not tutorial_config:
                raise HTTPException(status_code=404, detail="Tutorial configuration not found")
            
            return {
                "word": tutorial_config["word"],
                "timeLimit": config["time_settings"]["tutorial_time"]
            }
        except Exception as e:
            logger.error(f"Failed to initialize tutorial: {str(e)}")
            if isinstance(e, HTTPException):
                raise e
            raise HTTPException(status_code=500, detail=str(e))
        
        
    async def validate_word_submission(self, word: str, anagram: str) -> Dict[str, Any]:
        """Validate a submitted word."""
        return await validate_word(self.db, word, anagram)

    async def process_meaning_submissions(self, meaning_data: Dict[str, Any]) -> bool:
        """Process and store word meaning submissions."""
        try:
            session_id = ObjectId(meaning_data["sessionId"])
            
            # Update session completion status
            await self.db.sessions.update_one(
                {"_id": session_id},
                {
                    "$set": {
                        "completionStatus.meaningCheck": {
                            "completed": True,
                            "completedAt": meaning_data["completedAt"],
                            "wordMeanings": meaning_data["wordMeanings"]
                        }
                    }
                }
            )
            
            return True
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))