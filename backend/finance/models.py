from django.db import models
from django.utils import timezone
from django.contrib.auth.models import AbstractUser
from decimal import Decimal

class User(AbstractUser):
    ROLE_CHOICES = (
        ('OWNER', 'Owner'),
        ('ACCOUNTANT', 'Accountant'),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='OWNER')

    class Meta:
        ordering = ['-id']

    def __str__(self):
        return self.username

class BankAccount(models.Model):
    name = models.CharField(max_length=255, help_text="e.g. Axis Bank Main, Petty Cash")
    bank_name = models.CharField(max_length=255, blank=True, null=True)
    account_number = models.CharField(max_length=255, blank=True, null=True)
    ifsc_code = models.CharField(max_length=255, blank=True, null=True)
    upi_id = models.CharField(max_length=255, blank=True, null=True)
    current_balance = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))

    class Meta:
        ordering = ['-id']

    def __str__(self):
        return self.name

class Client(models.Model):
    name = models.CharField(max_length=255)
    company_name = models.CharField(max_length=255, blank=True, null=True)
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['-id']

    def __str__(self):
        return self.name

class Project(models.Model):
    TYPE_CHOICES = (
        ('FIXED', 'Fixed'),
        ('HOURLY', 'Hourly'),
        ('AMC', 'AMC'),
        ('REVENUE_SHARE', 'Revenue Share'),
    )
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='projects')
    project_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    total_value = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    name = models.CharField(max_length=255, default='New Project')

    # AMC config & Timeline
    amc_percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, help_text="e.g. 15.00 for 15%")
    delivery_date = models.DateField(null=True, blank=True, help_text="Date project is delivered/completed. AMC starts 3 months after.")
    
    # Revenue Share Config (if project_type == 'REVENUE_SHARE')
    REVENUE_SHARE_CHOICES = (
        ('PROFIT_SHARE', 'Monthly Profit Share'),
        ('PER_SEAT', 'Per Seat / Admission Share'),
    )
    revenue_share_type = models.CharField(max_length=20, choices=REVENUE_SHARE_CHOICES, null=True, blank=True)
    revenue_share_percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, help_text="e.g. 20.00 for 20%")
    per_seat_cost = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True, help_text="Total cost of 1 seat/admission in USD or INR")
    
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['-id']

    def __str__(self):
        return f"{self.client.name} - {self.name}"

class RevenueShareScope(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='revenue_share_scopes')
    name = models.CharField(max_length=255, help_text="e.g. MBBS, Nursing")
    earning = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'), help_text="Flat earning per seat in USD")

    class Meta:
        ordering = ['-id']

    def __str__(self):
        return f"{self.name} - {self.project.name}"

class Enhancement(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='enhancements')
    title = models.CharField(max_length=255)
    cost = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    date_added = models.DateField(auto_now_add=True)
    
    class Meta:
        ordering = ['-id']

    def __str__(self):
        return f"{self.title} ({self.project.name})"

class Renewal(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='renewals')
    title = models.CharField(max_length=255, help_text="e.g. Domain & Server 2026")
    cost = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    due_date = models.DateField()
    is_paid = models.BooleanField(default=False)

    class Meta:
        ordering = ['-id']

    def __str__(self):
        return f"{self.title} ({self.project.name})"


class Invoice(models.Model):
    STATUS_CHOICES = (
        ('DRAFT', 'Draft'),
        ('SENT', 'Sent'),
        ('PAID', 'Paid'),
    )
    PAYMENT_TYPE_CHOICES = (
        ('PARTIAL', 'Partial Payment'),
        ('ADVANCE', 'Advance Payment'),
        ('FULL', 'Full Payment'),
        ('RENEWAL', 'Renewal / AMC'),
    )
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='invoices')
    description = models.CharField(max_length=255, blank=True, null=True, help_text="Custom description for the invoice line item")
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    date = models.DateField(default=timezone.now)
    payment_type = models.CharField(max_length=20, choices=PAYMENT_TYPE_CHOICES, default='PARTIAL')
    pdf_file = models.FileField(upload_to='invoices/', null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT')
    deposit_account = models.ForeignKey(BankAccount, on_delete=models.SET_NULL, null=True, blank=True, related_name='deposits')

    # For Revenue Share tracking
    revenue_share_base_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True, help_text="Total profit pool for the month (USD/INR)")
    revenue_share_seats_sold = models.IntegerField(null=True, blank=True, help_text="Number of seats sold")
    revenue_share_scope = models.ForeignKey(RevenueShareScope, on_delete=models.SET_NULL, null=True, blank=True, related_name='invoices')

    class Meta:
        ordering = ['-id']

    def __str__(self):
        return f"INV-{self.id} ({self.project.name})"

