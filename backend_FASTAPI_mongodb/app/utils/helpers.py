from fastapi import HTTPException
from datetime import datetime
import random
from typing import Dict, Any, List

async def get_random_theory(db) -> Dict[str, Any]:
    """Get a random anti-cheating message that has been shown the least times."""
    try:
        messages = await db.anti_cheating_messages.find().to_list(None)
        if not messages:
            raise HTTPException(status_code=404, detail="No messages found")
        
        # Get message with minimum shown_count
        min_shown = min(msg["shown_count"] for msg in messages)
        eligible_messages = [msg for msg in messages if msg["shown_count"] == min_shown]
        
        selected_message = random.choice(eligible_messages)
        
        # Update shown count
        await db.anti_cheating_messages.update_one(
            {"_id": selected_message["_id"]},
            {"$inc": {"shown_count": 1}}
        )
        
        return {
            "id": selected_message["id"],
            "text": selected_message["text"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def validate_word(db, word: str, anagram: str) -> Dict[str, Any]:
    """Validate if a word is valid for the given anagram."""
    try:
        # Get game config to check solutions
        config = await db.game_config.find_one({})
        if not config:
            raise HTTPException(status_code=404, detail="Game configuration not found")

        # Find the anagram in tutorial or main game
        solutions = None
        for game_anagram in config["game_anagrams"]:
            if game_anagram["word"] == anagram:
                solutions = game_anagram["solutions"]
                break
        
        if not solutions:
            # Check tutorial solutions
            if config["tutorial_anagrams"]["word"] == anagram:
                solutions = config["tutorial_anagrams"]["solutions"]

        if not solutions:
            raise HTTPException(status_code=404, detail="Anagram not found")

        # Check if word exists in solutions
        word_length = str(len(word))
        if word_length in solutions and word.upper() in solutions[word_length]:
            reward = config["rewards"].get(word_length, 0)
            return {"isValid": True, "reward": reward}
        
        return {"isValid": False, "reward": 0}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def get_game_config(db) -> Dict[str, Any]:
    """Get game configuration from database."""
    try:
        config = await db.game_config.find_one({})
        if not config:
            raise HTTPException(status_code=404, detail="Game configuration not found")
        return config
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def log_game_event(db, event_data: Dict[str, Any]) -> bool:
    """Log a game event to the database."""
    try:
        # Remove None values from event data
        event_data = {k: v for k, v in event_data.items() if v is not None}
        
        # Ensure timestamp exists
        if 'timestamp' not in event_data:
            event_data['timestamp'] = datetime.utcnow()
            
        await db.game_events.insert_one(event_data)
        return True
    except Exception as e:
        logger.error(f"Failed to log game event: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to log game event: {str(e)}"
        )

async def update_session_status(db, session_id: str, update_data: Dict[str, Any]) -> bool:
    """Update session completion status."""
    try:
        await db.sessions.update_one(
            {"_id": session_id},
            {"$set": update_data}
        )
        return True
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def check_word_meanings(word_meanings: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Placeholder for word meaning validation.
    In a real implementation, this would check against a dictionary API or database.
    """
    # For now, we'll mark all meanings as correct if they're non-empty
    return [
        {**meaning, "isCorrect": bool(meaning.get("providedMeaning", "").strip())}
        for meaning in word_meanings
    ]