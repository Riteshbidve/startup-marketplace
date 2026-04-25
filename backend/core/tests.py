from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase


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
