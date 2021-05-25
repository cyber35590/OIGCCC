import re

class Lexer:
    ESPACE="espace"
    NOMBRE="nombre"
    PONTUTAION="ponct"
    OR="or"
    AND="and"
    NOT="not"
    ADD="+"
    SUB="-"
    VIRGULE=","
    DIV="/"
    MULT="*"
    PO="("
    PF=")"
    CMP="cmp"
    STRING="chaine"
    IDENT="identifiant"
    UNKNOWN="inconnu"

    def __init__(self, text):
        self.text=text
        self.keysword={
            "ou" : Lexer.OR,
            "et" : Lexer.AND,
            "non" : Lexer.NOT
        }
        self.left=text
        self.index=0
        self.current_lex=None
        self.current_string=None
        self.expressions={
            Lexer.NOMBRE : [r"^[0-9][0-9]*(\.[0-9]+)?", self.to_nombre],
            Lexer.IDENT : [r"^[_a-zA-Z][_a-zA-Z0-9]*"],
            Lexer.STRING : [r'^(".*?"|\'.*?\')', self.remove_delimiter],
            Lexer.ADD : [r"^\+"],
            Lexer.SUB : [r"^\-"],
            Lexer.MULT : [r"^\*"],
            Lexer.DIV : [r"^\/"],
            Lexer.PO : [r"^\("],
            Lexer.VIRGULE : [r"^,"],
            Lexer.PF : [r"^\)"],
            Lexer.CMP : [r"^(<|<=|=|!=|>|>=)"],
            Lexer.ESPACE : [r'^[ \t\n\r]+']
        }

    def to_nombre(self, x):
        return float(x) if "." in x else int(x)

    def remove_delimiter(self, x):
        return x[1:-1]

    def _next(self):
        for k in self.expressions:
            regex = re.search(self.expressions[k][0], self.left)
            if regex:
                l = regex.span()[1]
                text = self.left[:l]
                self.index=l
                self.left=self.left[l:]

                if k == Lexer.IDENT and text.lower() in self.keysword:
                    k = self.keysword[text.lower()]
                    return k, k
                else:
                    return k, (self.expressions[k][1](text) if len(self.expressions[k])>1 else text)

        if self.left=="": return None, None
        raise Exception("Expression '%s' non reconnu"%self.left)

    def next(self):
        l = Lexer.ESPACE
        t=None
        while l==Lexer.ESPACE:
            l, t = self._next()
        return l, t

