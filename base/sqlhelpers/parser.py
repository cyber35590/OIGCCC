# expression -> pexpr_or
# expr_or ->  expr_and 'or' expr_or | expr_and
# expr_and ->  expr_not 'and' expr_not | expr_not
# expr_not -> 'non' expr_not | expr_cmp
# expr_cmp -> expr_add ('<','<=', '=', '!=', '>', '>=') expr_cmp | expr_add
# expr_add -> expr_mult ('+'|'-') expr_add | expr_mult
# expr_mult -> prim ('*'|'/') expr_mult | prim
# prim -> int | float | '(' expression ')' | fonction
# fonction -> ident '(' [expression [',' expression]* ] ')' | ident
from base.sqlhelpers.lexer import Lexer

from .operations import *

class Parser:
    def __init__(self, text):
        self.lex = Lexer(text)
        self.tok = Lexer.UNKNOWN
        self.val = None
        self.context = None

    def _next(self):
        self.tok, self.val = self.lex.next()
        return self.tok, self.val

    def parse(self, context):
        self.context=context
        self._next()
        x=self._main()
        return x.simplify()


    def _main(self):
        ret=None
        ret=self._expr()
        ret.enclose=False
        return ret

    def _expr(self):
        return  self._exprOr()

    def _exprOr(self):
        first = self._exprAnd()
        op = self.tok
        opstr = self.val
        if op != Lexer.OR: return first

        self._next()
        second = self._exprOr()
        return OrOperation(self.context, first, second)

    def _exprAnd(self):
        first = self._exprNot()
        op = self.tok
        opstr = self.val
        if op != Lexer.AND: return first

        self._next()
        second = self._exprAnd()
        return AndOperation(self.context, first, second)


    def _exprNot(self):
        if self.tok == Lexer.NOT:
            self._next()
            x = self._exprNot()
            return Negation(self.context, x)
        else:
            return self._exprComp()

    def _exprComp(self):
        first = self._exprAdd()
        op = self.tok
        opstr = self.val
        if op != Lexer.CMP: return first

        self._next()
        second = self._exprComp()
        return Comparaison(self.context, opstr, first, second)

    def _exprAdd(self):
        first = self._exprMul()
        op = self.tok
        if not (op in [Lexer.ADD, Lexer.SUB]): return first

        self._next()
        second = self._exprAdd()
        if op == Lexer.ADD: return Addition(self.context, first, second)
        return Soustraction(self.context, first, second)

    def _exprMul(self):
        first = self._prim()
        op = self.tok

        if not (op in [Lexer.MULT, Lexer.DIV]):    return first

        self._next()
        second = self._exprMul()
        if op == Lexer.MULT: return Multiplication(self.context, first, second)
        return Division(self.context, first, second)

    PRIM_PREMIER = [Lexer.PO, Lexer.NOMBRE, Lexer.IDENT, Lexer.STRING]
    def _prim(self):
        if not (self.tok in Parser.PRIM_PREMIER): raise Exception("_exprMul: Attendu '(', int ou float : "+self.tok)

        # (
        if self.tok == Lexer.PO:
            self._next()
            x = self._expr()
            if self.tok != Lexer.PF:
                raise Exception("Parenthese fermante manquante=> " + Lexer.tokstr(self.tok))
            self._next()
            return x

        # Number
        if self.tok in [Lexer.NOMBRE, Lexer.STRING]:
            ret = Value(self.context, self.val)
            self._next()
            return ret
        # ident
        if self.tok in [Lexer.IDENT]:
            name = self.val
            self._next()
            if self.tok == Lexer.PO:
                return self._call(name)
            return Ident(self.context, name)
        raise Exception("Attendu: int, float ou '(' => " + self.tok)

    def _call(self, name):
        args = []
        self._next()
        if self.tok == Lexer.PF:
            self._next()
            return Ident(self.context, name, args)

        args.append(self._expr())

        while self.tok != Lexer.PF:
            if self.tok != Lexer.VIRGULE:
                raise Exception("Expected ',' in fct def : " + self.tok)
            self._next()
            args.append(self._expr())
        self._next()

        return Ident(self.context, name, args)
