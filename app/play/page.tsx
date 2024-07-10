import { ProblemDisplay } from "@/components/problem";
import { extractSequence } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function Home() {
  const subject = "European Capitals";
  const sentence = "The capital of France is Paris.";
  const sequence = extractSequence(sentence);
  return <ProblemDisplay problem={{ subject, sentence, sequence }} />;
}
