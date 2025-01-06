import { useState, useEffect } from "react";
import { CheckCircle, XCircle } from "lucide-react";

const DebriefPage = ({ sessionId, prolificId, onComplete }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const response = await fetch(
          `${
            import.meta.env.VITE_API_URL
          }/api/game-results?sessionId=${sessionId}&prolificId=${prolificId}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch results");
        }
        const data = await response.json();
        setResults(data);
      } catch (error) {
        console.error("Error fetching results:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [sessionId, prolificId]);

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

  // Sort valid words by length (longer words first) then alphabetically
  const sortedValidWords = [...validWords].sort((a, b) => {
    if (b.length !== a.length) return b.length - a.length;
    return a.word.localeCompare(b.word);
  });

  // Sort invalid words similarly
  const sortedInvalidWords = [...(invalidWords || [])].sort((a, b) => {
    if (b.length !== a.length) return b.length - a.length;
    return a.word.localeCompare(b.word);
  });

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-4">Study Debrief</h2>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">Study Purpose</h3>
            <p className="text-gray-700">
              This study was designed to investigate participant behavior in
              word creation tasks. We were particularly interested in
              understanding how participants approach problem-solving and word
              generation under time pressure.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Your Results</h3>

            <div className="bg-white p-4 rounded-lg space-y-4">
              {/* Valid Words Section */}
              <div>
                <h4 className="font-medium mb-2">Valid Words Created:</h4>
                <div className="flex flex-wrap gap-2">
                  {sortedValidWords.length > 0 ? (
                    sortedValidWords.map((word, idx) => (
                      <span
                        key={`valid-${word.word}-${idx}`}
                        className="inline-flex items-center px-3 py-1 bg-green-50 text-green-700 rounded-full"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        {word.word} ({word.length} letters - {word.reward}p)
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500">
                      No valid words created
                    </span>
                  )}
                </div>
              </div>

              {/* Invalid Words Section */}
              {invalidWords?.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Invalid Attempts:</h4>
                  <div className="flex flex-wrap gap-2">
                    {sortedInvalidWords.map((word, idx) => (
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

              {/* Final Results Section */}
              <div className="bg-green-50 border border-green-100 rounded-lg p-6 mt-6">
                <h4 className="font-semibold text-green-800 mb-3">
                  Final Results
                </h4>
                <div className="space-y-2">
                  <p className="text-gray-700">
                    Valid words: {sortedValidWords.length}
                  </p>
                  {invalidWords?.length > 0 && (
                    <p className="text-gray-700">
                      Invalid attempts: {sortedInvalidWords.length}
                    </p>
                  )}
                  <div className="text-xl font-bold mt-4">
                    Your reward: {totalReward}p
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={onComplete}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors"
          >
            Continue to Completion
          </button>
        </div>
      </div>
    </div>
  );
};

export default DebriefPage;
