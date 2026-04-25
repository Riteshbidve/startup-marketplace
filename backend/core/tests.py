from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Lead, Product


class AuthenticationApiTests(APITestCase):
    def test_user_can_register_and_login(self):
        register_response = self.client.post(
            reverse('register'),
            {
                'username': 'founder_user',
                'password': 'StrongPass123',
                'role': 'founder',
            },
            format='json',
        )

        self.assertEqual(register_response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(register_response.data['username'], 'founder_user')
        self.assertEqual(register_response.data['role'], 'founder')
        self.assertNotIn('password', register_response.data)

        login_response = self.client.post(
            reverse('token_obtain_pair'),
            {
                'username': 'founder_user',
                'password': 'StrongPass123',
            },
            format='json',
        )

        self.assertEqual(login_response.status_code, status.HTTP_200_OK)
        self.assertIn('access', login_response.data)
        self.assertIn('refresh', login_response.data)

    def test_products_api_requires_authentication(self):
        anonymous_response = self.client.get('/api/products/')

        self.assertEqual(anonymous_response.status_code, status.HTTP_401_UNAUTHORIZED)

        user = get_user_model().objects.create_user(
            username='buyer_user',
            password='StrongPass123',
            role='buyer',
        )
        self.client.force_authenticate(user=user)

        authenticated_response = self.client.get('/api/products/')

        self.assertEqual(authenticated_response.status_code, status.HTTP_200_OK)

    def test_founder_can_create_product_with_automatic_owner(self):
        founder = get_user_model().objects.create_user(
            username='founder_owner',
            password='StrongPass123',
            role='founder',
        )
        self.client.force_authenticate(user=founder)

        response = self.client.post(
            '/api/products/',
            {
                'name': 'TrustPilot for Startups',
                'description': 'Collects buyer intent for early SaaS products.',
                'problem_statement': 'Startups struggle to prove credibility before they have customers.',
                'website_url': 'https://example.com',
                'video_url': '',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        product = Product.objects.get(name='TrustPilot for Startups')
        self.assertEqual(product.founder, founder)

    def test_buyer_cannot_create_product(self):
        buyer = get_user_model().objects.create_user(
            username='buyer_creator',
            password='StrongPass123',
            role='buyer',
        )
        self.client.force_authenticate(user=buyer)

        response = self.client.post(
            '/api/products/',
            {
                'name': 'Buyer Product',
                'description': 'This should not be allowed.',
                'problem_statement': 'Buyers should submit leads, not products.',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(Product.objects.filter(name='Buyer Product').exists())

    def test_buyer_can_submit_lead_with_automatic_owner(self):
        founder = get_user_model().objects.create_user(
            username='lead_founder',
            password='StrongPass123',
            role='founder',
        )
        product = Product.objects.create(
            founder=founder,
            name='Lead Capture Tool',
            description='Captures buyer requests.',
            problem_statement='Founders need qualified conversations.',
        )
        buyer = get_user_model().objects.create_user(
            username='lead_buyer',
            password='StrongPass123',
            role='buyer',
        )
        self.client.force_authenticate(user=buyer)

        response = self.client.post(
            '/api/leads/',
            {
                'product': product.id,
                'name': 'Ritesh Buyer',
                'email': 'ritesh@example.com',
                'company_size': '11-50',
                'budget_range': '$2k-$10k',
                'urgency_level': 4,
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        lead = Lead.objects.get(email='ritesh@example.com')
        self.assertEqual(lead.buyer, buyer)
        self.assertEqual(lead.status, 'new')

    def test_founder_cannot_submit_lead(self):
        founder = get_user_model().objects.create_user(
            username='blocked_lead_founder',
            password='StrongPass123',
            role='founder',
        )
        product = Product.objects.create(
            founder=founder,
            name='Founder Product',
            description='A founder-owned product.',
            problem_statement='Buyers should submit leads.',
        )
        self.client.force_authenticate(user=founder)

        response = self.client.post(
            '/api/leads/',
            {
                'product': product.id,
                'name': 'Founder Lead',
                'email': 'founder@example.com',
                'company_size': '1-10',
                'budget_range': '$500-$2k',
                'urgency_level': 2,
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(Lead.objects.filter(email='founder@example.com').exists())
