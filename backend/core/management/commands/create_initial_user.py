import os

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Create an initial superuser from DJANGO_SUPERUSER_USERNAME and DJANGO_SUPERUSER_PASSWORD if no users exist."

    def handle(self, *args, **options):
        if User.objects.exists():
            self.stdout.write("Users already exist — skipping initial user creation.")
            return

        username = os.getenv("DJANGO_SUPERUSER_USERNAME")
        password = os.getenv("DJANGO_SUPERUSER_PASSWORD")

        if not username or not password:
            self.stdout.write(
                "No users exist and DJANGO_SUPERUSER_USERNAME / DJANGO_SUPERUSER_PASSWORD "
                "are not set — skipping initial user creation."
            )
            return

        User.objects.create_superuser(username=username, password=password)
        self.stdout.write(f'Created initial superuser "{username}".')
