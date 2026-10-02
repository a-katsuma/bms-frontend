import { useState, useRef } from "react";

const HISTORY_LIMIT = 100;

// 戻る／進むの履歴つき state
// set(next, mergeKey)：mergeKey が直前と同じなら履歴を増やさず上書き（同じセルへの連続入力を1回分にまとめる）
export function useUndoRedo(initial) {
  const [state, setState] = useState({ past: [], present: initial, future: [] });
  const lastMergeKey = useRef(null);

  const set = (next, mergeKey = null) => {
    const merge = mergeKey !== null && mergeKey === lastMergeKey.current;
    lastMergeKey.current = mergeKey;
    setState((s) => ({
      past: merge ? s.past : [...s.past, s.present].slice(-HISTORY_LIMIT),
      present: next,
      future: [],
    }));
  };

  const undo = () => {
    lastMergeKey.current = null;
    setState((s) =>
      s.past.length === 0
        ? s
        : {
            past: s.past.slice(0, -1),
            present: s.past[s.past.length - 1],
            future: [s.present, ...s.future],
          },
    );
  };

  const redo = () => {
    lastMergeKey.current = null;
    setState((s) =>
      s.future.length === 0
        ? s
        : {
            past: [...s.past, s.present],
            present: s.future[0],
            future: s.future.slice(1),
          },
    );
  };

  // 読み込み・保存後に履歴を消す
  const reset = (value) => {
    lastMergeKey.current = null;
    setState({ past: [], present: value, future: [] });
  };

  return {
    value: state.present,
    set,
    undo,
    redo,
    reset,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
  };
}
