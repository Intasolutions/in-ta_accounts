from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import (
    User, BankAccount, Client, Project, Enhancement, Renewal,
    Invoice, AdvanceWallet, AdvanceRequest, CompanyExpense,
    MonthLock, Transaction
)

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'role', 'is_staff')
    list_filter = ('role', 'is_staff', 'is_superuser', 'is_active')
    fieldsets = UserAdmin.fieldsets + (
        ('Custom Fields', {'fields': ('role',)}),
    )

@admin.register(BankAccount)
class BankAccountAdmin(admin.ModelAdmin):
    list_display = ('name', 'bank_name', 'account_number', 'current_balance')
    search_fields = ('name', 'bank_name', 'account_number')

@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = ('name', 'company_name', 'phone_number', 'created_at')
    search_fields = ('name', 'company_name', 'phone_number')

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ('name', 'client', 'project_type', 'total_value', 'created_at')
    list_filter = ('project_type',)
    search_fields = ('name', 'client__name')

@admin.register(Enhancement)
class EnhancementAdmin(admin.ModelAdmin):
    list_display = ('title', 'project', 'cost', 'date_added')
    search_fields = ('title', 'project__name')

@admin.register(Renewal)
class RenewalAdmin(admin.ModelAdmin):
    list_display = ('title', 'project', 'cost', 'due_date', 'is_paid')
    list_filter = ('is_paid',)
    search_fields = ('title', 'project__name')

@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ('id', 'project', 'amount', 'date', 'status')
    list_filter = ('status', 'date')
    search_fields = ('project__name',)

@admin.register(AdvanceWallet)
class AdvanceWalletAdmin(admin.ModelAdmin):
    list_display = ('user', 'current_balance')
    search_fields = ('user__username',)

@admin.register(AdvanceRequest)
class AdvanceRequestAdmin(admin.ModelAdmin):
    list_display = ('requested_by', 'amount', 'purpose', 'status', 'date')
    list_filter = ('status', 'date')
    search_fields = ('requested_by__username', 'purpose')

@admin.register(CompanyExpense)
class CompanyExpenseAdmin(admin.ModelAdmin):
    list_display = ('payee_description', 'expense_type', 'category', 'amount', 'date', 'logged_by')
    list_filter = ('expense_type', 'category', 'date')
    search_fields = ('payee_description', 'logged_by__username')

@admin.register(MonthLock)
class MonthLockAdmin(admin.ModelAdmin):
    list_display = ('month_year', 'is_locked', 'locked_by', 'locked_at')
    list_filter = ('is_locked',)

@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ('transaction_type', 'bank_account', 'amount', 'date')
    list_filter = ('transaction_type', 'date')
    search_fields = ('description', 'bank_account__name')
