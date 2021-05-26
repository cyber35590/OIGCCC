

class Hebdo {
    constructor(){

    }
}


var data = {
    titre:"Mon tire",
    contenu: "salut<br>salut<br>salut<br>salut<br>salut<br>salut<br>"
}

$(document).ready(()=> ($("#hebdo_root").append(new_hebdo(data))))