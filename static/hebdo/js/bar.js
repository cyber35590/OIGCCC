class MenuBar extends DataBind {

    constructor(elem, app){
        super(elem);
        this.app=app;
        this.root=this._root;
    }


}


class MenuActionBar extends MenuBar{
    constructor(elem, app){
        super(elem, app)
    }

    save(){
        this.app.save()
    }

    render(e, evt, type, force=false){
        var self=this;
        if(this.app.hebdo.has_changed() && !force){
            confirm("Enregistrer ?", "Voulez-vous enregistrer les modifications afin de les prévisualiser ?",
            function(){
                self.app.save();
                self.render(type, true);
            },function(){self.render(type, true);})
        }else{
            var hid = self.app.hebdo.data.hebdo.id
            var mid = app.hebdo.data.maquette.id;
            var url = "/hebdo/"+hid+"/maquette/"+mid+"/"+type;
            var ifroot = $("#iframe-preview-root")

            var node = null;
            if(type=="html"){
                node  = $$(`
                    <iframe
                    src="[[url]]"
                    ></iframe>
                `, {url: url})
                ifroot.empty()
                ifroot.append(node);
                $("#preview-modal").modal("show")
            }else {
                location.href=url;
            }
        }

    }
}

function accent_insensitive(x){
    return x.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "");
}

function text_filter(text, article){
    if(article.titre && accent_insensitive(article.titre).indexOf(text)!=-1) return true;
    if(article.sous_titre && accent_insensitive(article.sous_titre).indexOf(text)!=-1) return true;
    if(article.contenu && accent_insensitive(article.contenu).indexOf(text)!=-1) return true;
    return false;
}

class MenuAvailableBar extends MenuBar{
    constructor(elem, app){
        super(elem, app)
        this.filterinput=this.root.find(".available-filter")
        this.available = this.app.hebdo.available;
        this.search_list = new ArticleEntryManager("add-article-root", MaquetteSearchArticleEntry, [this.app]);
        this.search_form =  new RechercheSimpleForm("recherche_simple", this.search_list);
        this.advanced_search_form =  new RechercheAvanceeForm("recherche_avancée", this.search_list);
    }

    add(){
        $("#add-article-modal").modal("show")
        this.search_list.updateVisibility();

    }


    create(){
        var self = this;
        API.article_new(function(e){
            self.app.hebdo.add_article(e, function(x){
                self.app.show_article(e);
            });
        })
    }

    filter(){
        var text = accent_insensitive(this.filterinput.val());
        for(var i in this.available.children){
            var art = this.available.children[i];
            if(text=="" || text_filter(text, art.data)){
                art.elem.show();
            }else{
                art.elem.hide();
            }
        }
    }

    clear_filter(){
        this.filterinput.val("")
        this.filter();
    }

    _update_all(){
        var self = this;
        for(var i in this.app.hebdo.articles){
            var art = this.app.hebdo.articles[i];
            if(!art.latest){
                API.hebdo_update(this.app.hebdo.data.hebdo.id, art.id, function(e){
                    self.app.update_articles(art, e)
                    self._update_all();
                })
                return;
            }
        }
    }

    update_all(){
        var self = this;
        confirm("Mettre à jour", "Voulez-vous vraiment prendre la dernière version de chaque article ?",
        function(){
            self._update_all()
        })
    }

}




class MaquetteSearchArticleEntry extends ArticleEntry {
    constructor(iddiv, data, manager, app) {
        super(iddiv, data, manager);
        this.app=app;
        this.find(".action-bar").empty()
        var button = `
            <a type="button" class="btn  fond-color-1 color-4" title="Ajouter l'article de l'hebdo" data-on="add">
                <i class="material-icons selection-action" >add</i>
            </a>`
        this.find(".action-bar").prepend(button)
        this.updateBind();
    }

    updateVisibility(){
        this.setVisibility(!this.app.hebdo.has_article(this.data, "articleid"))
    }

    add(){
        var self = this;
        this.app.hebdo.add_article(this.data, function(e){
            toast("Article ajouté !")
            self.manager.updateVisibility();
        })
    }

}
