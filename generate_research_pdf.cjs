const fs = require('fs');
const PDFDocument = require('pdfkit');

const html = fs.readFileSync('research_project_handbook.html', 'utf8');
const text = html
  .replace(/<h1[^>]*>/gi, '\n\n')
  .replace(/<h2[^>]*>/gi, '\n\n')
  .replace(/<h3[^>]*>/gi, '\n\n')
  .replace(/<li[^>]*>/gi, '\n- ')
  .replace(/<\/li>/gi, '')
  .replace(/<p[^>]*>/gi, '\n')
  .replace(/<br\s*\/?\s*>/gi, '\n')
  .replace(/<[^>]+>/g, '')
  .replace(/&nbsp;/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&#39;/g, "'")
  .replace(/&quot;/g, '"')
  .replace(/[ \t]+/g, ' ')
  .replace(/\n\s*\n\s*\n+/g, '\n\n')
  .trim();

const document = new PDFDocument({
  size: 'A4',
  margins: { top: 54, bottom: 54, left: 54, right: 54 },
  info: {
    Title: 'LumiDrive / RoadSight Research Project Handbook',
    Author: 'Research and Implementation Reference',
    Subject: 'Transition-aware multi-task road perception research'
  }
});

const output = fs.createWriteStream('research_project_handbook.pdf');
document.pipe(output);
document.font('Times-Bold').fontSize(22).fillColor('#123b52')
  .text('LumiDrive / RoadSight Research Project Handbook', { align: 'center' });
document.moveDown(0.5).font('Times-Roman').fontSize(13).fillColor('#405a63')
  .text('Transition-Aware Cross-Task Consistency for Robust Multi-Task Road Perception under Changing Weather Conditions', { align: 'center' });
document.moveDown().fontSize(10).text('Research and implementation reference | September 2026', { align: 'center' });
document.addPage();

const blocks = text.split(/\n\s*\n/);
for (const block of blocks) {
  const heading = /^(\d+\. |Conclusion|LumiDrive)/.test(block.trim());
  document.font(heading ? 'Times-Bold' : 'Times-Roman')
    .fontSize(heading ? 15 : 10.5)
    .fillColor(heading ? '#176b72' : '#202735');
  document.text(block.trim(), { align: 'left', lineGap: 2, paragraphGap: heading ? 8 : 5 });
}

document.end();
output.on('finish', () => {
  const size = fs.statSync('research_project_handbook.pdf').size;
  console.log(`Created research_project_handbook.pdf (${size} bytes)`);
});