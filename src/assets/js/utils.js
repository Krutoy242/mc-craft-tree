
Object.defineProperty(exports, '__esModule', {
  value: true
})

function cleanupNbt(o) {
  if (!o) return

  for (let k in o) {
    if (!o[k] || typeof o[k] !== 'object') {
      continue // If null or not an object, skip to the next iteration
    }

    // The property is an object
    cleanupNbt(o[k]) // <-- Make a recursive call on the nested object
    if (Object.keys(o[k]).length === 0) {
      delete o[k] // The object had no properties, so delete that property
    }
  }

  if(Object.keys(o).length !== 0) return o // Return undefined if object is empty
}


function objToString(obj, ndeep) {
  switch (typeof obj) {
  case 'string':
    return '"' + obj + '"'
  case 'function':
    return obj.name || obj.toString()
  case 'object':
    var indent = Array(ndeep || 1).join('\t')
    var isArray = Array.isArray(obj)
    return (
      '{['[+isArray] + Object.keys(obj)
        .map(function (key) {
          const quoted = /^[a-zA-Z_$][a-zA-Z_$0-9]*$/.test(key) ? key : `"${key}"`
          return '\n\t' + indent + (isArray ? '' : quoted + ': ') + objToString(obj[key], (ndeep || 1) + 1)
        })
        .join(',') + '\n' + indent + '}]'[+isArray]
    )
      .replace(/[\s\t\n]+(?=(?:[^'"]*['"][^'"]*['"])*[^'"]*$)/g, '')
  default:
    return obj!=null ? obj.toString() : ''
  }
}

class NumLimits {
  constructor() {
    this.min = 999999999999
    this.max = 0
  }

  update(num) {
    this.min = Math.min(this.min, num)
    this.max = Math.max(this.max, num)
  }
}


class UniqueKeys {
  constructor() {
    this.ids = {}
    this.count = 0
  }

  mergeKey(key, val) {
    if(!key || !val) return
    if(this.ids[key] === undefined) {
      this.ids[key] = val
      this.count++
      return true
    } else {
      return false
    }
  }

  mergeChain(chain, onUnique) {
    if(!chain) return
    for (const [key, value] of Object.entries(chain.ids)) {
      if (this.mergeKey(key, value))
        onUnique?.(value)
    }
  }
}

exports.UniqueKeys = UniqueKeys
exports.NumLimits = NumLimits
exports.cleanupNbt = cleanupNbt
exports.objToString = objToString
