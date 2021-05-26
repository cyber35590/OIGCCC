import time

from django.http import HttpResponse, HttpRequest, HttpResponseBadRequest, JsonResponse, HttpResponseRedirect
from django.shortcuts import get_object_or_404, render
from datetime import datetime, timedelta, date

from django.shortcuts import render
from .models import Article, Fichier, Hebdo
from django.core.exceptions import ObjectDoesNotExist
from django.db import connection
import json

from .api import *


def new_hebdo():
    numero = sql_value("select max(numero) from base_hebdo;")
    numero = (numero+1) if numero else 1
    start = sql_value("select max(date_fin) from base_hebdo;")
    now = datetime.now()
    if not start:
        start=datetime.now()
        if start.weekday()>=4: # 4=Vendredi
            start+=timedelta(days=7)
        start-=timedelta(start.weekday()-4)
    else:
        start = date(*map(int, start.split("-")))

    end = start + timedelta(days=7)
    return Hebdo.objects.create(numero=numero, date_creation=now, date_modification=now,
                                date_debut=start, date_fin=end)


def new_article(request):
    article = default_article()
    return HttpResponseRedirect("/article/%d"%article.id)

def modify_article(request, id):
    if request.method == 'GET':
        obj = get_object_or_404(Article, pk=id)
        history = Article.objects.filter(articleid=obj.articleid, ).order_by('-revision')
        return render(request, "article.html", {"data": obj, "history": history})
    elif request.method=='POST':
        data = json.loads(request.body)
        action = data["action"]
        article = data["article"]
        db = Article.objects.get(pk=id)
        if action==PostArticleAction.edit:
            db.modify_article(article)
            db.save()
        return render(request, "article.html", {"data": db})
    elif request.method=='DELETE':
        data = json.loads(request.body)
        action = data["action"]
        if action=="delete_revision":
            db = Article.objects.get(pk=id)
            with connection.cursor() as cursor:
                cursor.execute("delete from base_article where articleid=%d" % id)
        elif action=="delete_article":
            with connection.cursor() as cursor:
                cursor.execute("delete from base_article where id=%d" % id)

def list_articles(request : HttpRequest):
    return render(request, "list_articles.html", {})

def hebdo_test(request : HttpRequest):
    return render(request, "hebdo/hebdo.html", {})

def hebdo_list(request : HttpRequest):
    return render(request, "hebdo_list.html", { "data": Hebdo.objects.all().order_by("-numero") })

def hebdo_new(request : HttpRequest):
    hebdo = new_hebdo()
    return HttpResponseRedirect("/hebdo/%d" % hebdo.id)

def hebdo_edit(request : HttpRequest, id : int):
    hebdo = get_object_or_404(Hebdo, pk=id)
    return render(request, "hebdo.html", {"data": hebdo})

def hebdo_make(request : HttpRequest, id : int, mid : int):
    hebdo =  Hebdo.objects.get(pk=id);
    return render(request, "hebdo_gen.html", {
        "hebdo" : hebdo,
        "maquette" : Maquette.objects.get(pk=mid),
        "articles" : json.dumps(list(map(lambda x: x.dict(), hebdo.articles.all())))
    })

def hebdo_make_new(request : HttpRequest, id : int):
    maq = new_maquette(id)
    hebdo =  Hebdo.objects.get(pk=id);
    maq.save()

    return render(request, "hebdo_gen.html", {
        "hebdo" : hebdo,
        "maquette" : maq,
        "articles" : json.dumps(list(map(lambda x: x.dict(), hebdo.articles.all())))
    })

