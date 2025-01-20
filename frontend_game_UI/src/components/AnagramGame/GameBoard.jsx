import React, { useCallback } from "react";
import { Send, Check } from "lucide-react";
import GameTimer from "./GameTimer";

const GameBoard = ({
  currentWord,
  availableLetters,
  solution,
  onSolutionChange,
  onValidate,
  onSubmit,
  wordIndex,
  totalWords,
  timeLeft,
  totalTime,
  isTimeUp,
  onRemoveWord,
  validatedWords,
  isTutorial = false,
  customSubmitDisabled,
}) => {
  // Memoize handlers
  const handleDragStart = useCallback((e, letter, index, source) => {
    const timestamp = Date.now();
    e.dataTransfer.setData("letter", letter);
    e.dataTransfer.setData("index", index.toString());
    e.dataTransfer.setData("source", source);
  }, []);

  const handleDrop = useCallback(
    (e, targetArea, targetIndex) => {
      e.preventDefault();
      const letter = e.dataTransfer.getData("letter");
      const sourceIndex = parseInt(e.dataTransfer.getData("index"));
      const sourceArea = e.dataTransfer.getData("source");
      const timestamp = Date.now();

      let newSolution = [...solution];
      let newAvailable = [...availableLetters];

      if (sourceArea === "solution" && targetArea === "solution") {
        const [removedLetter] = newSolution.splice(sourceIndex, 1);
        newSolution.splice(targetIndex, 0, removedLetter);
      } else if (sourceArea === "available" && targetArea === "solution") {
        newAvailable = newAvailable.filter((_, idx) => idx !== sourceIndex);
        newSolution.splice(targetIndex, 0, letter);
      } else if (sourceArea === "solution" && targetArea === "available") {
        newSolution = newSolution.filter((_, idx) => idx !== sourceIndex);
        newAvailable.splice(targetIndex, 0, letter);
      }

      onSolutionChange(newSolution, newAvailable);
    },
    [solution, availableLetters, onSolutionChange]
  );

  const handleRemoveWord = useCallback(
    (index) => {
      if (typeof onRemoveWord === "function") {
        onRemoveWord(index);
      }
    },
    [onRemoveWord]
  );

  // Submit confirmation handler
  const handleSubmitConfirm = useCallback(() => {
    // if (
    //   isTutorial &&
    //   !window.confirm(
    //     "Are you done with practice? You will now proceed to the main game"
    //   )
    // ) {
    //   return;
    // }
    onSubmit();
  }, [onSubmit]);

  // Memo-ize validation button disabled state
  const isValidateDisabled = solution.length < 5 || (isTimeUp && !isTutorial);
  // const isSubmitDisabled =
  //   validatedWords.length === 0 || (isTimeUp && !isTutorial);
  const isSubmitDisabled =
    validatedWords.length === 0 ||
    (isTimeUp && !isTutorial) ||
    (isTutorial && timeLeft > 60);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Game Header */}
      <div
        className={`text-center ${isTutorial ? "p-6" : ""} bg-white rounded-xl`}
      >
        <h2 className="text-xl font-bold text-gray-800">
          Word Challenge {wordIndex + 1} of {totalWords}
        </h2>
        <span>
          {isTutorial && (
            <>
              <p className="text-gray-600">
                Create as many words as possible and validate them. Submit when
                ready.
              </p>
              <p className="font-semibold text-blue-500">
                Longer words earn more rewards!
              </p>
            </>
          )}
        </span>
      </div>

      {/* Validated Words Display */}
      {validatedWords.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-3 rounded-xl shadow-sm">
          <h3 className="text-sm font-semibold text-blue-800 mb-3">
            Your Validated Words ({validatedWords.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {validatedWords.map((word, idx) => (
              <ValidatedWord
                key={`${word.word}-${idx}`}
                word={word}
                index={idx}
                onRemove={handleRemoveWord}
              />
            ))}
          </div>
        </div>
      )}

      {/* Game Timer */}
      <GameTimer timeLeft={timeLeft} totalTime={totalTime} />

      {/* Solution Area */}
      <div className="space-y-4">
        <DropArea
          items={solution}
          emptyMessage="Drag letters here to form a word"
          onDragStart={handleDragStart}
          onDrop={handleDrop}
          itemType="solution"
        />
      </div>

      {/* Available Letters */}
      <div className="space-y-4">
        <DropArea
          items={availableLetters}
          onDragStart={handleDragStart}
          onDrop={handleDrop}
          itemType="available"
        />
      </div>

      {/* Action Buttons */}
      <div className="space-y-2">
        <div className="flex gap-4">
          <ActionButton
            onClick={onValidate}
            disabled={isValidateDisabled}
            icon={<Check className="w-5 h-5" />}
            variant="green"
          >
            Validate Word
          </ActionButton>

          <ActionButton
            onClick={handleSubmitConfirm}
            disabled={isSubmitDisabled}
            icon={<Send className="w-5 h-5" />}
            variant="blue"
          >
            {isTutorial ? "Complete Practice" : "Submit Words"}
          </ActionButton>
        </div>

        {/* Error message below buttons */}
        {isSubmitDisabled && isTutorial && (
          <p className="text-sm text-gray-500 text-center">
            {validatedWords.length === 0
              ? "Validate at least one word"
              : timeLeft > 60
              ? `Please wait ${Math.ceil(
                  timeLeft - 60
                )} seconds to enable Complete Practice`
              : ""}
          </p>
        )}
        {isSubmitDisabled && !isTutorial && (
          <p className="text-sm text-gray-500 text-center">
            {validatedWords.length === 0
              ? "Try to validate at least one word"
              : ""}
          </p>
        )}
      </div>
    </div>
  );
};

