import sqlhelpers.parser

from base.sqlhelpers import simplequery
from base.sqlhelpers.operations import Environment
from base.sqlhelpers.parser import Parser

env = Environment(simplequery.fields, simplequery.vars, simplequery.functions)
line = 'pub(today-jours(1),today+jours(1)) et  ( priorite=0 ou priorite=1 ou priorite=2 ) et contient("tablette")'
p = Parser(line)
x = p.parse(env)
print(x)