import { useState, useEffect } from "react";
import { Info, ArrowRight, AlertTriangle } from "lucide-react";

const MessageDisplay = ({ message, onMessageShown }) => {
  const [isReady, setIsReady] = useState(false);
  const [hasRead, setHasRead] = useState(false);
  const [remainingTime, setRemainingTime] = useState(10);
  const [studyConfig, setStudyConfig] = useState(null);
  const [error, setError] = useState(null);
  const minReadTime = 10000; // Minimum time to show message (10 seconds)

  // Fetch study configuration
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/study-config`
        );
        if (!response.ok) {
          throw new Error(
            `Failed to fetch study config: ${response.statusText}`
          );
        }
        const data = await response.json();
        setStudyConfig(data);
      } catch (error) {
        console.error("Error fetching study config:", error);
        setError(error.message);
      }
    };
    fetchConfig();
  }, []);

  // Effect for the countdown timer
  useEffect(() => {
    if (message?.id && !isReady) {
      const timer = setTimeout(() => {
        setIsReady(true);
        setRemainingTime(0);
      }, minReadTime);

      const interval = setInterval(() => {
        setRemainingTime((prev) => Math.max(0, prev - 1));
      }, 1000);

      return () => {
        clearTimeout(timer);
        clearInterval(interval);
      };
    }
  }, [message?.id]);

  useEffect(() => {
    if (hasRead && message?.id) {
      onMessageShown?.();
    }
  }, [hasRead, message, onMessageShown]);

  if (!message?.text) return null;

  // Show error state if config fetch fails
  if (error) {
    return (
      <div className="text-center p-4 space-y-2">
        <AlertTriangle className="h-6 w-6 text-red-500 mx-auto" />
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  // Wait for config to load
  if (!studyConfig) {
    return null;
  }

  const gameTime = studyConfig.timeSettings.game_time / 60; // Convert to minutes

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <div className="bg-blue-50 p-6 rounded-lg">
          <div className="flex items-start gap-4">
            <Info className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
            <div className="space-y-4">
              <p className="text-lg text-blue-800 leading-relaxed font-medium">
                {message.text}
              </p>
            </div>
          </div>
        </div>
        {isReady && (
          <div className="mt-4 p-4 rounded-lg border border-blue-200">
            <p className="text-blue-900 font-medium">Next Steps:</p>
            <p className="text-blue-800 mt-2">
              You will now solve {studyConfig.game_anagrams} similar word
              puzzles with {gameTime} minutes for each
            </p>
          </div>
        )}

        <button
          onClick={() => setHasRead(true)}
          disabled={!isReady}
          className={`
            w-full mt-6 py-3 rounded-lg font-medium
            transition-all duration-200 flex items-center justify-center gap-2
            ${
              isReady
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }
          `}
        >
          {isReady ? (
            <>
              I understand, Continue <ArrowRight className="w-5 h-5" />
            </>
          ) : (
            `Please wait ${remainingTime} seconds...`
          )}
        </button>
      </div>
    </div>
  );
};

export default MessageDisplay;
