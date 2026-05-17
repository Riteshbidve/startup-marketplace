from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Lead, Product, Tag


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

    def test_product_search_filters_by_problem(self):
        founder = get_user_model().objects.create_user(
            username='search_founder',
            password='StrongPass123',
            role='founder',
        )
        self.client.force_authenticate(user=founder)

        product_a = Product.objects.create(
            founder=founder,
            name='Analytics Tool',
            description='Something else',
            problem_statement='Helps startups understand churn',
        )
        Product.objects.create(
            founder=founder,
            name='Sales Tool',
            description='Something else',
            problem_statement='Automates cold outreach',
        )

        response = self.client.get('/api/products/?search=churn')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], 'Analytics Tool')

        # Tag search also works.
        tag = Tag.objects.create(name='Retention')
        product_a.tags.add(tag)
        tag_response = self.client.get('/api/products/?search=retention')
        self.assertEqual(tag_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(tag_response.data), 1)
        self.assertEqual(tag_response.data[0]['name'], 'Analytics Tool')

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
        self.assertEqual(response.data['lead_tier'], 'warm')

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

    def test_founder_sees_only_leads_for_their_products(self):
        founder = get_user_model().objects.create_user(
            username='visible_founder',
            password='StrongPass123',
            role='founder',
        )
        other_founder = get_user_model().objects.create_user(
            username='hidden_founder',
            password='StrongPass123',
            role='founder',
        )
        buyer = get_user_model().objects.create_user(
            username='lead_scope_buyer',
            password='StrongPass123',
            role='buyer',
        )
        visible_product = Product.objects.create(
            founder=founder,
            name='Visible Product',
            description='Visible to owner.',
            problem_statement='Owner should see this lead.',
        )
        hidden_product = Product.objects.create(
            founder=other_founder,
            name='Hidden Product',
            description='Hidden from other founders.',
            problem_statement='Other founders should not see this lead.',
        )
        Lead.objects.create(
            product=visible_product,
            buyer=buyer,
            name='Visible Lead',
            email='visible@example.com',
            company_size='11-50',
            budget_range='$2k-$10k',
            urgency_level=4,
        )
        Lead.objects.create(
            product=hidden_product,
            buyer=buyer,
            name='Hidden Lead',
            email='hidden@example.com',
            company_size='1-10',
            budget_range='$500-$2k',
            urgency_level=2,
        )
        self.client.force_authenticate(user=founder)

        response = self.client.get('/api/leads/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['email'], 'visible@example.com')
        self.assertEqual(response.data[0]['product_name'], 'Visible Product')
        self.assertEqual(response.data[0]['buyer_username'], 'lead_scope_buyer')

    def test_buyer_sees_only_their_own_leads(self):
        founder = get_user_model().objects.create_user(
            username='buyer_scope_founder',
            password='StrongPass123',
            role='founder',
        )
        buyer = get_user_model().objects.create_user(
            username='visible_buyer',
            password='StrongPass123',
            role='buyer',
        )
        other_buyer = get_user_model().objects.create_user(
            username='hidden_buyer',
            password='StrongPass123',
            role='buyer',
        )
        product = Product.objects.create(
            founder=founder,
            name='Scoped Product',
            description='A product with two buyer leads.',
            problem_statement='Buyers should see their own lead only.',
        )
        Lead.objects.create(
            product=product,
            buyer=buyer,
            name='Visible Buyer Lead',
            email='buyer-visible@example.com',
            company_size='51-200',
            budget_range='$10k+',
            urgency_level=5,
        )
        Lead.objects.create(
            product=product,
            buyer=other_buyer,
            name='Hidden Buyer Lead',
            email='buyer-hidden@example.com',
            company_size='1-10',
            budget_range='$0-$500',
            urgency_level=1,
        )
        self.client.force_authenticate(user=buyer)

        response = self.client.get('/api/leads/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['email'], 'buyer-visible@example.com')

    def test_founder_can_update_lead_status_only(self):
        founder = get_user_model().objects.create_user(
            username='status_founder',
            password='StrongPass123',
            role='founder',
        )
        buyer = get_user_model().objects.create_user(
            username='status_buyer',
            password='StrongPass123',
            role='buyer',
        )
        product = Product.objects.create(
            founder=founder,
            name='Status Product',
            description='A product with status updates.',
            problem_statement='Founders need to manage lead status.',
        )
        lead = Lead.objects.create(
            product=product,
            buyer=buyer,
            name='Status Lead',
            email='status@example.com',
            company_size='11-50',
            budget_range='$2k-$10k',
            urgency_level=4,
        )
        self.client.force_authenticate(user=founder)

        response = self.client.patch(
            f'/api/leads/{lead.id}/',
            {'status': 'contacted'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        lead.refresh_from_db()
        self.assertEqual(lead.status, 'contacted')

        blocked_response = self.client.patch(
            f'/api/leads/{lead.id}/',
            {'email': 'changed@example.com'},
            format='json',
        )

        self.assertEqual(blocked_response.status_code, status.HTTP_403_FORBIDDEN)
        lead.refresh_from_db()
        self.assertEqual(lead.email, 'status@example.com')
