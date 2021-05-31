"""import sqlhelpers.parser

from base.sqlhelpers import simplequery
from base.sqlhelpers.operations import Environment
from base.sqlhelpers.parser import Parser

env = Environment(simplequery.fields, simplequery.vars, simplequery.functions)
line = 'pub(today-jours(1),today+jours(1)) et  ( priorite=0 ou priorite=1 ou priorite=2 ) et contient("tablette")'
p = Parser(line)
x = p.parse(env)
print(x)"""

from weasyprint import HTML, CSS
from weasyprint.fonts import FontConfiguration
with open("base/templates/hebdo/hebdo.html") as f:
    html = f.read()

with open("/home/fanch/Programmation/oigcc/static/hebdo/css/hebdo.css") as f:
    css = f.read()

font_config = FontConfiguration()
wp = HTML(url="http://localhost:8000/hebdo/1/maquette/236/html", base_url="http://localhost:8000/")
result = wp.write_pdf(target="mypdf.pdf")
