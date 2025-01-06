import { useState, useEffect, useCallback, useRef } from "react";
import GameBoard from "./GameBoard";
import { AlertTriangle, Timer, Award, Info } from "lucide-react";
import CoinIcon from "../CoinIcon";

const TutorialGame = ({ prolificId, sessionId, onComplete }) => {
  const [gameState, setGameState] = useState({
    tutorialWord: "",
    solution: [],
    availableLetters: [],
    validatedWords: [],
    timeLeft: 0,
    totalTime: 0,
    isTimeUp: false,
    solutions: {},
  });
  const [studyConfig, setStudyConfig] = useState(null);
  const [notification, setNotification] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showOverview, setShowOverview] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const startTime = useRef(new Date());
  const lastActionTime = useRef(new Date());
  const timerRef = useRef(null);
  const mouseInactivityTimer = useRef(null);
  const isInactive = useRef(false);
  const isSubmitted = useRef(false);
  const lastUserActivity = useRef(Date.now());
  const inactivityCheckInterval = useRef(null);
  const ignoreNextBlur = useRef(false);

  const showNotification = useCallback((message, isError = false) => {
    setNotification({ message, isError });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  const logGameEvent = useCallback(
    async (eventType, details = null) => {
      try {
        await fetch("/api/game-events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            prolificId,
            phase: "tutorial",
            anagramShown: gameState.tutorialWord,
            eventType,
            details: {
              ...details,
              // Keep only the relevant details without timing information
            },
            timestamp: new Date().toISOString(),
          }),
        });
      } catch (error) {
        console.error("Event logging error:", error);
      }
    },
    [sessionId, prolificId, gameState.tutorialWord]
  );

  useEffect(() => {
    if (showOverview || isSubmitted.current) return;

    let isPageActive = true;
    let currentFocus = true;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        isPageActive = false;
        isInactive.current = false;
        logGameEvent("page_leave");
      } else if (!isPageActive) {
        isPageActive = true;
        lastUserActivity.current = Date.now();
        logGameEvent("page_return");
      }
    };

    const handleWindowBlur = () => {
      if (ignoreNextBlur.current) {
        ignoreNextBlur.current = false;
        return;
      }
      currentFocus = false;
      if (isPageActive) {
        isPageActive = false;
        isInactive.current = false;
        logGameEvent("page_leave");
      }
    };

    const handleWindowFocus = () => {
      const wasFocused = currentFocus;
      currentFocus = true;

      if (!wasFocused && !document.hidden) {
        isPageActive = true;
        lastUserActivity.current = Date.now();
        logGameEvent("page_return");
      }
    };

    const originalAlert = window.alert;
    window.alert = function (message) {
      ignoreNextBlur.current = true;
      return originalAlert.call(window, message);
    };

    const handleUserActivity = () => {
      if (!isPageActive || isSubmitted.current) return;
      lastUserActivity.current = Date.now();
      if (isInactive.current) {
        logGameEvent("mouse_active");
        isInactive.current = false;
      }
    };

    inactivityCheckInterval.current = setInterval(() => {
      if (!isPageActive || isSubmitted.current) return;
      const timeSinceLastActivity = Date.now() - lastUserActivity.current;
      if (!isInactive.current && timeSinceLastActivity > 5000) {
        logGameEvent("mouse_inactive_start");
        isInactive.current = true;
      }
    }, 1000);

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);
    window.addEventListener("focus", handleWindowFocus);
    document.addEventListener("mousemove", handleUserActivity);
    document.addEventListener("keydown", handleUserActivity);
    document.addEventListener("click", handleUserActivity);

    return () => {
      window.alert = originalAlert;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
      window.removeEventListener("focus", handleWindowFocus);
      document.removeEventListener("mousemove", handleUserActivity);
      document.removeEventListener("keydown", handleUserActivity);
      document.removeEventListener("click", handleUserActivity);
      clearInterval(inactivityCheckInterval.current);
    };
  }, [showOverview, logGameEvent]);

  const initTutorial = useCallback(async () => {
    try {
      const [configResponse, tutorialResponse] = await Promise.all([
        fetch("/api/study-config"),
        fetch(`/api/tutorial/init?sessionId=${sessionId}`),
      ]);

      const [configData, tutorialData] = await Promise.all([
        configResponse.json(),
        tutorialResponse.json(),
      ]);
      console.log("Tutorial Data:", tutorialData);

      if (!configResponse.ok || !tutorialResponse.ok) {
        throw new Error("Failed to initialize tutorial");
      }

      setStudyConfig(configData);
      setGameState((prev) => ({
        ...prev,
        tutorialWord: tutorialData.word,
        solutions: tutorialData.solutions,
        availableLetters: tutorialData.word
          .split("")
          .sort(() => Math.random() - 0.5),
        timeLeft: configData.timeSettings.tutorial_time,
        totalTime: configData.timeSettings.tutorial_time,
      }));
    } catch (error) {
      setError(error.message);
      showNotification("Failed to initialize tutorial", true);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, showNotification]);

  const isValidWord = useCallback(
    (word) => {
      if (!word || !gameState.solutions) return false;
      const wordLength = word.length.toString();
      const solutionsForLength = gameState.solutions[wordLength];
      const isValid = solutionsForLength?.includes(word.toUpperCase());
      console.log({
        word,
        wordLength,
        solutionsForLength,
        isValid,
      });
      return isValid;
    },
    [gameState.solutions]
  );

  const handleValidate = useCallback(() => {
    const word = gameState.solution.join("");

    if (gameState.validatedWords.some((w) => w.word === word)) {
      showNotification("This word has already been recorded", true);
      return;
    }

    const valid = isValidWord(word);
    logGameEvent("word_validation", {
      word,
      wordLength: word.length,
      isValid: valid,
    });

    setGameState((prev) => ({
      ...prev,
      validatedWords: [
        ...prev.validatedWords,
        { word, length: word.length, validatedAt: new Date().toISOString() },
      ],
      solution: [],
      availableLetters: prev.tutorialWord
        .split("")
        .sort(() => Math.random() - 0.5),
    }));
    showNotification("Word has been recorded");
  }, [
    gameState.solution,
    gameState.tutorialWord,
    gameState.validatedWords,
    logGameEvent,
    showNotification,
    isValidWord,
  ]);

  const handleRemoveWord = useCallback(
    async (index) => {
      const removedWord = gameState.validatedWords[index];
      if (!removedWord) return;

      await logGameEvent("word_removal", {
        word: removedWord.word,
        wordLength: removedWord.length,
        timeInList: Date.now() - new Date(removedWord.validatedAt).getTime(),
      });

      setGameState((prev) => ({
        ...prev,
        validatedWords: prev.validatedWords.filter((_, i) => i !== index),
      }));

      showNotification(`Removed word: ${removedWord.word}`);
    },
    [gameState.validatedWords, logGameEvent, showNotification]
  );

  const handleSubmit = useCallback(async () => {
    if (isSubmitting || isSubmitted.current) return;

    try {
      setIsSubmitting(true);
      isSubmitted.current = true;

      if (mouseInactivityTimer.current) {
        clearTimeout(mouseInactivityTimer.current);
      }

      // Calculate rewards and check validity for each word
      const processedWords = gameState.validatedWords.map((word) => ({
        word: word.word,
        length: word.length,
        reward: 0,
        isValid: isValidWord(word.word),
      }));

      // Log the submission event
      await logGameEvent("word_submission", {
        words: processedWords,
      });

      // Update tutorial completion status
      await fetch("/api/tutorial/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          prolificId,
          completedAt: new Date().toISOString(),
          validatedWords: gameState.validatedWords,
        }),
      });

      // Only call onComplete if everything succeeded
      onComplete();
    } catch (error) {
      console.error("Tutorial submission error:", error);
      setNotification({
        message: "Failed to submit tutorial results. Please try again.",
        isError: true,
      });
      // Reset submission states on error
      setIsSubmitting(false);
      isSubmitted.current = false;
    }
  }, [
    gameState.validatedWords,
    sessionId,
    prolificId,
    logGameEvent,
    onComplete,
    setNotification,
  ]);

  useEffect(() => {
    if (!showOverview && gameState.timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setGameState((prev) => {
          if (prev.timeLeft <= 1 && !isSubmitted.current) {
            clearInterval(timerRef.current);
            isSubmitted.current = true;
            handleSubmit();
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
  }, [gameState.timeLeft, showOverview, handleSubmit]);

  useEffect(() => {
    if (sessionId) {
      initTutorial();
    }
  }, [sessionId, initTutorial]);

  if (isLoading) {
    return (
      <div className="flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-6">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600 mb-4">{error}</p>
      </div>
    );
  }

  if (showOverview && studyConfig) {
    const rewards = studyConfig.rewards;
    const minLength = Math.min(...Object.keys(rewards).map(Number));
    const maxLength = Math.max(...Object.keys(rewards).map(Number));
    const tutorialTime = Math.floor(
      studyConfig.timeSettings.tutorial_time / 60
    );

    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <Info className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-800">
              Practice Round Overview
            </h3>
          </div>

          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-3">How to Play</h4>
              <ul className="space-y-2 text-blue-700">
                <li>• Drag and drop letters to form valid English words</li>
                <li>
                  • Words must be {minLength}-{maxLength} letters long
                </li>
                <li>• Click 'Validate' after forming each word</li>
                <li>• Create multiple words from the same letters</li>
                <li>• Click 'Submit' when you're done</li>
              </ul>
            </div>

            <div className="flex items-start gap-3">
              <Timer className="h-5 w-5 text-green-600 mt-1" />
              <div>
                <p className="font-medium text-gray-700">Time Limit</p>
                <p className="text-gray-600">
                  {tutorialTime} minutes to practice
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Game will automatically submit when time runs out
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Award className="h-5 w-5 text-amber-600 mt-1" />
              <div>
                <p className="font-medium text-gray-700">Rewards per Word</p>
                <div className="space-y-1">
                  {Object.entries(studyConfig.rewards)
                    .sort(([a], [b]) => Number(b) - Number(a))
                    .map(([length, reward]) => (
                      <div key={length} className="flex items-center">
                        <CoinIcon className="h-4 w-4 text-amber-600 mr-2" />
                        <span className="text-gray-600 text-sm">
                          {reward}p for {length}-letter words
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowOverview(false)}
            className="w-full mt-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Start Practice Round
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {notification && (
        <div
          className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50
          ${
            notification.isError
              ? "bg-red-100 text-red-700"
              : "bg-green-100 text-green-700"
          }`}
        >
          {notification.message}
        </div>
      )}

      <GameBoard
        currentWord={gameState.tutorialWord}
        solution={gameState.solution}
        availableLetters={gameState.availableLetters}
        onSolutionChange={(solution, available) =>
          setGameState((prev) => ({
            ...prev,
            solution,
            availableLetters: available,
          }))
        }
        onValidate={handleValidate}
        onSubmit={handleSubmit}
        onRemoveWord={handleRemoveWord}
        wordIndex={0}
        totalWords={1}
        timeLeft={gameState.timeLeft}
        totalTime={gameState.totalTime}
        isTimeUp={gameState.isTimeUp}
        validatedWords={gameState.validatedWords}
        isTutorial={true}
      />
    </div>
  );
};

export default TutorialGame;
