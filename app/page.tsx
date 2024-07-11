import { ProblemDisplay } from "@/components/problem";
import { SomethingWrong } from "@/components/something-wrong";
import { getProblem } from "@/lib/game/actions";

export default async function Home() {
  const [problem] = await getProblem();
  return problem ? <ProblemDisplay problem={problem} /> : <SomethingWrong />
}