class AdvanceWallet(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='advance_wallet')
    current_balance = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))

    class Meta:
        ordering = ['-id']

    def __str__(self):
        return f"{self.user.username}'s Wallet - {self.current_balance}"

class AdvanceRequest(models.Model):
    STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
    )
    requested_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='advance_requests')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    purpose = models.CharField(max_length=255)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_advances')
    source_bank = models.ForeignKey(BankAccount, on_delete=models.SET_NULL, null=True, blank=True, related_name='funded_advances')
    date = models.DateTimeField(default=timezone.now)
    
    class Meta:
        ordering = ['-id']

    def __str__(self):
        return f"{self.requested_by.username} - {self.amount} ({self.status})"

class CompanyExpense(models.Model):
    TYPE_CHOICES = (
        ('DIRECT', 'Direct Expense (Company Bank Account)'),
        ('FROM_WALLET', 'Paid from Owner Wallet'),
    )
    CATEGORY_CHOICES = (
        ('TRAVEL', 'Travel'),
        ('SERVERS', 'Servers / Hosting'),
        ('SOFTWARE', 'Software Licenses'),
        ('MARKETING', 'Marketing'),
        ('OFFICE', 'Office Supplies'),
        ('OTHER', 'Other'),
    )
    expense_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    logged_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    payee_description = models.CharField(max_length=255)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='OTHER')
    project = models.ForeignKey(Project, on_delete=models.SET_NULL, null=True, blank=True, related_name='expenses')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    date = models.DateField(default=timezone.now)
    receipt_drive_link = models.URLField(max_length=500, null=True, blank=True)
    
    # If DIRECT, which company bank account did it leave from?
    withdrawal_account = models.ForeignKey(BankAccount, on_delete=models.SET_NULL, null=True, blank=True, related_name='direct_expenses')

    class Meta:
        ordering = ['-id']

    def __str__(self):
        return f"{self.expense_type} - {self.payee_description} - {self.amount}"

class MonthLock(models.Model):
    month_year = models.CharField(max_length=7, unique=True, help_text="Format: YYYY-MM")
    is_locked = models.BooleanField(default=False)
    locked_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='locked_months')
    locked_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-id']

    def __str__(self):
        return f"{self.month_year} - Locked: {self.is_locked}"

class OwnerDraw(models.Model):
    STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
    )
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='drawings')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    purpose = models.CharField(max_length=255)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_drawings')
    source_bank = models.ForeignKey(BankAccount, on_delete=models.SET_NULL, null=True, blank=True, related_name='funded_drawings')
    date = models.DateTimeField(default=timezone.now)
    
    class Meta:
        ordering = ['-id']

    def __str__(self):
        return f"{self.owner.username} - {self.amount} ({self.status})"

class Transaction(models.Model):
    TYPE_CHOICES = (
        ('INVOICE_PAYMENT', 'Invoice Payment'),
        ('EXPENSE_PAYMENT', 'Expense Payment'),
        ('WALLET_SETTLEMENT', 'Wallet Settlement'),
        ('TRANSFER_IN', 'Internal Transfer (In)'),
        ('TRANSFER_OUT', 'Internal Transfer (Out)'),
        ('MANUAL_ADJUSTMENT', 'Manual Adjustment'),
        ('OWNER_DRAW', 'Owner Draw')
    )
    bank_account = models.ForeignKey(BankAccount, on_delete=models.CASCADE, related_name='transactions')
    date = models.DateTimeField(default=timezone.now)
    amount = models.DecimalField(max_digits=12, decimal_places=2, help_text="Positive for deposits, negative for withdrawals")
    transaction_type = models.CharField(max_length=25, choices=TYPE_CHOICES)
    description = models.CharField(max_length=255)
    
    class Meta:
        ordering = ['-date', '-id']

    def __str__(self):
        return f"{self.transaction_type} - {self.amount} - {self.bank_account.name}"

class Quotation(models.Model):
    quote_no = models.CharField(max_length=50, unique=True)
    date = models.DateField(default=timezone.now)
    valid_until = models.DateField(null=True, blank=True)
    client_name = models.CharField(max_length=255)
    raw_data = models.JSONField(help_text="Stores the full quotation JSON data including line items, sub-rate, and GST")
    created_at = models.DateTimeField(default=timezone.now)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        ordering = ['-id']

    def __str__(self):
        return f"{self.quote_no} - {self.client_name}"
