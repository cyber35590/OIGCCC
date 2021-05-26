from django.urls import path
from django.conf.urls.static import static
from . import views

urlpatterns = [
    path('', views.new_article, name='index'),
    path('article/new', views.new_article),
    path('article/<int:id>', views.modify_article),
    path('articles', views.list_articles),
    path('hebdo/list', views.hebdo_list),
    path('hebdo/<int:id>', views.hebdo_edit),
    path('hebdo/new', views.hebdo_new),
    path('hebdo/test', views.hebdo_test),
    path('hebdo/<int:id>/maquette/new', views.hebdo_make_new),
    path('hebdo/<int:id>/maquette/<int:mid>', views.hebdo_make),

    path('api/article/<int:id>/<str:key>/<str:val>', views.api_article_set),
    path('api/article/<int:id>/<str:key>', views.api_article_get),
    path('api/article/<int:id>', views.api_modify_article),
    path('api/articles', views.api_list_articles),
    path('api/articles/batch', views.api_articles_batch),
    path('api/articles/query', views.api_list_article_query),
    path('api/articles/query/check', views.api_list_article_query_check),
    path('api/hebdo/list', views.api_hebdo_list),
    path('api/hebdo/<int:id>', views.api_hebdo),
    path('api/hebdo/<int:id>/add/<int:article>', views.api_hebdo_add_article),
    path('api/hebdo/<int:id>/add', views.api_hebdo_add_batch),
    path('api/hebdo/<int:id>/remove/<int:article>', views.api_hebdo_remove_article),
    path('api/hebdo/<int:id>/delete', views.api_hebdo_delete),
    path('api/hebdo/<int:id>/maquette/new', views.api_hebdo_maquette_new),
    path('api/hebdo/<int:id>/maquette/list', views.api_hebdo_maquette_list),
    path('api/hebdo/<int:id>/maquette/<int:mid>', views.api_hebdo_maquette),
    path('api/hebdo/<int:id>/maquette/<int:mid>/duplicate', views.api_hebdo_maquette_duplicate),
    path('api/hebdo/<int:id>/maquette/<int:mid>/delete', views.api_hebdo_maquette_delete),
]