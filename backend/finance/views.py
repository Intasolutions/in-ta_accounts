from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.views import APIView
from rest_framework.response import Response
from django.conf import settings
from pywebpush import webpush, WebPushException
import json

from django.contrib.auth import get_user_model
from django.http import HttpResponse
from decimal import Decimal
from django.core.mail import send_mail
from django.utils import timezone
from datetime import timedelta
import random
from django.db.models import Sum
from .models import User, Client, Project, Invoice, AdvanceWallet, AdvanceRequest, CompanyExpense, MonthLock, Enhancement, Renewal, BankAccount, Transaction, OwnerDraw, OwnerRepayment, RevenueShareScope, Quotation, PushSubscription
from .serializers import (
    UserSerializer, ClientSerializer, ProjectSerializer, 
    InvoiceSerializer, AdvanceWalletSerializer, AdvanceRequestSerializer, CompanyExpenseSerializer, MonthLockSerializer,
    EnhancementSerializer, RenewalSerializer, BankAccountSerializer, TransactionSerializer, OwnerDrawSerializer, OwnerRepaymentSerializer, RevenueShareScopeSerializer,
    QuotationSerializer
)
from .utils.invoice_generator import generate_invoice_pdf



def send_push_to_owners(title, body, url="/"):
    payload = json.dumps({"title": title, "body": body, "url": url})
    owners = User.objects.filter(role='OWNER')
    for owner in owners:
        for sub in owner.push_subscriptions.all():
            try:
                webpush(
                    subscription_info={
                        "endpoint": sub.endpoint,
                        "keys": {"p256dh": sub.p256dh, "auth": sub.auth}
                    },
                    data=payload,
                    vapid_private_key=settings.VAPID_PRIVATE_KEY,
                    vapid_claims={"sub": f"mailto:{settings.VAPID_ADMIN_EMAIL}"}
                )
            except WebPushException as ex:
                if ex.response and ex.response.status_code in [404, 410]:
                    sub.delete()
                print("Web Push Error:", repr(ex))
            except Exception as e:
                print("Web Push Unexpected Error:", repr(e))

def send_push_to_user(user, title, body, url="/"):
    payload = json.dumps({"title": title, "body": body, "url": url})
    errors = []
    success_count = 0
    for sub in user.push_subscriptions.all():
        try:
            webpush(
                subscription_info={
                    "endpoint": sub.endpoint,
                    "keys": {"p256dh": sub.p256dh, "auth": sub.auth}
                },
                data=payload,
                vapid_private_key=settings.VAPID_PRIVATE_KEY,
                vapid_claims={"sub": f"mailto:{settings.VAPID_ADMIN_EMAIL}"}
            )
            success_count += 1
        except WebPushException as ex:
            if ex.response and ex.response.status_code in [404, 410]:
                sub.delete()
            err_msg = f"Web Push Error: {repr(ex.response.text if hasattr(ex, 'response') and ex.response else ex)}"
            print(err_msg)
            errors.append(err_msg)
        except Exception as e:
            err_msg = f"Web Push Unexpected Error: {repr(e)}"
            print(err_msg)
            errors.append(err_msg)
    return {"success": success_count, "errors": errors}

class PushSubscribeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        subscription = request.data.get('subscription')
        if not subscription:
            return Response({"error": "No subscription data provided"}, status=400)
        
        endpoint = subscription.get('endpoint')
        keys = subscription.get('keys', {})
        p256dh = keys.get('p256dh')
        auth = keys.get('auth')

        if not endpoint or not p256dh or not auth:
            return Response({"error": "Invalid subscription data"}, status=400)
            
        sub, created = PushSubscription.objects.update_or_create(
            user=request.user,
            endpoint=endpoint,
            defaults={'p256dh': p256dh, 'auth': auth}
        )
        return Response({"status": "subscribed", "created": created})

class PushTestView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        result = send_push_to_user(
            user=request.user,
            title="Test Notification",
            body="If you see this, push notifications are working perfectly!",
            url="/"
        )
        if result["errors"] or result["success"] == 0:
            return Response({"status": "test_failed", "details": result}, status=400)
        return Response({"status": "test_sent", "details": result})

