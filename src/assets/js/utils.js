
Object.defineProperty(exports, '__esModule', {
  value: true
})

function clearEmpties(o) {
  if (!o) return

  for (var k in o) {
    if (!o[k] || typeof o[k] !== 'object') {
      continue // If null or not an object, skip to the next iteration
    }

    // The property is an object
    clearEmpties(o[k]) // <-- Make a recursive call on the nested object
    if (Object.keys(o[k]).length === 0) {
      delete o[k] // The object had no properties, so delete that property
    }
  }
}


function objToString(obj, ndeep) {
  switch (typeof obj) {
  case 'string':
    return '"' + obj + '"'
  case 'function':
    return obj.name || obj.toString()
  case 'object':
    var indent = Array(ndeep || 1).join('\t'),
      isArray = Array.isArray(obj)
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

exports.NumLimits = NumLimits
exports.clearEmpties = clearEmpties
exports.objToString = objToString
