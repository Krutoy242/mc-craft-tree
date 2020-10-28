
module.exports = function objToString(obj, ndeep) {
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