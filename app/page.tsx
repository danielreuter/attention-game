import { Header } from "@/components/header";
import { ProblemDisplay } from "@/components/problem";
import { SomethingWrong } from "@/components/something-wrong";
import { auth } from "@/lib/auth";
import { getProblem } from "@/lib/game/actions";

export default async function Home() {
  const { user } = await auth();  
  const [problem] = await getProblem();
  return (
    <>
      <Header />
      {problem ? <ProblemDisplay problem={problem} user={user}/> : <SomethingWrong />}
    </>
  )
}
