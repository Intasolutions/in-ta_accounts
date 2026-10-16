import os
import re
from io import BytesIO
from decimal import Decimal
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.utils import ImageReader
from django.conf import settings

# Brand colors
BRAND_BLUE = colors.HexColor("#3866df")

def draw_header_footer(canvas, doc):
    canvas.saveState()
    PAGE_WIDTH, PAGE_HEIGHT = A4
    
    # ---------------- HEADER ----------------
    # Logo (Top Left)
    logo_path = os.path.join(os.path.dirname(__file__), 'logo.jpg')
    if not os.path.exists(logo_path):
        logo_path = os.path.join(os.path.dirname(__file__), 'logo.png')
        
    if os.path.exists(logo_path):
        canvas.drawImage(ImageReader(logo_path), 40, PAGE_HEIGHT - 90, width=50, height=50, preserveAspectRatio=True)
    else:
        canvas.setFillColor(BRAND_BLUE)
        canvas.setFont("Helvetica-Bold", 20)
        canvas.drawString(40, PAGE_HEIGHT - 70, "INTA")
    
    # Company Texts
    canvas.setFont("Helvetica-Bold", 14)
    canvas.setFillColor(colors.black)
    canvas.drawString(100, PAGE_HEIGHT - 62, "IN-TA SOLUTIONS PRIVATE LIMITED")
    
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(colors.HexColor("#555555"))
    canvas.drawString(100, PAGE_HEIGHT - 74, "Mananthavady, Wayanad - 670645, Kerala")
    canvas.drawString(100, PAGE_HEIGHT - 85, "+91 9447595381 | info@in-tasolutions.com")
    
    # "QUOTATION" Text (Top Right)
    canvas.setFont("Helvetica-Bold", 28)
    canvas.setFillColor(BRAND_BLUE)
    title_text = "QUOTATION"
    text_width = canvas.stringWidth(title_text, "Helvetica-Bold", 28)
    canvas.drawString(PAGE_WIDTH - 40 - text_width, PAGE_HEIGHT - 68, title_text)
    
    # Subtle line under quotation header
    canvas.setStrokeColor(colors.HexColor("#e5e7eb"))
    canvas.setLineWidth(1)
    canvas.line(40, PAGE_HEIGHT - 95, PAGE_WIDTH - 40, PAGE_HEIGHT - 95)
    
    # Website Text
    canvas.setFont("Helvetica", 8.5)
    canvas.setFillColor(colors.HexColor("#555555"))
    web_text = "WWW.IN-TASOLUTIONS.COM"
    web_width = canvas.stringWidth(web_text, "Helvetica", 8.5)
    canvas.drawString(PAGE_WIDTH - 40 - web_width, PAGE_HEIGHT - 98, web_text)
    
    # ---------------- FOOTER ----------------
    canvas.setStrokeColor(BRAND_BLUE)
    canvas.setLineWidth(2)
    canvas.line(40, 55, PAGE_WIDTH - 40, 55)
    
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(colors.HexColor("#555555"))
    y_pos = 40
    
    # Phone Icon
    p = canvas.beginPath()
    p.moveTo(42, y_pos+6)
    p.lineTo(46, y_pos+6)
    p.lineTo(45, y_pos+2)
    p.lineTo(41, y_pos+2)
    p.close()
    canvas.drawPath(p, fill=0, stroke=1)
    canvas.arc(38, y_pos-1, 48, y_pos+9, 0, 360)
    canvas.drawString(55, y_pos, "+91 9447595381")
    
    # Mail Icon
    mail_x = 180
    canvas.rect(mail_x, y_pos, 12, 8, stroke=1, fill=0)
    canvas.line(mail_x, y_pos+8, mail_x+6, y_pos+4)
    canvas.line(mail_x+12, y_pos+8, mail_x+6, y_pos+4)
    canvas.drawString(mail_x + 18, y_pos, "info@in-tasolutions.com")
    
    # Location Icon
    loc_x = 380
    p2 = canvas.beginPath()
    p2.moveTo(loc_x+5, y_pos+8)
    p2.curveTo(loc_x+10, y_pos+8, loc_x+10, y_pos+3, loc_x+5, y_pos)
    p2.curveTo(loc_x, y_pos+3, loc_x, y_pos+8, loc_x+5, y_pos+8)
    canvas.drawPath(p2, fill=0, stroke=1)
    canvas.arc(loc_x+3.5, y_pos+4.5, loc_x+6.5, y_pos+7.5, 0, 360)
    canvas.drawString(loc_x + 15, y_pos, "Wayanad, Kerala")

    canvas.restoreState()


