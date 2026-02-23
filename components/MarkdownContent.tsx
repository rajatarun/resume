export function MarkdownContent({ markdown }: { markdown: string }) {
  const blocks = markdown.split("\n\n");

  return (
    <article className="space-y-4 leading-7 text-slate-700 dark:text-slate-200">
      {blocks.map((block, index) => {
        if (block.startsWith("## ")) {
          return (
            <h2 key={index} className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
              {block.replace("## ", "")}
            </h2>
          );
        }

        if (block.split("\n").every((line) => line.startsWith("- "))) {
          return (
            <ul key={index} className="list-disc space-y-1 pl-6">
              {block.split("\n").map((line) => (
                <li key={line}>{line.replace("- ", "")}</li>
              ))}
            </ul>
          );
        }

        return <p key={index}>{block}</p>;
      })}
    </article>
  );
}
