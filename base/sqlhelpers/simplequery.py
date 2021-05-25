import datetime

from .parser import Parser, Environment, Types, Prerendered

fields = {
    "date_debut" : [Types.DATE, "date_debut"],
    "debut" : [Types.DATE, "date_debut"],
    "date_fin" : [Types.DATE, "date_fin"],
    "fin" : [Types.DATE, "date_fin"],
    "date_creation" : [Types.DATETIME, "date_creation"],
    "creation" : [Types.DATETIME, "date_creation"],
    "date_modification" : [Types.DATETIME, "date_modification"],
    "modification" : [Types.DATETIME, "date_modification"],
    "contenu" : [Types.STRING, "contenu"],
    "priorite" : [Types.ENTIER, "priorite"],
    "pub_web" : [Types.ENTIER, "pub_web"],
    "web" : [Types.ENTIER, "pub_web"],
    "pub_hebdo" : [Types.ENTIER, "pub_hebdo"],
    "hebdo" : [Types.ENTIER, "pub_hebdo"],
    "pub_pp" : [Types.ENTIER, "pub_pp"],
    "pp" : [Types.ENTIER, "pub_pp"],
    "pub_panneau" : [Types.ENTIER, "pub_panneau"],
    "panneau" : [Types.ENTIER, "pub_panneau"],
    "pub_fb" : [Types.ENTIER, "pub_fb"],
    "pub_facebook" : [Types.ENTIER, "pub_fb"],
    "fb" : [Types.ENTIER, "pub_fb"],
    "facebook" : [Types.ENTIER, "pub_fb"],
    "commentaires" : [Types.STRING, "commentaires"],
    "com" : [Types.STRING, "commentaires"],
}

vars = {
    "imperatif" : 2,
    "impératif" : 2,
    "important" : 1,
    "secondaire" : 0,
    "afaire" :  4,
    "a_faire" :  4,
    "a_modifier" :  3,
    "modifier" :  3,
    "fait" :  2,
    "ignorer" :  0,
}

def a_publier(a=None, b=None):
    if not a: a=datetime.date.today()
    if not b: b=a;
    return Prerendered("((date_debut is null or date_debut<=\"%s\") and (date_fin is null or date_fin>=\"%s\")) " % (b,a))

def contient(match):
    return Prerendered(" ((titre like '%%%s%%') or (sous_titre like '%%%s%%') or (contenu like '%%%s%%')) "%(match,match,match))

def titre_contient(match):
    return Prerendered(" (titre like '%%%s%%') "%match)

def sous_titre_contient(match):
    return Prerendered(" (sous_titre like '%%%s%%') "%match)

def contenu_contient(match):
    return Prerendered(" (contenu like '%%%s%%') "%match)

def is_null(x):
    return Prerendered(" (x is null) "%x)

def is_not_null(x):
    return Prerendered(" (x is not null) "%x)

functions = {
    "a_publier" : a_publier,
    "pub" : a_publier,
    "contient" : contient,
    "titre_contient" : titre_contient,
    "sous_titre_contient" : sous_titre_contient,
    "null" : is_null,
    "nul" : is_null,
    "not_null" : is_not_null,
    "non_nul" : is_not_null,
    "non_null" : is_not_null,
}

env = Environment(fields, vars, functions)


def parse(query):
    parser = Parser(query)
    return str(parser.parse(env))

def compile(object, test=False):
    if isinstance(object, dict):
        query = object["query"] if "query" in object else None
        sort_col = object["sort_col"] if "sort_col" in object else None
        order = object["order"] if "order" in object else None
        archives = object["archives"] if "archives" in object else None
        revision = object["revision"] if "revision" in object else None

        sqlquery = "select %s from base_article" %("count(*)" if test else "*")

        if query:
            query=parse(query)
            sqlquery+=" where %s " % query
        else:
            sqlquery+=" where true "

        print("sqlquery = ", sqlquery)
        if archives:
            if archives=="hide_archives": sqlquery+='and not archived '
            if archives=="only_archives": sqlquery+='and archived '
            if archives=="all": sqlquery+='and (archived or not archived) '

        if revision:
            if revision=="all": sqlquery+='and (latest or not latest) '
            else: sqlquery+="and latest"

        if sort_col:
            sqlquery+=" order by %s " % sort_col
            if order:
                sqlquery+=order

        return sqlquery
    else:
        return parse(object)


