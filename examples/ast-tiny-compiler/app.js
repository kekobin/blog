const tiny = require('./super-tiny-compiler-chinese');
const s = '(add 2 (subtract 4 2))';
const token = tiny.tokenizer(s);
const ast = tiny.parser(token);
// console.log(JSON.stringify(ast, null, 2));
const newAst = tiny.transformer(ast);
// console.log(JSON.stringify(newAst, null, 2));
const code = tiny.codeGenerator(newAst);
console.log(code)
