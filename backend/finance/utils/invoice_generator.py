import os
import re
from io import BytesIO
from decimal import Decimal
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.utils import ImageReader
from django.core.files.base import ContentFile
from django.conf import settings

# Brand colors
BRAND_BLUE = colors.HexColor("#3866df")

def draw_header_footer(canvas, doc):
    canvas.saveState()
    PAGE_WIDTH, PAGE_HEIGHT = A4
    
    # ---------------- HEADER ----------------
    # Logo & Company Name (Top Left)
    logo_path = os.path.join(os.path.dirname(__file__), 'logo.jpg')
    if not os.path.exists(logo_path):
        logo_path = os.path.join(os.path.dirname(__file__), 'logo.png')
        
    if os.path.exists(logo_path):
        canvas.drawImage(ImageReader(logo_path), 40, PAGE_HEIGHT - 90, width=50, height=50, preserveAspectRatio=True)
    else:
        # Fallback if no logo
        canvas.setFillColor(BRAND_BLUE)
        canvas.setFont("Helvetica-Bold", 20)
        canvas.drawString(40, PAGE_HEIGHT - 70, "INTA")
    
    # Company Texts
    canvas.setFont("Helvetica-Bold", 16)
    canvas.setFillColor(colors.black)
    canvas.drawString(100, PAGE_HEIGHT - 65, "IN-TA SOLUTIONS")
    
    canvas.setFont("Helvetica", 9)
    canvas.setFillColor(colors.HexColor("#555555"))
    canvas.drawString(100, PAGE_HEIGHT - 78, "SOFTWARE COMPANY")
    
    # "INVOICE" Text (Top Right)
    canvas.setFont("Helvetica-Bold", 32)
    canvas.setFillColor(BRAND_BLUE)
    invoice_text = "INVOICE"
    text_width = canvas.stringWidth(invoice_text, "Helvetica-Bold", 32)
    canvas.drawString(PAGE_WIDTH - 40 - text_width, PAGE_HEIGHT - 70, invoice_text)
    
    # Subtle line under invoice header
    canvas.setStrokeColor(colors.HexColor("#e5e7eb"))
    canvas.setLineWidth(1)
    canvas.line(40, PAGE_HEIGHT - 95, PAGE_WIDTH - 40, PAGE_HEIGHT - 95)
    
    # Website Text
    canvas.setFont("Helvetica", 9)
    canvas.setFillColor(colors.HexColor("#555555"))
    web_text = "IN-TASOLUTIONS.COM"
    web_width = canvas.stringWidth(web_text, "Helvetica", 9)
    canvas.drawString(PAGE_WIDTH - 40 - web_width, PAGE_HEIGHT - 98, web_text)
    
    # ---------------- FOOTER ----------------
    # Bottom Blue Line
    canvas.setStrokeColor(BRAND_BLUE)
    canvas.setLineWidth(2)
    canvas.line(40, 60, PAGE_WIDTH - 40, 60)
    
    # Footer Contact Info & Simple Vector Icons
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(colors.HexColor("#555555"))
    
    y_pos = 45
    canvas.setStrokeColor(BRAND_BLUE)
    canvas.setLineWidth(1.5)
    
    # Phone Icon (Simple receiver)
    p = canvas.beginPath()
    p.moveTo(42, y_pos+6)
    p.lineTo(46, y_pos+6)
    p.lineTo(45, y_pos+2)
    p.lineTo(41, y_pos+2)
    p.close()
    canvas.drawPath(p, fill=0, stroke=1)
    # Phone circle
    canvas.arc(38, y_pos-1, 48, y_pos+9, 0, 360)
    canvas.drawString(55, y_pos, "+91 9447595381")
    
    # Mail Icon (Envelope)
    mail_x = 180
    canvas.rect(mail_x, y_pos, 12, 8, stroke=1, fill=0)
    canvas.line(mail_x, y_pos+8, mail_x+6, y_pos+4)
    canvas.line(mail_x+12, y_pos+8, mail_x+6, y_pos+4)
    canvas.drawString(mail_x + 18, y_pos, "intasolutionpvtltd@gmail.com")
    
    # Location Icon (Pin)
    loc_x = 380
    p2 = canvas.beginPath()
    p2.moveTo(loc_x+5, y_pos+8)
    p2.curveTo(loc_x+10, y_pos+8, loc_x+10, y_pos+3, loc_x+5, y_pos)
    p2.curveTo(loc_x, y_pos+3, loc_x, y_pos+8, loc_x+5, y_pos+8)
    canvas.drawPath(p2, fill=0, stroke=1)
    canvas.arc(loc_x+3.5, y_pos+4.5, loc_x+6.5, y_pos+7.5, 0, 360) # Inner hole
    canvas.drawString(loc_x + 15, y_pos, "Mananthavady, Kerala")

    canvas.restoreState()


