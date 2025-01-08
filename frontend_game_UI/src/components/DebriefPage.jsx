import React, { useState, useEffect } from "react";
import {
  CheckCircle,
  XCircle,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";

const DebriefPage = ({ sessionId, prolificId, onComplete }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);
  const [studyConfig, setStudyConfig] = useState(null);
  const [currentStep, setCurrentStep] = useState("results");
  const [resourceUsage, setResourceUsage] = useState({
    words: new Set(),
    none: false,
  });

  // Fetch both results and study config
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resultsRes, configRes] = await Promise.all([
          fetch(
            `${
              import.meta.env.VITE_API_URL
            }/api/game-results?sessionId=${sessionId}&prolificId=${prolificId}`
          ),
          fetch(`${import.meta.env.VITE_API_URL}/api/study-config`),
        ]);

        if (!resultsRes.ok || !configRes.ok) {
          throw new Error("Failed to fetch required data");
        }

        const [resultsData, configData] = await Promise.all([
          resultsRes.json(),
          configRes.json(),
        ]);

        setResults(resultsData);
        setStudyConfig(configData);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [sessionId, prolificId]);

  const handleResourceUsageChange = (word) => {
    if (word === "none") {
      setResourceUsage((prev) => ({
        words: new Set(),
        none: !prev.none,
      }));
    } else {
      const newWords = new Set(resourceUsage.words);
      if (newWords.has(word)) {
        newWords.delete(word);
      } else {
        newWords.add(word);
      }
      setResourceUsage({
        words: newWords,
        none: false,
      });
    }
  };

  const handleCompletion = async () => {
    try {
      const { validWords, invalidWords, anagramDetails } = results;
      const allWords = [...validWords, ...(invalidWords || [])];
      const selectedWords = Array.from(resourceUsage.words);

      // Create array of word-anagram pairs for selected words
      const wordsWithAnagrams = selectedWords.map((selectedWord) => {
        const wordInfo = allWords.find((w) => w.word === selectedWord);
        const anagramMatch = anagramDetails?.find((detail) =>
          detail.words.some(
            (w) => w.word.toUpperCase() === selectedWord.toUpperCase()
          )
        );
        return {
          word: selectedWord,
          length: wordInfo?.length,
          isValid: wordInfo?.reward !== undefined,
          anagramShown: anagramMatch?.anagram || "unknown",
        };
      });

      const eventDetails = {
        usedExternalResources: !resourceUsage.none,
        wordsWithExternalHelp: wordsWithAnagrams,
        // totalWordsChecked: allWords.length,
        // responseTimestamp: new Date().toISOString(),
      };

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/game-events`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            prolificId,
            phase: "debrief",
            eventType: "confessed_external_help",
            details: eventDetails,
            timestamp: new Date().toISOString(),
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to log resource usage response");
      }

      onComplete();
    } catch (error) {
      console.error("Error logging resource usage:", error);
      setError("Failed to submit response. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="text-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto" />
        <p className="text-gray-600 mt-2">Loading results...</p>
      </div>
    );
  }

  if (error || !results) {
    return (
      <div className="text-center p-4">
        <p className="text-red-600">Error loading results: {error}</p>
      </div>
    );
  }

  const { validWords, invalidWords, totalReward } = results;
  const allWords = [...validWords, ...(invalidWords || [])].sort((a, b) => {
    if (b.length !== a.length) return b.length - a.length;
    return a.word.localeCompare(b.word);
  });

  // Step 1: Results Display
  if (currentStep === "results") {
    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Your Results
          </h2>

          <div className="space-y-6">
            {/* Valid Words Section */}
            <div>
              <h3 className="font-semibold mb-3">Valid Words Created:</h3>
              <div className="flex flex-wrap gap-2">
                {validWords.length > 0 ? (
                  validWords.map((word, idx) => (
                    <span
                      key={`valid-${word.word}-${idx}`}
                      className="inline-flex items-center px-3 py-1 bg-green-50 text-green-700 rounded-full"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      {word.word} ({word.length} letters - {word.reward}p)
                    </span>
                  ))
                ) : (
                  <span className="text-gray-500">No valid words created</span>
                )}
              </div>
            </div>

            {/* Invalid Words Section */}
            {invalidWords?.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">Invalid Attempts:</h3>
                <div className="flex flex-wrap gap-2">
                  {invalidWords.map((word, idx) => (
                    <span
                      key={`invalid-${word.word}-${idx}`}
                      className="inline-flex items-center px-3 py-1 bg-red-50 text-red-700 rounded-full"
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      {word.word} ({word.length} letters)
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Summary Stats */}
            {/* <div className="bg-blue-50 border border-blue-100 rounded-lg p-6">
              <h3 className="font-semibold text-blue-800 mb-3">Summary</h3>
              <div className="space-y-2 text-gray-700">
                <p>Total valid words: {validWords.length}</p>
                {invalidWords?.length > 0 && (
                  <p>Invalid attempts: {invalidWords.length}</p>
                )}
                <p className="text-xl font-bold mt-4">
                  Your earned reward: {totalReward}p
                </p>
              </div>
            </div> */}
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-6">
              <h3 className="font-semibold text-blue-800 mb-3">Summary</h3>
              <div className="space-y-2 text-gray-700">
                <p>Total valid words: {validWords.length}</p>
                {invalidWords?.length > 0 && (
                  <p>Invalid attempts: {invalidWords.length}</p>
                )}

                {/* Calculate the displayed reward */}
                <p className="text-xl font-bold mt-4">
                  Your earned reward: {Math.min(totalReward, 120)}p
                </p>

                {/* Conditional message if the reward exceeds 120p */}
                {totalReward > 120 && (
                  <p className="text-sm font-medium text-blue-700 mt-2">
                    Maximum of 120p was assigned, with up to 40p per word
                    solving
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={() => setCurrentStep("debrief")}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              Continue to Study Debrief
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Study Debrief and Reward Update
  if (currentStep === "debrief") {
    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Let us reveal some important details about this study
          </h2>

          <div className="space-y-6">
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-3">
                Study Purpose and Methods
              </h3>
              <p className="text-gray-700 space-y-4">
                This study investigated participant behavior in word creation
                tasks, specifically focusing on detecting potential cheating
                during problem-solving. During the game, we implemented several
                monitoring mechanisms:
              </p>
              <ul className="list-disc list-inside mt-3 mb-4 space-y-2 text-gray-700">
                <li>Page focus and visibility tracking</li>
                <li>Mouse movement and inactivity detection</li>
                <li>Time spent on each word</li>
                <li>Word validation patterns</li>
              </ul>
              <p className="text-gray-700 mt-4">
                Additionally, the word meaning check was implemented to identify
                if participants obtained words from external sources rather than
                creating them independently during gameplay.
              </p>
              <p className="text-gray-700 mt-4">
                This transparency in data collection aligns with our research
                ethics standards. All collected data remains confidential and
                will be used solely for research purposes.
              </p>
              <p className="text-gray-700 font-semibold mt-4">
                Your participation contributes to important research on
                problem-solving behavior and online assessment integrity. Thank
                you for your participation.
              </p>
            </div>

            <div className="bg-green-50 border border-green-100 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-green-800 mb-3">
                Additional Information
              </h3>
              <p className="text-gray-700 mb-4">
                We appreciate your participation and effort in this study. To
                ensure fair compensation, we have decided to award the maximum
                bonus of {studyConfig?.compensation?.max_reward_per_anagram}p
                per word to all participants, regardless of the performance.
              </p>
              <p className="text-xl font-bold text-green-700">
                Your final reward:{" "}
                {studyConfig?.compensation?.max_reward_per_anagram *
                  studyConfig?.game_anagrams}
                p ({studyConfig?.compensation?.max_reward_per_anagram}p ×{" "}
                {studyConfig?.game_anagrams} anagrams)
              </p>
            </div>

            <button
              onClick={() => setCurrentStep("feedback")}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              Continue to Final Step
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (currentStep === "feedback") {
    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="space-y-6">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <div className="flex items-start gap-3 mb-6 ">
                <AlertTriangle className="h-7 w-7 text-amber-500 " />
                <div className="space-y-2.5">
                  <h3 className="font-semibold text-gray-800 ">
                    Final Question
                  </h3>
                  <p className="text-gray-700">
                    We noticed some discrepancies in your response patterns.{" "}
                    <br />
                    Did you use any external help (such as websites or mobile
                    apps) for finding words?
                  </p>
                  <p className="text-sm text-gray-500">
                    You can select multiple words where you used external help.
                    This will not affect your participation credit or final
                    reward amount
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {/* Map through all words (valid and invalid) */}
                {allWords.map((word) => (
                  <label
                    key={word.word}
                    className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-blue-50 transition-colors duration-200"
                  >
                    <input
                      type="checkbox"
                      checked={resourceUsage.words.has(word.word)}
                      onChange={() => handleResourceUsageChange(word.word)}
                      disabled={resourceUsage.none}
                      className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="flex items-center gap-2">
                      <span>{word.word}</span>
                      {/* <span
                        className={`text-sm ${
                          word.reward ? "text-gray-500" : "text-red-500"
                        }`}
                      >
                        ({word.length} letters
                        {word.reward ? ` - ${word.reward}p` : " - Invalid"})
                      </span> */}
                    </span>
                  </label>
                ))}
                <label className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-blue-50 transition-colors duration-200">
                  <input
                    type="checkbox"
                    checked={resourceUsage.none}
                    onChange={() => handleResourceUsageChange("none")}
                    className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span>No! I did not use any external help</span>
                </label>
              </div>
            </div>

            <button
              onClick={handleCompletion}
              disabled={resourceUsage.words.size === 0 && !resourceUsage.none}
              className={`w-full py-3 rounded-lg font-medium transition-colors ${
                resourceUsage.words.size === 0 && !resourceUsage.none
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              Continue to Completion
            </button>
            {resourceUsage.words.size === 0 && !resourceUsage.none && (
              <p className="text-red-400 text-sm text-center mt-2">
                Please select at least one checkbox to continue
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }
};

export default DebriefPage;
