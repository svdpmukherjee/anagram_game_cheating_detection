from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import JSONResponse
from typing import Dict, Any
from bson import ObjectId
import logging
from ..models.schemas import *
from ..services.logic import GameService
from ..utils.helpers import log_game_event, update_session_status

logger = logging.getLogger(__name__)

router = APIRouter()
router.db = None  # Will be set in main.py

@router.get("/study-config")
async def get_study_config():
    """Get study configuration for landing page."""
    try:
        config = await router.db.game_config.find_one({}, {'_id': 0})
        if not config:
            raise HTTPException(status_code=404, detail="Configuration not found")
            
        study_info = {
            "timeSettings": config["time_settings"],
            "rewards": config["rewards"],
            "compensation": config["compensation"],
            "game_anagrams": len(config["game_anagrams"])
        }
        
        return JSONResponse(content=study_info)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/initialize-session")
async def initialize_session(session_data: SessionInit):
    """Initialize a new session for a participant."""
    game_service = GameService(router.db)
    session_id = await game_service.initialize_session(
        session_data.prolificId,
        session_data.metadata.dict()
    )
    return JSONResponse(content={"sessionId": session_id})

@router.get("/tutorial/init")
async def initialize_tutorial(session_id: str):
    """Initialize tutorial game."""
    try:
        if not ObjectId.is_valid(session_id):
            raise HTTPException(status_code=422, detail="Invalid session ID format")
            
        game_service = GameService(router.db)
        tutorial_data = await game_service.initialize_tutorial(session_id)
        
        if not tutorial_data:
            raise HTTPException(status_code=500, detail="Failed to initialize tutorial")
            
        return JSONResponse(content=tutorial_data)
    except Exception as e:
        logger.error(f"Tutorial initialization error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/game/init")
async def initialize_game(session_id: str):
    """Initialize main game with theory message."""
    game_service = GameService(router.db)
    game_data = await game_service.initialize_game(session_id)
    return JSONResponse(content=game_data)

@router.post("/game-events")
async def log_event(event: GameEvent):
    """Log game events."""
    try:
        # Convert event to dict and handle None values
        event_dict = event.dict(exclude_none=True)
        
        # Ensure required fields are present
        if not event_dict.get('sessionId') or not event_dict.get('prolificId'):
            raise HTTPException(
                status_code=422,
                detail="Missing required fields: sessionId or prolificId"
            )
            
        # Log the event
        await log_game_event(router.db, event_dict)
        return JSONResponse(content={"status": "success"})
    except Exception as e:
        logger.error(f"Error logging game event: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/word/validate")
async def validate_word(word_data: Dict[str, str]):
    """Validate a submitted word."""
    game_service = GameService(router.db)
    result = await game_service.validate_word_submission(
        word_data["word"],
        word_data["anagram"]
    )
    return JSONResponse(content=result)

@router.post("/sessions/complete")
async def complete_session(completion_data: Dict[str, Any]):
    """Update session completion status."""
    try:
        await update_session_status(
            router.db,
            completion_data["sessionId"],
            completion_data["gameState"]
        )
        return JSONResponse(content={"status": "success"})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/meanings/submit")
async def submit_meanings(meaning_data: MeaningSubmission):
    """Submit and process word meanings."""
    game_service = GameService(router.db)
    await game_service.process_meaning_submissions(meaning_data.dict())
    return JSONResponse(content={"status": "success"})