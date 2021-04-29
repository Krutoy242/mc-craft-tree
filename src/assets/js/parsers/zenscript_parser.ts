import ohm from 'ohm-js'

// const grammar: { createSemantics: () => any; match: (arg0: any) => any }
// const semantics: { (arg0: any): any; addOperation: (arg0: string, arg1: { Statement: (a: any, _: any) => any; Expression_unary: (a: any, b: any) => any; LeftHandSideExpression_typed: (a: any, _: any, __: any) => any; LeftHandSideExpression_mult: (a: any, b: any, c: any) => string; LeftHandSideExpression_or: (a: any, b: any, c: any) => string; CallExpression: (a: any, b: any) => any; MemberExpression_arrayRefExp: (a: any, b: any, c: any, d: any) => any; MemberExpression_propRefExp: (a: any, b: any, c?: any) => any; PrimaryExpression_parenExpr: (a: any, b: any, c?: any) => any; literal: (_: any) => any; ArrayLiteral: (a: any, b: any, c?: any) => any; Arguments: (a: any, b: any, c?: any) => any; BracketHandler: (_: any, b: any, __: any) => string; ObjectLiteral_empty: (a: any, b: any) => any; ObjectLiteral_noTrailingComma: (a: any, b: any, c?: any) => any; ObjectLiteral_trailingComma: (a: any, b: any, c: any, d: any) => any; PropertyAssignment: (a: any, b: any, c?: any) => any; stringLiteral: (_: any, __: any, ___?: any) => any; identifier: (_: any, __: any) => any; hexIntegerLiteral: (a: any, b: any) => string; decimalLiteral_bothParts: (_: any, __: any, ___?: any, ____?: any) => any; decimalLiteral_decimalsOnly: (_: any, __: any, ___?: any) => any; decimalLiteral_integerOnly: (_: any, __: any) => any; decimalIntegerLiteral_nonZero: (_: any, __: any) => any; NonemptyListOf: (a: any, b: any, c: any) => string; EmptyListOf: () => any; _terminal: () => any }) => void }

function toStr(this:any, _: any) { return this.sourceString}
function toStr2(this:any, _: any,__: any) { return this.sourceString}
function toStr3(this:any, _: any,__: any,___?: any) { return this.sourceString}
function toStr4(this:any, _: any,__: any,___?: any,____?: any) { return this.sourceString}
function inParens(a: { sourceString: any },b: any,c: { sourceString: any }) { return a.sourceString + b.eval() + c.sourceString }
function delimiter(a: any,b: { sourceString: any },c: any) { return a.eval() + b.sourceString + c.eval() }

import fs from 'fs'
import path from 'path'
function loadText(filename: string) {
  return fs.readFileSync(path.resolve(__dirname, filename), 'utf8')
}

const grammar = ohm.grammar(loadText('./zenscript.ohm'))
const semantics = grammar.createSemantics()


semantics.addOperation('eval', {
  Statement:                     (a:any,_: any) => a.eval(),
  Expression_unary:              (a: { sourceString: any },b:any) => a.sourceString + b.eval(),
  LeftHandSideExpression_typed:  (a:any,_: any,__: any) => a.eval(),
  LeftHandSideExpression_mult:   (a:any,b: any,c:any) => `${a.eval()}.amount(${c.eval()})`,
  LeftHandSideExpression_or:     (a:any,b: any,c:any) => `${a.eval()}.or(${c.eval()})`,
  CallExpression:                (a:any,b:any) => a.eval() + b.eval(),
  MemberExpression_arrayRefExp:  (a:any,b: { sourceString: any },c:any,d: { sourceString: any }) => a.eval() + b.sourceString + c.eval() + d.sourceString,
  MemberExpression_propRefExp:   delimiter,
  PrimaryExpression_parenExpr:   inParens,
  literal:                       toStr,
  ArrayLiteral:                  inParens,
  Arguments:                     inParens,
  BracketHandler:                (_: any,b: { sourceString: any },__: any)=>`BH('${b.sourceString}')`,
  ObjectLiteral_empty:           (a: { sourceString: any },b: { sourceString: any }) => a.sourceString + b.sourceString,
  ObjectLiteral_noTrailingComma: inParens,
  ObjectLiteral_trailingComma:   (a: { sourceString: any },b:any,c: { sourceString: any },d: { sourceString: any }) => a.sourceString + b.eval() + c.sourceString + d.sourceString,
  PropertyAssignment:            delimiter,
  stringLiteral:                 toStr3,
  identifier:                    toStr2,
  hexIntegerLiteral:             (a: any,b: { sourceString: string }) => '0x' + b.sourceString,
  decimalLiteral_bothParts:      toStr4,
  decimalLiteral_decimalsOnly:   toStr3,
  decimalLiteral_integerOnly:    toStr2,
  decimalIntegerLiteral_nonZero: toStr2,
  NonemptyListOf:                (a:any,b: any,c:any) => { const arr=c.eval(); return `${a.eval()}${arr.length?',':''}${arr}`},
  EmptyListOf:                   function(this:any) { return this.sourceString },
  _terminal:                     function() { return this.sourceString },
})

exports.parseZenscriptLine = function(zsLine: any) {
  const matchResult = grammar.match(zsLine)
  if(matchResult.failed()) {
    console.error('grammar.match() failed :>> ', matchResult)
    return undefined
  }

  const semanticResult = semantics(matchResult)

  return semanticResult.eval()
}