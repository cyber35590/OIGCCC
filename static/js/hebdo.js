
function array_cmp(a, b){
    if(a.length!=b.length) return false;
    for(var i in a){
        if(!b.includes(a[i])) return false;
        if(!a.includes(b[i])) return false;
    }
    return true;
}

function dropdown_hebdo_done(id, status){
    var html = `
        <a class="dropdown" id="dropdown_hebdo_status_[[id]]">
          <button class="btn btn-secondary dropdown-toggle [[classe]] dropdown-badge" type="button"
                        id="dropdown_hebdo_status_[[id]]_value"  data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
            [[status]]
          </button>
          <div class="dropdown-menu  dropdown-badge-entry-root">
            <button class="dropdown-item dropdown-badge-entry" data-on="set_hebdo_state(PublicationStatus.IGNORE)">Ne pas Faire</button>
            <button class="dropdown-item dropdown-badge-entry theme-1" data-on="set_hebdo_state(PublicationStatus.A_FAIRE)">À faire</button>
            <button class="dropdown-item dropdown-badge-entry theme-3" data-on="set_hebdo_state(PublicationStatus.A_MODIFIER)">À modifier</button>
            <button class="dropdown-item dropdown-badge-entry theme-2" data-on="set_hebdo_state(PublicationStatus.FAIT)">Fait</button>
          </div>
        </a>
    `
    return $(Mustache.render(html, {
        classe: PublicationStatus.to_class(status),
        status: PublicationStatus.to_str(status),
        id: id
    }));
}


class SearchArticleEntry extends ArticleEntry {
    constructor(iddiv, data) {
        super(iddiv, data);
        this.find(".menu-action-other").remove()
        var button = `
            <a type="button" class="btn  fond-color-1 color-4" title="Ajouter l'article de l'hebdo" data-on="add">
                <i class="material-icons selection-action" >add</i>
            </a>`
        this.find(".action-bar").prepend(button)

        this.find(".article-content").prepend(dropdown_hebdo_done(data.id, data.pub_hebdo))
        this.updateBind();
    }

    updateVisibility(){
        this.setVisibility(!HebdoForm.has_article(this.data))
    }

    add(){
        API.hebdo_add(HebdoForm.data.id, this.data.id, function(){
            HebdoForm.on_update();
            toast("Article ajouté")
        })
    }

    set_hebdo_state(n){
        var self=this;
        API.article_set(this.data.id, "pub_hebdo", n, function(d){
            var drop = $("#dropdown_hebdo_status_"+self.data.id+"_value")
            drop.removeClass(["theme-1", "theme-2", "theme-3"])
            drop.addClass(PublicationStatus.to_class(n))
            drop.html(PublicationStatus.to_str(n))
            toast("Valeur modifiée")
        })
    }


}

class HebdoArticleEntry extends ArticleEntry {
    constructor(iddiv, data) {
        super(iddiv, data);
        this.find(".menu-action-other").remove()
        this.find(".badge_hebdo").remove()
        var button = `
            <a type="button" class="btn  fond-color-1 color-4" title="Enelever l'article de l'hebdo" data-on="remove">
                <i class="material-icons selection-action" >remove</i>
            </a>`
        this.find(".action-bar").prepend(button)

        this.find(".article-content").prepend(dropdown_hebdo_done(data.id, data.pub_hebdo))
        this.updateBind();
    }

    remove(){
        API.hebdo_remove(HebdoForm.data.id, this.data.id, function(){
            HebdoForm.on_update();
            toast("Article enlevé")
        })
    }


    set_hebdo_state(n){
        var self=this;
        API.article_set(this.data.id, "pub_hebdo", n, function(d){
            var drop = $("#dropdown_hebdo_status_"+self.data.id+"_value")
            drop.removeClass(["theme-1", "theme-2", "theme-3"])
            drop.addClass(PublicationStatus.to_class(n))
            drop.html(PublicationStatus.to_str(n))
            toast("Valeur modifiée")
        })
    }
}



function __set_visibility(child, done, not_to_done){
    var show = false;
    if(child.data.pub_hebdo==PublicationStatus.A_FAIRE || child.data.pub_hebdo==PublicationStatus.A_MODIFIER)
       return true;
    if(done && child.data.pub_hebdo==PublicationStatus.FAIT) return true;
    if(not_to_done && child.data.pub_hebdo==PublicationStatus.IGNORE) return true;
    return false;
}

class _HebdoForm extends DataBind {
    constructor(){
        super("hebdo_form");
        this.search_list = new ArticleEntryManager("add-article-root", SearchArticleEntry);
        this.search_form = new RechercheSimpleForm("recherche_simple", this.search_list);
        this.articles =  new ArticleEntryManager("hebdo-articles-root", HebdoArticleEntry);
        this.data = JSON.parse(data_str);
        this.old_data = Object.assign({}, this.data)
        this.id = this.data.id;
        this.on_update_success(this.data, true);
    }

