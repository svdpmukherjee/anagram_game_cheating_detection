import { useState, useEffect, useCallback, useRef } from "react";
import MessageDisplay from "./MessageDisplay";
import GameBoard from "./GameBoard";
import EventTrack from "../shared/EventTrack";
import { AlertTriangle } from "lucide-react";

const AnagramGame = ({ prolificId, sessionId, onComplete }) => {
  const [studyConfig, setStudyConfig] = useState(null);
  const [gameState, setGameState] = useState({
    phase: "loading", // loading -> anti-cheating-message -> play
    currentWord: "",
    solution: [],
    availableLetters: [],
    wordIndex: 0,
    totalAnagrams: 3, // Will be updated from studyConfig
    timeLeft: 0,
    totalTime: 0,
    validatedWords: [],
    allValidatedWords: [], // Track words across all anagrams
    currentMessage: null,
    isTimeUp: false,
    solutions: {},
    notification: null,
  });
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOverview, setShowOverview] = useState(true);

  // Refs for tracking
  const startTime = useRef(new Date());
  const timerRef = useRef(null);
  const isSubmitted = useRef(false);

  // Fetch study config on mount
  useEffect(() => {
    const fetchStudyConfig = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/study-config`
        );
        const config = await response.json();
        setStudyConfig(config);
        setGameState((prev) => ({
          ...prev,
          totalAnagrams: config.game_anagrams,
        }));
      } catch (error) {
        console.error("Error fetching study config:", error);
        setError("Failed to load game configuration");
      }
    };
    fetchStudyConfig();
  }, []);

  const showNotification = useCallback((message, isError = false) => {
    setGameState((prev) => ({
      ...prev,
      notification: { message, isError },
    }));
    setTimeout(() => {
      setGameState((prev) => ({ ...prev, notification: null }));
    }, 3000);
  }, []);

  // Calculate reward based on study config
  const calculateReward = useCallback(
    (wordLength, isValid) => {
      if (!studyConfig?.rewards || !isValid) return 0;
      return studyConfig.rewards[wordLength.toString()] || 0;
    },
    [studyConfig]
  );

  // Log game events
  const logGameEvent = useCallback(
    async (eventType, details = {}) => {
      try {
        const eventBody = {
          sessionId,
          prolificId,
          phase: "main_game",
          anagramShown: gameState.currentWord,
          eventType,
          details: {
            ...details,
            currentWord: gameState.currentWord,
            timeLeft: gameState.timeLeft,
            validatedWordsCount: gameState.validatedWords.length,
          },
          timestamp: new Date().toISOString(),
        };

        await fetch(`${import.meta.env.VITE_API_URL}/api/game-events`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(eventBody),
        });
      } catch (error) {
        console.error("Event logging error:", error);
      }
    },
    [
      sessionId,
      prolificId,
      gameState.currentWord,
      gameState.timeLeft,
      gameState.validatedWords.length,
    ]
  );

  const handleInactiveStart = useCallback(() => {
    console.log("handleInactiveStart called in index.jsx"); // Add this log
    if (!isSubmitted.current && gameState.phase === "play") {
      console.log("Logging inactivity event"); // Add this log
      logGameEvent("mouse_inactive_start");
    } else {
      console.log("Inactivity event skipped:", {
        // Add this log
        isSubmitted: isSubmitted.current,
        phase: gameState.phase,
      });
    }
  }, [logGameEvent, gameState.phase]);

  const handleActiveReturn = useCallback(() => {
    if (!isSubmitted.current && gameState.phase === "play") {
      logGameEvent("mouse_active");
    }
  }, [logGameEvent, gameState.phase]);

  const handlePageLeave = useCallback(
    ({ tabChangeCount, timestamp } = {}) => {
      if (!isSubmitted.current) {
        logGameEvent("page_leave", {
          tabChangeCount,
          timestamp,
          currentWord: gameState.currentWord,
        });
      }
    },
    [logGameEvent, gameState.currentWord]
  );

  const handlePageReturn = useCallback(() => {
    if (!isSubmitted.current) {
      logGameEvent("page_return", {
        currentWord: gameState.currentWord,
      });
    }
  }, [logGameEvent, gameState.currentWord]);

  // Initialize game
  const initGame = useCallback(async () => {
    try {
      if (!sessionId) {
        console.error("No session ID provided");
        setError("Session ID is required to initialize game");
        return;
      }

      // Only initialize if we're in loading phase
      if (gameState.phase !== "loading") return;

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/game/init?sessionId=${sessionId}`
      );
      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.detail || "Failed to initialize game");
      }

      const { currentMessage, word, timeSettings } = responseData;

      // Validate required data
      if (!word || !timeSettings) {
        throw new Error("Invalid game configuration received");
      }

      setGameState((prev) => ({
        ...prev,
        phase: currentMessage ? "message" : "play",
        currentMessage: currentMessage,
        currentWord: word,
        solutions: responseData.solutions,
        availableLetters: word.split("").sort(() => Math.random() - 0.5),
        currentWordsList: [word],
        timeLeft: timeSettings.game_time,
        totalTime: timeSettings.game_time,
      }));

      await logGameEvent("game_init", {
        currentWord: word,
        timeSettings: timeSettings,
        hasAntiCheatingMessage: !!currentMessage,
      });
    } catch (error) {
      console.error("Game initialization error:", error);
      setError(error.message || "Failed to initialize game");
      await logGameEvent("game_init_error", {
        error: error.message,
        sessionId,
      });
    }
  }, [sessionId, logGameEvent, gameState.phase]);

  const isValidWord = useCallback(
    (word) => {
      if (!word || !gameState.solutions) return false;
      const wordLength = word.length.toString();
      const solutionsForLength = gameState.solutions[wordLength];
      return solutionsForLength?.includes(word.toUpperCase());
    },
    [gameState.solutions]
  );

  const handleValidate = useCallback(() => {
    const word = gameState.solution.join("");

    if (gameState.validatedWords.some((w) => w.word === word)) {
      showNotification("This word has already been recorded", true);
      return;
    }

    const isValid = isValidWord(word);

    // Log the validation attempt
    logGameEvent("word_validation", {
      word,
      wordLength: word.length,
      isValid,
    });

    // Add word to validated list
    setGameState((prev) => ({
      ...prev,
      validatedWords: [
        ...prev.validatedWords,
        {
          word,
          length: word.length,
          validatedAt: new Date().toISOString(),
          isValid,
        },
      ],
      solution: [],
      availableLetters: prev.currentWord
        .split("")
        .sort(() => Math.random() - 0.5),
    }));

    showNotification("Word has been recorded");
  }, [
    gameState.solution,
    gameState.currentWord,
    gameState.validatedWords,
    logGameEvent,
    isValidWord,
    showNotification,
  ]);

  const handleRemoveWord = useCallback(
    async (index) => {
      const removedWord = gameState.validatedWords[index];
      if (!removedWord) return;

      await logGameEvent("word_removal", {
        word: removedWord.word,
        wordLength: removedWord.length,
      });

      setGameState((prev) => ({
        ...prev,
        validatedWords: prev.validatedWords.filter((_, i) => i !== index),
      }));

      showNotification(`Removed word: ${removedWord.word}`);
    },
    [gameState.validatedWords, logGameEvent, showNotification]
  );

  const handleSubmit = async () => {
    if (isSubmitting || (isSubmitted.current && !gameState.isTimeUp)) return;

    try {
      setIsSubmitting(true);
      isSubmitted.current = true;

      const currentTimeSpent = Date.now() - startTime.current;

      // Calculate rewards for validated words
      const submittedWords = gameState.validatedWords.map((word) => ({
        word: word.word,
        length: word.length,
        reward: calculateReward(word.length, isValidWord(word.word)),
        isValid: isValidWord(word.word),
        validatedAt: word.validatedAt,
        submittedAt: new Date().toISOString(),
      }));

      const totalReward = submittedWords.reduce(
        (sum, w) => sum + (w.reward || 0),
        0
      );

      // Submit words
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/word-submissions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            prolificId,
            phase: "main_game",
            anagramShown: gameState.currentWord,
            submittedWords,
            totalReward,
            timeSpent: currentTimeSpent,
            submittedAt: new Date().toISOString(),
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to submit words");
      }

      // Update all validated words
      const allValidatedWords = [
        ...gameState.allValidatedWords,
        ...submittedWords,
      ];
      setGameState((prev) => ({
        ...prev,
        allValidatedWords,
      }));

      // Log submission
      await logGameEvent("word_submission", {
        wordCount: submittedWords.length,
        words: submittedWords,
        timeSpent: currentTimeSpent,
      });

      // Check if this is the final anagram submission
      if (gameState.wordIndex >= gameState.totalAnagrams - 1) {
        // Show completion alert before moving to next phase
        alert("You have now completed all words in the game");
      }

      // Check if there are more anagrams
      if (gameState.wordIndex < gameState.totalAnagrams - 1) {
        // Fetch next anagram
        const response = await fetch(
          `${
            import.meta.env.VITE_API_URL
          }/api/game/next?sessionId=${sessionId}&currentIndex=${
            gameState.wordIndex
          }`
        );
        const data = await response.json();

        if (!response.ok || !data.word || !data.solutions) {
          throw new Error("Failed to fetch next anagram");
        }

        // Reset game state for next anagram
        setGameState((prev) => ({
          ...prev,
          wordIndex: prev.wordIndex + 1,
          currentWord: data.word,
          solutions: data.solutions,
          solution: [],
          availableLetters: Array.from(data.word).sort(
            () => Math.random() - 0.5
          ),
          validatedWords: [],
          timeLeft: prev.totalTime,
          isTimeUp: false,
        }));

        isSubmitted.current = false;
        startTime.current = new Date();
      } else {
        // Complete the game
        await logGameEvent("game_complete", {
          totalWords: allValidatedWords.length,
          finalAnagram: gameState.currentWord,
        });
        onComplete(allValidatedWords);
      }
    } catch (error) {
      console.error("Submission error:", error);
      showNotification("Failed to submit words. Please try again.", true);
      setIsSubmitting(false);
      isSubmitted.current = false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTimeUp = useCallback(async () => {
    if (isSubmitting || isSubmitted.current) return;

    // alert("Time's up!");
    handleSubmit();
  }, [handleSubmit]);

  const handleMessageShown = async (messageData) => {
    await logGameEvent("anti_cheating_message_shown", {
      messageId: messageData.messageId,
      messageText: messageData.messageText,
      timeSpentOnMessage: messageData.timeSpentOnMessage,
      theory: messageData.theory,
      variation: messageData.variation,
    });
    setGameState((prev) => ({ ...prev, phase: "play" }));
  };

  // Timer effect
  useEffect(() => {
    if (
      gameState.phase === "play" &&
      gameState.timeLeft > 0 &&
      !isSubmitted.current
    ) {
      timerRef.current = setInterval(() => {
        setGameState((prev) => {
          if (prev.timeLeft <= 1) {
            clearInterval(timerRef.current);
            // Set isTimeUp first
            setGameState((prev) => ({ ...prev, timeLeft: 0, isTimeUp: true }));
            handleTimeUp();
            return { ...prev, timeLeft: 0, isTimeUp: true };
          }
          return { ...prev, timeLeft: prev.timeLeft - 1 };
        });
      }, 1000);

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }
  }, [gameState.phase, gameState.timeLeft, handleTimeUp]);

  // Initialize game on mount
  useEffect(() => {
    if (sessionId) {
      initGame();
    }
  }, [sessionId, initGame]);

  if (error) {
    return (
      <div className="text-center p-6">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={() => {
            setError(null);
            setGameState((prev) => ({ ...prev, phase: "loading" }));
            initGame();
          }}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                     transition-colors duration-200"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {gameState.notification && (
        <div
          className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
            gameState.notification.isError
              ? "bg-red-100 text-red-700"
              : "bg-green-100 text-green-700"
          }`}
        >
          {gameState.notification.message}
        </div>
      )}

      {gameState.phase === "message" && (
        <MessageDisplay
          message={gameState.currentMessage}
          onMessageShown={handleMessageShown}
        />
      )}

      {gameState.phase === "play" && (
        <GameBoard
          currentWord={gameState.currentWord}
          solution={gameState.solution}
          availableLetters={gameState.availableLetters}
          onSolutionChange={(solution, available) => {
            setGameState((prev) => ({
              ...prev,
              solution,
              availableLetters: available,
            }));
          }}
          onValidate={handleValidate}
          onSubmit={handleSubmit}
          onRemoveWord={handleRemoveWord}
          wordIndex={gameState.wordIndex}
          totalWords={gameState.totalAnagrams}
          timeLeft={gameState.timeLeft}
          totalTime={gameState.totalTime}
          isTimeUp={gameState.isTimeUp}
          validatedWords={gameState.validatedWords}
        />
      )}
      <EventTrack
        onPageLeave={handlePageLeave}
        onPageReturn={handlePageReturn}
        onInactivityStart={handleInactiveStart}
        onActiveReturn={handleActiveReturn}
        enabled={!isSubmitted.current && gameState.phase === "play"}
        inactivityTimeout={5000}
      />
    </div>
  );
};

export default AnagramGame;
