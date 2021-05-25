var editor;
$(document).ready(function(){
    editor = SUNEDITOR.create('rich-content',
    {
        "mode": "classic",
        "rtl": false,
        "katex": "window.katex",
        "imageGalleryUrl": "https://etyswjpn79.execute-api.ap-northeast-1.amazonaws.com/suneditor-demo",
        "videoFileInput": false,
        "tabDisable": false,
        "buttonList": [
            [
                "undo",
                "redo",
                "font",
                "fontSize",
                "formatBlock",
                "paragraphStyle",
                "blockquote",
                "bold",
                "underline",
                "italic",
                "strike",
                "subscript",
                "superscript",
                "fontColor",
                "hiliteColor",
                "textStyle",
                "removeFormat",
                "outdent",
                "indent",
                "align",
                "horizontalRule",
                "list",
                "lineHeight",
                "table",
                "link",
                "image",
                "video",
                "audio",
                "math",
                "imageGallery",
                "fullScreen",
                "showBlocks",
                "codeView",
                "preview",
                "print",
                "save",
                "template"
            ]
        ]
    }) ;
    ArticleForm=new _ArticleForm();
    ArticleForm.setData(current_article);
});

var _data = JSON.parse(data_str);
var current_article = _data;
var ArticleForm;


function padding(x){
    var ret = x+"";
    if(ret.length<2) ret="0"+ret;
    return ret;
}

function formatdate(x){
    if(x){
        x=new Date(x)
        return x.getFullYear()+"-"+padding(1+x.getMonth())+"-"+padding(x.getDate())+" 12:00:00:0.000000"
    }
    return null;
}


window.addEventListener('beforeunload', function (e) {
  if(ArticleForm.isDataChanged()){
    e.preventDefault();
    e.returnValue = 'Êtes-vous sur de vouloir quitter sans enregistrer';
  }
});


class _ArticleForm extends DataBind{

    constructor(){
        super("article_form");
        this.old_data = {};
    }

    checkbox_changed(e, evt){
        var prefix = e.data("prefix")
        var cb = $("input[data-bind^=\"pub_"+prefix+"_cb\"]")
        var select = $("select[data-bind^=\"pub_"+prefix+"\"]")

        if (cb.is(":checked")){
            select.show();
        }else{
            select.hide();
        }
    }

    getData() {
        this.updateFields();
        var out = Object.assign({}, this.fields);
        var pubs = ["web", "hebdo", "panneau", "pp", "fb"]
        for(var p in pubs){
            p=pubs[p]
            if(!out["pub_"+p+"_cb"]) out["pub_"+p]=0;
            delete out["pub_"+p+"_cb"];
        }
        out.contenu=editor.getContents();
        out.date_debut=out.date_debut
        out.date_fin=out.date_fin
        return out
    }

    isDataChanged(){
        var data = this.getData()
        for(var k in this.old_data){
            if(data[k]!=this.old_data[k] && !(isNaN(data[k]) && isNaN(this.old_data[k]))){
                console.log("Field '"+k+"' changed from '"+this.old_data[k]+"' to '"+data[k]+"'")
                return true;
            }
        }
        return false;
    }

    setData(d){
        var pubs = ["web", "hebdo", "panneau", "pp", "fb"]
        editor.setContents(d.contenu);
        delete d.contenu;
        for(var p in pubs){
            p=pubs[p]
            var val=true;
           if(d["pub_"+p]==0|| d["pub_"+p]==null || d["pub_"+p]==undefined){
             val = false;
             d["pub_"+p]=2;
             $("[data-bind^=pub_"+p).hide();
           }
           else {
                $("[data-bind^=pub_"+p).show();
           }
           d["pub_"+p+"_cb"]=val;
        }
        //if(d.date_debut) d.date_debut=d.date_debut.substr(0,10)
        //if(d.date_fin)d.date_fin=d.date_fin.substr(0,10)
        d.valid=true;
        this.update_meta()
        this.set_fields(d)
        this.old_data=Object.assign(this.old_data, this.getData());
    }

    editArticle(){
        var data = this.getData();
        var self = this;
        API.article_edit(data, {
            success: function(x) {
                current_article=x;
                self.setData(current_article)
                toast("Article enregistré")
            }
        })
    }

    newRevisionArticle(){
        var data = this.getData();
        var self = this;
        API.article_new_revision(data, {
            success: function(x) {
                current_article=x;
                window.location.href="/article/"+x.id;
            }
        })

    }

    update_meta(){
        $("#prop_creation").html((new Date(current_article.date_creation*1000)).toLocaleString())
        $("#prop_modification").html((new Date(current_article.date_modification*1000)).toLocaleString())
        $("#prop_id").html(current_article.articleid)
        $("#prop_revision").html(current_article.revision)
        $("#prop_chars").html(current_article.char_count)
        $("#prop_words").html(current_article.word_count)
    }
}
