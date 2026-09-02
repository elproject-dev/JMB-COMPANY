import re

with open('app/piutang/page.tsx', 'r') as f:
    content = f.read()

# The block to move
block_to_move_regex = re.compile(
    r'(<div className="flex justify-between items-center mb-4">\s*<h1 className="text-1xl font-bold tracking-tight">Catatan Piutang</h1>\s*<div className="flex gap-2 items-center">.*?</div>\s*</div>)',
    re.DOTALL
)

match = block_to_move_regex.search(content)
if match:
    block_to_move = match.group(1)
    
    # Modify the block slightly to add mt-2 to match dompet
    modified_block = block_to_move.replace('mb-4"', 'mb-4 mt-2"')
    
    # Remove it from the original location (after `<div className="flex flex-1 flex-col p-4 md:p-6 w-full">`)
    content = content.replace(block_to_move + '\n\n          \n', '')
    
    # Place it after the summary cards
    cards_end = '          </div>\n\n          {isAdding && ('
    content = content.replace(cards_end, '          </div>\n\n          ' + modified_block + '\n\n          {isAdding && (')

    with open('app/piutang/page.tsx', 'w') as f:
        f.write(content)
    print("Done moving title and button")
else:
    print("Block not found")
