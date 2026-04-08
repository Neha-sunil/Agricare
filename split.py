import os
import io

html = open('index.html', encoding='utf-8').read()

html = html.replace('href="#home"', 'href="index.html"')
html = html.replace('href="#about"', 'href="about.html"')
html = html.replace('href="#pre-care"', 'href="pre-care.html"')
html = html.replace('href="#post-care"', 'href="post-care.html"')
html = html.replace('href="#crops"', 'href="crops.html"')
html = html.replace('href="#support-tool"', 'href="smart-tool.html"')

about = html[html.find('<!-- 2. About the Platform -->'):html.find('<!-- How It Works Section -->')]
precare = html[html.find('<!-- 3. Pre-Care Guidance Page -->'):html.find('<!-- 4. Post-Care Guidance Page -->')]
postcare = html[html.find('<!-- 4. Post-Care Guidance Page -->'):html.find('<!-- 5. Crop Guidance Section -->')]
crops = html[html.find('<!-- 5. Crop Guidance Section -->'):html.find('<!-- Modal for Crop Details -->')]
modal = html[html.find('<!-- Modal for Crop Details -->'):html.find('<!-- 6. Smart Crop Support Tool -->')]
smarttool = html[html.find('<!-- 6. Smart Crop Support Tool -->'):html.find('<!-- Modern Dashboard Cards Section (Stage-wise insights) -->')]

header = html[:html.find('<!-- 1. Home Page Hero Section -->')]
footer = html[html.find('<!-- 8. Footer -->'):]

def add_ptop(content):
    return content.replace('<section ', '<section style="padding-top: 8rem;" ', 1)

def write_f(name, title_suffix, *contents):
    with open(name, 'w', encoding='utf-8') as f:
        head = header.replace('<title>AgriCare Thailand - Smart Crop Support</title>', f'<title>AgriCare Thailand - {title_suffix}</title>')
        f.write(head)
        for i, c in enumerate(contents):
            if i == 0:
                f.write(add_ptop(c))
            else:
                f.write(c)
        f.write(footer)

write_f('about.html', 'About', about)
write_f('pre-care.html', 'Pre-Care', precare)
write_f('post-care.html', 'Post-Care', postcare)
write_f('crops.html', 'Crops', crops, modal)
write_f('smart-tool.html', 'Smart Tool', smarttool)

new_index = html.replace(about, '').replace(precare, '').replace(postcare, '').replace(crops, '').replace(modal, '').replace(smarttool, '')
with open('index.html', 'w', encoding='utf-8') as f:
    f.write(new_index)
print("Successfully split pages!")