class TriggerDailySummaryView(APIView):
    permission_classes = [] 
    authentication_classes = []

    def get(self, request):
        token = request.query_params.get('token')
        if token != "cron_super_secret_123":
            return Response({"error": "Unauthorized"}, status=403)

        now = timezone.now()
        current_month = now.month
        current_year = now.year

        bank_total = BankAccount.objects.aggregate(total=Sum('current_balance'))['total'] or 0
        income_total = Invoice.objects.filter(
            status='PAID', date__month=current_month, date__year=current_year
        ).aggregate(total=Sum('amount'))['total'] or 0
        expense_total = CompanyExpense.objects.filter(
            date__month=current_month, date__year=current_year
        ).aggregate(total=Sum('amount'))['total'] or 0

        net_profit = income_total - expense_total
        body = f"Bank Balance: ₹{bank_total:,.0f}\nThis Month's Profit: ₹{net_profit:,.0f}\nThis Month's Expenses: ₹{expense_total:,.0f}"

        users = User.objects.all()
        notified = 0
        for u in users:
            if u.push_subscriptions.exists():
                send_push_to_user(user=u, title="Good Morning! Daily Summary ☀️", body=body, url="/")
                notified += 1
                
        return Response({"status": "sent", "notified": notified})

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

class PasswordResetDirectView(APIView):
    permission_classes = [] # Allow unauthenticated access
    authentication_classes = []

    def post(self, request):
        email = request.data.get('email')
        new_password = request.data.get('new_password')

        if not email or not new_password:
            return Response({'error': 'Email and new password are required.'}, status=400)

        User = get_user_model()
        try:
            user = User.objects.get(email__iexact=email)
            
            user.set_password(new_password)
            user.otp = None
            user.otp_created_at = None
            user.save()
            return Response({'success': 'Password reset successfully.'})
        except User.DoesNotExist:
            return Response({'error': 'No account found with this email address.'}, status=404)

class CheckEmailView(APIView):
    permission_classes = [] # Allow unauthenticated access
    authentication_classes = []

    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({'error': 'Email is required.'}, status=400)
            
        User = get_user_model()
        try:
            user = User.objects.get(email__iexact=email)
            return Response({'exists': True, 'message': 'Email found.'})
        except User.DoesNotExist:
            return Response({'error': 'No account found with this email address.'}, status=404)

class VerifyOTPView(APIView):
    permission_classes = []
    authentication_classes = []

    def post(self, request):
        email = request.data.get('email')
        otp = request.data.get('otp')

        if not email or not otp:
            return Response({'error': 'Email and OTP are required.'}, status=400)

        User = get_user_model()
        try:
            user = User.objects.get(email__iexact=email)
            
            if not user.otp or user.otp != otp:
                return Response({'error': 'Invalid OTP.'}, status=400)
                
            if not user.otp_created_at or timezone.now() > user.otp_created_at + timedelta(minutes=10):
                return Response({'error': 'OTP has expired. Please request a new one.'}, status=400)

            return Response({'success': 'OTP verified.'})
        except User.DoesNotExist:
            return Response({'error': 'No account found.'}, status=404)

class BankAccountViewSet(viewsets.ModelViewSet):
    queryset = BankAccount.objects.all()
    serializer_class = BankAccountSerializer

    @action(detail=True, methods=['post'])
    def transfer(self, request, pk=None):
        from_account = self.get_object()
        to_account_id = request.data.get('to_account_id')
        amount = request.data.get('amount')
        
        if not to_account_id or not amount:
            return Response({'error': 'to_account_id and amount required'}, status=400)
            
        to_account = BankAccount.objects.get(id=to_account_id)
        transfer_amount = Decimal(str(amount))
        
        from_account.current_balance -= transfer_amount
        from_account.save()
        Transaction.objects.create(
            bank_account=from_account,
            amount=-transfer_amount,
            transaction_type='TRANSFER_OUT',
            description=f"Transfer to {to_account.name}"
        )
        
        to_account.current_balance += transfer_amount
        to_account.save()
        Transaction.objects.create(
            bank_account=to_account,
            amount=transfer_amount,
            transaction_type='TRANSFER_IN',
            description=f"Transfer from {from_account.name}"
        )
        
        return Response({'status': 'transferred'})

class TransactionViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = TransactionSerializer

    def get_queryset(self):
        queryset = Transaction.objects.all().order_by('-date')
        bank_account = self.request.query_params.get('bank_account')
        if bank_account:
            queryset = queryset.filter(bank_account_id=bank_account)
        return queryset

class ClientViewSet(viewsets.ModelViewSet):
    queryset = Client.objects.all()
    serializer_class = ClientSerializer

class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer

class RevenueShareScopeViewSet(viewsets.ModelViewSet):
    queryset = RevenueShareScope.objects.all()
    serializer_class = RevenueShareScopeSerializer

class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.all()
    serializer_class = InvoiceSerializer

    def perform_create(self, serializer):
        invoice = serializer.save()
            
        if invoice.status == 'PAID' and invoice.deposit_account:
            invoice.deposit_account.current_balance += invoice.amount
            invoice.deposit_account.save()
            Transaction.objects.create(
                bank_account=invoice.deposit_account,
                amount=invoice.amount,
                transaction_type='INVOICE_PAYMENT',
                description=f"Payment for Invoice {invoice.id} (Project: {invoice.project.name})"
            )

    def perform_update(self, serializer):
        old_invoice = self.get_object()
        new_invoice = serializer.save()

        # Reversal Logic
        if old_invoice.status == 'PAID' and old_invoice.deposit_account:
            old_invoice.deposit_account.current_balance -= old_invoice.amount
            old_invoice.deposit_account.save()
            Transaction.objects.create(
                bank_account=old_invoice.deposit_account,
                amount=-old_invoice.amount,
                transaction_type='INVOICE_PAYMENT',
                description=f"Reversal of Invoice {old_invoice.id}"
            )

        if new_invoice.status == 'PAID' and new_invoice.deposit_account:
            new_invoice.deposit_account.current_balance += new_invoice.amount
            new_invoice.deposit_account.save()
            Transaction.objects.create(
                bank_account=new_invoice.deposit_account,
                amount=new_invoice.amount,
                transaction_type='INVOICE_PAYMENT',
                description=f"Payment for Invoice {new_invoice.id}"
            )

    def perform_destroy(self, instance):
        if instance.status == 'PAID' and instance.deposit_account:
            instance.deposit_account.current_balance -= instance.amount
            instance.deposit_account.save()
            Transaction.objects.create(
                bank_account=instance.deposit_account,
                amount=-instance.amount,
                transaction_type='INVOICE_PAYMENT',
                description=f"Reversal of Deleted Invoice {instance.id}"
            )
        instance.delete()

    @action(detail=True, methods=['get'])
    def download_pdf(self, request, pk=None):
        invoice = self.get_object()
        invoice = generate_invoice_pdf(invoice)
        
        pdf_bytes = invoice.pdf_file.read()
        
        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        filename = f"INV_{invoice.id}_{invoice.date.strftime('%Y%m%d')}.pdf"
        response['Content-Disposition'] = f'inline; filename="{filename}"'
        return response

class AdvanceWalletViewSet(viewsets.ModelViewSet):
    queryset = AdvanceWallet.objects.all()
    serializer_class = AdvanceWalletSerializer

    @action(detail=True, methods=['post'])
    def settle(self, request, pk=None):
        wallet = self.get_object()
        amount = request.data.get('amount')
        bank_account_id = request.data.get('bank_account_id')
        
        if not amount or not bank_account_id:
            return Response({'error': 'amount and bank_account_id required'}, status=400)
            
        bank_account = BankAccount.objects.get(id=bank_account_id)
        
        bank_account.current_balance -= Decimal(str(amount))
        bank_account.save()
        Transaction.objects.create(
            bank_account=bank_account,
            amount=-Decimal(str(amount)),
            transaction_type='WALLET_SETTLEMENT',
            description=f"Wallet settlement for {wallet.user.username}"
        )
        
        wallet.current_balance -= Decimal(str(amount))
        wallet.save()
        
        return Response({'status': 'settled'})

