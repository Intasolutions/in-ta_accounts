import datetime
from django.core.management.base import BaseCommand
from django.db.models import Sum
from finance.models import BankAccount, Invoice, CompanyExpense, User
from finance.views import send_push_to_user
import locale

class Command(BaseCommand):
    help = 'Sends a daily summary push notification to all owners'

    def handle(self, *args, **options):
        now = datetime.datetime.now()
        current_month = now.month
        current_year = now.year

        # 1. Total Bank Balance
        bank_total = BankAccount.objects.aggregate(total=Sum('current_balance'))['total'] or 0

        # 2. Current Month Income (Paid Invoices)
        income_total = Invoice.objects.filter(
            status='PAID',
            date__month=current_month,
            date__year=current_year
        ).aggregate(total=Sum('amount'))['total'] or 0

        # 3. Current Month Expenses
        expense_total = CompanyExpense.objects.filter(
            date__month=current_month,
            date__year=current_year
        ).aggregate(total=Sum('amount'))['total'] or 0

        # 4. Net Profit
        net_profit = income_total - expense_total

        # Formatting as INR
        def format_inr(value):
            return f"₹{value:,.0f}"

        title = "Good Morning! Daily Summary ☀️"
        body = (
            f"Bank Balance: {format_inr(bank_total)}\n"
            f"This Month's Profit: {format_inr(net_profit)}\n"
            f"This Month's Expenses: {format_inr(expense_total)}"
        )

        owners = User.objects.filter(role='OWNER')
        notified_count = 0
        for owner in owners:
            if owner.push_subscriptions.exists():
                send_push_to_user(
                    user=owner,
                    title=title,
                    body=body,
                    url="/"
                )
                notified_count += 1
        
        self.stdout.write(self.style.SUCCESS(f'Successfully sent daily summary to {notified_count} owners.'))
