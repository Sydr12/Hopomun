import { useEffect, useState } from "preact/hooks";
import { CHARACTERS } from "../data/characters";
import { newSeed, Rng } from "../core/rng";
import { SHIMDEUK_SLOTS } from "../core/shimdeuk";
import { createTraining, type ActionResult, type TrainingState } from "../core/training";
import { loadSave, writeSave, type GameSave } from "./save";
import { PickScreen } from "./screens/Pick";
import { ResultScreen } from "./screens/Result";
import { ShimdeukListScreen } from "./screens/Shimdeuks";
import { TitleScreen } from "./screens/Title";
import { TrainingScreen } from "./screens/Training";

type View =
  | { name: "title" }
  | { name: "pick"; candidates: string[] }
  | { name: "training" }
  | { name: "result"; stored: boolean }
  | { name: "shimdeuks" };

export function App() {
  const [save, setSave] = useState<GameSave>(loadSave);
  const [view, setView] = useState<View>({ name: "title" });

  useEffect(() => writeSave(save), [save]);
  useEffect(() => window.scrollTo(0, 0), [view.name]);

  const startPick = () => {
    const rng = new Rng(newSeed());
    const candidates = rng.shuffle(CHARACTERS.map((c) => c.id)).slice(0, 3);
    setView({ name: "pick", candidates });
  };

  const startTraining = (characterId: string) => {
    setSave({ ...save, training: createTraining(characterId, newSeed()) });
    setView({ name: "training" });
  };

  /** 수련 상태 변경: 복사본에 적용한 뒤 저장. 수련이 끝나면 심득을 보관함에 넣는다. */
  const mutate = (fn: (s: TrainingState) => ActionResult | void): ActionResult | void => {
    const next = structuredClone(save.training!);
    const result = fn(next);
    let shimdeuks = save.shimdeuks;
    let stored = true;
    if (next.phase === "done" && next.result && !shimdeuks.some((s) => s.id === next.result!.id)) {
      const mine = shimdeuks.filter((s) => s.characterId === next.characterId).length;
      stored = mine < SHIMDEUK_SLOTS;
      if (stored) shimdeuks = [...shimdeuks, next.result];
      setView({ name: "result", stored });
    }
    setSave({ ...save, training: next, shimdeuks });
    return result;
  };

  switch (view.name) {
    case "title":
      return (
        <div class="app">
          <TitleScreen
            save={save}
            onNew={startPick}
            onContinue={() => setView({ name: "training" })}
            onShimdeuks={() => setView({ name: "shimdeuks" })}
          />
        </div>
      );
    case "pick":
      return <div class="app"><PickScreen candidates={view.candidates} onPick={startTraining} onBack={() => setView({ name: "title" })} /></div>;
    case "training":
      if (!save.training) return null;
      if (save.training.phase === "done" && save.training.result) {
        return <div class="app"><ResultScreen shimdeuk={save.training.result} stored onDone={() => finishTraining()} /></div>;
      }
      return <div class="app"><TrainingScreen state={save.training} mutate={mutate} onExit={() => setView({ name: "title" })} /></div>;
    case "result":
      return <div class="app"><ResultScreen shimdeuk={save.training!.result!} stored={view.stored} onDone={() => finishTraining()} /></div>;
    case "shimdeuks":
      return (
        <div class="app">
          <ShimdeukListScreen
            shimdeuks={save.shimdeuks}
            onBack={() => setView({ name: "title" })}
            onDelete={(id) => setSave({ ...save, shimdeuks: save.shimdeuks.filter((s) => s.id !== id) })}
          />
        </div>
      );
  }

  function finishTraining() {
    setSave({ ...save, training: null });
    setView({ name: "title" });
  }
}
