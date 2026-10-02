import { useEffect, useState } from "react";

// タブレット・スマホ（style.css の @media (max-width: 1024px) と同じ境目）
export const TABLET_QUERY = "(max-width: 1024px)";

// 画面幅などがメディアクエリに合っているか（幅が変わると再描画する）
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(
    () => window.matchMedia(query).matches,
  );

  useEffect(() => {
    const mql = window.matchMedia(query);
    const handleChange = (e) => setMatches(e.matches);
    setMatches(mql.matches);
    mql.addEventListener("change", handleChange);
    return () => mql.removeEventListener("change", handleChange);
  }, [query]);

  return matches;
}
