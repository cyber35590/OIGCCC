import re
import time

from django.http import HttpResponse, HttpRequest, HttpResponseBadRequest, JsonResponse, HttpResponseNotFound
from django.shortcuts import get_object_or_404, render
from datetime import datetime, date
from django.db.models import Q

from django.shortcuts import render
from .models import Article, Fichier, Hebdo
from django.core.exceptions import ObjectDoesNotExist
from django.db import connection
import json
from django.views.decorators.csrf import csrf_exempt
from .sqlhelpers import simplequery

#
# Enleve le flag latest de tous les autres entrée du même article
#
def clear_latest(article):
    with connection.cursor() as cursor:
        cursor.execute("update base_article set latest=false where articleid=%d"%article.articleid)

def archive(article, state):
    with connection.cursor() as cursor:
        cursor.execute("update base_article set archived=%s where articleid=%d"%(("true" if state else "false"),article.articleid))

def sql_value(sql):
    with connection.cursor() as cursor:
        cursor.execute(sql)
        x=cursor.fetchone()
        if x and len(x):
            return x[0]
    return None


def autocast(x):
    if re.match(r"^[1-9][0-9]*$", x):  return int(x)
    if re.match(r"^[1-9][0-9]*\.[0-9]+$", x):  return float(x)
    if re.match(r"^true|false$", x):  return x=="true"
    if re.match(r"^[0-9]{4}\-[0-9]{2}\-[0-9]{2}$", x):  return date.strftime(x, "%Y-%m-%d")

    return x


def sq_execute(object):
    if not isinstance(object, dict) or not "ids" in object:
        query = simplequery.compile(object)
        return Article.objects.raw(query)
    else:
        res = Article.objects.filter(id__in=object["ids"])
        order = ""
        if "sort_col" in object:
            order = object["sort_col"]
            if "order" in object and object["order"].lower()=="desc":
                order="-"+order
            res=res.order_by(order)
        return res

class PostArticleAction:
    edit="edit"
    new_revision="new_revision"

def sql_execute(query):
    with connection.cursor() as cursor:
        cursor.execute(query)

def get_next_revision(article):
    aid = 0
    row = None
    with connection.cursor() as cursor:
        cursor.execute("select max(revision) from base_article where articleid=%d"%article.articleid)
        row = cursor.fetchone()
    row = row[0]
    return row+1


def default_article():
    aid = 0
    row = None
    with connection.cursor() as cursor:
        cursor.execute("select max(articleid), id from base_article")
        row=cursor.fetchone()
    row=row[0]
    if(row is not None):
        aid=1+row
    else:
        aid = 1

    now = datetime.now()
    return Article.objects.create(articleid=aid, date_creation=now, date_modification=now,
                                  priorite=0, valid=False, latest=True, archived=False)



def jsonresponse(data, code=200, appcode=0, msg="Success"):
    x = HttpResponse(json.dumps({"code" : appcode, "message" : msg, "data" : data }),
                     content_type="application/json")
    x.status_code=code
    return x

@csrf_exempt
def api_modify_article(request, id):
    if request.method == 'GET':
        obj = get_object_or_404(Article, pk=id)
        return jsonresponse(obj.dict())
    elif request.method == 'POST':
        data = json.loads(request.body)
        action = data["action"]
        article = data["article"]
        db = Article.objects.get(pk=article["id"])

        if action == PostArticleAction.edit:
            db.modify_article(article)
            db.save()
        elif action == PostArticleAction.new_revision:
            aid = db.articleid
            rev = get_next_revision(db)
            db = default_article()
            db.revision=rev
            db.articleid=aid
            db.modify_article(article)
            clear_latest(db)
            db.latest = True
            db.save()

        return jsonresponse(db.dict())
    elif request.method == 'DELETE':
        pass


