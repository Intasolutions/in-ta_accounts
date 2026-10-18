from decimal import Decimal
from django.db import models
from rest_framework import serializers
from .models import User, Client, Project, Invoice, AdvanceWallet, AdvanceRequest, CompanyExpense, MonthLock, Enhancement, Renewal, BankAccount, Transaction, OwnerDraw, OwnerRepayment, RevenueShareScope, Quotation, PushSubscription

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'is_superuser', 'is_staff', 'password']
        extra_kwargs = {
            'is_superuser': {'read_only': True},
            'is_staff': {'read_only': True}
        }
        
    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = super().create(validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        user = super().update(instance, validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user

class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = '__all__'

class BankAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = BankAccount
        fields = '__all__'

class ClientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = '__all__'

class EnhancementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Enhancement
        fields = '__all__'

class RenewalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Renewal
        fields = '__all__'

class AdvanceRequestSerializer(serializers.ModelSerializer):
    requested_by_name = serializers.CharField(source='requested_by.username', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.username', read_only=True, allow_null=True)
    source_bank_name = serializers.CharField(source='source_bank.name', read_only=True, allow_null=True)

    class Meta:
        model = AdvanceRequest
        fields = '__all__'

class CompanyExpenseSerializer(serializers.ModelSerializer):
    logged_by_name = serializers.CharField(source='logged_by.username', read_only=True)
    project_name = serializers.CharField(source='project.name', read_only=True, allow_null=True)
    withdrawal_account_name = serializers.CharField(source='withdrawal_account.name', read_only=True, allow_null=True)
    receipt_file = serializers.FileField(write_only=True, required=False)

    class Meta:
        model = CompanyExpense
        fields = '__all__'

class InvoiceSerializer(serializers.ModelSerializer):
    project_name = serializers.CharField(source='project.name', read_only=True)
    client_name = serializers.CharField(source='project.client.name', read_only=True)
    company_name = serializers.CharField(source='project.client.company_name', read_only=True, allow_null=True)
    client_company = serializers.CharField(source='project.client.company_name', read_only=True, allow_null=True)
    invoice_number = serializers.SerializerMethodField()
    total_project_value = serializers.SerializerMethodField()
    calculated_advance_amount = serializers.SerializerMethodField()
    calculated_advance_date = serializers.SerializerMethodField()
    calculated_balance_amount = serializers.SerializerMethodField()

    class Meta:
        model = Invoice
        fields = '__all__'

    def get_invoice_number(self, obj):
        return f"INV-{str(obj.id).zfill(3)}"

    def get_total_project_value(self, obj):
        if not obj.project:
            return Decimal('0.00')
        enhancement_total = sum(Decimal(str(e.cost or 0)) for e in obj.project.enhancements.all())
        return Decimal(str(obj.project.total_value or 0)) + enhancement_total

    def get_calculated_advance_amount(self, obj):
        if obj.advance_amount is not None:
            return obj.advance_amount
        if not obj.project:
            return None
        if obj.payment_type == 'ADVANCE':
            return obj.amount
        all_invs = [i for i in obj.project.invoices.all() if i.payment_type == 'ADVANCE' and i.id != obj.id]
        if all_invs:
            all_invs.sort(key=lambda x: (x.date, x.id or 0))
            return all_invs[0].amount
        return None

    def get_calculated_advance_date(self, obj):
        if obj.advance_date is not None:
            return obj.advance_date
        if not obj.project:
            return None
        if obj.payment_type == 'ADVANCE':
            return obj.date
        all_invs = [i for i in obj.project.invoices.all() if i.payment_type == 'ADVANCE' and i.id != obj.id]
        if all_invs:
            all_invs.sort(key=lambda x: (x.date, x.id or 0))
            return all_invs[0].date
        return None

    def get_calculated_balance_amount(self, obj):
        if obj.balance_amount is not None:
            return obj.balance_amount
        if not obj.project:
            return Decimal('0.00')
        total_val = self.get_total_project_value(obj)
        if total_val <= Decimal('0.00'):
            return Decimal('0.00')
        
        if obj.payment_type == 'ADVANCE':
            return max(Decimal('0.00'), total_val - Decimal(str(obj.amount or 0)))
        elif obj.payment_type == 'FULL':
            return Decimal('0.00')
        
        # PARTIAL
        adv = self.get_calculated_advance_amount(obj) or Decimal('0.00')
        prior_partials = Decimal('0.00')
        for i in obj.project.invoices.all():
            if i.payment_type == 'PARTIAL' and i.id != obj.id:
                if i.date < obj.date or (i.date == obj.date and (i.id or 0) < (obj.id or 0)):
                    prior_partials += Decimal(str(i.amount or 0))
        total_paid_so_far = Decimal(str(adv)) + prior_partials + Decimal(str(obj.amount or 0))
        return max(Decimal('0.00'), total_val - total_paid_so_far)

class RevenueShareScopeSerializer(serializers.ModelSerializer):
    class Meta:
        model = RevenueShareScope
        fields = '__all__'

class ProjectSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source='client.name', read_only=True)
    company_name = serializers.CharField(source='client.company_name', read_only=True, allow_null=True)
    enhancements = EnhancementSerializer(many=True, read_only=True)
    renewals = RenewalSerializer(many=True, read_only=True)
    expenses = CompanyExpenseSerializer(many=True, read_only=True)
    invoices = InvoiceSerializer(many=True, read_only=True)
    revenue_share_scopes = RevenueShareScopeSerializer(many=True, read_only=True)
    
    total_project_value = serializers.SerializerMethodField()
    amount_received = serializers.SerializerMethodField()
    balance_due = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = '__all__'

    def get_total_project_value(self, obj):
        enhancement_total = sum(Decimal(str(e.cost or 0)) for e in obj.enhancements.all())
        if obj.project_type == 'REVENUE_SHARE':
            return sum(Decimal(str(i.amount or 0)) for i in obj.invoices.all())
        return Decimal(str(obj.total_value or 0)) + enhancement_total

    def get_amount_received(self, obj):
        return sum(Decimal(str(i.amount or 0)) for i in obj.invoices.all() if i.status == 'PAID')

    def get_balance_due(self, obj):
        return self.get_total_project_value(obj) - self.get_amount_received(obj)


class AdvanceWalletSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = AdvanceWallet
        fields = '__all__'
    
    def get_full_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}".strip() or obj.user.username

class MonthLockSerializer(serializers.ModelSerializer):
    locked_by_name = serializers.CharField(source='locked_by.username', read_only=True)

    class Meta:
        model = MonthLock
        fields = '__all__'

class OwnerDrawSerializer(serializers.ModelSerializer):
    owner_name = serializers.CharField(source='owner.username', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.username', read_only=True, allow_null=True)
    source_bank_name = serializers.CharField(source='source_bank.name', read_only=True, allow_null=True)

    class Meta:
        model = OwnerDraw
        fields = '__all__'

class OwnerRepaymentSerializer(serializers.ModelSerializer):
    owner_name = serializers.CharField(source='owner.username', read_only=True)
    logged_by_name = serializers.CharField(source='logged_by.username', read_only=True, allow_null=True)

    class Meta:
        model = OwnerRepayment
        fields = '__all__'

class QuotationSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.username', read_only=True, allow_null=True)

    class Meta:
        model = Quotation
        fields = '__all__'

class PushSubscriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PushSubscription
        fields = '__all__'
