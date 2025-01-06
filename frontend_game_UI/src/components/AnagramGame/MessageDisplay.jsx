import { useState, useEffect } from "react";
import { Info, ArrowRight } from "lucide-react";

const MessageDisplay = ({ message, onMessageShown }) => {
  const [isReady, setIsReady] = useState(false);
  const [hasRead, setHasRead] = useState(false);
  const [remainingTime, setRemainingTime] = useState(5);
  const minReadTime = 5000; // Minimum time to show message (5 seconds)

  // Effect for the countdown timer
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
              {/* <p className="text-sm text-blue-600">
                Please read this message carefully before proceeding
              </p> */}
            </div>
          </div>
        </div>

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
              I understand, continue <ArrowRight className="w-5 h-5" />
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
