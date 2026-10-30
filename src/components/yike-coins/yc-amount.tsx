import { YIKE_COIN_ABBR, normalizeYcText } from "@/lib/yike-coins/constants";

type Props = {
  amount: number;
  className?: string;
};

/** Renders coin amounts with a plain YC suffix (avoids double-encoded entity labels). */
export function YcAmount({ amount, className }: Props) {
  const formatted = amount.toLocaleString("en-NG");
  return (
    <span className={className}>
      {formatted} {YIKE_COIN_ABBR}
    </span>
  );
}

export function YcLabelText({ text }: { text: string }) {
  return <>{normalizeYcText(text)}</>;
}
