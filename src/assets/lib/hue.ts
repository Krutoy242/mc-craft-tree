import hashCode from './hashCode'

export function getHue(name: string) {
  return Math.abs(hashCode(name)) % 256
}
