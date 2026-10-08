import Button from "../../atoms/Button";

/**
 * ベースの切り替え（管理者は［＋ベースを追加］も出す）
 * 業者（onAdd なし）でベースが1つ以下なら、何も出さない
 * @param adding 新しいベースを作成中か（作成中は［＋ベースを追加］を選択中にする）
 */
export default function BaseSwitcher({ bases, selectedId, adding = false, onSelect, onAdd = null }) {
  if (bases.length <= 1 && !onAdd) return null;

  return (
    <div className="base-switcher">
      {bases.map((b) => {
        const active = !adding && b.baseId === selectedId;
        return (
          <Button
            key={b.baseId}
            variant={active ? "primary" : "secondary"}
            className="btn-sm"
            aria-pressed={active}
            onClick={() => !active && onSelect(b.baseId)}
          >
            {b.baseName}
            {b.stopped && "（使用停止）"}
          </Button>
        );
      })}
      {onAdd && (
        <Button
          variant={adding ? "primary" : "secondary"}
          className="btn-sm"
          aria-pressed={adding}
          onClick={() => !adding && onAdd()}
        >
          ＋ベースを追加
        </Button>
      )}
    </div>
  );
}
