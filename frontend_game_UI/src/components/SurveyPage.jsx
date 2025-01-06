import React, { useState } from "react";
import { ExternalLink } from "lucide-react";
import Container from "./Container";

const SurveyPage = ({ onComplete }) => {
  const [showScore, setShowScore] = useState(false);
  const [surveyCode, setSurveyCode] = useState("");
  const [codeError, setCodeError] = useState(false);

  const handleSurveyCodeSubmit = () => {
    if (surveyCode.trim().toLowerCase() === "12345") {
      setCodeError(false);
      onComplete(); // This will take us to WordMeaningCheck
    } else {
      setCodeError(true);
    }
  };

  return (
    <Container>
      <div className="text-center space-y-8 pb-6">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-800">Almost Done!</h2>
        </div>

        <div className="border-t pt-4">
          <h3 className="text-xl mb-4">Next Steps</h3>

          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-6">
              <h4 className="font-semibold text-blue-800 mb-3">
                Complete Survey to Continue
              </h4>
              <ol className="list-decimal list-inside space-y-3 text-gray-700">
                <li>Click the button below to open the survey in a new tab</li>
                <li>Complete all questions in the survey</li>
                <li>Copy the completion code shown at the end</li>
                <li>Return here and enter the code to continue</li>
              </ol>
            </div>

            <div className="flex justify-center">
              <a
                href="https://ulsurvey.uni.lu/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-300"
              >
                Open Survey
                <ExternalLink className="ml-2 h-5 w-5" />
              </a>
            </div>

            <div className="max-w-md mx-auto mt-6">
              <div className="space-y-3">
                <label className="block text-gray-700">
                  Enter Survey Completion Code:
                </label>
                <input
                  type="text"
                  value={surveyCode}
                  onChange={(e) => {
                    setSurveyCode(e.target.value);
                    setCodeError(false);
                  }}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none
                    ${codeError ? "border-red-500" : "border-gray-300"}`}
                  placeholder="Enter code from survey"
                />
                {codeError && (
                  <p className="text-red-500 text-sm">
                    Invalid code. Please complete the survey and enter the
                    correct code.
                  </p>
                )}
                <button
                  onClick={handleSurveyCodeSubmit}
                  className="w-full bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors duration-300"
                >
                  Submit Code
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
};

export default SurveyPage;
