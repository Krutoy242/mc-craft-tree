function forceUpdate() {
  var next = 1;
  return function (i, nodes) {
    var curr = Math.floor(20 * Math.log(i));
    if (curr !== next) {
      next = curr;
      return true;
    }
    return false;
  };
}

export default d3.forceManyBodyReuse().update(forceUpdate)