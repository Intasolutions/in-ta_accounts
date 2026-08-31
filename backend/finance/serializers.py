from rest_framework import serializers
from .models import User, Client, Project, Invoice, AdvanceWallet, AdvanceRequest, CompanyExpense, MonthLock, Enhancement, Renewal, BankAccount, Transaction, OwnerDraw, RevenueShareScope

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'password']
        
    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = super().create(validated_data)
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

    class Meta:
        model = Invoice
        fields = '__all__'

class RevenueShareScopeSerializer(serializers.ModelSerializer):
    class Meta:
        model = RevenueShareScope
        fields = '__all__'

class ProjectSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source='client.name', read_only=True)
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
        enhancement_total = sum(e.cost for e in obj.enhancements.all())
        return obj.total_value + enhancement_total

    def get_amount_received(self, obj):
        return sum(i.amount for i in obj.invoices.filter(status='PAID'))

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
