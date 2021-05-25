import datetime
import sys

BUILTIN={
    "print": print,
    "int": int,
    "float": float,
    "bool": bool,
    "string": str,
    "len": len,
    "object": dict
}


class Prerendered(str):
    pass

class Types:
    ENTIER="entier"
    FLOTTANT="flotant"
    DATE="date"
    DATETIME="datetime"
    DUREE="durée"
    STRING="chaine"
    BOOL="bool"
    UNKNOWN="unknown"
    PRERENDERED="prerendu"

    @staticmethod
    def resolve(x):
        if isinstance(x, int): return Types.ENTIER
        if isinstance(x, float): return Types.FLOTTANT
        if isinstance(x, datetime.date): return Types.DATE
        if isinstance(x, datetime.datetime): return Types.DATETIME
        if isinstance(x, datetime.timedelta): return Types.DUREE
        if isinstance(x, bool): return Types.BOOL
        if isinstance(x, Prerendered): return Types.PRERENDERED
        if isinstance(x, str): return Types.STRING
        return Types.UNKNOWN


class Entry:
    VAR="var"
    FUNCTION="function"
    FIELD="field"
    def eval(self, params): raise NotImplementedError
    def type(self, params): raise NotImplementedError
    def is_function(self): return False
    def is_var(self): return False
    def is_field(self): return False

class VarEntry(Entry):
    def __init__(self, name, type, value=None):
        self.type=type
        self.name=name
        self.value=value

    def eval(self, params):
        if callable(self.value):
            return self.value()
        return self.value

    def type(self, params):
        return self.type()

    def is_var(self): return True

class FieldEntry(VarEntry):
    def __init__(self, name, type, value):
        self._type=type
        self.name=name
        self.value=value

    def eval(self, params):
        if callable(self.value):
            return self.value()
        return self.value

    def type(self, params):
        return self._type

    def is_var(self): return False
    def is_field(self): return True

class FunctionEntry:
    def __init__(self, types_table, name):
        self.types_table=types_table
        self.name=name

    def execute(self, params):
        raise NotImplementedError

    def eval(self, params):
        if not self.type(params):
            raise Exception()
        if params: params = list(map(lambda x: x.eval(), params))
        return self.execute(params)

    def type(self, params):
        for row in self.types_table:
            if array_equals(row[0], params):
                return row[1]
        return None

    def is_function(self): return True

class AnonymeEntry(Entry):
    def __init__(self, entry_type, name, type, value=None):
        self.entry_type=entry_type
        self._type = type
        self.name = name
        self.value = value

    def eval(self, params):
        if callable(self.value):
            if params: params = list(map(lambda x: x.eval(), params))
            return self.value(*params)
        return self.value

    def type(self, params):
        if self.entry_type==Entry.FUNCTION:
            array=[]
            for i in range(len(params)):
                array.append(params[i].type())
            allowed = self._type
            for row in allowed:
                if array_equals(row[0], array):
                    return row[1]
        else:
            return self._type
        raise Exception("Types %s interdit" % str(array))

    def is_var(self): return self.entry_type==Entry.VAR
    def is_function(self): return self.entry_type==Entry.FUNCTION
    def is_field(self): return self.entry_type==Entry.FIELD

def today():
    return datetime.datetime.now().date()

class Environment:

    def __init__(self, fields={}, vars={}, fcts={}):
        self.table={}
        self.add_anonyme(Entry.VAR, "maintenant", Types.DATE, datetime.datetime.now)
        self.add_anonyme(Entry.VAR, "today", Types.DATE, today)
        self.add_anonyme(Entry.VAR, "aujourdhui", Types.DATE, today)
        self.add_anonyme(Entry.VAR, "now", Types.DATE, datetime.datetime.now)
        self.add_anonyme(Entry.FUNCTION, "jours", [[[Types.ENTIER], Types.DUREE]], lambda x: datetime.timedelta(days=x))
        self.add_anonyme(Entry.FUNCTION, "date", [[[Types.STRING], Types.DATE]], lambda x: datetime.datetime.strptime(x, "%d/%m/%Y").date())
        self.add_anonyme(Entry.FUNCTION, "moment", [[[Types.STRING], Types.DATE]], lambda x: datetime.datetime.strptime(x, "%d/%m/%Y"))
        for f in fields:
            self.add_field(f, fields[f][0], fields[f][1])
        for f in vars:
            self.add_var(f, Types.resolve(vars[f]), vars[f])
        for f in fcts:
            self.add_anonyme(Entry.FUNCTION, f, [], fcts[f])


    def add_var(self, name, type, value):
        self.table[name.lower()]=VarEntry(name, type, value)

    def add_field(self, name, type, value):
        self.table[name.lower()]=FieldEntry(name, type, value)

    def add_function(self, classe):
        obj = classe()
        self.table[obj.name.lower()]=obj

    def eval(self, name, params):
        return self.table[name.lower()].eval(params)

    def typeof(self, name, params=None):
        if not params: params=[]
        return self.table[name.lower()].type(params)

    def add_anonyme(self, entry_type, name, type, value):
        self.table[name.lower()]=AnonymeEntry(entry_type, name, type, value)

    def is_field(self, name): return self.table[name.lower()].is_field()
    def is_function(self, name): return self.table[name.lower()].is_function()
    def is_var(self, name): return self.table[name.lower()].is_var()