// Extracted components for better organization
const ValidatedWord = React.memo(({ word, index, onRemove }) => (
  <span className="px-4 py-2 bg-white text-blue-700 rounded-lg text-sm font-medium border border-blue-200 shadow-sm hover:shadow-md transition-shadow group relative">
    {word.word}
    <span className="ml-1 text-blue-500">({word.length} letters)</span>
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onRemove(index);
      }}
      className="ml-2 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
    >
      ×
    </button>
  </span>
));

const DropArea = React.memo(
  ({ items, emptyMessage, onDragStart, onDrop, itemType }) => (
    <div
      className={`${
        itemType === "solution"
          ? "border-2 border-dashed my-12 border-gray-400 bg-gray-100 rounded-xl p-6"
          : "rounded-xl"
      } flex flex-wrap gap-3 items-center justify-center`}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => onDrop(e, itemType, items.length)}
    >
      {items.length === 0 && emptyMessage ? (
        <p className="text-blue-500 text-center">{emptyMessage}</p>
      ) : (
        items.map((letter, index) => (
          <LetterTile
            key={`${itemType}-${index}`}
            letter={letter}
            index={index}
            type={itemType}
            onDragStart={onDragStart}
            onDrop={onDrop}
          />
        ))
      )}
    </div>
  )
);

const LetterTile = React.memo(
  ({ letter, index, type, onDragStart, onDrop }) => (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, letter, index, type)}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onDrop(e, type, index);
      }}
      className={`w-10 h-10 ${
        type === "solution"
          ? "bg-gradient-to-br from-blue-500 to-blue-600"
          : "bg-gradient-to-br from-gray-600 to-gray-700"
      } text-white rounded-xl flex items-center justify-center font-bold text-xl cursor-move shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 active:scale-95`}
    >
      {letter}
    </div>
  )
);

const ActionButton = React.memo(
  ({ onClick, disabled, children, icon, variant }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
      flex-1 py-4 px-6 rounded-xl font-medium flex items-center justify-center gap-2 transition-all
      ${
        disabled
          ? "bg-gray-200 text-gray-400 cursor-not-allowed"
          : `bg-gradient-to-r ${
              variant === "green"
                ? "from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                : "from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
            } text-white shadow-lg hover:shadow-xl`
      }
    `}
    >
      {icon}
      <span className="text-lg">{children}</span>
    </button>
  )
);

export default React.memo(GameBoard);
