import { Mic, MicOff } from 'lucide-react';

type VoiceButtonProps = {
  listening: boolean;
  transcript: string;
  supported: boolean;
  onToggle: () => void;
};

export function VoiceButton({ listening, transcript, supported, onToggle }: VoiceButtonProps) {
  return (
    <>
      {listening || transcript ? (
        <div className="bf-budget-create-transcript">
          <span aria-hidden="true">{listening ? <MicOff size={14} /> : <Mic size={14} />}</span>
          <span>{listening ? 'Listening...' : `"${transcript}"`}</span>
        </div>
      ) : null}

      <div className="bf-budget-create-voice-row">
        <button
          type="button"
          className={`bf-budget-create-voice-btn ${listening ? 'is-listening' : ''}`}
          onClick={onToggle}
          disabled={!supported && !listening}
          title={supported ? 'Speak budget' : 'Voice input is not supported in this browser'}
        >
          <span className="bf-budget-create-mic-dot" />
          {listening ? <MicOff size={14} /> : <Mic size={14} />}
          {listening ? 'Listening...' : 'Speak budget'}
        </button>
        <span className="bf-budget-create-voice-note">or type above</span>
      </div>
    </>
  );
}
