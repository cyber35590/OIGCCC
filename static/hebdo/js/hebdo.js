


class Maquette {
    constructor(app, data={}, root_elem){
        this.app=app;
        this.root = root_elem
        this.info=data.hebdo

        // HebdoColumn objects by id (id is autocreated
        this.collections={} //ArticleContainer of this.pages and this.specials

        //list of all articles
        this.articles={};

       // list of columns by page 0 indexed
        this.pages = [] // ArticleContainer

        // éléments spéciaux en page 4
        this.specials = {
            medaitheque: mediatheque_container(this.app), // ArticleContainer
            menus: menus_container(this.app),
            coup_coeur: coeur_container(this.app),
            sudoku: sudoku_container(this.app)
        }
        for(var i in this.specials) this.register_container(this.specials[i])

        this.selected_article=null;
        this.selected_article_collection=null;

        this.available=new AvailableArticleCollection(this.root.find(".article_list"), this.app);
        this.register_container(this.available)


        for(var pageindex=0; pageindex<3; pageindex++){
            var page = []
            var columns = this.root.find(".page-"+(pageindex+1)+" > .page-content > .pub")
            for(var i=0; i<columns.length; i++){
                var elem = $(columns[i])
                var column = new HebdoColumn(elem, this.app, STYLES_PARAMS[pageindex][i]);
                this.register_container(column);
                page.push(column);
            }
            this.pages.push(page)
        }

        this.reset(data)
    }

    select_article(elem, data, col){
        $(".selected").removeClass("selected")
        this.selected_article=data;
        this.selected_article_collection=col;
        elem.addClass("selected");
    }
    unselect(){
        $(".selected").removeClass("selected")
    }

    register_container(container){
        this.collections[container.data_col_id]=container;
    }

    new_article(article, add_to_available=true){
        var param = {
            article: article,
            maquette: {}
        }
        this.articles[article.id]=new StyledArticle(param);
        if(add_to_available)
            this.available.append(this.articles[article.id]);
    }

    make_styled_article(id, data){
        var param = {
            article: null,
            maquette: {}
        }
        for(var i in data.articles){
            if(data.articles[i].id==id){
                param.article = data.articles[i];
            }
        }
        if(!param.article) return null;

        if(data.maquette.articles && data.maquette.articles[id]){
            param.maquette = data.maquette.articles[id];
        }
        this.selected_article=null;
        this.selected_article_collection=null;
        return new StyledArticle(param);
    }

    reset(data){
        this.data=data;
        this.articles={}
        for(var k in data.articles){
            var styled = this.make_styled_article(data.articles[k].id, data);
            if(styled) this.articles[data.articles[k].id]=styled;
        }

        if(Object.keys(data.maquette.placement).length){
            var pla = data.maquette.placement;
            for(var i in pla.pages){
                var page = pla.pages[i];
                for(var j in page){
                    this.pages[i][j].set_json(page[j], this.articles);
                }
            }

            for(var i in pla.specials){
                this.specials[i].set_json(pla.specials[i], this.articles);
            }
            this.available.set_json(pla.available, this.articles);
            for(var k in this.articles){
                var art = this.articles[k]
                if(!art.collection){
                   this.available.append(art);
                }
            }
        } else {
            for(var k in this.articles){
                this.available.append(this.articles[k]);
            }
        }

        this.last_save = JSON.stringify(this.get_json());
    }

    has_article(x, field){
        for(var k in this.articles){
            var art = this.articles[k];
            if(x[field]==art[field]) return true;
        }
        return false;
    }

    get_col(page, which=null){
        if(which==null) return this.columns[page];
        if(typeof which == "string") which = (which.toLowerCase()=="little")?1:2;
        return this.pages[page][which];
    }

    render(){
        var x = $(this.root.find(".hebdo-root").parent().html())
        x.find("[class^='_']").remove()
        return x.html();
    }

    get_json(){
        var pages = []
        for(var i in this.pages){
            var page = this.pages[i];
            var pageout = []
            for(var j in page){
                pageout.push(page[j].get_json())
            }
            pages.push(pageout)
        }
        var specials = {}
        for(var k in this.specials){
            specials[k]=this.specials[k].get_json();
        }

        var available = this.available.get_json();

        var articles={}
        for(var k in this.articles){
            articles[k] = this.articles[k].get_json();
        }
        return {
            rendu: this.render(),
            placement:  JSON.stringify({
                articles: articles,
                available: available,
                pages: pages,
                specials: specials
            })
        }
    }


    add_article(article, fct=null){
        var self = this;
        API.hebdo_add(app.hebdo.data.hebdo.id, article.id, function(e){
            self.new_article(article);
            if(fct) fct(article);
        })
    }


    has_changed(){
        return JSON.stringify(this.get_json())!=this.last_save;
    }

    refresh_article(data){
        var col = this.articles[data.id].collection;
        col.refresh_article(data)
    }

    save(cb=null){
        var self = this;
        var js = this.get_json();
        API.maquette_set(this.app.hebdo.data.hebdo.id, this.app.hebdo.data.maquette.id,
                            js, function(e){
            toast("Maquette sauvegardée !")
            self.last_save = JSON.stringify(js);
            if(cb) cb();
        })
    }

    remove(id){
        var self = this;
        API.hebdo_remove(this.data.hebdo.id, id, function(e){
            self.articles[id].collection.remove(id);
            delete self.articles[id];
            toast("Article enlevé de l'hebdo")
        })
    }

    get_articles_id(){
        var out=[]
        for(var k in this.articles) out.push(this.articles[k].id);
        return out
    }

