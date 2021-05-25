import datetime
import json
from .htmlutils import text_stat

from django.db import models
from django.db.models import Field
from django.utils import timezone
# Create your models here.
from django.core import serializers

class Fichier(models.Model):
    titre = models.CharField(max_length=1024)
    mime = models.CharField(max_length=1024)
    chemin = models.CharField(max_length=1024*2)
    taille = models.IntegerField()
    filename =  models.CharField(max_length=1024*2)




class Article(models.Model):
    class PubStatus(models.IntegerChoices):
        IGNORE = 0
        A_FAIRE = 2
        A_MODIFIER = 3
        FAIT = 4

    articleid = models.IntegerField()
    titre = models.CharField(max_length=1024, null=True, blank=True, default="")
    sous_titre = models.CharField(max_length=1024, null=True, blank=True, default="")
    contenu = models.CharField(max_length=1024*32, null=True, blank=True, default="")
    revision = models.IntegerField(default=0)
    date_creation = models.DateTimeField()
    date_modification = models.DateTimeField()
    date_debut = models.DateField(null=True, blank=True, default=None)
    date_fin = models.DateField(null=True, blank=True, default=None)
    priorite = models.IntegerField(default=0)
    commentaires = models.CharField(max_length=1024*32, null=True, blank=True, default="")
    pub_web = models.IntegerField(choices=PubStatus.choices, default=PubStatus.IGNORE)
    pub_hebdo = models.IntegerField(choices=PubStatus.choices, default=PubStatus.A_FAIRE)
    pub_pp = models.IntegerField(choices=PubStatus.choices, default=PubStatus.IGNORE)
    pub_panneau = models.IntegerField(choices=PubStatus.choices, default=PubStatus.IGNORE)
    pub_fb = models.IntegerField(choices=PubStatus.choices, default=PubStatus.IGNORE)
    fichiers = models.ManyToManyField(Fichier)
    valid=models.BooleanField(default=False)
    char_count = models.IntegerField(null=True, blank=True, default=0)
    word_count = models.IntegerField(null=True, blank=True, default=0)
    latest = models.BooleanField(null=True, default=False)
    archived = models.BooleanField(null=True, default=False)

    def modify_article(self, data):
        self.titre = data["titre"]
        self.sous_titre = data["sous_titre"]
        self.contenu = data["contenu"]
        self.date_debut =  data["date_debut"]
        self.date_fin = data["date_fin"]
        self.priorite = data["priorite"]
        self.commentaires = data["commentaires"]
        self.pub_web = data["pub_web"]
        self.pub_hebdo = data["pub_hebdo"]
        self.pub_pp = data["pub_pp"]
        self.pub_panneau = data["pub_panneau"]
        self.pub_fb = data["pub_fb"]
        self.archived = data["archived"] if "archived" in data else self.archived
        self.date_modification=datetime.datetime.now()
        s = (self.titre+" ") if self.titre else ""
        s += (self.sous_titre+" ") if self.titre else ""
        s += (self.contenu+" ") if self.titre else ""
        self.char_count, self.word_count = text_stat(s)
        self.valid=True


    def short_dict(self):
        fields = ["titre", "date_debut", "date_fin", "priorite", "date_modification", "date_creation", "char_count", "word_count", "articleid", "revision"]
        js = {}
        for k in fields:
            js[k] = getattr(self, k)
        js["priorite"] = ["Impératif", "Important", "Secondaire"][js["priorite"]]
        return js


    def dict(self):
        #js= serializers.serialize('json', [self])
        js = {}
        for k in self.__dict__.keys():
            if not k.startswith("_"):
                o=getattr(self, k)
                if isinstance(o, datetime.datetime):
                    o = o.timestamp()
                if isinstance(o, datetime.date):
                    o = o.isoformat()
                js[k] = o
        return js

    def json(self):
        return json.dumps(self.dict())

    def pubs(self):
        return [{"name": "Site Web", "data":self.pub_web, "id":"web"},
                {"name": "Hebdo", "data":self.pub_hebdo, "id":"hebdo"},
                {"name": "Panneau Pocket", "data":self.pub_pp, "id":"pp"},
                {"name": "Panneau", "data":self.pub_panneau, "id":"panneau"},
                {"name": "Facebook", "data":self.pub_fb, "id":"fb"}]

class Hebdo(models.Model):
    numero = models.IntegerField(null=True, blank=True, default=1)
    date_creation = models.DateTimeField()
    date_modification = models.DateTimeField()
    date_debut = models.DateField(null=True, blank=True, default=0)
    date_fin = models.DateField(null=True, blank=True, default=0)
    commentaires = models.CharField(max_length=1024*32, null=True, blank=True)
    articles = models.ManyToManyField(Article)
    articles_count = models.IntegerField(default=0)
    char_count = models.IntegerField(default=0)
    word_count = models.IntegerField(default=0)

    def dict(self):
        #js= serializers.serialize('json', [self])
        js = {}
        for k in self.__dict__.keys():
            if not k.startswith("_"):
                o=getattr(self, k)
                if isinstance(o, datetime.datetime):
                    o = o.timestamp()
                if isinstance(o, datetime.date):
                    o = o.isoformat()
                js[k] = o
        js["articles"]=list(self.articles.all().values_list("id",flat=True))
        return js


    def json(self):
        return json.dumps(self.dict())

    def update_meta(self):
        self.articles_count = 0
        self.char_count = 0
        self.word_count = 0
        for art in self.articles.all():
            self.articles_count+=1
            self.char_count+=art.char_count;
            self.word_count+=art.word_count;


    def set(self, data):
        self.numero = data["numero"]
        self.date_debut =  data["date_debut"]
        self.date_fin = data["date_fin"]
        self.commentaires = data["commentaires"]
        self.date_modification=datetime.datetime.now()
        self.valid=True


