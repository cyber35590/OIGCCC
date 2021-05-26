


class EntryBase extends DataBind {
    constructor(iddiv, data){
        super(iddiv);
        this.data=data
        this.id=data.id
    }

    show(){
        this._root.show()
    }

    hide(){
        this._root.hide()
    }

    setVisibility(x){
        if(x) this._root.show(); else this._root.hide()
    }


    updateVisibility(){
        return;
    }
}



class ArticleEntry extends EntryBase {
    constructor(iddiv, data){
        super(iddiv, data);
    }

    show_info(){
        var article = this.data;
        for(var k in article){
            var v = article[k]
            $("#article_list_info_"+k).html(v)
        }
        $("#info-modal").modal("show")
    }

    show_apercu(){
        var article = this.data;
        for(var k in article){
            var v = article[k]
            $("#modal_apercu_"+k).html(v)
        }
        $("#apercu-modal").modal("show")
    }

    unarchive(){
        var self = this;
        API.article_set(this.id, "archived", "false", {
            success: function(e){
                toast("L'article a été désarchivé")
                self.find(".archive").show()
                self.find(".unarchive").hide()
            }
        })
    }

    archive(){
        var self = this;
        API.article_set(this.id, "archived", "true", {
            success: function(e){
                toast("L'article a été archivé")
                self.find(".archive").hide()
                self.find(".unarchive").show()
            }
        })
    }

    set_prio(n){
        var self=this;
        API.article_set(this.data.id, "priorite", n, function(d){
            var drop = $("#dropdown_priorite_"+self.data.id+"_value")
            drop.removeClass(["theme-1", "theme-2", "theme-3"])
            drop.addClass(Priorite.to_class(n))
            drop.html(Priorite.to_str(n))
            toast("Valeur modifiée")
        })

    }

    delete_revision(){
        var self = this;
        API.article_remove(this.data.id, true, function(){
            toast("Article supprimé")
            self._root.remove();
        })
    }

    delete_article(){
        var self = this;
        API.article_remove(this.data.id, false, function(){
            toast("Article supprimé");
            self._root.remove();
        })
    }
}


function article_set(id, key, val){
    API.article_set(id, key,val, {
        success: function(e){
            toast("L'article a été modifié")
        },
        errorFct: function(a,b,c, d){
            error("Erreur", a.message)
        }
    })
}

class EntryManager{
    constructor(rootid, classe=ArticleEntry){
        this.root=$("#"+rootid)
        this.rootid=rootid;
        this.children={}
        this.prefix=Utils.newid(5)
        this.child_classe=classe
    }

    adapt(data){
    }

     set(data){
        this.clear();
        this.root.empty();
        for(var i in data){
            var article = data[i];
            this.adapt(article)
            this.add(article)
        }
        this.updateVisibility();
    }

    add(data){
       var iddiv = this.prefix+"__result__"+data.id+"_";
       if( !((data.id) in this.children)){
            Template.append(this.root, data, "template-article-entry")
            $("#template-article-entry-root").attr("id", iddiv)
       }
        this.children[data.id] = new this.child_classe(iddiv, data)
    }

    remove(id){
        $("#"+this.prefix+"__result__"+id+"_").remove()
        delete this.children[id]
    }

    clear(){
        $("[id^='"+this.prefix+"__result__'").remove()
        this.children={}
    }

    forEach(fct, ...args){
        for(var i in this.children){
            var child = this.children[i];
            fct(child, ...args)
        }
    }

    callEach(meth, ...args){
        for(var i in this.children){
            var child = this.children[i];
            child[meth](...args)
        }
    }

    updateVisibility(){
        this.callEach("updateVisibility");
    }

    showIf(fct, ...params){
        for(var i in this.children){
            var child = this.children[i];
            if(fct(child, ...params)){
                child.show();
            }else{
                child.hide();
            }
        }
    }
}

class ArticleEntryManager extends EntryManager{
    constructor(rootid, classe=ArticleEntry){
        super(rootid, classe)
    }

    adapt(data){
        data.date_creation=int_to_std_datetime(data.date_creation)
        data.date_modification=int_to_std_datetime(data.date_modification)
        data.date_debut=iso_to_std_date(data.date_debut)
        data.date_debut_texte=date_to_phrase(data.date_debut)
        data.date_fin=iso_to_std_date(data.date_fin)
        data.date_fin_texte=date_to_phrase(data.date_fin)
        data.contenu_txt=data.contenu?(data.contenu.replace(/<[^>]*>/g, '')):""
        data.resume=data.contenu_txt.substr(0,100)
        data.unarchive_class=data.archived?"":"hidden"
        data.archive_class=data.archived?"hidden":""
        var tmp = ["", "", "À faire", "À modifier", "Fait"]
        data.pub_web_text=tmp[data.pub_web]
        data.pub_hebdo_text=tmp[data.pub_hebdo]
        data.pub_pp_text=tmp[data.pub_pp]
        data.pub_panneau_text=tmp[data.pub_panneau]
        data.pub_fb_text=tmp[data.pub_fb]
        data.priorite_str=Priorite.to_str(data.priorite)
        data.priorite_classe=Priorite.to_class(data.priorite)


    }
}