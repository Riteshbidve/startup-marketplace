from rest_framework import serializers
from rest_framework.exceptions import ValidationError

from .models import Lead, Product, Tag, User


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ['id', 'username', 'password', 'role', 'linkedin_profile']
        extra_kwargs = {
            'linkedin_profile': {'required': False},
            'role': {'required': False},
        }

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name']


class ProductSerializer(serializers.ModelSerializer):
    tags = TagSerializer(many=True, read_only=True)
    founder_username = serializers.CharField(source='founder.username', read_only=True)
    founder_linkedin_profile = serializers.URLField(source='founder.linkedin_profile', read_only=True, allow_null=True)

    class Meta:
        model = Product
        fields = '__all__'
        read_only_fields = ['founder', 'created_at']


class LeadSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    buyer_username = serializers.CharField(source='buyer.username', read_only=True)
    lead_score = serializers.SerializerMethodField()
    lead_tier = serializers.SerializerMethodField()

    class Meta:
        model = Lead
        fields = '__all__'
        read_only_fields = ['buyer', 'created_at', 'product_name', 'buyer_username']

    def validate(self, attrs):
        request = self.context.get('request')
        if request and request.method == 'POST' and 'status' in attrs:
            raise ValidationError({'status': 'Status is set by the system. Founders can update it later.'})
        return attrs

    def get_lead_score(self, obj):
        budget_points = {
            '$0-$500': 0,
            '$500-$2k': 1,
            '$2k-$10k': 2,
            '$10k+': 3,
        }.get(obj.budget_range, 0)
        urgency_points = int(obj.urgency_level or 0)
        return budget_points + urgency_points

    def get_lead_tier(self, obj):
        score = self.get_lead_score(obj)
        if score >= 7:
            return 'hot'
        if score >= 5:
            return 'warm'
        return 'low'
