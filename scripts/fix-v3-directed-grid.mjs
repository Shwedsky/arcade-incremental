import fs from 'node:fs';

const path='src/v3_a_clarity.css';
let css=fs.readFileSync(path,'utf8');
const oldRule='@media(min-width:981px){.v3TalentCore{grid-row:1!important;grid-column:1/-1!important}.v3TalentBranch{grid-row:2!important;margin:0!important;align-self:start}.v3TalentBranch[data-v3-branch="salvage"]{grid-column:1!important}.v3TalentBranch[data-v3-branch="logistics"]{grid-column:2!important}.v3TalentBranch[data-v3-branch="workshop"]{grid-column:3!important}.v3TalentBranch[data-v3-branch="automation"]{grid-column:4!important}.v3TalentBranch[data-v3-branch="trade"]{grid-column:5!important}}';
const rule='@media(min-width:981px){.v3TalentCore{grid-row:1!important;grid-column:1/-1!important}.v3TalentBranch{grid-row:2!important;margin:0!important;align-self:start!important;justify-self:stretch!important}.v3TalentBranch[data-v3-branch="salvage"]{grid-column:1!important}.v3TalentBranch[data-v3-branch="logistics"]{grid-column:2!important}.v3TalentBranch[data-v3-branch="workshop"]{grid-column:3!important}.v3TalentBranch[data-v3-branch="automation"]{grid-column:4!important}.v3TalentBranch[data-v3-branch="trade"]{grid-column:5!important}}';
if(css.includes(oldRule))css=css.replace(oldRule,rule);
else if(!css.includes(rule))css += `\n${rule}\n`;
fs.writeFileSync(path,css,'utf8');
console.log('Desktop talent grid locked to one core row plus five uniformly aligned directed branch columns');
