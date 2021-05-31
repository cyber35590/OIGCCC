
class EmbeddedArticle extends _ArticleForm {
    constructor(app){
        super();
        this.app=app;
        $(".title_bar").remove()
        $("[data-on=editArticle]").remove()
    }


    editArticle(){
        var data = this.getData();
        var self = this;
        API.article_edit(data, {
            success: function(x) {
                current_article=x;
                self.setData(current_article)
                self.app.refresh_article(current_article)
                toast("Article enregistré")
            }
        })
    }

}