def array_equals(a,b):
    if len(a) != len(b): return False
    for i in range(len(a)):
        if a[i]!=b[i]: return False
    return True

class Operation:
    def __init__(self, env):
        self.env=env

    def getOperande(self, n):
        raise Exception("Not implemented")

    def countOperande(self):
        raise Exception("Not implemented")

    def countAll(self):
        if self.isLeaf(): return 1
        acc = 1
        for i in range(self.countOperande()):
            acc += self.getOperande(i).countAll()
        return acc

    def type(self):
        array=[]
        for i in range(self.countOperande()):
            array.append(self.getOperande(i).types())
        allowed = self.get_types_table()
        for row in allowed:
            if array_equals(row[0], array):
                return row[1]
        raise Exception("Types %s interdit" % str(array))


    def __repr__(self):
        return self.__str__()

    def __str__(self):
        raise Exception(sys._getframe().f_code.co_name, " not implemented for " + type(self).__name__)

    def eval(self):
        raise Exception(sys._getframe().f_code.co_name, " not implemented for " + type(self).__name__)

    def maxDepth(self, n=0):
        if self.isLeaf(): return n + 1
        max = 0
        for i in range(self.countOperande()):
            x = self.getOperande(i).maxDepth(n + 1)
            max = x if x > max else max
        return max

    def isLeaf(self):
        raise Exception(sys._getframe().f_code.co_name, " not implemented for " + type(self).__name__)

    def clone(self, data=None):
        raise Exception(sys._getframe().f_code.co_name, " not implemented for " + type(self).__name__)

    def print(self, n=0):
        for i in range(self.countOperande()):
            op = self.getOperande(i)
            if op.isLeaf():
                print(op.first)
            else:
                op.print(n + 1)

    def get_types_table(self):
        raise NotImplementedError()


    def is_optimizable(self):
        return False

    def simplify(self):
        if self.is_optimizable(): return Value(self.env, self.eval())
        return self

class BinaryOperation(Operation):
    def __init__(self, env, first=None, second=None):
        super().__init__(env)
        self.first = first.simplify()
        self.second = second.simplify()

    def isLeaf(self):
        return False

    def countOperande(self):
        return 2

    def getOperande(self, n):
        if n == 0: return self.first
        if n == 1: return self.second
        raise Exception("Out of band")

    def clone(self, data=None):
        return type(self)(self.first, self.second)


    def is_optimizable(self):
        return self.first.is_optimizable() and self.second.is_optimizable()



class UnaryOperation(Operation):
    def __init__(self, env, first):
        super().__init__(env)
        self.first = first.simplify() if isinstance(first, Operation) else first

    def type(self):
        return self.first.type()

    def getOperande(self, n):
        if n == 0: return self.first
        raise Exception("Out of band")

    def countOperande(self): return 1

    def clone(self, data=None): return type(self)(self.first)

    def is_optimizable(self):
        return self.first.is_optimizable()


class Addition(BinaryOperation):
    ADDITION_TYPES_TABLE=[
            [[Types.ENTIER, Types.ENTIER] , Types.ENTIER ],
            [[Types.FLOTTANT, Types.ENTIER] , Types.FLOTTANT ],
            [[Types.ENTIER, Types.FLOTTANT] , Types.FLOTTANT ],
            [[Types.FLOTTANT, Types.FLOTTANT] , Types.FLOTTANT ],
            [[Types.DATE, Types.DUREE] , Types.DUREE ],
            [[Types.DUREE, Types.DATE] , Types.DUREE ],
            [[Types.DUREE, Types.DUREE] , Types.DUREE ],
            [[Types.DATETIME, Types.DUREE] , Types.DUREE ],
            [[Types.DUREE, Types.DATETIME] , Types.DUREE ]
        ]

    def eval(self):
        return self.first.eval() + self.second.eval()

    def __str__(self):
        return "("+str(self.first)+"+"+str(self.second)+")"

    def type(self):
        a, b = self.first.type(), self.second.type()
        if a==b: return a

    def get_types_table(self):
        return Addition.ADDITION_TYPES_TABLE



