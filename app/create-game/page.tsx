import { CreateGame } from "@/components/create-game";
import { SomethingWrong } from "@/components/something-wrong";
import { getAllGames, getProblem } from "@/lib/game/actions";

export default async function CreateGamePage() {
  const [games, err] = await getAllGames();
  if (err) return <SomethingWrong />; 
  return <CreateGame games={games} />;
}
