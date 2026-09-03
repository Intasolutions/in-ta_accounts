import os
from io import BytesIO
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
    
    # Gradient/Colored line under invoice
    canvas.setStrokeColor(BRAND_BLUE)
    canvas.setLineWidth(2)
    canvas.line(100, PAGE_HEIGHT - 95, 380, PAGE_HEIGHT - 95)
    
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
    
    client_info_html = f"<font color='#555555' size='8'>Invoice to :</font><br/>"
    client_info_html += f"<font size='12'><b>{client_name}</b></font><br/>"
    if client_company:
        client_info_html += f"{client_company}<br/>"
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
    col_widths = [40, 250, 50, 80, 95]
    table_data = [
        ['NO', 'DESCRIPTION', 'QTY', 'PRICE', 'TOTAL']
    ]
    
    project = invoice.project
    total_project_cost = project.total_value if project else invoice.amount
    if project:
        enhancements_total = sum(e.cost for e in project.enhancements.all())
        total_project_cost += enhancements_total
        
    desc_text = invoice.description
    if not desc_text:
        desc_text = f"Payment for Project: {project.name if project else 'N/A'}"
        
    table_data.append([
        "1", 
        Paragraph(desc_text.replace('\n', '<br/>'), normal), 
        "1", 
        f"{total_project_cost:,.0f}", 
        f"{total_project_cost:,.0f}"
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
        ('FONTNAME', (0,1), (-1,-1), 'Helvetica'),
        ('FONTSIZE', (0,1), (-1,-1), 8),
        ('TEXTCOLOR', (0,1), (-1,-1), colors.HexColor("#333333")),
        ('TOPPADDING', (0,1), (-1,-1), 8),
        ('BOTTOMPADDING', (0,1), (-1,-1), 8),
        ('LINEBELOW', (0,1), (-1,-2), 0.5, colors.HexColor("#eeeeee")),
    ]))
    
    elements.append(items_table)
    elements.append(Spacer(1, 40))
    
    # ---------------- TOTALS & THANK YOU ----------------
    thank_you_html = "<br/><br/><br/><br/><font color='#a0a0a0'>________________________________________</font><br/><br/><b>Thank you for doing business with us!</b>"
    
    totals_data = [
        ['Amount', f"{invoice.amount:,.0f}"],
    ]
    
    discount = getattr(invoice, 'discount', 0)
    if discount > 0:
        totals_data.append(['Discount', f"{discount:,.0f}"])
        
    totals_data.append(['GRAND TOTAL :', f"{invoice.amount:,.0f} RS"])
    
    totals_subtable = Table(totals_data, colWidths=[100, 80])
    totals_subtable.setStyle(TableStyle([
        ('ALIGN', (0,0), (0,-1), 'LEFT'),
        ('ALIGN', (1,0), (1,-1), 'RIGHT'),
        ('FONTNAME', (0,0), (-1,-2), 'Helvetica'),
        ('FONTSIZE', (0,0), (-1,-2), 8),
        ('TEXTCOLOR', (0,0), (-1,-2), colors.HexColor("#555555")),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        
        ('BACKGROUND', (0,-1), (-1,-1), BRAND_BLUE),
        ('TEXTCOLOR', (0,-1), (-1,-1), colors.white),
        ('FONTNAME', (0,-1), (-1,-1), 'Helvetica-Bold'),
        ('FONTSIZE', (0,-1), (-1,-1), 8),
    ]))
    
    bottom_table = Table([
        [Paragraph(thank_you_html, ParagraphStyle('Small', parent=normal, fontSize=8)), totals_subtable]
    ], colWidths=[PAGE_WIDTH/2 + 20, PAGE_WIDTH/2 - 20 - MARGIN*2])
    
    bottom_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('ALIGN', (1,0), (1,0), 'RIGHT'),
    ]))
    
    elements.append(KeepTogether(bottom_table))
    elements.append(Spacer(1, 40))
    
    # ---------------- FOOTER (SEAL & SIGNATURE) ----------------
    seal_path = os.path.join(settings.BASE_DIR, 'frontend', 'public', 'seal', 'seal__1_-removebg-preview.png')
    sig_path = os.path.join(os.path.dirname(__file__), 'signature.png')
    
    seal_flowable = []
    if os.path.exists(seal_path):
        seal_flowable.append(Image(seal_path, width=70, height=70, kind='proportional'))
    else:
        seal_flowable.append(Spacer(1, 70))
    seal_flowable.append(Spacer(1, 5))
    seal_flowable.append(Paragraph("<b>IN-TA SOLUTIONS</b>", ParagraphStyle('CenterBold', parent=normal, alignment=1, fontSize=9)))
    
    sig_flowable = []
    if os.path.exists(sig_path):
        sig_flowable.append(Image(sig_path, width=90, height=35, kind='proportional'))
    else:
        sig_flowable.append(Spacer(1, 35))
        
    sig_flowable.insert(0, Spacer(1, 40)) 
    sig_flowable.append(Paragraph("<b>Vijay P N</b>", ParagraphStyle('RightBold', parent=normal, alignment=1, fontSize=9)))
    sig_flowable.append(Paragraph("<font size='7'>Director</font>", ParagraphStyle('Right', parent=normal, alignment=1)))
    
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
        
    file_name = f"Invoice_A{str(invoice.id).zfill(4)}.pdf"
    invoice.pdf_file.save(file_name, ContentFile(pdf), save=True)
    
    return invoice
