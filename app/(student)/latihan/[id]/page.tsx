import { QuizPlayer } from "./QuizPlayer";

export default async function QuizPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <QuizPlayer exerciseId={id} />;
}
