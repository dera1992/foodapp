from django.urls import include, path

urlpatterns = [
    path('auth/', include('account.api.auth_urls')),
    path('account/', include('account.api.urls')),
    path('blog/', include('blog.api.urls')),
    path('foodcreate/', include('foodCreate.api.urls')),
    path('home/', include('home.api.urls')),
    path('comments/', include('comments.api.urls')),
    path('marketing/', include('marketing.api.urls')),
    path('search/', include('search.api.urls')),
    path('owner/', include('owner.api.urls')),
    path('cart/', include('cart.api.urls')),
    path('order/', include('order.api.urls')),
    path('chat/', include('chat.api.urls')),
    path('budget/', include('budget.api.urls')),
    path('voice/', include('voice.api.urls')),
]
