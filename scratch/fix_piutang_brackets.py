import re

with open('app/piutang/page.tsx', 'r') as f:
    content = f.read()

# Let's clean up the trailing lines near SidebarInset
# We want to find:
#             )}
#           </div>
#             </>
#           )}
#         </div>
# 
# 
#           {viewMode === 'detail' && riwayatId && (
#             <div className="flex flex-col space-y-6">

# And change it to:
#             )}
#           </div>
#             </>
#           )}
#
#           {viewMode === 'detail' && riwayatId && (
#             <div className="flex flex-col space-y-6">
# ...
#             </div>
#           )}
#         </div>

# Let's just use regex to find the end of viewMode === 'list' block and the start of viewMode === 'detail' block
pattern = r'            \)\}\n          </div>\n            </>\n          \}\)\n        </div>\n\n\n          \{viewMode === \'detail\' && riwayatId && \(\n            <div className="flex flex-col space-y-6">'

replacement = r'            )}\n          </div>\n            </>\n          )}\n\n\n          {viewMode === \'detail\' && riwayatId && (\n            <div className="flex flex-col space-y-6">'

content = re.sub(pattern, replacement, content)

# And add the closing `</div>` before `</SidebarInset>` (which is before `<AlertDialog open={!!deletingId}`)
# Actually, the detail view block ends with:
#                             </TableCell>
#                           </TableRow>
#                         ))}
#                       </TableBody>
#                     </Table>
#                   </div>
#                 )}
#               </div>
#             </div>
#           )}
#       </SidebarInset>

# We need to add `</div>` right before `</SidebarInset>` because we removed it earlier.
pattern_end = r'            </div>\n          \}\)\n      </SidebarInset>'
replacement_end = r'            </div>\n          )}\n        </div>\n      </SidebarInset>'

content = re.sub(pattern_end, replacement_end, content)

with open('app/piutang/page.tsx', 'w') as f:
    f.write(content)

print("Fixed layout brackets")
