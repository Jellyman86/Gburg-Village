#!/usr/bin/env node
// Verifies that frozen versions are untouched by comparing the working tree with the archive tag.
// V1 lives at the repository root; V2-V7 live in their own folders. Only v8/ is the living version.
'use strict';
const {spawnSync}=require('node:child_process');
const path=require('node:path');

const root=path.resolve(__dirname,'..');
const TAG=process.env.GBURG_ARCHIVE_TAG||'archive/v1-v7';
const FROZEN=[
 // V1 (root) runtime and shared art that every later version still loads through ../assets
 'index.html','play.html','style.css','README.txt','manifest.sha256.json','preview.png','mobile-preview.png','package.py','src','assets',
 'v2','v3','v4','v5','v6','v7'
];

function git(...args){
 const result=spawnSync('git',args,{cwd:root,encoding:'utf8'});
 if(result.status!==0)throw new Error('git '+args.join(' ')+' failed: '+(result.stderr||result.stdout).trim());
 return result.stdout;
}

try{git('rev-parse','--verify','--quiet',TAG+'^{commit}');}
catch{
 console.error(`Missing tag ${TAG}. Create it at the last commit before the freeze, e.g.\n  git tag ${TAG} <commit>`);
 process.exit(2);
}

const changed=git('diff','--name-status',TAG,'--',...FROZEN).trim();
const untracked=git('ls-files','--others','--exclude-standard','--',...FROZEN).trim();
const problems=[];
if(changed)problems.push('Tracked changes versus '+TAG+':\n'+changed.split('\n').map(l=>'  '+l).join('\n'));
if(untracked)problems.push('Untracked files inside frozen folders:\n'+untracked.split('\n').map(l=>'  '+l).join('\n'));
if(problems.length){
 console.error('✖ Frozen archive drift detected.\n'+problems.join('\n')+'\n\nFrozen folders must stay byte-identical. Put new work in the living version instead.');
 process.exit(1);
}
const tracked=git('ls-files','--',...FROZEN).trim().split('\n').filter(Boolean).length;
console.log(`✔ Frozen archive intact: ${tracked} files under ${FROZEN.join(', ')} match ${TAG}.`);
