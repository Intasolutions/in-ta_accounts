import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from finance.models import User, AdvanceWallet

# Create Super Admin
super_admin, created = User.objects.get_or_create(username='superadmin', defaults={'first_name': 'Super', 'last_name': 'Accountant', 'role': 'SUPER_ADMIN'})
if created:
    super_admin.set_password('pass123')
    super_admin.save()
    AdvanceWallet.objects.create(user=super_admin)

# Create Admin (Founder)
admin, created = User.objects.get_or_create(username='admin', defaults={'first_name': 'Admin', 'last_name': 'Founder', 'role': 'ADMIN'})
if created:
    admin.set_password('pass123')
    admin.save()
    AdvanceWallet.objects.create(user=admin)

print("Seed completed.")
