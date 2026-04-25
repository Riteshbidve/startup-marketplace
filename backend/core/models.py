from django.contrib.auth.models import AbstractUser
from django.db import models


# USER MODEL
class User(AbstractUser):
    ROLE_CHOICES = (
        ('founder', 'Founder'),
        ('buyer', 'Buyer'),
    )

    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='buyer')
    linkedin_profile = models.URLField(blank=True, null=True)

    def __str__(self):
        return self.username


# TAG MODEL
class Tag(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name


# PRODUCT MODEL
class Product(models.Model):
    founder = models.ForeignKey(User, on_delete=models.CASCADE, related_name='products')
    name = models.CharField(max_length=255)
    description = models.TextField()
    problem_statement = models.TextField()
    website_url = models.URLField(blank=True, null=True)
    video_url = models.URLField(blank=True, null=True)
    tags = models.ManyToManyField(Tag, related_name='products', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


# LEAD STATUS CHOICES
STATUS_CHOICES = (
    ('new', 'New'),
    ('contacted', 'Contacted'),
    ('converted', 'Converted'),
    ('rejected', 'Rejected'),
)


# LEAD MODEL
class Lead(models.Model):
    
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='leads')
    buyer = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='leads')

    name = models.CharField(max_length=100)
    email = models.EmailField()

    company_size = models.CharField(max_length=50)
    budget_range = models.CharField(max_length=50)
    urgency_level = models.IntegerField(default=1)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='new')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} - {self.product.name}"
