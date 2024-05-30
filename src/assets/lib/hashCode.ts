// java String#hashCode
export default function hashCode(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++)
    hash = str.charCodeAt(i) + ((hash << 5) - hash)

  return hash
}
