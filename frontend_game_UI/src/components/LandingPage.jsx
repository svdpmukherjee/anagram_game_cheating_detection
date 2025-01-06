import { useState, useEffect } from "react";
import { AlertTriangle, Clock, Award, Shield, Target } from "lucide-react";
import Container from "./Container";
import CoinIcon from "./CoinIcon";

const LandingPage = ({ onStartStudy }) => {
  const [studyConfig, setStudyConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isChecked, setIsChecked] = useState(false);

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
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const handleExit = () => {
    window.location.href = "https://www.prolific.co";
  };

  if (loading) {
    return (
      <Container>
        <div className="flex flex-col items-center justify-center min-h-[200px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4" />
          <div className="text-gray-600">Loading study information...</div>
        </div>
      </Container>
    );
  }
  if (error) {
    return (
      <Container>
        <div className="text-center space-y-4">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-semibold text-red-600">
            Failed to Load Study
          </h2>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            Try Again
          </button>
        </div>
      </Container>
    );
  }

  const totalTime =
    studyConfig.timeSettings.tutorial_time +
    studyConfig.timeSettings.game_time * 3 +
    studyConfig.timeSettings.survey_time;

  return (
    <Container>
      <div className="max-w-4xl mx-auto space-y-6 mb-8">
        {/* Header Section */}
        <section className="text-center bg-gray-50 p-6 rounded-xl">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Anagram Word Game Study
          </h2>
          <p className="text-lg text-gray-700">
            Create Valid English words from scrambled letters. Longer words earn
            higher rewards!
          </p>
        </section>

        {/* Study Overview */}
        <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Target className="h-5 w-5 text-blue-600 mr-2" />
            Study Overview
          </h3>
          <div className="bg-blue-50 p-6 rounded-lg">
            {/* <div className="flex items-center gap-2 mb-4">
              <ListCheck className="h-5 w-5 text-blue-600" />
              <h4 className="text-lg font-semibold text-gray-800">
                Game Rules
              </h4>
            </div> */}
            <ul className="space-y-4">
              <li className="flex items-start">
                <span className="bg-blue-100 rounded-full p-1 mr-2 mt-0.5">
                  <span className="block h-1.5 w-1.5 bg-blue-600 rounded-full"></span>
                </span>
                You will receive {studyConfig.game_anagrams} different sets of
                scrambled letters, each containing {""}
                {Math.max(...Object.keys(studyConfig.rewards).map(Number))}{" "}
                letters
              </li>
              <li className="flex items-start">
                <span className="bg-blue-100 rounded-full p-1 mr-2 mt-0.5">
                  <span className="block h-1.5 w-1.5 bg-blue-600 rounded-full"></span>
                </span>
                <span>
                  Use these letters to create{" "}
                  <span className="font-semibold">valid</span> English words of
                  varying lengths, with a{" "}
                  <span className="font-semibold">
                    minimum of{" "}
                    {Math.min(...Object.keys(studyConfig.rewards).map(Number))}{" "}
                    letters
                  </span>
                </span>
              </li>
              <li className="flex items-start">
                <span className="bg-blue-100 rounded-full p-1 mr-2 mt-0.5">
                  <span className="block h-1.5 w-1.5 bg-blue-600 rounded-full"></span>
                </span>
                Validate each word you create when you are confident
              </li>
              <li className="flex items-start">
                <span className="bg-blue-100 rounded-full p-1 mr-2 mt-0.5">
                  <span className="block h-1.5 w-1.5 bg-blue-600 rounded-full"></span>
                </span>
                Submit your solutions when ready
              </li>
            </ul>
          </div>
        </section>

        {/* Time and Compensation Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Time Commitment Section */}
          <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-5 w-5 text-green-600" />
              <h4 className="text-lg font-semibold text-gray-800">
                Time Commitment
              </h4>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <ul className="text-md text-gray-600 space-y-3">
                <li className="flex items-start">
                  <span className="bg-green-100 rounded-full p-1 mr-2 mt-0.5">
                    <span className="block h-1.5 w-1.5 bg-green-600 rounded-full"></span>
                  </span>
                  Practice round (1 word,{" "}
                  {studyConfig.timeSettings.tutorial_time / 60} minutes)
                </li>
                <li className="flex items-start">
                  <span className="bg-green-100 rounded-full p-1 mr-2 mt-0.5">
                    <span className="block h-1.5 w-1.5 bg-green-600 rounded-full"></span>
                  </span>
                  Game round ({studyConfig.game_anagrams} words,{" "}
                  {studyConfig.timeSettings.game_time / 60} minutes each)
                </li>
                <li className="flex items-start">
                  <span className="bg-green-100 rounded-full p-1 mr-2 mt-0.5">
                    <span className="block h-1.5 w-1.5 bg-green-600 rounded-full"></span>
                  </span>
                  Quick survey ({studyConfig.timeSettings.survey_time / 60}{" "}
                  minutes)
                </li>
              </ul>
              <p className="font-medium text-gray-700 mt-4">
                Total time: ~{Math.ceil(totalTime / 60)} minutes
              </p>
            </div>
          </section>

          {/* Compensation Section */}
          <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <Award className="h-5 w-5 text-amber-600" />
              <h4 className="text-lg font-semibold text-gray-800">
                Compensation
              </h4>
            </div>
            <div className="bg-amber-50 p-4 rounded-lg">
              <p className="font-medium text-gray-800 mb-4">
                Base compensation: {studyConfig.compensation.prolific_rate}
              </p>
              <h5 className="font-medium text-gray-700 mb-2">
                Additional rewards per word:
              </h5>
              <div className="space-y-2">
                {Object.entries(studyConfig.rewards)
                  .sort(([a], [b]) => Number(b) - Number(a))
                  .map(([length, reward]) => (
                    <div key={length} className="flex items-center">
                      <CoinIcon className="h-5 w-5 text-amber-600 mr-2" />
                      <span className="text-gray-600 text-sm">
                        {reward}p for {length}-letter words
                      </span>
                    </div>
                  ))}
              </div>
              <p className=" bg-yellow-50 rounded-lg mt-4 text-yellow-800">
                Maximum reward per anagram:{" "}
                {studyConfig.compensation.max_reward_per_anagram}p
              </p>
            </div>
          </section>
        </div>

        {/* Privacy Section */}
        <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="h-6 w-6 text-blue-600 fill-blue-300" />
            <h3 className="text-xl font-semibold text-gray-800">
              Data Collection and Privacy
            </h3>
          </div>

          <div className="space-y-4 text-gray-700">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">We collect:</h4>
              <ul className="space-y-2">
                {[
                  "Word solutions and solving patterns",
                  "Response times and word creation strategies",
                  "Game interactions",
                  "Survey responses",
                  "Basic demographic information",
                ].map((item, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="bg-blue-100 rounded-full p-1 mt-1">
                      <span className="block h-1.5 w-1.5 bg-blue-600 rounded-full"></span>
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-3">
              <p className="flex items-start gap-2">
                <Shield className="h-5 w-5 text-green-600 flex-shrink-0 fill-green-300" />
                Your personal data will be strictly pseudonymized and securely
                stored at the University of Luxembourg.
              </p>
              <p className="flex items-start gap-2">
                <Shield className="h-5 w-5 text-green-600 flex-shrink-0 fill-green-300" />
                Only the researchers working on this study will have the access
                to these data.
              </p>
              <p className="flex items-start gap-2">
                <Shield className="h-5 w-5 text-green-600 flex-shrink-0 fill-green-300" />
                The data collected during the study will only be used for the
                research project.
              </p>
              <p className="flex items-start gap-2">
                <Shield className="h-5 w-5 text-green-600 flex-shrink-0 fill-green-300" />
                The data will be used for publications without personally
                identifying you.
              </p>
            </div>
          </div>
        </section>

        {/* Consent Section */}
        <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
          <div className="flex items-center gap-3 mb-6">
            <input
              type="checkbox"
              id="consent"
              checked={isChecked}
              onChange={() => setIsChecked(!isChecked)}
              className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <label htmlFor="consent" className="text-gray-700">
              I have read and understood the above information and agree to
              participate in this study.
            </label>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <button
              onClick={onStartStudy}
              disabled={!isChecked}
              className={`
                w-full sm:w-auto px-8 py-3 rounded-lg font-medium transition-all duration-200
                ${
                  isChecked
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "bg-gray-200 text-gray-500 cursor-not-allowed"
                }
              `}
            >
              Start Study
            </button>
            <button
              onClick={() => {
                if (window.confirm("Are you sure you want to exit?")) {
                  handleExit();
                }
              }}
              className="w-full sm:w-auto px-8 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium"
            >
              I do not want to participate
            </button>
          </div>
        </div>
      </div>
    </Container>
  );
};

export default LandingPage;