class AdvanceRequestViewSet(viewsets.ModelViewSet):
    queryset = AdvanceRequest.objects.all()
    serializer_class = AdvanceRequestSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated and user.role == 'OWNER':
            return AdvanceRequest.objects.filter(requested_by=user)
        return AdvanceRequest.objects.all()

    def perform_create(self, serializer):
        adv_request = serializer.save()
        send_push_to_owners(
            title="New Advance Request",
            body=f"{adv_request.requested_by.username} requested {adv_request.amount} for {adv_request.purpose}",
            url="/advances"
        )

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        adv_request = self.get_object()
        source_bank_id = request.data.get('source_bank_id')
        
        if adv_request.status != 'PENDING':
            return Response({'error': 'Request is not pending'}, status=400)
            
        if not source_bank_id:
            return Response({'error': 'Source bank account required for approval'}, status=400)
            
        source_bank = BankAccount.objects.get(id=source_bank_id)
        
        # Deduct from company bank
        source_bank.current_balance -= adv_request.amount
        source_bank.save()
        Transaction.objects.create(
            bank_account=source_bank,
            amount=-adv_request.amount,
            transaction_type='EXPENSE_PAYMENT', # Using EXPENSE_PAYMENT or WALLET_SETTLEMENT logic
            description=f"Advance Funding for {adv_request.requested_by.username} - {adv_request.purpose}"
        )
        
        # Add to User's Wallet
        wallet, created = AdvanceWallet.objects.get_or_create(user=adv_request.requested_by)
        wallet.current_balance += adv_request.amount
        wallet.save()
        
        # Update Request Status
        adv_request.status = 'APPROVED'
        adv_request.source_bank = source_bank
        adv_request.approved_by = request.user if request.user.is_authenticated else None
        adv_request.save()
        
        send_push_to_user(
            user=adv_request.requested_by,
            title="Advance Request Approved",
            body=f"Your advance request for {adv_request.amount} has been approved.",
            url="/advances"
        )
        
        return Response({'status': 'approved'})
        
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        adv_request = self.get_object()
        if adv_request.status != 'PENDING':
            return Response({'error': 'Request is not pending'}, status=400)
            
        adv_request.status = 'REJECTED'
        adv_request.save()
        return Response({'status': 'rejected'})

class CompanyExpenseViewSet(viewsets.ModelViewSet):
    queryset = CompanyExpense.objects.all()
    serializer_class = CompanyExpenseSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated and user.role == 'OWNER':
            return CompanyExpense.objects.filter(logged_by=user)
        return CompanyExpense.objects.all()

    def perform_create(self, serializer):
        receipt_file = serializer.validated_data.pop('receipt_file', None)
        expense = serializer.save()
        
        if receipt_file:
            try:
                from .gdrive import upload_receipt_to_drive
                link = upload_receipt_to_drive(receipt_file, receipt_file.name, expense.date)
                expense.receipt_drive_link = link
                expense.save()
            except Exception as e:
                import traceback
                with open("gdrive_error.log", "w") as f:
                    f.write(traceback.format_exc())
                print(f"Failed to upload to Google Drive: {e}")
        
        if expense.expense_type == 'DIRECT':
            if not expense.withdrawal_account:
                raise Exception("Withdrawal account is required for DIRECT expenses")
                
            expense.withdrawal_account.current_balance -= expense.amount
            expense.withdrawal_account.save()
            Transaction.objects.create(
                bank_account=expense.withdrawal_account,
                amount=-expense.amount,
                transaction_type='EXPENSE_PAYMENT',
                description=f"Direct Expense: {expense.payee_description}"
            )
            
        elif expense.expense_type == 'FROM_WALLET':
            if not expense.logged_by:
                raise Exception("Logged by user is required for FROM_WALLET expenses")
                
            wallet, created = AdvanceWallet.objects.get_or_create(user=expense.logged_by)
            wallet.current_balance -= expense.amount
            wallet.save()

    def perform_destroy(self, instance):
        if instance.expense_type == 'DIRECT' and instance.withdrawal_account:
            instance.withdrawal_account.current_balance += instance.amount
            instance.withdrawal_account.save()
            Transaction.objects.create(
                bank_account=instance.withdrawal_account,
                amount=instance.amount,
                transaction_type='EXPENSE_PAYMENT',
                description=f"Reversal of Deleted Direct Expense {instance.id}"
            )
        elif instance.expense_type == 'FROM_WALLET' and instance.logged_by:
            wallet, created = AdvanceWallet.objects.get_or_create(user=instance.logged_by)
            wallet.current_balance += instance.amount
            wallet.save()
            
        instance.delete()

class MonthLockViewSet(viewsets.ModelViewSet):
    queryset = MonthLock.objects.all()
    serializer_class = MonthLockSerializer
    lookup_field = 'month_year'

    def perform_create(self, serializer):
        serializer.save(locked_by=self.request.user if self.request.user.is_authenticated else None)

    def perform_update(self, serializer):
        serializer.save(locked_by=self.request.user if self.request.user.is_authenticated else None)

    @action(detail=True, methods=['get'])
    def summary(self, request, month_year=None):
        try:
            year, month = month_year.split('-')
            year = int(year)
            month = int(month)
        except ValueError:
            return Response({'error': 'Invalid month_year format. Use YYYY-MM'}, status=400)
            
        income_agg = Invoice.objects.filter(status='PAID', date__year=year, date__month=month).aggregate(Sum('amount'))
        total_income = income_agg['amount__sum'] or Decimal('0.00')
        
        expense_agg = CompanyExpense.objects.filter(date__year=year, date__month=month).aggregate(Sum('amount'))
        total_expenses = expense_agg['amount__sum'] or Decimal('0.00')
        
        drawings_agg = OwnerDraw.objects.filter(status='APPROVED', date__year=year, date__month=month).aggregate(Sum('amount'))
        total_drawings = drawings_agg['amount__sum'] or Decimal('0.00')
        
        net_cash_flow = total_income - total_expenses - total_drawings
        
        return Response({
            'month_year': month_year,
            'total_income': str(total_income),
            'total_expenses': str(total_expenses),
            'total_drawings': str(total_drawings),
            'net_cash_flow': str(net_cash_flow)
        })

