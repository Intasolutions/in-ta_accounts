import os
from io import BytesIO
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.utils import ImageReader
from django.core.files.base import ContentFile

def generate_invoice_pdf(invoice):
    """
    Generates an ultra-premium PDF invoice with an absolute-positioned sidebar and custom curves.
    """
    buffer = BytesIO()
    
    # Page Setup
    PAGE_WIDTH, PAGE_HEIGHT = A4
    LEFT_MARGIN = 240  # Push all flowables to the right side
    RIGHT_MARGIN = 30
    TOP_MARGIN = 40
    BOTTOM_MARGIN = 40
    
    # Custom canvas hook for background graphics & sidebar text
    def draw_background(canvas, doc):
        canvas.saveState()
        
        # 1. Main Dark Blue Sidebar
        canvas.setFillColor(colors.HexColor("#0a192f")) # Deep navy blue
        p = canvas.beginPath()
        p.moveTo(0, 0)
        p.lineTo(200, 0)
        p.curveTo(240, PAGE_HEIGHT * 0.3, 160, PAGE_HEIGHT * 0.7, 220, PAGE_HEIGHT)
        p.lineTo(0, PAGE_HEIGHT)
        p.close()
        canvas.drawPath(p, fill=1, stroke=0)
        
        # 2. Accent Curve (Lighter blue overlay)
        canvas.setFillColor(colors.HexColor("#1e3a8a"))
        canvas.setFillAlpha(0.7)
        p2 = canvas.beginPath()
        p2.moveTo(0, 0)
        p2.lineTo(150, 0)
        p2.curveTo(220, PAGE_HEIGHT * 0.4, 80, PAGE_HEIGHT * 0.6, 180, PAGE_HEIGHT)
        p2.lineTo(0, PAGE_HEIGHT)
        p2.close()
        canvas.drawPath(p2, fill=1, stroke=0)
        
        # Reset Alpha
        canvas.setFillAlpha(1.0)
        
        # 3. Logo
        logo_path = os.path.join(os.path.dirname(__file__), 'logo.jpg')
        if not os.path.exists(logo_path):
            logo_path = os.path.join(os.path.dirname(__file__), 'logo.png')
            
        if os.path.exists(logo_path):
            # Increase dimensions significantly for a professional, prominent look
            canvas.drawImage(ImageReader(logo_path), 20, PAGE_HEIGHT - 120, width=160, height=80, preserveAspectRatio=True)
        else:
            canvas.setFillColor(colors.white)
            canvas.setFont("Helvetica-Bold", 24)
            canvas.drawString(20, PAGE_HEIGHT - 80, "IN-TA SOLUTION PVT LTD")
            
        # 4. Sidebar Text (Invoice To & Terms)
        canvas.setFillColor(colors.white)
        
        # Invoice To Header
        canvas.setFont("Helvetica-Bold", 14)
        canvas.drawString(20, 260, "Invoice to:")
        
        # Client Details
        canvas.setFont("Helvetica-Bold", 12)
        client_name = invoice.project.client.name if invoice.project.client else "N/A"
        canvas.drawString(20, 240, client_name)
        
        canvas.setFont("Helvetica", 9)
        client_company = invoice.project.client.company_name if invoice.project.client and invoice.project.client.company_name else ""
        y_pos = 225
        if client_company:
            canvas.drawString(20, y_pos, client_company)
            y_pos -= 15
            
        address = invoice.project.client.address if invoice.project.client and invoice.project.client.address else ""
        if address:
            # Simple text wrap for address
            import textwrap
            lines = textwrap.wrap(address, width=30)
            for line in lines:
                canvas.drawString(20, y_pos, line)
                y_pos -= 12
                
        # Terms & Conditions
        canvas.setFont("Helvetica-Bold", 10)
        canvas.drawString(20, 120, "Terms & Conditions")
        canvas.setFont("Helvetica", 8)
        canvas.setFillColorRGB(0.8, 0.8, 0.8) # Light grey for terms
        terms = "Payment is due within 15 days.\nPlease make checks payable to\nIN-TA SOLUTION PVT LTD."
        t_y = 105
        for line in terms.split('\n'):
            canvas.drawString(20, t_y, line)
            t_y -= 10
            
        # 5. Dynamic Watermark Stamp on the right side
        canvas.translate(400, PAGE_HEIGHT / 2)
        canvas.rotate(30)
        if invoice.status == 'PAID':
            canvas.setFillColorRGB(0, 0.6, 0)
            canvas.setFillAlpha(0.1)
            text = "PAID"
        elif invoice.status == 'SENT':
            canvas.setFillColorRGB(0.8, 0.2, 0)
            canvas.setFillAlpha(0.1)
            text = "PAYMENT DUE"
        else:
            canvas.setFillColorRGB(0.5, 0.5, 0.5)
            canvas.setFillAlpha(0.1)
            text = "DRAFT"
            
        canvas.setFont("Helvetica-Bold", 80)
        canvas.drawCentredString(0, 0, text)
        canvas.restoreState()

    # Create the document with a heavily shifted left margin
    doc = SimpleDocTemplate(
        buffer, 
        pagesize=A4, 
        rightMargin=RIGHT_MARGIN, 
        leftMargin=LEFT_MARGIN, 
        topMargin=TOP_MARGIN, 
        bottomMargin=BOTTOM_MARGIN
    )
    elements = []
    
    styles = getSampleStyleSheet()
    normal = styles['Normal']
    normal.fontSize = 9
    normal.leading = 12
    
    # ---------------- RIGHT SIDE FLOWABLES ----------------
    
    # INVOICE TITLE
    title_style = ParagraphStyle(
        'InvoiceTitle',
        parent=styles['Heading1'],
        fontSize=28,
        textColor=colors.HexColor("#ef4444"), # Vibrant red matching the layout idea
        spaceAfter=15,
        alignment=0 # Left aligned in the remaining space
    )
    
    payment_type_display = getattr(invoice, 'get_payment_type_display', lambda: 'Payment')()
    title_text = f"INVOICE - {payment_type_display.upper()}"
    elements.append(Paragraph(f"<b>{title_text}</b>", title_style))
    
    # INVOICE METADATA TABLE
    meta_data = [
        [Paragraph("<b>Invoice#</b>", normal), f"INV-{str(invoice.id).zfill(4)}"],
        [Paragraph("<b>Date</b>", normal), invoice.date.strftime('%B %d, %Y')],
        [Paragraph("<b>Status</b>", normal), invoice.status]
    ]
    meta_table = Table(meta_data, colWidths=[60, 150])
    meta_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('TOPPADDING', (0,0), (-1,-1), 4),
    ]))
    elements.append(meta_table)
    elements.append(Spacer(1, 40))
    
    # LINE ITEMS TABLE
    FLOWABLE_WIDTH = PAGE_WIDTH - LEFT_MARGIN - RIGHT_MARGIN
    col_widths = [FLOWABLE_WIDTH * 0.1, FLOWABLE_WIDTH * 0.5, FLOWABLE_WIDTH * 0.4]
    
    data = [
        ['SL.', 'Item Description', 'Total']
    ]
    
    if invoice.description:
        desc = invoice.description.replace('\n', '<br/>')
    else:
        desc = f"Payment for Project: <b>{invoice.project.name}</b><br/>Type: {invoice.project.project_type}"
    data.append(["1", Paragraph(desc, normal), f"Rs. {invoice.amount:,.2f}"])
    
    table = Table(data, colWidths=col_widths)
    
    t_style = TableStyle([
        # Header styles (Transparent background, just text)
        ('TEXTCOLOR', (0,0), (-1,0), colors.black),
        ('ALIGN', (0,0), (-1,0), 'LEFT'),
        ('ALIGN', (2,0), (2,0), 'RIGHT'),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,0), 9),
        ('BOTTOMPADDING', (0,0), (-1,0), 10),
        ('LINEBELOW', (0,0), (-1,0), 1, colors.HexColor("#e2e8f0")),
        
        # Row styles
        ('TEXTCOLOR', (0,1), (-1,-1), colors.HexColor("#475569")),
        ('ALIGN', (0,1), (-1,-1), 'LEFT'),
        ('ALIGN', (2,1), (2,-1), 'RIGHT'),
        ('FONTNAME', (0,1), (-1,-1), 'Helvetica'),
        ('FONTSIZE', (0,1), (-1,-1), 9),
        ('VALIGN', (0,1), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,1), (-1,-1), 12),
        ('BOTTOMPADDING', (0,1), (-1,-1), 12),
        ('LINEBELOW', (0,1), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
    ])
    table.setStyle(t_style)
    elements.append(table)
    elements.append(Spacer(1, 20))
    
    # TOTALS TABLE
    totals_data = [
        ['Sub Total:', f"Rs. {invoice.amount:,.2f}"],
        ['Tax:', "0.00%"],
        ['Total:', f"Rs. {invoice.amount:,.2f}"]
    ]
    totals_table = Table(totals_data, colWidths=[FLOWABLE_WIDTH * 0.6, FLOWABLE_WIDTH * 0.4])
    totals_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (0,-1), 'RIGHT'),
        ('ALIGN', (1,0), (1,-1), 'RIGHT'),
        ('FONTNAME', (0,0), (0,1), 'Helvetica-Bold'),
        ('FONTNAME', (1,0), (1,1), 'Helvetica'),
        ('FONTNAME', (0,-1), (-1,-1), 'Helvetica-Bold'),
        ('TEXTCOLOR', (0,-1), (-1,-1), colors.HexColor("#ef4444")), # Red total
        ('FONTSIZE', (0,-1), (-1,-1), 12),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LINEABOVE', (0,-1), (-1,-1), 1, colors.HexColor("#e2e8f0")),
        ('LINEBELOW', (0,-1), (-1,-1), 1, colors.HexColor("#e2e8f0")),
    ]))
    elements.append(totals_table)
    
    # PROJECT SUMMARY
    elements.append(Spacer(1, 20))
    project = invoice.project
    enhancements_total = sum(e.cost for e in project.enhancements.all())
    total_project_cost = project.total_value + enhancements_total
    
    amount_billed = sum(inv.amount for inv in project.invoices.filter(status__in=['PAID', 'SENT']))
    if invoice.status == 'DRAFT' and not invoice.pk:
        amount_billed += invoice.amount # Add if not saved yet
    elif invoice.status == 'DRAFT' and invoice.pk:
        # If it's saved as DRAFT, add its amount manually since filter above excludes DRAFTs
        amount_billed += invoice.amount
        
    remaining_balance = total_project_cost - amount_billed

    summary_data = [
        ['Project Summary', ''],
        ['Total Project Cost:', f"Rs. {total_project_cost:,.2f}"],
        ['Amount Billed to Date:', f"Rs. {amount_billed:,.2f}"],
        ['Remaining Balance:', f"Rs. {remaining_balance:,.2f}"]
    ]
    summary_table = Table(summary_data, colWidths=[FLOWABLE_WIDTH * 0.6, FLOWABLE_WIDTH * 0.4])
    summary_table.setStyle(TableStyle([
        ('SPAN', (0,0), (1,0)),
        ('ALIGN', (0,0), (-1,-1), 'RIGHT'),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('TEXTCOLOR', (0,0), (-1,0), colors.HexColor("#1e3a8a")),
        ('FONTSIZE', (0,0), (-1,0), 10),
        ('BOTTOMPADDING', (0,0), (-1,0), 6),
        
        ('ALIGN', (0,1), (0,-1), 'RIGHT'),
        ('ALIGN', (1,1), (1,-1), 'RIGHT'),
        ('FONTNAME', (0,1), (1,-2), 'Helvetica'),
        ('FONTNAME', (0,-1), (1,-1), 'Helvetica-Bold'),
        ('TEXTCOLOR', (0,-1), (-1,-1), colors.HexColor("#10b981")), # Green balance
        ('FONTSIZE', (0,1), (-1,-1), 9),
        ('TOPPADDING', (0,1), (-1,-1), 4),
        ('BOTTOMPADDING', (0,1), (-1,-1), 4),
    ]))
    elements.append(summary_table)
    
    # FOOTER & SIGNATURE
    elements.append(Spacer(1, 60))
    
    # Payment Info and Signature Side-by-side
    pay_info = Paragraph("<b>Payment Info:</b><br/>A/C Name: IN-TA SOLUTION PVT LTD<br/>Bank: Standard Bank<br/>A/C No: 1234 5678 9012", normal)
    
    # Signature Section
    sig_path = os.path.join(os.path.dirname(__file__), 'signature.png')
    sig_elements = []
    if os.path.exists(sig_path):
        sig_elements.append(Image(sig_path, width=120, height=50, kind='proportional'))
    else:
        sig_elements.append(Spacer(1, 40)) # Empty space if no signature uploaded yet
        
    sig_elements.append(Spacer(1, 10))
    sig_elements.append(Paragraph("<b>Vijay P N</b>", ParagraphStyle('C', alignment=1, fontSize=10)))
    sig_elements.append(Paragraph("Managing Director", ParagraphStyle('C', alignment=1, fontSize=8, textColor=colors.HexColor("#64748b"))))
    
    footer_table = Table([[pay_info, sig_elements]], colWidths=[FLOWABLE_WIDTH * 0.5, FLOWABLE_WIDTH * 0.5])
    footer_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'BOTTOM'),
        ('ALIGN', (1,0), (1,0), 'CENTER'),
    ]))
    
    elements.append(footer_table)
    
    # Build PDF with the background hook
    doc.build(elements, onFirstPage=draw_background, onLaterPages=draw_background)
    
    pdf_content = buffer.getvalue()
    buffer.close()
    
    return pdf_content
