/*

Taken from:
https://stackoverflow.com/questions/30312601/translating-minecraft-color-codes-into-html

*/

let currId = 0
const obfuscators: Record<number, number[]> = {}
const alreadyParsed: (HTMLPreElement | undefined)[] = []
const styleMap = {
  '§0': 'color:#000000',
  '§1': 'color:#0000AA',
  '§2': 'color:#00AA00',
  '§3': 'color:#00AAAA',
  '§4': 'color:#AA0000',
  '§5': 'color:#AA00AA',
  '§6': 'color:#FFAA00',
  '§7': 'color:#AAAAAA',
  '§8': 'color:#555555',
  '§9': 'color:#5555FF',
  '§a': 'color:#55FF55',
  '§b': 'color:#55FFFF',
  '§c': 'color:#FF5555',
  '§d': 'color:#FF55FF',
  '§e': 'color:#FFFF55',
  '§f': 'color:#FFFFFF',
  '§l': 'font-weight:bold',
  '§m': 'text-decoration:line-through',
  '§n': 'text-decoration:underline',
  '§o': 'font-style:italic',
} as const

type StyledCode = keyof typeof styleMap
type ValidCode = StyledCode | '§k' | '§r'

function obfuscate(elem: HTMLSpanElement, string: string) {
  let multiMagic,
    currNode,
    listLen,
    nodeI

  function randInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  function replaceRand(string: string, i: number) {
    const randChar = String.fromCharCode(randInt(64, 95))
    return string.substr(0, i) + randChar + string.substr(i + 1, string.length)
  }

  function initMagic(el: HTMLSpanElement, str?: string) {
    let i = 0
    let obsStr = str || el.innerHTML
    const strLen = obsStr.length
    if (!strLen)
      return
    obfuscators[currId].push(
      window.setInterval(() => {
        if (i >= strLen)
          i = 0
        obsStr = replaceRand(obsStr, i)
        el.innerHTML = obsStr
        i++
      }, 0),
    )
  }

  if (string.includes('<br>')) {
    elem.innerHTML = string
    listLen = elem.childNodes.length
    for (nodeI = 0; nodeI < listLen; nodeI++) {
      currNode = elem.childNodes[nodeI]
      if (currNode.nodeType === 3) {
        multiMagic = document.createElement('span')
        multiMagic.innerHTML = currNode.nodeValue || ''
        elem.replaceChild(multiMagic, currNode)
        initMagic(multiMagic)
      }
    }
  }
  else {
    initMagic(elem, string)
  }
}

function applyCode(string: string, codes: ValidCode[]) {
  const elem = document.createElement('span')
  let obfuscated = false

  // eslint-disable-next-line no-control-regex
  string = string.replace(/\x00/g, '')

  codes.forEach((code: ValidCode) => {
    if (code in styleMap)
      elem.style.cssText += `${styleMap[code as StyledCode]};`
    if (code === '§k') {
      obfuscate(elem, string)
      obfuscated = true
    }
  })

  if (!obfuscated)
    elem.innerHTML = string

  return elem
}

function parseStyle(string: string) {
  const finalPre = document.createElement('pre')
  const codes: any[] = string.match(/§.{1}/g) || []
  const codesLen = codes.length
  const indexes: number[] = []
  let indexDelta: number
  let apply: ValidCode[] = []
  let strSlice: string
  let i: number

  if (!obfuscators[currId])
    obfuscators[currId] = []

  string = string.replace(/\n|\\n/g, '<br>')

  for (i = 0; i < codesLen; i++) {
    indexes.push(string.indexOf(codes[i]))
    string = string.replace(codes[i], '\x00\x00')
  }

  if (indexes[0] !== 0)
    finalPre.appendChild(applyCode(string.substring(0, indexes[0]), []))

  for (i = 0; i < codesLen; i++) {
    indexDelta = indexes[i + 1] - indexes[i]
    if (indexDelta === 2) {
      while (indexDelta === 2) {
        apply.push(codes[i])
        i++
        indexDelta = indexes[i + 1] - indexes[i]
      }
      apply.push(codes[i])
    }
    else {
      apply.push(codes[i])
    }
    if (apply.lastIndexOf('§r') > -1)
      apply = apply.slice(apply.lastIndexOf('§r') + 1)

    strSlice = string.substring(indexes[i], indexes[i + 1])
    finalPre.appendChild(applyCode(strSlice, apply))
  }

  return finalPre
}

function clearObfuscators(id: number) {
  obfuscators[id].forEach((interval) => {
    clearInterval(interval)
  })
  alreadyParsed[id] = undefined
  obfuscators[id] = []
}

export default function mineParse(input: string) {
  let i = currId
  if (i > 0) {
    while (i--) {
      const ap = alreadyParsed[i]
      if (ap && ap.nodeType) {
        if (!document.contains(ap))
          clearObfuscators(i)
      }
    }
  }
  const parsed = parseStyle(input)
  alreadyParsed.push(parsed)
  currId++
  return {
    parsed,
    raw: parsed.innerHTML,
  }
}
