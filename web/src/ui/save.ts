/** 브라우저 저장소. 접근이 막히면(사생활 보호 모드 등) 메모리에서만 동작한다. */
import type { TrainingState } from "../core/training";
import type { Shimdeuk } from "../core/types";

export interface GameSave {
  version: 1;
  training: TrainingState | null;
  shimdeuks: Shimdeuk[];
}

const KEY = "gangho-save-v1";

export function emptySave(): GameSave {
  return { version: 1, training: null, shimdeuks: [] };
}

export function loadSave(): GameSave {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptySave();
    const data = JSON.parse(raw) as GameSave;
    return data.version === 1 ? { ...emptySave(), ...data } : emptySave();
  } catch {
    return emptySave();
  }
}

export function writeSave(save: GameSave): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(save));
  } catch {
    /* 저장 불가 환경: 무시 */
  }
}
