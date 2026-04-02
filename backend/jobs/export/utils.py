from openpyxl.styles import Border, Side
from openpyxl.utils import range_boundaries

def style_range(ws, cell_range, font=None, fill=None, border=None, alignment=None):
    for row in ws[cell_range]:
        for cell in row:
            if font:
                cell.font = font
            if fill:
                cell.fill = fill
            if border:
                cell.border = border
            if alignment:
                cell.alignment = alignment

def border_range_colrow(ws, min_col, min_row, max_col, max_row, border_style='thin'):
    border_side = Side(style=border_style)  # type: ignore

    if min_col is None or min_row is None or max_col is None or max_row is None:
        return
        
    for row in range(min_row, max_row + 1):
        for col in range(min_col, max_col + 1):
            cell = ws.cell(row=row, column=col)
            
            new_border_kwargs = {
                'left': cell.border.left,
                'right': cell.border.right,
                'top': cell.border.top,
                'bottom': cell.border.bottom,
            }
            
            if row == min_row:
                new_border_kwargs['top'] = border_side
            if row == max_row:
                new_border_kwargs['bottom'] = border_side
            if col == min_col:
                new_border_kwargs['left'] = border_side
            if col == max_col:
                new_border_kwargs['right'] = border_side
                
            cell.border = Border(**new_border_kwargs)

def border_range(ws, cell_range, border_style='thin'):
    min_col, min_row, max_col, max_row = range_boundaries(cell_range)
    border_range_colrow(ws, min_col, min_row, max_col, max_row, border_style)
