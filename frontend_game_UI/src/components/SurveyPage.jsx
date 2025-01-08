import React, { useState } from "react";
import {
  ExternalLink,
  CheckCircle,
  ArrowRight,
  ClipboardCopy,
} from "lucide-react";
import Container from "./Container";

const SurveyPage = ({ onComplete }) => {
  const [surveyCode, setSurveyCode] = useState("");
  const [codeError, setCodeError] = useState(false);
  const [surveyOpened, setSurveyOpened] = useState(false);

  const handleSurveyCodeSubmit = () => {
    if (surveyCode.trim().toLowerCase() === "12345") {
      setCodeError(false);
      onComplete();
    } else {
      setCodeError(true);
    }
  };

  const handleOpenSurvey = () => {
    window.open("https://ulsurvey.uni.lu/", "_blank");
    setSurveyOpened(true);
  };

  return (
    <Container>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="text-center space-y-2">
          {/* <h2 className="text-2xl font-bold text-gray-800">Quick Survey</h2> */}
          <p className="text-gray-600">
            Please complete a brief survey about your game experience
          </p>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Steps Section */}
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6">
            <h3 className="text-lg font-semibold text-blue-800 mb-4">
              Follow these steps:
            </h3>
            <div className="space-y-4">
              {/* Step 1 */}
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                  1
                </div>
                <div>
                  <p className="font-medium text-gray-800">Open the survey</p>
                  <p className="text-gray-600 text-sm mt-1">
                    Click the button below to start the survey in a new tab
                  </p>
                  <button
                    onClick={handleOpenSurvey}
                    className="mt-3 inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
                  >
                    Open Survey <ExternalLink className="ml-2 h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                  2
                </div>
                <div>
                  <p className="font-medium text-gray-800">
                    Complete all questions
                  </p>
                  <p className="text-gray-600 text-sm mt-1">
                    Answer all survey questions honestly and thoroughly
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                  3
                </div>
                <div>
                  <p className="font-medium text-gray-800">
                    Get completion code
                  </p>
                  <p className="text-gray-600 text-sm mt-1">
                    Copy the code shown at the end of the survey
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                  4
                </div>
                <div>
                  <p className="font-medium text-gray-800">Submit the code</p>
                  <p className="text-gray-600 text-sm mt-1">
                    Enter the code below to continue
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Code Input Section */}
          <div className="p-6 bg-white">
            <div className="space-y-4">
              <label className="block">
                <span className="text-gray-700 font-medium">
                  Survey Completion Code
                </span>
                <div className="mt-1 relative">
                  <input
                    type="text"
                    value={surveyCode}
                    onChange={(e) => {
                      setSurveyCode(e.target.value);
                      setCodeError(false);
                    }}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors
                      ${
                        codeError
                          ? "border-red-300 bg-red-50"
                          : "border-gray-300"
                      }
                      ${surveyOpened ? "bg-white" : "bg-gray-50"}`}
                    placeholder="Enter the code from the survey"
                    disabled={!surveyOpened}
                  />
                  {codeError && (
                    <p className="mt-2 text-sm text-red-600">
                      Invalid code. Please enter the correct code provided in
                      the survey.
                    </p>
                  )}
                </div>
              </label>

              <button
                onClick={handleSurveyCodeSubmit}
                disabled={!surveyOpened || !surveyCode.trim()}
                className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all duration-200
                  ${
                    !surveyOpened || !surveyCode.trim()
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-green-600 hover:bg-green-700 text-white"
                  }`}
              >
                {surveyOpened ? (
                  <>
                    Continue <ArrowRight className="h-5 w-5" />
                  </>
                ) : (
                  "Please open and complete the survey first"
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Help Text */}
        <div className="text-center text-sm text-gray-500">
          Having trouble? Contact us at support@uni.lu for assistance
        </div>
      </div>
    </Container>
  );
};

export default SurveyPage;
