var ohm = require('ohm-js')

var grammar, semantics

function toStr(_) { return this.sourceString}
function toStr2(_,__) { return this.sourceString}
function inParens(a,b,c) { return a.sourceString + b.eval() + c.sourceString }
function delimiter(a,b,c) { return a.eval() + b.sourceString + c.eval() }


exports.initZenscriptGrammar = function(grammarString) {
  if(grammar) return
  grammar = ohm.grammar(grammarString)
  semantics = grammar.createSemantics()


  semantics.addOperation('eval', {
    Statement:                     (a,_) => a.eval(),
    Expression_unary:              (a,b) => a.sourceString + b.eval(),
    LeftHandSideExpression_typed:  (a,_,__) => a.eval(),
    LeftHandSideExpression_mult:   (a,b,c) => `${a.eval()}.amount(${c.eval()})`,
    LeftHandSideExpression_or:     (a,b,c) => `${a.eval()}.or(${c.eval()})`,
    anyType:                       toStr,
    CallExpression:                (a,b) => a.eval() + b.eval(),
    MemberExpression_arrayRefExp:  (a,b,c,d) => a.eval() + b.sourceString + c.eval() + d.sourceString,
    MemberExpression_propRefExp:   delimiter,
    PrimaryExpression_parenExpr:   inParens,
    literal:                       toStr,
    ArrayLiteral:                  inParens,
    Arguments:                     inParens,
    BracketHandler:                (_,b,__)=>`BH('${b.sourceString}')`,
    ObjectLiteral_noTrailingComma: inParens,
    ObjectLiteral_trailingComma:   (a,b,c,d) => a.sourceString + b.eval() + c.sourceString + d.sourceString,
    PropertyAssignment:            delimiter,
    stringLiteral:                 (_,b,__) =>  `'${b.eval()}'`,
    identifier:                    toStr2,
    number:                        function(_) {return parseFloat(this.sourceString)},
    NonemptyListOf:                (a,b,c) => { var arr=c.eval(); return `${a.eval()}${arr.length?',':''}${arr}`},
    EmptyListOf:                   () => { return this.sourceString },
    _terminal:                     function() { return this.sourceString }
  })
}

var once = 1
exports.parseZenscriptLine = function(zsLine) {
  // if(once-->0) console.log('grammar.trace(zsLine) :>> ', 
  //   grammar.trace(zsLine)
  // )
  // console.log('zsLine :>> ', zsLine);
  // var matchResult = grammar.match(zsLine, 'ArgumentsList')
  var matchResult = grammar.match(zsLine)
  if(matchResult.failed()) return undefined

  var semanticResult = semantics(matchResult)

  return semanticResult.eval()
}