    get_articles_articleid(){
        var out=[]
        for(var k in this.articles) out.push(this.articles[k].articleid);
        return out
    }

    //quand latest=false
    update_article(){

    }
}

class ArticleContextMenu extends DataBind {
    constructor(elem, app){
        super(elem);
        this.app=app;
        this.data=null;
        this.root=this._root;
    }

    toggle(data, x, y){
        if(this.root.is(":visible")){
            this.hide();
        }else{
            this.show(data, x, y);
        }
    }

    show(data, x, y){
        this.data=data;
        this.root.show();
        this.root[0].style.left=x+"px"
        this.root[0].style.top=y+"px"
        this.root.show();
    }

    hide(){
        this.root.hide();
    }

    edit(){
        this.hide();
        this.app.show_article(this.data.id);
    }

    remove(){
        this.hide();
        this.app.hebdo.remove(this.data.id)
    }



    update(){
        var self = this;
        var old_data = this.data;
        API.hebdo_update(this.app.hebdo.data.hebdo.id, old_data.id, function(e){
            self.app.update_articles(old_data, e)
        });
        this.hide();

    }
}

document.addEventListener( "click", function(e) {
    var button = e.which || e.button;
    if ( button === 1 ) {
        app.article_context_menu.hide();
    }
});

window.onkeyup = function(e) {
    if ( e.keyCode === 27 ) {
        app.article_context_menu.hide();
    }
}


class HebdoApplication {

    constructor(data, root){
        this.hebdo_visualizer = new HebdoWidget($(".hebdo_visualizer"))
        this.hebdo = new Maquette(this, data, root);
        this.article_context_menu = new ArticleContextMenu($(".context-menu"), this)
        this.available_menu_bar = new MenuAvailableBar($(".available-menu-bar"), this);
        this.main_menu_bar = new MenuActionBar($(".main-menu-bar"), this);
    }

   show_article(data){
        if(typeof data == "string" || Number.isInteger(data)){
            data=this.hebdo.articles[data];
        }
        article_init(data, EmbeddedArticle, this);
        $("#article-modal").modal("show")
    }

    refresh_article(data){
        this.hebdo.refresh_article(data);
    }

    save(cb=null){
        this.hebdo.save(cb)
    }

    update_articles(oldart, newart){
        this.hebdo.new_article(newart, false);
        newart = this.hebdo.articles[newart.id];
        var container = oldart.collection;
        var oldindex = container.find_index(oldart.id);
        container.insert(newart, oldindex);
        container.remove(oldart.id);
        delete this.hebdo.articles[oldart.id];
    }
}



class WidthResizeablePane {

    constructor(elem, bar = null){
        var self = this;
        this.root = elem;
        this.hebdo_root = this.root.find(".hebdo_root")
        this.bar = bar?bar:(elem.next());
        this.pos=null;
        this.body = $("body")[0]
        this.after=this.bar.next();
        this.return_false = function(){return false;}
        this.callback = function(e){self.on_resize(e); }
        this.bar.on("mousedown", function(e){
            self.pos = e.originalEvent.x;
            $(document).on("mousemove", self.callback);
            $(document).on("selectstart", self.return_false);
        });
        $(document).on("mouseup", function(){
            $(document).off("mousemove", self.callback);
            $(document).off("selectstart", self.return_false);
        })
        this.root.bind('mousewheel DOMMouseScroll', function(event)
        {
            if(event.ctrlKey == true)
            {
                event.preventDefault();
                var zoom = self.get_zoom();
                if(event.originalEvent.detail > 0) {
                     if(zoom>0.1) self.set_zoom(zoom-0.1);
                }else {
                     if(zoom<3) self.set_zoom(zoom+0.1);
                }
            }
        });


        this.init();
    }

    get_zoom(){
        var val = parseFloat(/[0-9\.]+/.exec(this.hebdo_root.css("transform")));
        return isNaN(val)?1:val
    }

    set_zoom(val){
        var zoompc = val/this.get_zoom();
        var offset = this.root.scrollTop()
        this.hebdo_root.css("transform", "scale("+val+")")
        this.root.scrollTop(offset)
    }

    init(){
          var leftwidth = parseInt(getComputedStyle(this.root[0], '').width);
          this.root[0].style.width = leftwidth + "px";
          leftwidth+=parseInt(getComputedStyle(this.bar[0], '').width)
          this.after[0].style.width=(parseInt(getComputedStyle(this.body, '').width) -leftwidth)+"px"
    }

    on_resize(e){
          e.preventDefault();
          const dx = e.originalEvent.x - this.pos;
          this.pos = e.originalEvent.x;
          var leftwidth = (parseInt(getComputedStyle(this.root[0], '').width) + dx);
          this.root[0].style.width = leftwidth + "px";
          leftwidth+=parseInt(getComputedStyle(this.bar[0], '').width)
          this.after[0].style.width=(parseInt(getComputedStyle(this.body, '').width) -leftwidth)+"px"
    }
}


class HebdoWidget extends WidthResizeablePane {
    constructor(root, bar=null){
        super(root, bar);
    }
}


var app;
$(document).ready(function(){
    $(".hebdo_root").append(new_hebdo(data.hebdo));
    app = new HebdoApplication(data, $(".app_root"));

    window.addEventListener('beforeunload', function (e) {
      if(app.hebdo.has_changed()){
        e.preventDefault();
        e.returnValue = 'Êtes-vous sur de vouloir quitter sans enregistrer';
      }
    });
})

