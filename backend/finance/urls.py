from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UserViewSet, ClientViewSet, ProjectViewSet, 
    InvoiceViewSet, AdvanceWalletViewSet, AdvanceRequestViewSet, CompanyExpenseViewSet, MonthLockViewSet,
    EnhancementViewSet, RenewalViewSet, BankAccountViewSet, TransactionViewSet, OwnerDrawViewSet,
    PasswordResetDirectView
)

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'bank-accounts', BankAccountViewSet)
router.register(r'clients', ClientViewSet)
router.register(r'projects', ProjectViewSet)
router.register(r'invoices', InvoiceViewSet)
router.register(r'advance-wallets', AdvanceWalletViewSet)
router.register(r'advance-requests', AdvanceRequestViewSet)
router.register(r'company-expenses', CompanyExpenseViewSet)
router.register(r'month-locks', MonthLockViewSet)
router.register(r'enhancements', EnhancementViewSet)
router.register(r'renewals', RenewalViewSet)
router.register(r'transactions', TransactionViewSet, basename='transaction')
router.register(r'owner-draws', OwnerDrawViewSet, basename='ownerdraw')

urlpatterns = [
    path('direct-password-reset/', PasswordResetDirectView.as_view(), name='direct_password_reset'),
    path('', include(router.urls)),
]
