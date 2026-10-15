import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Modal } from "../../shared/ui/Modal";
import { ConfirmDialog } from "../../shared/ui/ConfirmDialog";
import { useToast } from "../../shared/ui/toast";
import { flashcards } from "../data/entities";
import { recordId } from "../../lib/blocks/data";
import { percent } from "../../lib/format";
import type { Flashcard } from "../data/types";

// Cards are written by the student. Marking a card Difficult twice flags it
// and brings it up first next time; marking Got it masters it. The deck reads
// its mastery as the share of cards marked Got it.
export function FlashcardsSection({ subjectId, topicId }: { subjectId: string; topicId?: string }) {
  const list = flashcards.useList();
  const mutations = flashcards.useMutations();
  const { show } = useToast();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Flashcard | null>(null);
  const [removing, setRemoving] = useState<Flashcard | null>(null);
  const [studying, setStudying] = useState(false);

  const all = (list.data ?? []).filter((card) => card.subjectId === subjectId);
  const mastered = all.filter((card) => card.mastered).length;
  const mastery = percent(mastered, all.length);

  function mark(card: Flashcard, got: boolean) {
    const nextCount = got ? card.difficultCount ?? 0 : (card.difficultCount ?? 0) + 1;
    mutations.update.mutate({
      id: recordId(card),
      mastered: got ? true : card.mastered,
      difficultCount: nextCount,
      difficult: !got && nextCount >= 2
    });
  }

  return (
    <div className="panel">
      <div className="panel-head">
        <h3>Flashcards</h3>
        <div className="row">
          {all.length > 0 ? <button className="ghost-button" onClick={() => setStudying(true)}>Study deck</button> : null}
          <button className="ghost-button" onClick={() => setCreating(true)}><Plus size={15} /> Add card</button>
        </div>
      </div>

      {all.length === 0 ? (
        <p className="muted">No flashcards yet. Write your first question to start studying.</p>
      ) : (
        <>
          <div className="deck-stats">
            <span className="muted">{all.length} cards · {mastery}% mastered</span>
            {all.filter((card) => card.difficult).length > 0 ? <span className="muted">{all.filter((card) => card.difficult).length} flagged Difficult</span> : null}
          </div>
          <div className="list-stack mt8">
            {all.map((card) => (
              <div key={recordId(card)} className="list-row">
                <div className="list-row-main">
                  <strong>{card.question}</strong>
                  <span className="muted">{card.answer}</span>
                </div>
                <div className="row">
                  {card.difficult ? <span className="pill pill-warn">Difficult</span> : null}
                  {card.mastered ? <span className="pill pill-good">Got it</span> : null}
                  <button className="icon-button" title="Edit card" onClick={() => setEditing(card)}>Edit</button>
                  <button className="icon-button" title="Remove card" onClick={() => setRemoving(card)}><Trash2 size={15} /></button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {creating || editing ? (
        <CardModal
          initial={editing ?? undefined}
          onClose={() => { setCreating(false); setEditing(null); }}
          onSubmit={(values) => {
            if (editing) mutations.update.mutate({ id: recordId(editing), ...values }, { onSuccess: () => setEditing(null) });
            else mutations.create.mutate({ ...values, subjectId, topicId, difficult: false, mastered: false, difficultCount: 0 }, { onSuccess: () => { setCreating(false); show("Flashcard added.", "success"); } });
          }}
        />
      ) : null}

      {removing ? (
        <ConfirmDialog
          title="Remove flashcard"
          message="Remove this flashcard? This cannot be undone."
          onCancel={() => setRemoving(null)}
          onConfirm={() => mutations.remove.mutate({ id: recordId(removing) }, { onSuccess: () => setRemoving(null) })}
        />
      ) : null}

      {studying ? (
        <StudyMode
          cards={all}
          onClose={() => setStudying(false)}
          onMark={mark}
        />
      ) : null}
    </div>
  );
}

function CardModal({ initial, onClose, onSubmit }: { initial?: Flashcard; onClose: () => void; onSubmit: (values: { question: string; answer: string }) => void }) {
  const [question, setQuestion] = useState(initial?.question ?? "");
  const [answer, setAnswer] = useState(initial?.answer ?? "");
  const [error, setError] = useState("");

  return (
    <Modal title={initial ? "Edit flashcard" : "Add flashcard"} onClose={onClose}>
      <label className="form-field">
        <span>Question</span>
        <textarea value={question} onChange={(event) => { setQuestion(event.target.value); setError(""); }} />
      </label>
      <label className="form-field">
        <span>Answer</span>
        <textarea value={answer} onChange={(event) => { setAnswer(event.target.value); setError(""); }} />
      </label>
      {error ? <div className="field-error">{error}</div> : null}
      <div className="modal-actions">
        <button className="icon-button" onClick={onClose}>Cancel</button>
        <button
          className="primary-button"
          onClick={() => {
            if (!question.trim()) { setError("Question is required."); return; }
            if (!answer.trim()) { setError("Answer is required."); return; }
            onSubmit({ question: question.trim(), answer: answer.trim() });
          }}
        >
          Save card
        </button>
      </div>
    </Modal>
  );
}

function StudyMode({ cards, onClose, onMark }: { cards: Flashcard[]; onClose: () => void; onMark: (card: Flashcard, got: boolean) => void }) {
  // Difficult cards come up first.
  const ordered = useMemo(() => [...cards].sort((a, b) => Number(Boolean(b.difficult)) - Number(Boolean(a.difficult))), [cards]);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const card = ordered[index];

  if (!card) {
    return (
      <Modal title="Flashcard study" onClose={onClose}>
        <p className="muted">You've reached the end of this deck.</p>
        <div className="modal-actions"><button className="primary-button" onClick={onClose}>Done</button></div>
      </Modal>
    );
  }
  const activeCard = card;

  function answer(got: boolean) {
    onMark(activeCard, got);
    setRevealed(false);
    setIndex((current) => (current + 1 < ordered.length ? current + 1 : current));
  }

  return (
    <Modal title="Flashcard study" onClose={onClose}>
      <p className="muted">Card {index + 1} of {ordered.length}</p>
      <div className="flashcard-study">
        <p className="flashcard-question">{card.question}</p>
        {revealed ? <p className="flashcard-answer">{card.answer}</p> : null}
      </div>
      <div className="modal-actions">
        {!revealed ? (
          <button className="primary-button" onClick={() => setRevealed(true)}>Reveal answer</button>
        ) : (
          <>
            <button className="ghost-button" onClick={() => answer(false)}>Difficult</button>
            <button className="primary-button" onClick={() => answer(true)}>Got it</button>
          </>
        )}
      </div>
    </Modal>
  );
}
