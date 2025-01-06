import React, { useCallback } from "react";
import { Send, Check, X } from "lucide-react";
import GameTimer from "./GameTimer";

const GameBoard = ({
  currentWord,
  availableLetters,
  solution,
  onSolutionChange,
  onValidate,
  onSubmit,
  onRemoveWord,
  wordIndex,
  totalWords,
  timeLeft,
  totalTime,
  isTimeUp,
  validatedWords,
  isTutorial = false,
}) => {
  const handleDragStart = useCallback((e, letter, index, source) => {
    e.dataTransfer.setData(
      "text/plain",
      JSON.stringify({
        letter,
        index,
        source,
      })
    );
  }, []);

  const handleDrop = useCallback(
    (e, targetArea, targetIndex) => {
      e.preventDefault();
      const data = JSON.parse(e.dataTransfer.getData("text/plain"));
      const { letter, index: sourceIndex, source: sourceArea } = data;

      let newSolution = [...solution];
      let newAvailable = [...availableLetters];

      // Get correct target index based on drop position
      const dropRect = e.currentTarget.getBoundingClientRect();
      const mouseX = e.clientX;
      const letterWidth =
        dropRect.width /
        (targetArea === "solution"
          ? newSolution.length + 1
          : newAvailable.length + 1);
      let insertIndex = Math.floor((mouseX - dropRect.left) / letterWidth);

      // Clamp index to valid range
      insertIndex = Math.max(
        0,
        Math.min(
          insertIndex,
          targetArea === "solution" ? newSolution.length : newAvailable.length
        )
      );

      if (sourceArea === targetArea) {
        if (sourceArea === "solution") {
          newSolution = newSolution.filter((_, idx) => idx !== sourceIndex);
          newSolution.splice(insertIndex, 0, letter);
        } else {
          newAvailable = newAvailable.filter((_, idx) => idx !== sourceIndex);
          newAvailable.splice(insertIndex, 0, letter);
        }
      } else {
        if (sourceArea === "available") {
          newAvailable = newAvailable.filter((_, idx) => idx !== sourceIndex);
          newSolution.splice(insertIndex, 0, letter);
        } else {
          newSolution = newSolution.filter((_, idx) => idx !== sourceIndex);
          newAvailable.splice(insertIndex, 0, letter);
        }
      }

      onSolutionChange(newSolution, newAvailable);
    },
    [solution, availableLetters, onSolutionChange]
  );

  const handleSubmitConfirm = useCallback(() => {
    if (
      isTutorial &&
      !window.confirm(
        "Are you done with practice? You will now proceed to the main game."
      )
    ) {
      return;
    }
    onSubmit();
  }, [isTutorial, onSubmit]);

  const isValidateDisabled = solution.length < 5 || (isTimeUp && !isTutorial);
  const isSubmitDisabled =
    validatedWords.length === 0 || (isTimeUp && !isTutorial);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Game Header */}
      <div className="text-center space-y-2 bg-white p-6 rounded-xl">
        <h2 className="text-xl font-bold text-gray-800">
          Anagram Challenge {wordIndex + 1} of {totalWords}
        </h2>
        <p className="text-gray-600">
          Create as many words as possible and validate them. Submit when ready.
        </p>
        <p className="font-semibold text-blue-500">
          Longer words earn more rewards!
        </p>
      </div>

      {/* Validated Words */}
      {validatedWords.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-xl">
          <h3 className="text-sm font-semibold text-blue-800 mb-3">
            Your Validated Words ({validatedWords.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {validatedWords.map((word, idx) => (
              <span
                key={`${word.word}-${idx}`}
                className="px-4 py-2 bg-white text-blue-700 rounded-lg text-sm font-medium 
                         border border-blue-200 shadow-sm hover:shadow-md transition-shadow 
                         group relative"
              >
                {word.word}
                <span className="ml-1 text-blue-500">
                  ({word.length} letters)
                </span>
                <button
                  onClick={() => onRemoveWord(idx)}
                  className="ml-2 text-red-500 opacity-50 group-hover:opacity-100 
                           transition-opacity cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Game Timer */}
      <GameTimer timeLeft={timeLeft} totalTime={totalTime} />

      {/* Solution Area */}
      <div
        className="min-h-[100px] border-2 border-dashed border-gray-300 rounded-lg p-4
                   flex flex-wrap gap-2 items-center justify-center"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => handleDrop(e, "solution", solution.length)}
      >
        {solution.length === 0 ? (
          <p className="text-gray-500">Drag letters here to form a word</p>
        ) : (
          solution.map((letter, index) => (
            <div
              key={`solution-${index}`}
              draggable
              onDragStart={(e) => handleDragStart(e, letter, index, "solution")}
              className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 
                       text-white rounded-xl flex items-center justify-center 
                       font-bold text-xl cursor-move shadow-lg hover:shadow-xl 
                       transition-all hover:-translate-y-0.5"
            >
              {letter}
            </div>
          ))
        )}
      </div>

      {/* Available Letters */}
      <div
        className="flex flex-wrap gap-2 justify-center"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => handleDrop(e, "available", availableLetters.length)}
      >
        {availableLetters.map((letter, index) => (
          <div
            key={`available-${index}`}
            draggable
            onDragStart={(e) => handleDragStart(e, letter, index, "available")}
            className="w-12 h-12 bg-gradient-to-br from-gray-600 to-gray-700 
                     text-white rounded-xl flex items-center justify-center 
                     font-bold text-xl cursor-move shadow-lg hover:shadow-xl 
                     transition-all hover:-translate-y-0.5"
          >
            {letter}
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={onValidate}
          disabled={isValidateDisabled}
          className={`
            flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium
            transition-all duration-200
            ${
              isValidateDisabled
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl"
            }
          `}
        >
          <Check className="w-5 h-5" />
          <span>Validate Word</span>
        </button>

        <button
          onClick={handleSubmitConfirm}
          disabled={isSubmitDisabled}
          className={`
            flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium
            transition-all duration-200
            ${
              isSubmitDisabled
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl"
            }
          `}
        >
          <Send className="w-5 h-5" />
          <span>{isTutorial ? "Complete Practice" : "Submit Words"}</span>
        </button>
      </div>
    </div>
  );
};

export default React.memo(GameBoard);