@csrf_exempt
def api_articles_batch(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        ids = data["ids"]
        modifications = data["modifications"]
        for art in Article.objects.filter(id__in=ids):
            for k in modifications:
                if hasattr(art, k):
                    setattr(art, k, modifications[k])
            art.save()
        news = Article.objects.filter(id__in=ids)
        news = list(map(lambda x: x.dict(), news))
        return jsonresponse(news)


@csrf_exempt
def api_article_set(request : HttpRequest, id : int, key : str, val : str):
        obj = get_object_or_404(Article, pk=id)
        val = autocast(val)
        if key=="delete":
            if val=="article":
                sql_execute("delete from base_article where articleid=%d"%obj.articleid)
            else:
                sql_execute("delete from base_article where id=%d"%obj.id)

        else:
            if key in ["date_creation", "date_modification"]:
                val=datetime.fromtimestamp(val)
            if key=="archive":
                archive(obj, val)
            else:
                if hasattr(obj, key):
                    setattr(obj, key, val)
                else:
                    return jsonresponse(None, code=404, appcode=404,  msg="La propriété '%s' n'existe pas pour Article"%key)
            obj.save()
        return jsonresponse(obj.dict())

@csrf_exempt
def api_article_get(request : HttpRequest, id : int, key : str):
        obj = get_object_or_404(Article, pk=id)
        val = getattr(obj, key)
        if key in ["date_creation", "date_modification", "date_fin", "date_debut"]:
            val=str(val)
        return jsonresponse(val)


@csrf_exempt
def api_list_articles(request : HttpRequest):
    if request.method == 'POST':
        out = sq_execute(json.loads(request.body))
        out = list(map(lambda x: x.dict() , out))
        return jsonresponse(out)

@csrf_exempt
def api_list_article_query(request : HttpRequest):
    if request.method == 'POST':
        out = sq_execute(json.loads(request.body))
        out = list(map(lambda x: x.dict() , out))
        return jsonresponse(out)

@csrf_exempt
def api_list_article_query_check(request : HttpRequest):
    if request.method == 'POST':
        out = sq_execute(json.loads(request.body))
        try:
            out = simplequery.compile(out, True)
            with connection.cursor() as curs:
                curs.execute(out);
                out = curs.fetchone()[0]
        except:
            return jsonresponse(None, appcode=-1, msg="Erreur")

        return jsonresponse({"count": out})

@csrf_exempt
def api_hebdo_list(request : HttpRequest):
    hebdos = Hebdo.objects.all()
    hebdos=list(map(lambda x: x.dict(), hebdos))
    return jsonresponse(hebdos)

@csrf_exempt
def api_hebdo(request : HttpRequest, id : int):
    if request.method=="GET":
        hebdo = get_object_or_404(Hebdo, pk=id)
        return jsonresponse(hebdo.dict())
    elif request.method=="POST":
        hebdo = get_object_or_404(Hebdo, pk=id)
        hebdo.set(json.loads(request.body))
        hebdo.save()
        return jsonresponse(hebdo.dict())


@csrf_exempt
def api_hebdo_add_article(request : HttpRequest, id : int, article: int):
    hebdo = get_object_or_404(Hebdo, pk=id)
    art = get_object_or_404(Article, pk=article)
    hebdo.articles.add(art)
    hebdo.update_meta()
    hebdo.save()
    return jsonresponse(hebdo.dict())


@csrf_exempt
def api_hebdo_add_batch(request : HttpRequest, id : int):
    hebdo = get_object_or_404(Hebdo, pk=id)
    to_add = Article.objects.filter(id__in=json.loads(request.body))
    for k in to_add:
        print("Ajout de %d (article) à %d (hebdo)"%(k.id, hebdo.id))
        hebdo.articles.add(k)
        print(hebdo.articles.all())
    hebdo.update_meta()
    hebdo.save()
    return jsonresponse(hebdo.dict())

@csrf_exempt
def api_hebdo_remove_article(request : HttpRequest, id : int, article: int):
    hebdo = get_object_or_404(Hebdo, pk=id)
    art = get_object_or_404(Article, pk=article)
    hebdo.articles.remove(art)
    hebdo.update_meta()
    hebdo.save()
    return jsonresponse(hebdo.dict())

@csrf_exempt
def api_hebdo_delete(request : HttpRequest, id : int):
    hebdo = get_object_or_404(Hebdo, pk=id)
    hebdo.delete()
    return jsonresponse(None)

