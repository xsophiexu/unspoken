// "1 skip", "2 skips". Pass the plural when it isn't just the word plus "s".
export function count(n: number, singular: string, plural = `${singular}s`): string {
  return `${n} ${n === 1 ? singular : plural}`;
}
