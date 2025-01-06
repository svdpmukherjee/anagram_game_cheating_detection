import { useState, useEffect } from "react";
import LandingPage from "./components/LandingPage";
import ProlificIdPage from "./components/ProlificIdPage";
import TutorialGame from "./components/AnagramGame/TutorialGame";
import TestPage from "./components/TestPage";
import SurveyPage from "./components/SurveyPage";
import DebriefPage from "./components/DebriefPage";
import ThankYouPage from "./components/ThankYouPage";
import WordMeaningCheck from "./components/AnagramGame/WordMeaningCheck";

const STEPS = {
  LANDING: {
    id: "landing",
    progress: 0,
    title: "Welcome to the Anagram Study",
  },
  PROLIFIC_ID: {
    id: "prolific_id",
    progress: 10,
    step: 1,
    title: "Participant Registration",
  },
  TUTORIAL: { id: "tutorial", progress: 30, step: 2, title: "Practice Round" },
  MAIN_GAME: {
    id: "main_game",
    progress: 50,
    step: 3,
    title: "Anagram Challenge",
  },
  SURVEY: { id: "survey", progress: 70, step: 4, title: "Quick Survey" },
  WORD_MEANING: {
    id: "word_meaning",
    progress: 85,
    step: 5,
    title: "Word Meanings",
  },
  DEBRIEF: { id: "debrief", progress: 90, step: 6, title: "Study Debrief" },
  THANK_YOU: { id: "thank_you", progress: 100, step: 7, title: "Thank You" },
};

function App() {
  const [currentStep, setCurrentStep] = useState(STEPS.LANDING.id);
  const [sessionId, setSessionId] = useState(null);
  const [prolificId, setProlificId] = useState("");
  const [validatedWords, setValidatedWords] = useState([]);
  const [isInitializing, setIsInitializing] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentStep]);

  const initializeSession = async (id) => {
    try {
      const response = await fetch("/api/initialize-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prolificId: id,
          metadata: {
            browser: navigator.userAgent,
            platform: navigator.platform,
            screenSize: {
              width: window.innerWidth,
              height: window.innerHeight,
            },
          },
        }),
      });

      if (!response.ok) throw new Error("Failed to initialize session");
      const data = await response.json();
      return data.sessionId;
    } catch (error) {
      console.error("Session initialization error:", error);
      throw error;
    }
  };

  const handleStartStudy = () => setCurrentStep(STEPS.PROLIFIC_ID.id);

  const handleProlificIdSubmit = async (id) => {
    setIsInitializing(true);
    try {
      setProlificId(id);
      const newSessionId = await initializeSession(id);
      setSessionId(newSessionId);
      setSessionStartTime(new Date());
      setCurrentStep(STEPS.TUTORIAL.id);
    } catch (error) {
      console.error("Error during initialization:", error);
      alert("Failed to initialize session. Please try again.");
    } finally {
      setIsInitializing(false);
    }
  };

  const handleTutorialComplete = () => setCurrentStep(STEPS.MAIN_GAME.id);

  const handleMainGameComplete = (words) => {
    setValidatedWords(words);
    setCurrentStep(STEPS.SURVEY.id);
  };

  const handleSurveyComplete = () => {
    setCurrentStep(STEPS.WORD_MEANING.id);
  };

  const handleMeaningCheckComplete = async (meanings) => {
    if (!sessionId || !prolificId) {
      console.error("Missing session ID or Prolific ID");
      alert("Session error. Please try refreshing the page.");
      return;
    }

    try {
      const response = await fetch("/api/meanings/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          prolificId,
          wordMeanings: meanings.map((m) => ({
            word: m.word,
            providedMeaning: m.providedMeaning,
            isCorrect: null,
          })),
          completedAt: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to submit meanings");
      }

      // Only proceed if submission was successful
      setCurrentStep(STEPS.DEBRIEF.id);
    } catch (error) {
      console.error("Error submitting meanings:", error);
      alert(
        error.message || "Failed to submit word meanings. Please try again."
      );
    }
  };

  const handleDebriefComplete = () => {
    setCurrentStep(STEPS.THANK_YOU.id);
  };

  const getCurrentStep = () => {
    return (
      Object.values(STEPS).find((step) => step.id === currentStep) ||
      STEPS.LANDING
    );
  };

  const renderPage = () => {
    switch (currentStep) {
      case STEPS.LANDING.id:
        return <LandingPage onStartStudy={handleStartStudy} />;

      case STEPS.PROLIFIC_ID.id:
        return (
          <ProlificIdPage
            onSubmit={handleProlificIdSubmit}
            initialValue={prolificId}
            isInitializing={isInitializing}
          />
        );

      case STEPS.TUTORIAL.id:
        return (
          <TutorialGame
            prolificId={prolificId}
            sessionId={sessionId}
            onComplete={handleTutorialComplete}
          />
        );

      case STEPS.MAIN_GAME.id:
        return (
          <TestPage
            prolificId={prolificId}
            sessionId={sessionId}
            onComplete={handleMainGameComplete}
          />
        );

      case STEPS.SURVEY.id:
        return <SurveyPage onComplete={handleSurveyComplete} />;

      case STEPS.WORD_MEANING.id:
        return (
          <WordMeaningCheck
            validatedWords={validatedWords}
            sessionId={sessionId}
            prolificId={prolificId}
            onComplete={handleMeaningCheckComplete}
          />
        );

      case STEPS.DEBRIEF.id:
        return (
          <DebriefPage
            sessionId={sessionId}
            prolificId={prolificId}
            onComplete={handleDebriefComplete}
          />
        );

      case STEPS.THANK_YOU.id:
        return (
          <ThankYouPage
            prolificId={prolificId}
            startTime={sessionStartTime?.toISOString()}
            endTime={new Date().toISOString()}
          />
        );

      default:
        return <div>Unknown step</div>;
    }
  };

  const currentStepInfo = getCurrentStep();

  return (
    <div className="min-h-screen bg-gray-50">
      {currentStep !== STEPS.LANDING.id && (
        <div className="fixed top-0 left-0 w-full h-2 bg-gray-200">
          <div
            className="h-full bg-blue-600 transition-all duration-300"
            style={{ width: `${currentStepInfo.progress}%` }}
          />
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-8">
        {currentStep !== STEPS.LANDING.id && (
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              {currentStepInfo.title}
            </h1>
            {currentStepInfo.step && (
              <div className="flex items-center justify-center gap-2">
                <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                  Step {currentStepInfo.step} of{" "}
                  {Object.values(STEPS).length - 2}
                </span>
              </div>
            )}
          </div>
        )}

        {renderPage()}
      </div>
    </div>
  );
}

export default App;
