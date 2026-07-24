import { ConversationStarterProps } from "../../../types/ConversationStarter";
import { PromptTemplate } from "../../../types/PromptTemplate";
import { ConversationStarter, ConversationStarterVariant } from "../ConversationStarter";

interface PrefillChipButtonProps {
  chip: PromptTemplate;
  disabled: boolean;
  onClick: () => void;
}

const PrefillChipButton = ({ chip, disabled, onClick }: PrefillChipButtonProps) => (
  <button type="button" className="openui-agent-prefill-chip" disabled={disabled} onClick={onClick}>
    {chip.icon && (
      <span className="openui-agent-prefill-chip__icon" aria-hidden>
        {chip.icon}
      </span>
    )}
    <span className="openui-agent-prefill-chip__label">{chip.displayText}</span>
  </button>
);

export interface WelcomePrefillChipsProps {
  chips: PromptTemplate[];
  starters: ConversationStarterProps[];
  starterVariant: ConversationStarterVariant;
  draft: string;
  selectedChip: PromptTemplate | null;
  onChipClick: (chip: PromptTemplate) => void;
  onContextualSelect: (starter: ConversationStarterProps) => void;
  disabled: boolean;
}

/**
 * Chip row + grid-stacked starters layers for the prefill-chips welcome.
 * Layer 1 (chips + default starters) hides via `visibility` while drafting so
 * the layout doesn't jump; layer 2 shows the selected chip's contextual
 * starters, which append to the draft (see WelcomeScreen).
 */
export const WelcomePrefillChips = ({
  chips,
  starters,
  starterVariant,
  draft,
  selectedChip,
  onChipClick,
  onContextualSelect,
  disabled,
}: WelcomePrefillChipsProps) => {
  const isDraftEmpty = draft.length === 0;

  return (
    <div className="openui-agent-welcome-screen__desktop-starters openui-agent-welcome-screen__starters-layers">
      <div
        className="openui-agent-welcome-screen__starters-layer"
        data-hidden={!isDraftEmpty || undefined}
        aria-hidden={!isDraftEmpty || undefined}
      >
        <div className="openui-agent-welcome-screen__chip-row">
          {chips.map((chip, index) => (
            <PrefillChipButton
              key={`${chip.displayText}-${index}`}
              chip={chip}
              disabled={disabled}
              onClick={() => onChipClick(chip)}
            />
          ))}
        </div>
        <ConversationStarter starters={starters} variant={starterVariant} />
      </div>
      {selectedChip && (
        <div className="openui-agent-welcome-screen__starters-layer">
          <ConversationStarter
            starters={selectedChip.completions}
            variant="long"
            onSelect={onContextualSelect}
          />
        </div>
      )}
    </div>
  );
};

export default WelcomePrefillChips;