class EnhancementViewSet(viewsets.ModelViewSet):
    queryset = Enhancement.objects.all()
    serializer_class = EnhancementSerializer

class RenewalViewSet(viewsets.ModelViewSet):
    queryset = Renewal.objects.all()
    serializer_class = RenewalSerializer
    
    def perform_update(self, serializer):
        old_renewal = self.get_object()
        new_renewal = serializer.save()
        
        if not old_renewal.is_paid and new_renewal.is_paid:
            # Auto-spawn invoice for this renewal payment
            invoice = Invoice.objects.create(
                project=new_renewal.project,
                amount=new_renewal.cost,
                status='PAID',
                # Need to select a default deposit account or leave null?
                # For auto-generated, we might leave it null and force the accountant to map it later,
                # but let's try to map it to the first bank account if available just for automation flow.
                deposit_account=BankAccount.objects.first()
            )
            
            if invoice.deposit_account:
                invoice.deposit_account.current_balance += invoice.amount
                invoice.deposit_account.save()
                Transaction.objects.create(
                    bank_account=invoice.deposit_account,
                    amount=invoice.amount,
                    transaction_type='INVOICE_PAYMENT',
                    description=f"Auto-payment for Renewal Invoice {invoice.id}"
                )

class OwnerDrawViewSet(viewsets.ModelViewSet):
    queryset = OwnerDraw.objects.all().order_by('-date')
    serializer_class = OwnerDrawSerializer

    def perform_create(self, serializer):
        draw = serializer.save()
        send_push_to_owners(
            title="New Owner Draw",
            body=f"{draw.owner.username} requested {draw.amount} for {draw.purpose}",
            url="/owner-drawings"
        )



    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        draw = self.get_object()
        source_bank_id = request.data.get('source_bank_id')
        
        if draw.status != 'PENDING':
            return Response({'error': 'Draw request is not pending'}, status=400)
            
        if not source_bank_id:
            return Response({'error': 'Source bank account required for approval'}, status=400)
            
        source_bank = BankAccount.objects.get(id=source_bank_id)
        
        # Deduct from company bank
        source_bank.current_balance -= draw.amount
        source_bank.save()
        Transaction.objects.create(
            bank_account=source_bank,
            amount=-draw.amount,
            transaction_type='OWNER_DRAW',
            description=f"Owner Draw: {draw.owner.username} - {draw.purpose}"
        )
        
        # Update Request Status
        draw.status = 'APPROVED'
        draw.source_bank = source_bank
        draw.approved_by = request.user if request.user.is_authenticated else None
        draw.save()
        
        send_push_to_user(
            user=draw.owner,
            title="Owner Draw Approved",
            body=f"Your draw request for {draw.amount} has been approved.",
            url="/owner-drawings"
        )
        
        return Response({'status': 'approved'})
        
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        draw = self.get_object()
        if draw.status != 'PENDING':
            return Response({'error': 'Draw request is not pending'}, status=400)
            
        draw.status = 'REJECTED'
        draw.save()
        return Response({'status': 'rejected'})

class QuotationViewSet(viewsets.ModelViewSet):
    queryset = Quotation.objects.all()
    serializer_class = QuotationSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user if self.request.user.is_authenticated else None)

    def perform_update(self, serializer):
        serializer.save(created_by=self.request.user if self.request.user.is_authenticated else None)

class OwnerRepaymentViewSet(viewsets.ModelViewSet):
    queryset = OwnerRepayment.objects.all().order_by('-date')
    serializer_class = OwnerRepaymentSerializer

    def perform_create(self, serializer):
        serializer.save(logged_by=self.request.user if self.request.user.is_authenticated else None)
