from django.urls import path
from . import views

urlpatterns = [
    path('monitor/', views.monitor_screen, name='monitor_screen'),
]