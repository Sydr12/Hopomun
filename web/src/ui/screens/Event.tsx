import { useEffect, useState } from "preact/hooks";
import { CHARACTER_BY_ID } from "../../data/characters";
import { EVENT_DIALOGUE } from "../../data/dialogue";
import type { EventDef } from "../../data/events";
import type { ActionResult } from "../../core/training";
import { Backdrop, CharacterBust, NamedBust } from "../art";
import { Gains } from "../components";

const SOURCE_LABEL = { region: "지역 이벤트", character: "고유 이벤트", bond: "인연 이벤트" } as const;

/** 한 글자씩 나타나는 대사 */
function useTypewriter(text: string, speed = 28): [string, boolean, () => void] {
  const [n, setN] = useState(0);
  useEffect(() => setN(0), [text]);
  useEffect(() => {
    if (n >= text.length) return;
    const t = setTimeout(() => setN((v) => v + 1), speed);
    return () => clearTimeout(t);
  }, [n, text]);
  return [text.slice(0, n), n >= text.length, () => setN(text.length)];
}

/** 대화형 이벤트: 장소 배경 + 화자 상반신 + 대사 상자 + 선택지 */
export function EventScene({ event, source, regionId, trainee, result, onChoose, onClose }: {
  event: EventDef; source: "region" | "character" | "bond"; regionId: string; trainee: string;
  result: ActionResult | null; onChoose: (i: number) => void; onClose: () => void;
}) {
  const dialogue = EVENT_DIALOGUE[event.id];
  const speakerId = dialogue?.speaker === "self" ? trainee : dialogue?.speaker;
  const speakerChar = speakerId ? CHARACTER_BY_ID[speakerId] : undefined;
  const speakerName = speakerChar?.name ?? dialogue?.speaker ?? "";
  const line = result ? result.messages[0] : dialogue?.line ?? event.text;
  const [shown, done, skip] = useTypewriter(line);

  return (
    <div class="vn" onClick={() => !done && skip()}>
      <Backdrop regionId={regionId} />
      {speakerChar ? <CharacterBust characterId={speakerChar.id} className="speaker" /> : <NamedBust name={speakerName} className="speaker" />}
      <div class="vn-box glass">
        {!result && <span class="vn-name">{result ? "" : speakerName}</span>}
        <div class="row between">
          <span class="chip gold">{SOURCE_LABEL[source]}</span>
          <b class="small">{event.title}</b>
        </div>
        {!result && dialogue && <p class="narration">{event.text}</p>}
        <p class="vn-line">{shown}{!done && <span class="caret" />}</p>
        {result && done && (
          <>
            <Gains gains={result.gains} />
            {result.messages.slice(1).map((m, i) => <p key={i} class="small dim" style={{ textAlign: "center" }}>{m}</p>)}
            <button class="btn primary block" onClick={onClose}>계속</button>
          </>
        )}
        {!result && done && (
          <div class="col" style={{ gap: 6 }}>
            {event.choices.map((c, i) => (
              <button key={i} class="btn block" style={{ justifyContent: "flex-start" }} onClick={(e) => { e.stopPropagation(); onChoose(i); }}>
                <span class="gold" style={{ fontFamily: "var(--serif)" }}>{i + 1}</span> {c.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