def format_date_helper(d, fmt='%d %b %Y'):
    if not d:
        return ''
    if hasattr(d, 'strftime'):
        return d.strftime(fmt)
    try:
        dt = datetime.strptime(str(d)[:10], '%Y-%m-%d')
        return dt.strftime(fmt)
    except Exception:
        return str(d)


def generate_quotation_pdf(quotation):
    """
    Generates a professional enterprise-style PDF quotation from a Quotation model instance.
    Returns bytes of the generated PDF.
    """
    buffer = BytesIO()
    
    PAGE_WIDTH, PAGE_HEIGHT = A4
    MARGIN = 40
    
    doc = SimpleDocTemplate(
        buffer, 
        pagesize=A4, 
        rightMargin=MARGIN, 
        leftMargin=MARGIN, 
        topMargin=130,
        bottomMargin=75
    )
    
    elements = []
    styles = getSampleStyleSheet()
    normal = styles['Normal']
    normal.fontName = 'Helvetica'
    normal.fontSize = 8.5
    normal.leading = 13
    normal.textColor = colors.HexColor("#333333")
    
    raw = quotation.raw_data or {}
    
    client_name = raw.get('client_name') or quotation.client_name or 'Valued Client'
    client_company = raw.get('client_company', '')
    client_address = raw.get('client_address', '')
    
    quote_no = quotation.quote_no or raw.get('quote_no', 'QT-000')
    date_str = format_date_helper(quotation.date or raw.get('date'), '%d %B %Y')
    valid_until_str = format_date_helper(quotation.valid_until or raw.get('valid_until'), '%d %B %Y')
    
    primary_client = client_company if client_company else client_name
    
    # ---------------- CLIENT & QUOTATION DETAILS ----------------
    client_info_html = "<font color='#64748b' size='8'><b>QUOTE FOR :</b></font><br/>"
    client_info_html += f"<font size='11'><b>{primary_client}</b></font><br/>"
    if client_company and client_name and client_name != client_company:
        client_info_html += f"<font color='#555555'>Attn: {client_name}</font><br/>"
    if client_address:
        addr_lines = client_address.split('\n')
        client_info_html += f"<font color='#666666'>{'<br/>'.join(addr_lines)}</font>"
        
    quote_meta_html = f"<font size='10' color='#3866df'><b>QUOTE NO: {quote_no}</b></font><br/>"
    quote_meta_html += f"<font color='#555555' size='8'><b>Date:</b> {date_str}</font><br/>"
    if valid_until_str:
        quote_meta_html += f"<font color='#555555' size='8'><b>Valid Until:</b> {valid_until_str}</font>"
    
    top_table_data = [
        [
            Paragraph(client_info_html, normal), 
            Paragraph(quote_meta_html, ParagraphStyle('RightMeta', parent=normal, alignment=2, leading=14))
        ]
    ]
    
    top_table = Table(top_table_data, colWidths=[PAGE_WIDTH/2 - MARGIN, PAGE_WIDTH/2 - MARGIN])
    top_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (0,0), 'LEFT'),
        ('ALIGN', (1,0), (1,0), 'RIGHT'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    
    elements.append(top_table)
    elements.append(Spacer(1, 20))
    
    # Scope Banner
    main_heading = raw.get('main_heading', 'Scope of Work & Professional Services')
    heading_p = Paragraph(f"<b>{main_heading.upper()}</b>", ParagraphStyle('HeadingBanner', parent=normal, fontName='Helvetica-Bold', fontSize=9, textColor=BRAND_BLUE))
    elements.append(heading_p)
    elements.append(Spacer(1, 8))
    
    # ---------------- LINE ITEMS TABLE ----------------
    col_widths = [35, 265, 45, 85, 85]
    table_data = [
        ['NO', 'DESCRIPTION', 'QTY', 'UNIT PRICE', 'TOTAL']
    ]
    
    items = raw.get('items', [])
    if not items:
        items = [{'heading': 'Software Development Services', 'description': '', 'quantity': 1, 'unit_price': 0}]
        
    subtotal = Decimal('0.00')
    for idx, item in enumerate(items, start=1):
        heading = item.get('heading', '')
        desc = item.get('description', '')
        qty = Decimal(str(item.get('quantity') or 1))
        unit_price = Decimal(str(item.get('unit_price') or 0))
        item_total = qty * unit_price
        subtotal += item_total
        
        desc_cell_html = f"<b>{heading}</b>" if heading else ""
        if desc:
            clean_desc = desc.replace('\n', '<br/>')
            if desc_cell_html:
                desc_cell_html += f"<br/><font color='#555555' size='7.5'>{clean_desc}</font>"
            else:
                desc_cell_html = f"<font color='#333333'>{clean_desc}</font>"
                
        table_data.append([
            str(idx),
            Paragraph(desc_cell_html or "Service Deliverable", normal),
            f"{qty:g}",
            f"₹{unit_price:,.0f}",
            f"₹{item_total:,.0f}"
        ])
    
    # Check third party
    include_tp = raw.get('include_third_party', False)
    tp_cost = Decimal(str(raw.get('third_party_cost') or 0)) if include_tp else Decimal('0.00')
    tp_gst = Decimal(str(raw.get('third_party_gst') or 18)) if include_tp else Decimal('0.00')
    tp_gst_amt = tp_cost * (tp_gst / Decimal('100.0'))
    tp_total = tp_cost + tp_gst_amt
    
    grand_total = subtotal + (tp_total if include_tp else Decimal('0.00'))
    adv_pct = Decimal(str(raw.get('advance_percentage') or 50))
    advance_req = grand_total * (adv_pct / Decimal('100.0'))

    items_table = Table(table_data, colWidths=col_widths)
    items_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), BRAND_BLUE),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,0), 8),
        ('ALIGN', (0,0), (-1,0), 'CENTER'),
        ('ALIGN', (1,0), (1,0), 'LEFT'),
        ('BOTTOMPADDING', (0,0), (-1,0), 5),
        ('TOPPADDING', (0,0), (-1,0), 5),
        
        ('ALIGN', (0,1), (-1,-1), 'CENTER'),
        ('ALIGN', (1,1), (1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('FONTNAME', (0,1), (-1,-1), 'Helvetica'),
        ('FONTSIZE', (0,1), (-1,-1), 8),
        ('TEXTCOLOR', (0,1), (-1,-1), colors.HexColor("#333333")),
        ('TOPPADDING', (0,1), (-1,-1), 8),
        ('BOTTOMPADDING', (0,1), (-1,-1), 8),
        ('LINEBELOW', (0,1), (-1,-1), 0.5, colors.HexColor("#eeeeee")),
    ]))
    
    elements.append(items_table)
    elements.append(Spacer(1, 20))
    
    # ---------------- TOTALS & BANK DETAILS ----------------
    from finance.models import BankAccount
    bank_account = BankAccount.objects.first()
    
    left_html = "<font size='8' color='#3866df'><b>Payment Terms & Conditions:</b></font><br/>"
    left_html += f"<font size='7.5' color='#475569'>"
    left_html += f"• Advance Required ({adv_pct:g}%): <b>₹{advance_req:,.0f}</b><br/>"
    left_html += "• Balance payable upon milestone completion / final handover.<br/>"
    left_html += "• Quotation valid as per the validity date specified above.<br/>"
    left_html += "</font><br/>"

    left_html += "<font size='8' color='#333333'><b>Bank Account for Remittance:</b><br/>"
    if bank_account:
        left_html += f"<font size='7' color='#555555'>Account Name: {bank_account.name}<br/>"
        if bank_account.bank_name:
            left_html += f"Bank: {bank_account.bank_name}<br/>"
        if bank_account.account_number:
            left_html += f"A/C No: {bank_account.account_number}<br/>"
        if bank_account.ifsc_code:
            left_html += f"IFSC: {bank_account.ifsc_code}<br/>"
        left_html += "</font>"
    left_html += "<font size='7' color='#777777'><br/><b>TAN Number:</b> AAIC1010K</font></font>"
    
    totals_data = [
        ['Subtotal', f"₹{subtotal:,.0f}"]
    ]
    
    if include_tp and tp_cost > 0:
        tp_label = raw.get('third_party_desc') or 'Third Party / API Cost'
        totals_data.append([tp_label, f"₹{tp_cost:,.0f}"])
        if tp_gst > 0:
            totals_data.append([f"GST ({tp_gst:g}%)", f"₹{tp_gst_amt:,.0f}"])
            
    totals_data.append(['GRAND TOTAL :', f"₹{grand_total:,.0f}"])
    totals_data.append([f"Advance ({adv_pct:g}%) :", f"₹{advance_req:,.0f}"])
    
    totals_subtable = Table(totals_data, colWidths=[140, 110])
    
    # Row index for grand total
    grand_idx = len(totals_data) - 2
    
    subtable_styles = [
        ('ALIGN', (0,0), (0,-1), 'LEFT'),
        ('ALIGN', (1,0), (1,-1), 'RIGHT'),
        ('FONTNAME', (0,0), (-1,-1), 'Helvetica'),
        ('FONTSIZE', (0,0), (-1,-1), 8),
        ('TEXTCOLOR', (0,0), (-1,-1), colors.HexColor("#444444")),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('LINEBELOW', (0,0), (-1,-1), 0.3, colors.HexColor("#f0f0f0")),
        
        # Grand total highlight
        ('BACKGROUND', (0, grand_idx), (-1, grand_idx), BRAND_BLUE),
        ('TEXTCOLOR', (0, grand_idx), (-1, grand_idx), colors.white),
        ('FONTNAME', (0, grand_idx), (-1, grand_idx), 'Helvetica-Bold'),
        ('FONTSIZE', (0, grand_idx), (-1, grand_idx), 8.5),
        ('TOPPADDING', (0, grand_idx), (-1, grand_idx), 5),
        ('BOTTOMPADDING', (0, grand_idx), (-1, grand_idx), 5),
        
        # Advance row highlight
        ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor("#ecfdf5")),
        ('TEXTCOLOR', (0, -1), (-1, -1), colors.HexColor("#065f46")),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, -1), (-1, -1), 8),
        ('TOPPADDING', (0, -1), (-1, -1), 4),
        ('BOTTOMPADDING', (0, -1), (-1, -1), 4),
    ]
    
    totals_subtable.setStyle(TableStyle(subtable_styles))
    
    bottom_table = Table([
        [Paragraph(left_html, ParagraphStyle('Small', parent=normal, fontSize=8, leading=11)), totals_subtable]
    ], colWidths=[265, 250])
    
    bottom_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('ALIGN', (1,0), (1,0), 'RIGHT'),
    ]))
    
    elements.append(KeepTogether(bottom_table))
    elements.append(Spacer(1, 20))
    
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
    return pdf
