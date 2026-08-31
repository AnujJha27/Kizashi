import { ImmersionSurface } from "@/components/learning/immersion-surface";
import { AozoraShelf } from "@/components/learning/aozora-shelf";
import { TadokuShelf } from "@/components/learning/tadoku-shelf";

export const metadata = { title: "Immersion" };

export default function ImmersionPage() {
  return <div className="mx-auto max-w-5xl"><ImmersionSurface /><TadokuShelf /><AozoraShelf /></div>;
}
