


class Maquette {
    constructor(app, data={}, root_selector="#hebdo_root"){
        this.app=app;
        this.root = $(root_selector)
        this.info=data.hebdo

        //list of all articles
        this.articles={};

       // list of columns by page 0 indexed
        this.pages = [] // ArticleContainer

        // éléments spéciaux en page 4
        this.specials = {
            medaitheque: null, // ArticleContainer
            menus: null,
            coup_coeur: null,
            sudoku: null
        }

        this.not_used = null; // ArticleContainer

        // HebdoColumn objects by id (id is autocreated
        this.collections={} //ArticleContainer of this.pages and this.specials

        for(var pageindex=0; pageindex<3; pageindex++){
            var page = []
            var columns = this.root.find(".page-"+(pageindex+1)+" > .page-content > .pub")
            for(var i=0; i<columns.length; i++){
                var elem = $(columns[i])
                var column = new HebdoColumn(elem, STYLES_PARAMS[pageindex][i], this.app);
                page.push(column);
                this.collections[column.data_col_id]=column;
            }
            this.pages.push(page)
        }

        this.reset(data)
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
        return new StyledArticle(param);
    }

    reset(data){
        this.articles={}
        for(var k in data.articles){
            var styled = this.make_styled_article(data.articles[k].id, data);
            if(styled) this.articles[data.articles[k].id]=styled;
        }

        if(data.maquette){
            for(var k in this.collections){
                    this.collections[k].clear();
                }

                for(var i in this.pages){

                }

        }



    }

    get_col(page, which=null){
        if(which==null) return this.columns[page];
        if(typeof which == "string") which = (which.toLowerCase()=="little")?1:2;
        return this.pages[page][which];
    }

    get_json(){
        var pages = []
        for(var i in this.pages){
            var page = this.pages[i];
            for(var j in page){
                pages.push(page[j].get_json())
            }
        }
        var specials = {}
        for(var k in this.specials){
            specials[k]=this.specials[k].get_json();
        }

        var not_used = this.not_used.get_json();

        var articles={}
        for(var k in this.articles){
            articles[k] = this.articles[k].get_json();
        }
        return {
            articles: articles,
            not_used: not_used,
            pages: pages,
            specials: specials
        }
    }


}

class HebdoApplication {

    constructor(data){
        this.hebdo = new Maquette(this, data);
        this.hebdo_visualizer = new WidthResizeablePane($(".hebdo_visualizer"))
    }

}


var app;
$(document).ready(function(){
    $("#hebdo_root").append(new_hebdo(data.hebdo));
    app = new HebdoApplication(data);
    app.hebdo.pages[0][0].append(app.hebdo.articles[2]);
})

class WidthResizeablePane {

    constructor(elem, bar = null){
        var self = this;
        this.root = elem;
        this.bar = bar?bar:(elem.next());
        this.pos=null;
        this.callback = function(e){self.on_resize(e);}
        this.bar.on("mousedown", function(e){
            self.pos = e.originalEvent.x;
            $(document).on("mousemove", self.callback);
        });
        $(document).on("mouseup", function(){$(document).off("mousemove", self.callback); })
    }

    on_resize(e){
          const dx = e.originalEvent.x - this.pos;
          this.pos = e.originalEvent.x;
          this.root[0].style.width = (parseInt(getComputedStyle(this.root[0], '').width) + dx) + "px";
    }
}
