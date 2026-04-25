from django.contrib import admin
from .models import User, Product, Tag, Lead

admin.site.register(User)
admin.site.register(Product)
admin.site.register(Tag)
admin.site.register(Lead)