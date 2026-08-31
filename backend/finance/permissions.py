from rest_framework import permissions

class CustomRolePermission(permissions.BasePermission):
    """
    Accountant has full access to everything (Super Admin).
    Owner has read-only access to most things.
    Owner can write to Expense and Draw viewsets, but cannot approve/reject/settle/transfer.
    Owner cannot create users.
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.role == 'ACCOUNTANT':
            return True

        if request.user.role == 'OWNER':
            # View option (Read-Only everywhere)
            if request.method in permissions.SAFE_METHODS:
                return True

            view_name = view.__class__.__name__

            # Specific restricted write actions for Owner
            allowed_write_views = ['CompanyExpenseViewSet', 'AdvanceRequestViewSet', 'OwnerDrawViewSet']

            if view_name in allowed_write_views:
                # Restrict custom action calls that modify status or transfer money
                if hasattr(view, 'action') and view.action in ['approve', 'reject', 'settle', 'transfer']:
                    return False
                return True

            # Disallow User Creation or modification for Owner
            if view_name == 'UserViewSet':
                return False

            return False

        return False
