var editor;
var editor_inited = false;
var current_article;
var ArticleForm;
function format_pasted_data(input){

}
var customCommand = {
    // @Required @Unique
    // plugin name
    name: 'customCommand',
    // @Required
    // data display
    display: 'command',

    // @Options
    title: 'Add range tag',
    buttonClass: '',
    innerHTML: '<i class="material-icons">duplicate</i>',

    // @Required
    // add function - It is called only once when the plugin is first run.
    // This function generates HTML to append and register the event.
    // arguments - (core : core object, targetElement : clicked button element)
    add: function (core, targetElement) {
        const context = core.context;
        const rangeTag = core.util.createElement('div');
        core.util.addClass(rangeTag, '__se__format__range_custom');
        context.customCommand = {
            targetButton: targetElement,
            tag: rangeTag
        };
    },

    action: function () {
        var cont = editor.getContents();
        cont=cont.replaceAll("<br>", "")

        editor.setContents(cont)
    }
}
function article_init(article, classe=_ArticleForm, ...params){
    if(!editor_inited){
        editor_inited=true;
        editor = SUNEDITOR.create('rich-content',
        {
            "plugins" : [customCommand],
            "mode": "classic",
            "rtl": false,
            "charCounter": true,
            "charCounterLabel": "Nombre de carctères",
            "katex": "window.katex",
            "imageGalleryUrl": "https://etyswjpn79.execute-api.ap-northeast-1.amazonaws.com/suneditor-demo",
            "videoFileInput": false,
            "tabDisable": false,
            "buttonList": [
                [
                    "undo",
                    "redo",
                    "customCommand",
                    //"font",
                    //"fontSize",
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
                    //"textStyle",
                    "removeFormat",
                    "outdent",
                    "indent",
                    "align",
                    "horizontalRule",
                    "list",
                    //"lineHeight",
                    "table",
                    "link",
                    "image",
                    //"video",
                    //"audio",
                    "math",
                    "imageGallery",
                    "fullScreen",
                    "showBlocks",
                    "codeView",
                    "preview",
                    //"print",
                    //"save",
                    "template"
                ]
            ]
        }) ;
        $(editor).bind("paste",function(e){
            var pastedData = e.originalEvent.clipboardData.getData('text');
            alert(pastedData);
            editor.setContents(format_pasted_data(pastedData));
        })
    }
    ArticleForm = new classe(...params);
    ArticleForm.setData(current_article=article);
}



class _ArticleForm extends DataBind{

    constructor(rootid="article_form"){
        super(rootid);
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
                return true;
            }
        }
        return false;
    }

    setData(d){
        var pubs = ["web", "hebdo", "panneau", "pp", "fb"]
        editor.setContents(d.contenu);
        //delete d.contenu;
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



var ArticleForm;