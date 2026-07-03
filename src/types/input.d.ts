// The "input" npm package (interactive terminal prompts) ships no types.
declare module 'input' {
  const input: { text(prompt: string): Promise<string> }
  export default input
}
