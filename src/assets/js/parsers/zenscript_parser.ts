let ohm = require('ohm-js')

let grammar, semantics

function toStr(_) { return this.sourceString}
function toStr2(_,__) { return this.sourceString}
function toStr3(_,__,___) { return this.sourceString}
function toStr4(_,__,___,____) { return this.sourceString}
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
    CallExpression:                (a,b) => a.eval() + b.eval(),
    MemberExpression_arrayRefExp:  (a,b,c,d) => a.eval() + b.sourceString + c.eval() + d.sourceString,
    MemberExpression_propRefExp:   delimiter,
    PrimaryExpression_parenExpr:   inParens,
    literal:                       toStr,
    ArrayLiteral:                  inParens,
    Arguments:                     inParens,
    BracketHandler:                (_,b,__)=>`BH('${b.sourceString}')`,
    ObjectLiteral_empty:           (a,b) => a.sourceString + b.sourceString,
    ObjectLiteral_noTrailingComma: inParens,
    ObjectLiteral_trailingComma:   (a,b,c,d) => a.sourceString + b.eval() + c.sourceString + d.sourceString,
    PropertyAssignment:            delimiter,
    stringLiteral:                 toStr3,
    identifier:                    toStr2,
    hexIntegerLiteral:             (a,b) => '0x' + b.sourceString,
    decimalLiteral_bothParts:      toStr4,
    decimalLiteral_decimalsOnly:   toStr3,
    decimalLiteral_integerOnly:    toStr2,
    decimalIntegerLiteral_nonZero: toStr2,
    NonemptyListOf:                (a,b,c) => { let arr=c.eval(); return `${a.eval()}${arr.length?',':''}${arr}`},
    EmptyListOf:                   () => { return this.sourceString },
    _terminal:                     function() { return this.sourceString },
  })
}

exports.parseZenscriptLine = function(zsLine) {
  let matchResult = grammar.match(zsLine)
  if(matchResult.failed()) {
    console.error('grammar.match() failed :>> ', matchResult)
    return undefined
  }

  let semanticResult = semantics(matchResult)

  return semanticResult.eval()
}