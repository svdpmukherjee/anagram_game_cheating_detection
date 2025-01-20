import { useState, useEffect, useRef } from "react";
import { Info, ArrowRight, AlertTriangle } from "lucide-react";

const MessageDisplay = ({ message, onMessageShown }) => {
  const [isReady, setIsReady] = useState(false);
  const [hasRead, setHasRead] = useState(false);
  const [remainingTime, setRemainingTime] = useState(10);
  const [studyConfig, setStudyConfig] = useState(null);
  const [error, setError] = useState(null);
  const minReadTime = 10000;
  const messageStartTime = useRef(new Date());

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
      const timeSpent = Math.round(
        (new Date() - messageStartTime.current) / 1000
      );
      // Ensure we pass the complete message object with all properties
      onMessageShown?.({
        messageId: message.id,
        messageText: message.text,
        timeSpentOnMessage: timeSpent,
        theory: message.theory,
        variation: message.variation,
      });
    }
  }, [hasRead, message, onMessageShown]);

  if (!message?.text) return null;

  if (error) {
    return (
      <div className="text-center p-4 space-y-2">
        <AlertTriangle className="h-6 w-6 text-red-500 mx-auto" />
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!studyConfig) return null;

  const gameTime = studyConfig.timeSettings.game_time / 60;

  // Split message text into main message and variation text
  const [mainMessage, variationText] = message.text
    .split("!")
    .map((text) => text.trim());

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <div className="bg-gradient-to-r from-blue-50 to-blue-50 p-6 rounded-lg">
          <div className="flex items-start gap-4">
            <Info className="h-7 w-7 text-blue-600 flex-shrink-0 mt-1" />
            <div className="space-y-4">
              {/* Main message with larger font and primary color */}
              <p className="text-2xl font-semibold text-blue-900 leading-relaxed">
                {mainMessage}!
              </p>
              {/* Variation text with different styling */}
              {variationText && (
                <p className="text-xl  leading-relaxed mt-2 border-t border-blue-200 pt-4">
                  {variationText}
                </p>
              )}
            </div>
          </div>
        </div>

        {isReady && (
          <div className="mt-10 p-4 rounded-lg border border-gray-200 bg-gray-50">
            <p className="text-gray-900 font-medium">Next Steps:</p>
            <p className="text-gray-800 mt-2">
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
