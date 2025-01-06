import React, { useState, useEffect, useCallback, useRef } from "react";
import { AlertTriangle, Info } from "lucide-react";

const WordMeaningCheck = ({
  validatedWords = [],
  sessionId,
  prolificId,
  onComplete,
}) => {
  // State management
  const [currentIndex, setCurrentIndex] = useState(0);
  const [meanings, setMeanings] = useState({});
  const [uniqueWords, setUniqueWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Tracking refs
  const startTime = useRef(new Date());
  const lastActionTime = useRef(new Date());
  const wordStartTime = useRef(new Date());
  const isSubmitted = useRef(false);
  const lastUserActivity = useRef(Date.now());
  const inactivityCheckInterval = useRef(null);
  const isInactive = useRef(false);
  const ignoreNextBlur = useRef(false);

  // Initialize unique words
  // In WordMeaningCheck.jsx
  useEffect(() => {
    try {
      // Get unique words from all validated words
      const uniqueWordsMap = new Map();
      validatedWords.forEach((word) => {
        if (!uniqueWordsMap.has(word.word)) {
          uniqueWordsMap.set(word.word, word);
        }
      });
      const unique = Array.from(uniqueWordsMap.values());
      setUniqueWords(unique);
      setLoading(false);

      // Log meaning check start
      logEvent("meaning_check_start", {
        totalUniqueWords: unique.length,
        words: unique.map((w) => w.word),
      });
    } catch (error) {
      console.error("Error initializing word meaning check:", error);
      setError("Failed to initialize word meanings");
      setLoading(false);
    }
  }, [validatedWords]);

  // Log events to MongoDB
  // In WordMeaningCheck.jsx, update the logEvent function:

  const logEvent = useCallback(
    async (eventType, details = {}) => {
      if (!sessionId || !prolificId) return;

      try {
        const eventBody = {
          sessionId,
          prolificId,
          phase: "meaning_check",
          eventType,
          details: {
            word: details.word || uniqueWords[currentIndex]?.word,
            wordLength: details.wordLength || uniqueWords[currentIndex]?.length,
            timeSpent: Date.now() - wordStartTime.current,
            providedMeaning: details.providedMeaning,
            anagram: details.anagram,
            wordIndex: details.wordIndex,
          },
          timestamp: new Date().toISOString(),
        };

        await fetch("/api/game-events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(eventBody),
        });
      } catch (error) {
        console.error("Event logging error:", error);
      }
    },
    [sessionId, prolificId, uniqueWords, currentIndex]
  );

  // Activity tracking
  useEffect(() => {
    if (isSubmitted.current) return;

    let isPageActive = true;
    let currentFocus = true;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        isPageActive = false;
        isInactive.current = false;
        logEvent("page_leave");
      } else {
        isPageActive = true;
        lastUserActivity.current = Date.now();
        logEvent("page_return");
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
        logEvent("page_leave");
      }
    };

    const handleWindowFocus = () => {
      const wasFocused = currentFocus;
      currentFocus = true;
      if (!wasFocused && !document.hidden) {
        isPageActive = true;
        lastUserActivity.current = Date.now();
        logEvent("page_return");
      }
    };

    const handleUserActivity = () => {
      if (!isPageActive || isSubmitted.current) return;
      lastUserActivity.current = Date.now();
      if (isInactive.current) {
        logEvent("mouse_active");
        isInactive.current = false;
      }
    };

    // Override alert to prevent blur event
    const originalAlert = window.alert;
    window.alert = function (message) {
      ignoreNextBlur.current = true;
      return originalAlert.call(window, message);
    };

    inactivityCheckInterval.current = setInterval(() => {
      if (!isPageActive || isSubmitted.current) return;
      const timeSinceLastActivity = Date.now() - lastUserActivity.current;
      if (!isInactive.current && timeSinceLastActivity > 5000) {
        logEvent("mouse_inactive_start");
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
  }, [logEvent]);

  // Handle meaning submission
  const handleSubmit = async (meaning) => {
    const currentWord = uniqueWords[currentIndex];
    if (!currentWord) return;

    const timeSpent = Date.now() - wordStartTime.current;

    // Log meaning submission
    await logEvent("meaning_submission", {
      anagram: currentWord.anagram,
      word: currentWord.word,
      providedMeaning: meaning,
      wordIndex: currentIndex,
    });

    // Update meanings state
    setMeanings((prev) => ({
      ...prev,
      [currentWord.word]: meaning,
    }));

    // Move to next word or complete
    if (currentIndex < uniqueWords.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      wordStartTime.current = new Date();
    } else {
      // Complete meaning check
      try {
        isSubmitted.current = true;
        const meaningData = uniqueWords.map((word) => ({
          word: word.word,
          providedMeaning: meanings[word.word] || meaning,
          isCorrect: null, // Will be validated by backend
        }));

        await fetch("/api/meanings/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            prolificId,
            phase: "meaning_check",
            wordMeanings: meaningData,
            completedAt: new Date().toISOString(),
            totalTimeSpent: Date.now() - startTime.current,
          }),
        });

        // Log completion
        await logEvent("meaning_check_complete", {
          totalWords: uniqueWords.length,
          totalTimeSpent: Date.now() - startTime.current,
        });

        onComplete(meaningData);
      } catch (error) {
        console.error("Failed to submit meanings:", error);
        setError("Failed to submit meanings. Please try again.");
        isSubmitted.current = false;
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-6 bg-red-50 rounded-lg">
        <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!uniqueWords.length) {
    return (
      <div className="text-center p-6 bg-red-50 rounded-lg">
        <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
        <p className="text-red-600">No words available for meaning check.</p>
      </div>
    );
  }

  const currentWord = uniqueWords[currentIndex];

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="bg-blue-50 p-6 rounded-lg">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-500 mt-0.5" />
          <div className="space-y-2">
            <p className="text-blue-700">
              Please provide the meaning of each word you created during the
              anagram task, based on your understanding.
            </p>
            <p className="text-sm text-blue-600">
              Your responses help us understand how you approached the
              word-creation task.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        {/* Progress Bar */}
        <div className="mb-4 flex items-center justify-between text-sm text-gray-500">
          <span>
            Word {currentIndex + 1} of {uniqueWords.length}
          </span>
          <div className="w-32 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-300"
              style={{
                width: `${((currentIndex + 1) / uniqueWords.length) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Word Display */}
        <div className="text-center mb-6">
          <h3 className="text-3xl font-bold text-blue-600">
            {currentWord.word}
          </h3>
          <p className="text-gray-500 text-sm mt-1">
            ({currentWord.length} letters • {currentWord.reward || 0}p reward)
          </p>
        </div>

        {/* Input Area */}
        <div className="space-y-4">
          <textarea
            className="w-full p-4 border rounded-lg focus:ring-2 focus:ring-blue-500 
                     focus:border-blue-500 min-h-[120px] text-gray-700"
            value={meanings[currentWord.word] || ""}
            onChange={(e) =>
              setMeanings((prev) => ({
                ...prev,
                [currentWord.word]: e.target.value,
              }))
            }
            placeholder="What does this word mean to you?"
          />

          <button
            onClick={() => handleSubmit(meanings[currentWord.word])}
            disabled={!meanings[currentWord.word]?.trim()}
            className={`w-full py-3 px-6 rounded-lg font-medium transition-all duration-200
              ${
                meanings[currentWord.word]?.trim()
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
          >
            {currentIndex < uniqueWords.length - 1 ? "Next Word" : "Complete"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WordMeaningCheck;