class Soustraction(BinaryOperation):
    def eval(self):
        return self.first.eval() - self.second.eval()

    def __str__(self):
        return "("+str(self.first)+"-"+str(self.second)+")"

    def get_types_table(self):
        return Addition.ADDITION_TYPES_TABLE

class Multiplication(BinaryOperation):
    MULTIPLICATION_TYPES_TABLE=[
            [[Types.ENTIER, Types.ENTIER] , Types.ENTIER ],
            [[Types.FLOTTANT, Types.ENTIER] , Types.FLOTTANT ],
            [[Types.ENTIER, Types.FLOTTANT] , Types.FLOTTANT ],
            [[Types.FLOTTANT, Types.FLOTTANT] , Types.FLOTTANT ]
        ]
    def eval(self):
        return self.first.eval() + self.second.eval()

    def __str__(self):
        return "("+str(self.first)+"*"+str(self.second)+")"

    def get_types_table(self):
        return Multiplication.MULTIPLICATION_TYPES_TABLE

class Division(BinaryOperation):
    def eval(self):
        return self.first.eval() / self.second.eval()

    def __str__(self):
        return "("+str(self.first)+"/"+str(self.second)+")"

    def get_types_table(self):
        return Multiplication.MULTIPLICATION_TYPES_TABLE

class AndOperation(BinaryOperation):
    def eval(self):
        return self.first.eval() and self.second.eval()

    def __str__(self):
        return "("+str(self.first)+" and "+str(self.second)+")"

    def get_types_table(self):
        return [[[Types.BOOL, Types.BOOL], Types.BOOL]]



class OrOperation(BinaryOperation):
    def eval(self):
        return self.first.eval() or self.second.eval()

    def __str__(self):
        return "("+str(self.first)+" or "+str(self.second)+")"

    def type(self): return Types.BOOL

    def get_types_table(self):
        return [[[Types.BOOL, Types.BOOL], Types.BOOL]]


class Comparaison(BinaryOperation):
    def __init__(self, env, op, a, b):
        BinaryOperation.__init__(self, env, a, b)
        self.op = op

    def get_types_table(self):
        return [
            [[Types.ENTIER, Types.ENTIER], Types.BOOL],
            [[Types.FLOTTANT, Types.ENTIER], Types.BOOL],
            [[Types.ENTIER, Types.FLOTTANT], Types.BOOL],
            [[Types.FLOTTANT, Types.FLOTTANT], Types.BOOL],
            [[Types.DATE, Types.DATE], Types.BOOL],
            [[Types.DUREE, Types.DUREE], Types.BOOL],
            [[Types.DATETIME, Types.DATETIME], Types.BOOL],
        ]

    def eval(self):
        a = self.first.eval()
        b = self.second.eval()
        if self.op == ">": return a > b
        if self.op == ">=": return a >= b
        if self.op == "<": return a < b
        if self.op == "<=": return a <= b
        if self.op == "!=": return a != b
        if self.op == "=": return a == b

    def __str__(self):
        return "(" + str(self.first) + self.op + str(self.second) + ")"


class Negation(UnaryOperation):
    def eval(self):
        return not self.first.eval()

    def simplify(self):
        if not self.is_optimizable(): return self
        return Value(self.env, self.eval())


    def __str__(self):
        return "!" + str(self.first)

    def isLeaf(self): return True

    def get_types_table(self):
        return [
            [[Types.ENTIER], Types.BOOL],
            [[Types.FLOTTANT], Types.BOOL],
            [[Types.BOOL], Types.BOOL],
        ]

class Ident(Operation):
    def __init__(self, env, name, args=None):
        super().__init__(env)
        self.name=name
        self.args=args if args else []

    def eval(self):
        return self.env.eval(self.name, self.args)

    def generate(self):
        type = self.type()


    def __str__(self):
        return self.eval()

    def isLeaf(self): return True

    def type(self):
        return self.env.typeof(self.name, self.args)

    def is_optimizable(self):
        return not self.env.is_field(self.name)


class Value(UnaryOperation):
    def eval(self):
        return self.first

    def type(self):
        return Types.resolve(self.first)

    def __str__(self):
        t = self.type()
        if t in [Types.DATE, Types.STRING, Types.DATETIME]: return '"%s"' % self.first
        if t in [Types.BOOL]: return "true" if self.first else "false"
        return str(self.first)

    def isLeaf(self): return True

    def is_optimizable(self): return True