def generate_invoice_pdf(invoice):
    """
    Generates a highly professional enterprise-style PDF invoice matching the new design.
    """
    buffer = BytesIO()
    
    PAGE_WIDTH, PAGE_HEIGHT = A4
    MARGIN = 40
    
    doc = SimpleDocTemplate(
        buffer, 
        pagesize=A4, 
        rightMargin=MARGIN, 
        leftMargin=MARGIN, 
        topMargin=130,  # Space for header
        bottomMargin=80  # Space for footer line and contact info
    )
    
    elements = []
    styles = getSampleStyleSheet()
    normal = styles['Normal']
    normal.fontName = 'Helvetica'
    normal.fontSize = 9
    normal.leading = 14
    normal.textColor = colors.HexColor("#333333")
    
    # ---------------- CLIENT & INVOICE DETAILS ----------------
    client_name = invoice.project.client.name if invoice.project and invoice.project.client else "N/A"
    client_company = invoice.project.client.company_name if invoice.project and invoice.project.client else ""
    client_phone = invoice.project.client.phone_number if invoice.project and invoice.project.client else ""
    client_address = invoice.project.client.address if invoice.project and invoice.project.client else ""
    
    invoice_no = f"INV-{str(invoice.id).zfill(3)}"
    date_str = invoice.date.strftime('%d %B %Y')
    
    primary_name = client_company if client_company else client_name
    
    client_info_html = f"<font color='#555555' size='8'>Invoice to :</font><br/>"
    client_info_html += f"<font size='12'><b>{primary_name}</b></font><br/>"
    if client_phone:
        client_info_html += f"<font color='#777777'>{client_phone}</font><br/>"
    if client_address:
        addr_lines = client_address.split('\n')
        client_info_html += f"<font color='#777777'>{'<br/>'.join(addr_lines)}</font>"
        
    invoice_meta_html = f"<font size='9'><b>Invoice no : {invoice_no}</b></font><br/>"
    invoice_meta_html += f"<font color='#777777' size='8'>{date_str}</font>"
    
    top_table_data = [
        [Paragraph(client_info_html, normal), Paragraph(invoice_meta_html, ParagraphStyle('RightBold', parent=normal, alignment=2))]
    ]
    
    top_table = Table(top_table_data, colWidths=[PAGE_WIDTH/2 - MARGIN, PAGE_WIDTH/2 - MARGIN])
    top_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (0,0), 'LEFT'),
        ('ALIGN', (1,0), (1,0), 'RIGHT'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    
    elements.append(top_table)
    elements.append(Spacer(1, 40))
    
    # ---------------- LINE ITEMS TABLE ----------------
    col_widths = [35, 260, 45, 85, 90]
    table_data = [
        ['NO', 'DESCRIPTION', 'QTY', 'PRICE', 'TOTAL']
    ]
    
    project = invoice.project
    payment_type = getattr(invoice, 'payment_type', 'PARTIAL')
        
    desc_text = invoice.description
    if not desc_text:
        if payment_type == 'ADVANCE':
            desc_text = f"Advance Payment for Project: {project.name if project else 'N/A'}"
        elif payment_type == 'PARTIAL':
            desc_text = f"Partial Payment / Milestone for Project: {project.name if project else 'N/A'}"
        elif payment_type == 'FULL':
            desc_text = f"Full Payment / Final Settlement for Project: {project.name if project else 'N/A'}"
        else:
            desc_text = f"Payment for Project: {project.name if project else 'N/A'}"
        
    table_data.append([
        "1", 
        Paragraph(desc_text.replace('\n', '<br/>'), normal), 
        "1", 
        f"₹{invoice.amount:,.0f}", 
        f"₹{invoice.amount:,.0f}"
    ])
    
    items_table = Table(table_data, colWidths=col_widths)
    items_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), BRAND_BLUE),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,0), 8),
        ('ALIGN', (0,0), (-1,0), 'CENTER'),
        ('ALIGN', (1,0), (1,0), 'LEFT'),
        ('BOTTOMPADDING', (0,0), (-1,0), 6),
        ('TOPPADDING', (0,0), (-1,0), 6),
        
        ('ALIGN', (0,1), (-1,-1), 'CENTER'),
        ('ALIGN', (1,1), (1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('FONTNAME', (0,1), (-1,-1), 'Helvetica'),
        ('FONTSIZE', (0,1), (-1,-1), 8),
        ('TEXTCOLOR', (0,1), (-1,-1), colors.HexColor("#333333")),
        ('TOPPADDING', (0,1), (-1,-1), 10),
        ('BOTTOMPADDING', (0,1), (-1,-1), 10),
        ('LINEBELOW', (0,1), (-1,-1), 0.5, colors.HexColor("#eeeeee")),
    ]))
    
    elements.append(items_table)
    elements.append(Spacer(1, 25))
    
    # ---------------- CALCULATE ADVANCE, PARTIAL & BALANCE ----------------
    from django.db.models import Q
    total_project_val = Decimal('0.00')
    if project:
        enhancement_total = sum(e.cost for e in project.enhancements.all())
        total_project_val = project.total_value + enhancement_total

    # Advance amount & date determination
    adv_amount = getattr(invoice, 'advance_amount', None)
    adv_date = getattr(invoice, 'advance_date', None)

    if adv_amount is None and project:
        if payment_type == 'ADVANCE':
            adv_amount = invoice.amount
            adv_date = invoice.date
        else:
            adv_inv = project.invoices.filter(payment_type='ADVANCE').exclude(id=invoice.id if invoice.id else None).order_by('date', 'id').first()
            if adv_inv:
                adv_amount = adv_inv.amount
                adv_date = adv_inv.date

    # Prior partial payments
    prior_partial_total = Decimal('0.00')
    if project and payment_type in ['PARTIAL', 'FULL']:
        prior_qs = project.invoices.filter(
            payment_type='PARTIAL',
            date__lte=invoice.date
        ).exclude(id=invoice.id if invoice.id else None)
        if invoice.id:
            prior_qs = prior_qs.filter(Q(date__lt=invoice.date) | Q(date=invoice.date, id__lt=invoice.id))
        prior_partial_total = sum(i.amount for i in prior_qs)

    # Balance Calculation
    if getattr(invoice, 'balance_amount', None) is not None:
        balance_due = invoice.balance_amount
    elif total_project_val > Decimal('0.00'):
        if payment_type == 'ADVANCE':
            balance_due = max(Decimal('0.00'), total_project_val - invoice.amount)
        elif payment_type == 'FULL':
            balance_due = Decimal('0.00')
        else:  # PARTIAL
            total_paid_so_far = (adv_amount or Decimal('0.00')) + prior_partial_total + invoice.amount
            balance_due = max(Decimal('0.00'), total_project_val - total_paid_so_far)
    else:
        balance_due = Decimal('0.00')

    def format_date_helper(d, fmt='%d %b %Y'):
        if not d:
            return 'Earlier'
        if hasattr(d, 'strftime'):
            return d.strftime(fmt)
        try:
            from datetime import datetime
            dt = datetime.strptime(str(d)[:10], '%Y-%m-%d')
            return dt.strftime(fmt)
        except Exception:
            return str(d)

    adv_date_str = format_date_helper(adv_date, '%d %b %Y')

    # ---------------- TOTALS & BANK DETAILS ----------------
    bank_account = invoice.deposit_account
    if not bank_account:
        from finance.models import BankAccount
        bank_account = BankAccount.objects.first()
        
    status_label = "PAID" if invoice.status == 'PAID' else ("SENT" if invoice.status == 'SENT' else "DRAFT")
    status_color = "#16a34a" if invoice.status == 'PAID' else ("#2563eb" if invoice.status == 'SENT' else "#d97706")
    
    inv_date_display = format_date_helper(invoice.date, '%d %B %Y')
    left_html = f"<font size='9' color='{status_color}'><b>STATUS: {status_label}</b></font><br/>"
    if invoice.status == 'PAID':
        left_html += f"<font size='7' color='#555555'>Payment received with thanks on {inv_date_display}.</font><br/><br/>"
    else:
        left_html += "<font size='7' color='#555555'>Please remit payment to the bank account below.</font><br/><br/>"

    # Payment schedule note for clarity
    if total_project_val > Decimal('0.00') and payment_type in ['ADVANCE', 'PARTIAL']:
        left_html += "<font size='8' color='#3866df'><b>Payment Overview:</b></font><br/>"
        left_html += f"<font size='7' color='#555555'>"
        if payment_type == 'ADVANCE':
            left_html += f"• Advance Payment: ₹{invoice.amount:,.0f} (Dated {invoice.date.strftime('%d %b %Y')})<br/>"
            left_html += f"• Remaining Project Balance: ₹{balance_due:,.0f}<br/>"
        elif payment_type == 'PARTIAL':
            if adv_amount:
                left_html += f"• Advance Received: ₹{adv_amount:,.0f} ({adv_date_str})<br/>"
            left_html += f"• Current Partial Payment: ₹{invoice.amount:,.0f} ({invoice.date.strftime('%d %b %Y')})<br/>"
            left_html += f"• Remaining Balance Due: ₹{balance_due:,.0f}<br/>"
        left_html += "</font><br/>"

    left_html += "<font size='8' color='#333333'><b>Bank Details:</b><br/>"
    if bank_account:
        left_html += f"<font size='7' color='#555555'>Account Name: {bank_account.name}<br/>"
        if bank_account.bank_name:
            left_html += f"Bank: {bank_account.bank_name}<br/>"
        if bank_account.account_number:
            left_html += f"A/C No: {bank_account.account_number}<br/>"
        if bank_account.ifsc_code:
            left_html += f"IFSC: {bank_account.ifsc_code}<br/>"
        if bank_account.upi_id:
            left_html += f"UPI ID: {bank_account.upi_id}<br/>"
        left_html += "</font>"
    
    left_html += "<font size='7' color='#777777'><br/><b>TAN Number:</b> AAIC1010K</font></font>"
    
    # Financial breakdown table
    totals_data = []
    
    if total_project_val > Decimal('0.00'):
        totals_data.append(['Project Total Value', f"₹{total_project_val:,.0f}"])
        
    if payment_type == 'ADVANCE':
        totals_data.append(['Advance Payment Due', f"₹{invoice.amount:,.0f}"])
        totals_data.append(['INVOICE TOTAL :', f"₹{invoice.amount:,.0f}"])
        totals_data.append(['Remaining Balance', f"₹{balance_due:,.0f}"])
    elif payment_type == 'PARTIAL':
        if adv_amount:
            totals_data.append([f"Advance Paid ({adv_date_str})", f"(-) ₹{adv_amount:,.0f}"])
        if prior_partial_total > Decimal('0.00'):
            totals_data.append(['Previous Payments', f"(-) ₹{prior_partial_total:,.0f}"])
        totals_data.append(['THIS INVOICE (Partial) :', f"₹{invoice.amount:,.0f}"])
        if total_project_val > Decimal('0.00'):
            total_paid_all = (adv_amount or Decimal('0.00')) + prior_partial_total + invoice.amount
            totals_data.append(['Total Paid to Date', f"₹{total_paid_all:,.0f}"])
            totals_data.append(['BALANCE DUE :', f"₹{balance_due:,.0f}"])
    elif payment_type == 'FULL':
        if adv_amount:
            totals_data.append([f"Advance Paid ({adv_date_str})", f"(-) ₹{adv_amount:,.0f}"])
        if prior_partial_total > Decimal('0.00'):
            totals_data.append(['Previous Payments', f"(-) ₹{prior_partial_total:,.0f}"])
        totals_data.append(['FINAL PAYMENT :', f"₹{invoice.amount:,.0f}"])
        totals_data.append(['BALANCE DUE :', '₹0 (Settled)'])
    else:  # RENEWAL / Other
        totals_data.append(['Amount', f"₹{invoice.amount:,.0f}"])
        totals_data.append(['GRAND TOTAL :', f"₹{invoice.amount:,.0f}"])

    discount = getattr(invoice, 'discount', 0)
    if discount > 0:
        totals_data.insert(1, ['Discount', f"(-) ₹{discount:,.0f}"])
        
    totals_subtable = Table(totals_data, colWidths=[150, 105])
    
    # Determine the highlight row index (the INVOICE TOTAL / THIS INVOICE row)
    main_total_idx = 1
    for idx, row in enumerate(totals_data):
        if 'INVOICE' in row[0] or 'GRAND TOTAL' in row[0] or 'FINAL PAYMENT' in row[0]:
            main_total_idx = idx
            break

    subtable_styles = [
        ('ALIGN', (0,0), (0,-1), 'LEFT'),
        ('ALIGN', (1,0), (1,-1), 'RIGHT'),
        ('FONTNAME', (0,0), (-1,-1), 'Helvetica'),
        ('FONTSIZE', (0,0), (-1,-1), 8),
        ('TEXTCOLOR', (0,0), (-1,-1), colors.HexColor("#444444")),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('LINEBELOW', (0,0), (-1,-1), 0.3, colors.HexColor("#f0f0f0")),
        
        # Primary Brand Highlight for This Invoice Amount
        ('BACKGROUND', (0, main_total_idx), (-1, main_total_idx), BRAND_BLUE),
        ('TEXTCOLOR', (0, main_total_idx), (-1, main_total_idx), colors.white),
        ('FONTNAME', (0, main_total_idx), (-1, main_total_idx), 'Helvetica-Bold'),
        ('FONTSIZE', (0, main_total_idx), (-1, main_total_idx), 8.5),
        ('TOPPADDING', (0, main_total_idx), (-1, main_total_idx), 5),
        ('BOTTOMPADDING', (0, main_total_idx), (-1, main_total_idx), 5),
    ]

    # If Balance Due is the last row, style it with distinct emphasis
    if 'BALANCE' in totals_data[-1][0]:
        subtable_styles.extend([
            ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor("#fef3c7")),
            ('TEXTCOLOR', (0, -1), (-1, -1), colors.HexColor("#92400e")),
            ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, -1), (-1, -1), 8.5),
            ('TOPPADDING', (0, -1), (-1, -1), 4),
            ('BOTTOMPADDING', (0, -1), (-1, -1), 4),
        ])

    totals_subtable.setStyle(TableStyle(subtable_styles))
    
    bottom_table = Table([
        [Paragraph(left_html, ParagraphStyle('Small', parent=normal, fontSize=8, leading=11)), totals_subtable]
    ], colWidths=[255, 260])
    
    bottom_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('ALIGN', (1,0), (1,0), 'RIGHT'),
    ]))
    
    elements.append(KeepTogether(bottom_table))
    elements.append(Spacer(1, 15))
    
    # ---------------- FOOTER (SEAL & SIGNATURE) ----------------
    seal_path = os.path.join(str(settings.BASE_DIR.parent), 'frontend', 'public', 'seal', 'seal__1_-removebg-preview.png')
    sig_path = os.path.join(os.path.dirname(__file__), 'signature.png')
    
    seal_flowable = []
    if os.path.exists(seal_path):
        seal_flowable.append(Image(seal_path, width=70, height=70, kind='proportional'))
    else:
        seal_flowable.append(Spacer(1, 70))
    seal_flowable.append(Spacer(1, 5))
    seal_flowable.append(Paragraph("<b>IN-TA SOLUTIONS</b>", ParagraphStyle('LeftBold', parent=normal, alignment=0, fontSize=9)))
    
    sig_flowable = []
    if os.path.exists(sig_path):
        sig_flowable.append(Image(sig_path, width=90, height=35, kind='proportional'))
    else:
        sig_flowable.append(Spacer(1, 35))
        
    sig_flowable.insert(0, Spacer(1, 40)) 
    sig_flowable.append(Paragraph("<b>Vijay P N</b>", ParagraphStyle('RightBold', parent=normal, alignment=2, fontSize=9)))
    sig_flowable.append(Paragraph("<font size='7'>Director</font>", ParagraphStyle('Right', parent=normal, alignment=2)))
    
    sig_table = Table([
        [seal_flowable, sig_flowable]
    ], colWidths=[PAGE_WIDTH/2, PAGE_WIDTH/2 - MARGIN*2])
    
    sig_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'BOTTOM'),
        ('ALIGN', (0,0), (0,0), 'LEFT'),
        ('ALIGN', (1,0), (1,0), 'RIGHT'),
    ]))
    
    elements.append(KeepTogether(sig_table))

    doc.build(elements, onFirstPage=draw_header_footer, onLaterPages=draw_header_footer)
    
    pdf = buffer.getvalue()
    buffer.close()
    
    if invoice.pdf_file:
        invoice.pdf_file.delete(save=False)
        
    client = invoice.project.client
    client_name = client.company_name or client.name
    # Clean the client name to be safe for a filename
    safe_client_name = re.sub(r'[^a-zA-Z0-9]', '', client_name)
    date_str = invoice.date.strftime('%Y-%m-%d')
    invoice_number = f"INV-{str(invoice.id).zfill(4)}"
    
    file_name = f"{invoice_number}_{safe_client_name}_{date_str}.pdf"
    invoice.pdf_file.save(file_name, ContentFile(pdf), save=True)
    
    return invoice
