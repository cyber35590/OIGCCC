

class ParametersTab
{
    static TASK_ID="ParameterInit"
    constructor(){
        this.db = new DataBind("parameters-div");
        this.config={}
        this.recieved_config={}
        this.load();
        this.current_toast=null;
    }

    save(){
        Loading.open();
        var self=this
        API.set_config(this.db.fields,{
            success:function(d){
                self._load(d)
                Loading.close()
                toast("Configuration envoyé ! Redémarrez le serveur pour appliquer les modifications")
            }
        })
    }

    get_new_url(port){
        return  window.location.protocol+"//"+window.location.hostname+":"+port+window.location.pathname+"api/command/ping"
    }

    ping(port){
        var self = this;
        API.ping(this.get_new_url(port),{
            success: function(d){
                Loading.close()
                window.location.href=window.location.protocol+"//"+window.location.hostname+":"+
                            port+window.location.pathname;
            },
            errorFct: function(d, hasJs){
                if(hasJs && d.code!=401){
                    setTimeout(function(){
                        self.ping(port)
                    }, 1000)
                }else{
                    window.location.href=window.location.protocol+"//"+window.location.hostname+":"+
                            port+window.location.pathname;
                }
            }
        })
    }

    save_and_restart(){
        Loading.open();
        var self=this;
        API.set_config(this.db.fields,{
            success:function(d){
                self._load(d)
                API.restart({
                    success:function(){
                        toast("Redémarrage du serveur")
                        setTimeout(function(){
                            self.ping(self.db.fields.server.port)
                        }, 500)

                }})
            }
        })
    }

    _load(x){
        this.recieved_config=Object.assign({}, x)
        this.db.set_fields(x)
        Loading.close()
    }

    load(){
        Loading.open();
        var self = this
        API.get_config(this.config,{
            success:function(d){
                self._load(d)
                App.finished(ParametersTab.TASK_ID)
            }
        })
    }

    get(x){
        var obj = this.db.updateFields()
        if(x) return obj[x]
        return obj
    }


    server_exit(b){
        API.exit(b, function(d){
        })
    }

    server_restart(){
        API.restart(function(d){
        })
    }

    subsonic_test()
    {
        var data = this.db.updateFields()
        API.subsonic_test(data.subsonic,{
            success: function(d){
                toast("Connexion réussie !")
            },
            errorFct: function(data, err, msg){
                if(err){
                    toast_error("Erreur, impossible d'établir la connexion (code: "+data.data.code
                        +" message: '"+data.data.message+"' )")
                }else{
                    toast_error("Erreur: "+data)
                }
            }
        })
    }

    _subsonic_status(){
        var self=this
        API.subsonic_status_scan({
            success: function(d){
                if(d.scanning){
                    var text  = "Scan en cours "+d.count+" fichiers trouvés "
                    if(!self.current_toast){
                        self.current_toast=toast(text, 0);
                    }
                    setTimeout(function(){
                        self._subsonic_status()
                    }, 500)
                    self.current_toast.html(text)
                }else{
                    if(self.current_toast) self.current_toast.remove();
                    toast("Scan terminé: "+d.count+" chansons trouvées", 20000)
                }
            }
        })
    }

    subsonic_update()
    {
        var data = this.db.updateFields()
        var self=this
        this.current_toast=null;
        if(! dict_compare(this.recieved_config.subsonic,data.subsonic)){
            modal_alert("Modification non sauvegardés",
            "Merci de sauvegarder (redémarrage non nécessaire) avant de faire cette action")
        }else{
            API.subsonic_start_scan({
                success: function(d){
                    toast("Scan en cours, merci de patienter")
                    self._subsonic_status()
                }
            })
        }
    }
}

var Config = null;

App.enqueue_to_load(function(){
    Config=new ParametersTab(ParametersTab.TASK_ID);
}, ParametersTab.TASK_ID)