    getData(){
        this.updateFields();
        var out = Object.assign({}, this.fields);
        return out
    }

    setData(d){
        this.data=d;
        this.old_data = Object.assign({}, )
        this.set_fields(d)
    }

    on_start_changed(){
        var end = new Date(HebdoForm.find("[data-bind^=date_debut]").val())
        end.setDate(end.getDate()+7);
        var date_str = date_to_std_date(end);
        console.log("New date : ", date_str);
        HebdoForm.find("[data-bind^=date_fin]").val(date_str);
        this.on_update();
    }

    on_update(data=null){
        if(data && !(data instanceof jQuery)){
            this.data=data;
            this.on_update_success();
        }
        else{
            var d = this.getData();
            var self = this;
            API.hebdo_set(d, {
                success: function(e){self.on_update_success(e);}
            });
        }
    }
    _on_update_success(){return on_update_success();}

    on_update_success(data, force=false){
        var update_art = false;

        $("#prop_creation").html((new Date(data.date_creation*1000)).toLocaleString());
        $("#prop_modification").html((new Date(data.date_modification*1000)).toLocaleString());
        $("#prop_id").html(data.id);
        $("#prop_revision").html(data.revision);
        $("#prop_article_count").html(data.articles_count);
        $("#prop_article_count_2").html(data.articles_count);
        $("#prop_chars").html(data.char_count);
        $("#prop_words").html(data.word_count);
        update_art = !array_cmp(data.articles, this.data.articles);
        this.setData(data);
        this.update_articles();
    }

    update_articles(){
        var self = this;
        var query ={
            ids: this.data.articles,
            sort_col: this.fields.sort_col,
            order:  this.fields.order
        }

        API.article_search_query(query,{
            success: function(e){
                self.articles.set(e);
                self.update_visibility();
            }
        })
    }

    update_visibility(){
        var fait = $("#show_done").is(":checked");
        var ne_pas_faire = $("#show_ignore").is(":checked");
        this.articles.showIf(__set_visibility, fait, ne_pas_faire);
        this.search_list.updateVisibility();
    }

    __mark_all(val){
        var self = this;
        API.articles_batch(this.data.articles, {pub_hebdo: val}, {
            success: function(e){
                self.articles.set(e);
                self.update_visibility();
            }
        })
    }

    mark_all_done(){ this.__mark_all(PublicationStatus.FAIT);  }

    mark_all_to_do(){ this.__mark_all(PublicationStatus.A_FAIRE);  }

    has_article(data_or_id){
        var id=data_or_id;
        if(!Number.isInteger(data_or_id)) id=data_or_id.articleid;
        for(var i in this.articles.children){
            if(id==this.articles.children[i].data.articleid) return true;
        }
        return false;
    }

    has_revision(data_or_id){
        var id=data_or_id;
        if(!Number.isInteger(data_or_id)) id=data_or_id.id;
        for(var i in this.articles.children){
            if(id==this.articles.children[i].data.id) return true;
        }
        return false;
    }

    show_add_article(){
        $("#add-article-modal").modal("show")
    }

    auto_add(){
        var id = this.data.id;
        var self = this;
        var query={
            query: 'pub(date("'+iso_to_std_date(this.data.date_debut)+'"), date("'+iso_to_std_date(this.data.date_fin)+'")) et (debut ou fin)',
            revision: "latest",
            archives: "hide_archives"
        }
        API.article_search_query(query, function(articles){
            var out = []
            for(var i in articles) out.push(articles[i].id);
            API.hebdo_add_batch(id, out, function(x){
                self.on_update();
            });
        })
    }

}


function show_maquettes(){
    $("#template-maquette").modal("show");
    API.maquette_list(HebdoForm.data.id, function(d){
        var elem = $("#maquette-select")
        elem.empty();
        for(var i in d){
            var id = d[i].id;
            elem.append($('<option value="'+id+'">Version '+id+'</option>'))
        }
    })
}

function maquette_edit(id){
    location.href="/hebdo/"+HebdoForm.data.id+"/maquette/"+id;
}

function maquette_dup(id=null){
    if(id){
        API.maquette_duplicate(HebdoForm.data.id, id, function(e){
            location.href="/hebdo/"+HebdoForm.data.id+"/maquette/"+e.id;
        });
    }else{
        location.href="/hebdo/"+HebdoForm.data.id+"/maquette/new";
    }
}


var HebdoForm;
$(document).ready(function(){
    HebdoForm = new _HebdoForm();
})
