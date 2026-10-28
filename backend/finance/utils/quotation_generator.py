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

# Enterprise brand palette
BRAND_BLUE = colors.HexColor("#2563eb")     # Enterprise Royal Blue
BRAND_DARK = colors.HexColor("#0f172a")     # Slate 900
BRAND_MUTED = colors.HexColor("#475569")    # Slate 600
BRAND_BORDER = colors.HexColor("#e2e8f0")   # Slate 200

def draw_header_footer(canvas, doc):
    canvas.saveState()
    PAGE_WIDTH, PAGE_HEIGHT = A4
    
    # ---------------- HEADER ----------------
    # Logo (Top Left)
    logo_path = os.path.join(os.path.dirname(__file__), 'logo.jpg')
    if not os.path.exists(logo_path):
        logo_path = os.path.join(os.path.dirname(__file__), 'logo.png')
        
    if os.path.exists(logo_path):
        canvas.drawImage(ImageReader(logo_path), 40, PAGE_HEIGHT - 75, width=46, height=46, preserveAspectRatio=True)
    else:
        canvas.setFillColor(BRAND_BLUE)
        canvas.setFont("Helvetica-Bold", 20)
        canvas.drawString(40, PAGE_HEIGHT - 60, "INTA")
    
    # Company Texts
    canvas.setFont("Helvetica-Bold", 13)
    canvas.setFillColor(BRAND_DARK)
    canvas.drawString(94, PAGE_HEIGHT - 48, "IN-TA SOLUTIONS PRIVATE LIMITED")
    
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(BRAND_MUTED)
    canvas.drawString(94, PAGE_HEIGHT - 60, "Mananthavady, Wayanad - 670645, Kerala")
    canvas.drawString(94, PAGE_HEIGHT - 71, "+91 9447595381  |  info@in-tasolutions.com  |  www.in-tasolutions.com")
    
    # "QUOTATION" Text (Top Right)
    canvas.setFont("Helvetica-Bold", 24)
    canvas.setFillColor(BRAND_BLUE)
    title_text = "QUOTATION"
    text_width = canvas.stringWidth(title_text, "Helvetica-Bold", 24)
    canvas.drawString(PAGE_WIDTH - 40 - text_width, PAGE_HEIGHT - 52, title_text)
    
    # Subtle line under quotation header
    canvas.setStrokeColor(BRAND_BORDER)
    canvas.setLineWidth(1)
    canvas.line(40, PAGE_HEIGHT - 82, PAGE_WIDTH - 40, PAGE_HEIGHT - 82)
    
    # ---------------- FOOTER ----------------
    canvas.setStrokeColor(BRAND_BLUE)
    canvas.setLineWidth(1.5)
    canvas.line(40, 48, PAGE_WIDTH - 40, 48)
    
    canvas.setFont("Helvetica", 7.5)
    canvas.setFillColor(BRAND_MUTED)
    y_pos = 35
    
    # Contact info in single neat line
    canvas.drawString(42, y_pos, "Tel: +91 9447595381")
    canvas.drawString(200, y_pos, "Email: info@in-tasolutions.com")
    canvas.drawString(380, y_pos, "Web: www.in-tasolutions.com  •  Wayanad, Kerala")

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
    Generates a professional, publication-quality single-page PDF quotation from a Quotation model instance.
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
        topMargin=95,
        bottomMargin=55
    )
    
    elements = []
    styles = getSampleStyleSheet()
    normal = styles['Normal']
    normal.fontName = 'Helvetica'
    normal.fontSize = 8
    normal.leading = 11
    normal.textColor = BRAND_DARK
    
    raw = getattr(quotation, 'raw_data', None) or {}
    
    client_name = raw.get('client_name') or getattr(quotation, 'client_name', None) or 'Valued Client'
    client_company = raw.get('client_company', '')
    client_address = raw.get('client_address', '')
    
    quote_no = getattr(quotation, 'quote_no', None) or raw.get('quote_no', 'QT-000')
    date_str = format_date_helper(getattr(quotation, 'date', None) or raw.get('date'), '%d %B %Y')
    valid_until_str = format_date_helper(getattr(quotation, 'valid_until', None) or raw.get('valid_until'), '%d %B %Y')
    
    primary_client = client_company if client_company else client_name
    
    # ---------------- CLIENT & QUOTATION DETAILS ----------------
    client_info_html = "<font color='#64748b' size='7.5'><b>QUOTE FOR :</b></font><br/>"
    client_info_html += f"<font size='10.5' color='#0f172a'><b>{primary_client}</b></font><br/>"
    if client_company and client_name and client_name.strip().lower() != client_company.strip().lower():
        client_info_html += f"<font color='#475569' size='8'>Attn: <b>{client_name}</b></font><br/>"
    if client_address:
        addr_clean = client_address.replace('\n', ', ')
        client_info_html += f"<font color='#64748b' size='8'>{addr_clean}</font>"
        
    quote_meta_html = f"<font size='10.5' color='#2563eb'><b>QUOTE NO: {quote_no}</b></font><br/>"
    quote_meta_html += f"<font color='#475569' size='8'><b>Date:</b> {date_str}</font><br/>"
    if valid_until_str:
        quote_meta_html += f"<font color='#475569' size='8'><b>Valid Until:</b> {valid_until_str}</font>"
    
    top_table_data = [
        [
            Paragraph(client_info_html, normal), 
            Paragraph(quote_meta_html, ParagraphStyle('RightMeta', parent=normal, alignment=2, leading=13))
        ]
    ]
    
    top_table = Table(top_table_data, colWidths=[PAGE_WIDTH/2 - MARGIN, PAGE_WIDTH/2 - MARGIN])
    top_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (0,0), 'LEFT'),
        ('ALIGN', (1,0), (1,0), 'RIGHT'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
        ('TOPPADDING', (0,0), (-1,-1), 0),
    ]))
    
    elements.append(top_table)
    elements.append(Spacer(1, 14))
    
    # Scope Banner
    main_heading = raw.get('main_heading', 'Scope of Work & Professional Services')
    heading_p = Paragraph(f"<b>{main_heading.upper()}</b>", ParagraphStyle('HeadingBanner', parent=normal, fontName='Helvetica-Bold', fontSize=8.5, textColor=BRAND_BLUE))
    elements.append(heading_p)
    elements.append(Spacer(1, 6))
    
    # ---------------- LINE ITEMS TABLE ----------------
    # Printable width: 595.27 - 80 = 515.27
    col_widths = [28, 277, 35, 85, 90]
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
            clean_desc = desc.replace('\n', ' ')
            if desc_cell_html:
                desc_cell_html += f"<br/><font color='#475569' size='7'>{clean_desc}</font>"
            else:
                desc_cell_html = f"<font color='#333333'>{clean_desc}</font>"
                
        table_data.append([
            str(idx),
            Paragraph(desc_cell_html or "Service Deliverable", ParagraphStyle('DescStyle', parent=normal, fontSize=8, leading=10.5)),
            f"{qty:g}",
            f"Rs. {unit_price:,.0f}",
            f"Rs. {item_total:,.0f}"
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
    balance_req = grand_total - advance_req

    items_table = Table(table_data, colWidths=col_widths, repeatRows=1)
    items_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), BRAND_BLUE),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,0), 7.5),
        ('ALIGN', (0,0), (-1,0), 'CENTER'),
        ('ALIGN', (1,0), (1,0), 'LEFT'),
        ('ALIGN', (3,0), (-1,0), 'RIGHT'),
        ('BOTTOMPADDING', (0,0), (-1,0), 4),
        ('TOPPADDING', (0,0), (-1,0), 4),
        
        ('ALIGN', (0,1), (0,-1), 'CENTER'),
        ('ALIGN', (1,1), (1,-1), 'LEFT'),
        ('ALIGN', (2,1), (2,-1), 'CENTER'),
        ('ALIGN', (3,1), (-1,-1), 'RIGHT'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('FONTNAME', (0,1), (-1,-1), 'Helvetica'),
        ('FONTSIZE', (0,1), (-1,-1), 7.5),
        ('TEXTCOLOR', (0,1), (-1,-1), BRAND_DARK),
        ('TOPPADDING', (0,1), (-1,-1), 4),
        ('BOTTOMPADDING', (0,1), (-1,-1), 4),
        ('LINEBELOW', (0,1), (-1,-1), 0.5, colors.HexColor("#f1f5f9")),
    ]))
    
    elements.append(items_table)
    elements.append(Spacer(1, 10))
    
    # ---------------- PAYMENT TERMS & CONDITIONS (NO BANK ACCOUNT) ----------------
    # Note: Bank account details are purposefully excluded from quotations and reserved for invoices only.
    left_html = "<font size='8' color='#2563eb'><b>Payment Terms & Conditions:</b></font><br/>"
    left_html += "<font size='7.5' color='#334155'>"
    left_html += f"• <b>Advance Required ({adv_pct:g}%):</b> Rs. {advance_req:,.0f} upon project commencement.<br/>"
    left_html += f"• <b>Balance Due ({100-adv_pct:g}%):</b> Rs. {balance_req:,.0f} upon milestone completion / final handover.<br/>"
    left_html += "• Quotation valid as per the validity period specified above.<br/>"
    left_html += "• Deliverables include source code, deployment, and documentation.<br/>"
    left_html += "</font>"

    totals_data = [
        ['Subtotal', f"Rs. {subtotal:,.0f}"]
    ]
    
    if include_tp and tp_cost > 0:
        tp_label = raw.get('third_party_desc') or 'Third Party / API Cost'
        totals_data.append([tp_label, f"Rs. {tp_cost:,.0f}"])
        if tp_gst > 0:
            totals_data.append([f"GST ({tp_gst:g}%)", f"Rs. {tp_gst_amt:,.0f}"])
            
    totals_data.append(['GRAND TOTAL :', f"Rs. {grand_total:,.0f}"])
    totals_data.append([f"Advance ({adv_pct:g}%) :", f"Rs. {advance_req:,.0f}"])
    totals_data.append([f"Balance ({100-adv_pct:g}%) :", f"Rs. {balance_req:,.0f}"])
    
    totals_subtable = Table(totals_data, colWidths=[125, 115])
    
    # Grand total index
    grand_idx = len(totals_data) - 3
    
    subtable_styles = [
        ('ALIGN', (0,0), (0,-1), 'LEFT'),
        ('ALIGN', (1,0), (1,-1), 'RIGHT'),
        ('FONTNAME', (0,0), (-1,-1), 'Helvetica'),
        ('FONTSIZE', (0,0), (-1,-1), 7.5),
        ('TEXTCOLOR', (0,0), (-1,-1), BRAND_DARK),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2.5),
        ('TOPPADDING', (0,0), (-1,-1), 2.5),
        ('LINEBELOW', (0,0), (-1,-1), 0.3, colors.HexColor("#f1f5f9")),
        
        # Grand total highlight
        ('BACKGROUND', (0, grand_idx), (-1, grand_idx), BRAND_BLUE),
        ('TEXTCOLOR', (0, grand_idx), (-1, grand_idx), colors.white),
        ('FONTNAME', (0, grand_idx), (-1, grand_idx), 'Helvetica-Bold'),
        ('FONTSIZE', (0, grand_idx), (-1, grand_idx), 8),
        ('TOPPADDING', (0, grand_idx), (-1, grand_idx), 3.5),
        ('BOTTOMPADDING', (0, grand_idx), (-1, grand_idx), 3.5),
        
        # Advance row highlight
        ('BACKGROUND', (0, grand_idx+1), (-1, grand_idx+1), colors.HexColor("#f0fdf4")),
        ('TEXTCOLOR', (0, grand_idx+1), (-1, grand_idx+1), colors.HexColor("#166534")),
        ('FONTNAME', (0, grand_idx+1), (-1, grand_idx+1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, grand_idx+1), (-1, grand_idx+1), 7.5),
        
        # Balance row highlight
        ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor("#f8fafc")),
        ('TEXTCOLOR', (0, -1), (-1, -1), colors.HexColor("#334155")),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, -1), (-1, -1), 7.5),
    ]
    
    totals_subtable.setStyle(TableStyle(subtable_styles))
    
    bottom_table = Table([
        [Paragraph(left_html, ParagraphStyle('TermsStyle', parent=normal, fontSize=7.5, leading=10.5)), totals_subtable]
    ], colWidths=[270, 245])
    
    bottom_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('ALIGN', (1,0), (1,0), 'RIGHT'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
        ('TOPPADDING', (0,0), (-1,-1), 0),
    ]))
    
    elements.append(KeepTogether(bottom_table))
    elements.append(Spacer(1, 12))
    
    # ---------------- FOOTER (SEAL & SIGNATURE) ----------------
    seal_path = os.path.join(str(settings.BASE_DIR.parent), 'frontend', 'public', 'seal', 'seal__1_-removebg-preview.png')
    sig_path = os.path.join(os.path.dirname(__file__), 'signature.png')
    
    seal_flowable = []
    if os.path.exists(seal_path):
        seal_flowable.append(Image(seal_path, width=54, height=54, kind='proportional'))
    else:
        seal_flowable.append(Spacer(1, 54))
    seal_flowable.append(Spacer(1, 3))
    seal_flowable.append(Paragraph("<b>IN-TA SOLUTIONS</b>", ParagraphStyle('LeftBold', parent=normal, alignment=0, fontSize=8, textColor=BRAND_DARK)))
    
    sig_flowable = []
    if os.path.exists(sig_path):
        sig_flowable.append(Image(sig_path, width=80, height=30, kind='proportional'))
    else:
        sig_flowable.append(Spacer(1, 30))
        
    sig_flowable.insert(0, Spacer(1, 22)) 
    sig_flowable.append(Paragraph("<b>Vijay P N</b>", ParagraphStyle('RightBold', parent=normal, alignment=2, fontSize=8.5, textColor=BRAND_DARK)))
    sig_flowable.append(Paragraph("<font size='7' color='#64748b'>Authorized Signatory / Director</font>", ParagraphStyle('Right', parent=normal, alignment=2)))
    
    sig_table = Table([
        [seal_flowable, sig_flowable]
    ], colWidths=[PAGE_WIDTH/2 - MARGIN, PAGE_WIDTH/2 - MARGIN])
    
    sig_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'BOTTOM'),
        ('ALIGN', (0,0), (0,0), 'LEFT'),
        ('ALIGN', (1,0), (1,0), 'RIGHT'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
        ('TOPPADDING', (0,0), (-1,-1), 0),
    ]))
    
    elements.append(KeepTogether(sig_table))

    doc.build(elements, onFirstPage=draw_header_footer, onLaterPages=draw_header_footer)
    
    pdf = buffer.getvalue()
    buffer.close()
    return pdf
