import { useGame } from "./game/store";
import { CharacterCreator } from "./ui/CharacterCreator";
import { GameScreen } from "./ui/GameScreen";
import { MainMenu } from "./ui/MainMenu";

export default function App() {
  const screen = useGame((s) => s.screen);
  if (screen === "create") return <CharacterCreator />;
  if (screen === "game") return <GameScreen />;
  return <MainMenu />;
}
