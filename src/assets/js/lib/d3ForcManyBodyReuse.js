function forceUpdate() {
  let next = 1
  return function (i, nodes) {
    let curr = Math.floor(20 * Math.log(i))
    if (curr !== next) {
      next = curr
      return true
    }
    return false
  }
}

export default d3.forceManyBodyReuse().update(forceUpdate)